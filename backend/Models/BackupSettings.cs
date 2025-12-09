namespace QlnppApi.Models
{
    public class BackupSettings
    {
        public string BackupFolder { get; set; } = "./Backups";
        public bool AutoBackupEnabled { get; set; } = false;
        public int AutoBackupIntervalMinutes { get; set; } = 60;
        // New scheduling options
        // Use daily schedule (if true, ScheduledTime will be used)
        public bool UseDailySchedule { get; set; } = false;
        // Scheduled time in HH:mm format (local server time)
        public string ScheduledTime { get; set; } = "02:00";
    }
}
