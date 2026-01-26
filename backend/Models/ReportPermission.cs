using System;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class ReportPermission
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string ReportKey { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? ReportName { get; set; }
        
        public bool CanView { get; set; }
        public bool CanPrint { get; set; }
        public bool CanExport { get; set; }
    }

    public class ReportCategory
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public int SortOrder { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}
