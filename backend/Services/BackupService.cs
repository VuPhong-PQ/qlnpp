using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QlnppApi.Models;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace QlnppApi.Services
{
    public class BackupService : BackgroundService
    {
        private readonly ILogger<BackupService> _logger;
        private readonly Microsoft.Extensions.Options.IOptionsMonitor<QlnppApi.Models.BackupSettings> _options;
        private readonly string _connectionString;

        public BackupService(ILogger<BackupService> logger, Microsoft.Extensions.Options.IOptionsMonitor<QlnppApi.Models.BackupSettings> options, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _logger = logger;
            _options = options;
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("BackupService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var settings = _options.CurrentValue;
                    if (settings.AutoBackupEnabled)
                    {
                        if (settings.UseDailySchedule && !string.IsNullOrWhiteSpace(settings.ScheduledTime))
                        {
                            // parse HH:mm
                            if (TimeSpan.TryParse(settings.ScheduledTime, out var timeOfDay))
                            {
                                var now = DateTime.Now;
                                var next = now.Date + timeOfDay;
                                if (next <= now) next = next.AddDays(1);
                                var wait = next - now;
                                _logger.LogInformation("Next scheduled backup at {next} (in {delay})", next, wait);
                                await Task.Delay(wait, stoppingToken);

                                // double-check if still enabled
                                if (_options.CurrentValue.AutoBackupEnabled)
                                {
                                    await DoBackupAsync();
                                }
                                // after running scheduled backup, continue to compute next loop
                                continue;
                            }
                            else
                            {
                                _logger.LogWarning("Invalid ScheduledTime format: {t}", settings.ScheduledTime);
                            }
                        }

                        // fallback: use interval minutes
                        await DoBackupAsync();
                    }
                }
                catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // shutting down
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while running scheduled backup");
                }

                var interval = Math.Max(1, _options.CurrentValue.AutoBackupIntervalMinutes);
                var delay = TimeSpan.FromMinutes(interval);
                await Task.Delay(delay, stoppingToken);
            }
        }

        public async Task<string> DoBackupAsync()
        {
            var settings = _options.CurrentValue;
            var backupFolder = settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(backupFolder))
            {
                backupFolder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, backupFolder));
            }

            Directory.CreateDirectory(backupFolder);

            var builder = new SqlConnectionStringBuilder(_connectionString);
            var database = builder.InitialCatalog;
            if (string.IsNullOrWhiteSpace(database)) database = builder["Database"] as string ?? "Database";

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var fileName = $"{database}_backup_{timestamp}.bak";
            var filePath = Path.Combine(backupFolder, fileName);

            var backupSql = $"BACKUP DATABASE [{database}] TO DISK = N'{filePath.Replace("'", "''")}' WITH NOFORMAT, NOINIT, NAME = N'{database}-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10";

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = backupSql;
                cmd.CommandTimeout = 600; // 10 minutes
                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
            }

            _logger.LogInformation("Created backup file: {file}", filePath);
            return filePath;
        }
    }
}
