using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QlnppApi.Models;
using QlnppApi.Services;
using QlnppApi.Data;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Data.SqlClient;

namespace QlnppApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly BackupService _backupService;
        private readonly BackupSettings _settings;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public AdminController(BackupService backupService, IOptions<BackupSettings> options, Microsoft.Extensions.Configuration.IConfiguration configuration, ApplicationDbContext context)
        {
            _backupService = backupService;
            _settings = options.Value;
            _configuration = configuration;
            _context = context;
        }

        [HttpGet("backups")]
        public IActionResult GetBackups()
        {
            var folder = _settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
            if (!Directory.Exists(folder)) return Ok(new List<object>());

            var files = Directory.GetFiles(folder, "*.bak")
                .Select(f => new {
                    fileName = Path.GetFileName(f),
                    path = f,
                    size = new FileInfo(f).Length,
                    created = System.IO.File.GetCreationTimeUtc(f)
                })
                .OrderByDescending(x => x.created)
                .ToList();

            return Ok(files);
        }

        [HttpGet("backup-files")]
        public IActionResult GetBackupFiles()
        {
            var folder = _settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
            if (!Directory.Exists(folder)) return Ok(new List<object>());

            var files = Directory.GetFiles(folder, "*.bak")
                .Select(f => new {
                    fileName = Path.GetFileName(f),
                    filePath = f,
                    size = new FileInfo(f).Length,
                    lastModified = System.IO.File.GetLastWriteTimeUtc(f)
                })
                .OrderByDescending(x => x.lastModified)
                .ToList();

            return Ok(files);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(1_000_000_000)]
        public async Task<IActionResult> UploadBackup([FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0) 
                    return BadRequest(new { success = false, error = "No file provided" });

                var folder = _settings.BackupFolder ?? "./Backups";
                if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
                Directory.CreateDirectory(folder);

                var originalName = Path.GetFileName(file.FileName);
                if (string.IsNullOrWhiteSpace(originalName))
                    return BadRequest(new { success = false, error = "Invalid file name" });

                // Always generate unique filename to avoid any conflicts
                var nameWithoutExt = Path.GetFileNameWithoutExtension(originalName);
                var extension = Path.GetExtension(originalName);
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss_fff");
                var fileName = $"{nameWithoutExt}_{timestamp}{extension}";
                var filePath = Path.Combine(folder, fileName);

                // Create file directly without checking existence
                using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new { success = true, originalName = file.FileName, fileName = fileName, filePath = filePath, size = file.Length });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("history")]
        public IActionResult GetBackupHistory()
        {
            var folder = _settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
            if (!Directory.Exists(folder)) return Ok(new List<object>());

            var files = Directory.GetFiles(folder, "*.bak")
                .Select((f, idx) => new {
                    id = idx,
                    backupDate = System.IO.File.GetCreationTimeUtc(f),
                    backupType = "Auto",
                    fileName = Path.GetFileName(f),
                    fileSizeMB = Math.Round(new FileInfo(f).Length / 1024.0 / 1024.0, 2),
                    status = "Success",
                    note = ""
                })
                .OrderByDescending(x => x.backupDate)
                .ToList();

            return Ok(files);
        }

        [HttpPost("settings/test")]
        public async Task<IActionResult> TestBackup()
        {
            try
            {
                var file = await _backupService.DoBackupAsync();
                return Ok(new { success = true, path = file });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("delete-sales")]
        public async Task<IActionResult> DeleteSalesData([FromBody] DeleteSalesRequest req)
        {
            if (req == null || req.ConfirmationText != "DELETE SALES DATA") return BadRequest("Invalid confirmation");

            try
            {
                // Delete orders table records as a safe operation
                using (var conn = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "DELETE FROM Orders";
                    await conn.OpenAsync();
                    await cmd.ExecuteNonQueryAsync();
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        public class DeleteSalesRequest { public string ConfirmationText { get; set; } }

        public class ScheduleRequest { public DateTime ScheduledAt { get; set; } }

        [HttpPost("backup/manual")]
        public async Task<IActionResult> ManualBackup()
        {
            try
            {
                var file = await _backupService.DoBackupAsync();
                return Ok(new { success = true, path = file });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("backup/restore")]
        public async Task<IActionResult> Restore([FromBody] RestoreRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.FileName)) 
                    return BadRequest(new { success = false, error = "Missing file name" });

                var folder = _settings.BackupFolder ?? "./Backups";
                if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
                var filePath = Path.Combine(folder, req.FileName);
                if (!System.IO.File.Exists(filePath)) 
                    return NotFound(new { success = false, error = "Backup file not found" });

                var connString = _configuration.GetConnectionString("DefaultConnection");
                var builder = new SqlConnectionStringBuilder(connString);
                var database = builder.InitialCatalog;
                
                // Connect to master database to avoid "database in use" error
                builder.InitialCatalog = "master";
                var masterConnString = builder.ConnectionString;

                // First try to close all connections to target database
                var killConnectionsSql = $@"
USE master;
ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
";
                
                var restoreSql = $@"
RESTORE DATABASE [{database}] FROM DISK = N'{filePath.Replace("'", "''")}' WITH REPLACE;
";
                
                var setMultiUserSql = $@"
ALTER DATABASE [{database}] SET MULTI_USER;
";

                // Execute in separate steps to handle potential issues
                using (var conn = new SqlConnection(masterConnString))
                {
                    await conn.OpenAsync();
                    
                    // Step 1: Set single user to kill connections
                    using (var cmd1 = conn.CreateCommand())
                    {
                        cmd1.CommandText = killConnectionsSql;
                        cmd1.CommandTimeout = 120;
                        await cmd1.ExecuteNonQueryAsync();
                    }
                    
                    // Step 2: Restore database
                    using (var cmd2 = conn.CreateCommand())
                    {
                        cmd2.CommandText = restoreSql;
                        cmd2.CommandTimeout = 1200; // 20 minutes for large restores
                        await cmd2.ExecuteNonQueryAsync();
                    }
                    
                    // Step 3: Set back to multi user
                    using (var cmd3 = conn.CreateCommand())
                    {
                        cmd3.CommandText = setMultiUserSql;
                        cmd3.CommandTimeout = 120;
                        await cmd3.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { success = true, message = "Database restored successfully. You may need to restart the application." });
            }
            catch (Exception ex)
            {
                // Try to ensure database is back in multi-user mode if restore failed
                try
                {
                    var connString = _configuration.GetConnectionString("DefaultConnection");
                    var builder = new SqlConnectionStringBuilder(connString);
                    var database = builder.InitialCatalog;
                    builder.InitialCatalog = "master";
                    var masterConnString = builder.ConnectionString;
                    
                    using (var conn = new SqlConnection(masterConnString))
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = $"ALTER DATABASE [{database}] SET MULTI_USER;";
                        await conn.OpenAsync();
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                catch { /* ignore cleanup errors */ }
                
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("backup/download")]
        public IActionResult Download([FromQuery] string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return BadRequest("fileName required");
            var folder = _settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));
            var filePath = Path.Combine(folder, fileName);
            if (!System.IO.File.Exists(filePath)) return NotFound();

            var contentType = "application/octet-stream";
            return PhysicalFile(filePath, contentType, fileName);
        }

        [HttpGet("settings")]
        public IActionResult GetSettings() => Ok(_settings);

        [HttpPost("settings")]
        public IActionResult UpdateSettings([FromBody] BackupSettings settings)
        {
            if (settings == null) return BadRequest();
            // Update runtime settings
            _settings.BackupFolder = settings.BackupFolder;
            _settings.AutoBackupEnabled = settings.AutoBackupEnabled;
            _settings.AutoBackupIntervalMinutes = settings.AutoBackupIntervalMinutes;
            _settings.UseDailySchedule = settings.UseDailySchedule;
            _settings.ScheduledTime = settings.ScheduledTime;

            // Attempt to persist to appsettings.json so changes survive restarts.
            try
            {
                var basePath = AppContext.BaseDirectory;
                var configPath = Path.Combine(basePath, "appsettings.json");
                if (System.IO.File.Exists(configPath))
                {
                    var text = System.IO.File.ReadAllText(configPath);
                    var root = JsonNode.Parse(text) as JsonObject ?? new JsonObject();

                    var section = root["BackupSettings"] as JsonObject ?? new JsonObject();
                    section["BackupFolder"] = _settings.BackupFolder;
                    section["AutoBackupEnabled"] = _settings.AutoBackupEnabled;
                    section["AutoBackupIntervalMinutes"] = _settings.AutoBackupIntervalMinutes;
                    section["UseDailySchedule"] = _settings.UseDailySchedule;
                    section["ScheduledTime"] = _settings.ScheduledTime;

                    root["BackupSettings"] = section;

                    var options = new JsonSerializerOptions { WriteIndented = true };
                    System.IO.File.WriteAllText(configPath, root.ToJsonString(options));
                }
            }
            catch
            {
                // ignore persistence errors - runtime settings were updated
            }

            return Ok(_settings);
        }

        [HttpGet("info")]
        public IActionResult GetInfo()
        {
            var connString = _configuration.GetConnectionString("DefaultConnection");
            var builder = new SqlConnectionStringBuilder(connString);
            var database = builder.InitialCatalog;
            var dataSource = builder.DataSource;

            // Last backup info
            var folder = _settings.BackupFolder ?? "./Backups";
            if (!Path.IsPathRooted(folder)) folder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, folder));

            DateTime? lastBackupUtc = null;
            string lastBackupFile = null;
            if (Directory.Exists(folder))
            {
                var files = Directory.GetFiles(folder, "*.bak");
                if (files.Length > 0)
                {
                    var latest = files.OrderByDescending(f => System.IO.File.GetCreationTimeUtc(f)).First();
                    lastBackupUtc = System.IO.File.GetCreationTimeUtc(latest);
                    lastBackupFile = Path.GetFileName(latest);
                }
            }

            return Ok(new {
                database = database,
                server = dataSource,
                lastBackupUtc,
                lastBackupFile
            });
        }

        [HttpPost("schedule")]
        public IActionResult Schedule([FromBody] ScheduleRequest req)
        {
            if (req == null || req.ScheduledAt == default) return BadRequest("Missing scheduledAt");

            // Convert to local time if unspecified
            var scheduled = req.ScheduledAt;
            if (scheduled.Kind == DateTimeKind.Unspecified) scheduled = DateTime.SpecifyKind(scheduled, DateTimeKind.Local);

            var now = DateTime.Now;
            if (scheduled <= now) return BadRequest("Scheduled time must be in the future");

            // Fire-and-forget scheduling. Note: if the process restarts the schedule is lost.
            Task.Run(async () =>
            {
                try
                {
                    var delay = scheduled - DateTime.Now;
                    if (delay.TotalMilliseconds > 0)
                        await Task.Delay(delay);

                    await _backupService.DoBackupAsync();
                }
                catch
                {
                    // swallow - logging could be added here
                }
            });

            return Ok(new { success = true, scheduledAt = scheduled });
        }
    }

    public class RestoreRequest
    {
        public string FileName { get; set; }
    }
}
