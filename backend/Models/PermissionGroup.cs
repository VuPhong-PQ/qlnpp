using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class PermissionGroup
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        // Navigation
        public ICollection<UserPermissionGroup> UserPermissionGroups { get; set; } = new List<UserPermissionGroup>();
        public ICollection<PermissionGroupDetail> PermissionDetails { get; set; } = new List<PermissionGroupDetail>();
    }

    public class UserPermissionGroup
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int PermissionGroupId { get; set; }
        public PermissionGroup? PermissionGroup { get; set; }
    }

    public class PermissionGroupDetail
    {
        public int Id { get; set; }
        public int PermissionGroupId { get; set; }
        public PermissionGroup? PermissionGroup { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string ResourceKey { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? ResourceName { get; set; }
        
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanPrint { get; set; }
        public bool CanImport { get; set; }
        public bool CanExport { get; set; }
    }
}
