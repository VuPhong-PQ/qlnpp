using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Username is required")]
        [MaxLength(100, ErrorMessage = "Username cannot exceed 100 characters")]
        public string Username { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? BirthYear { get; set; }
        public string? IdNumber { get; set; }
        public DateTime? IdIssuedDate { get; set; }
        public string? IdIssuedPlace { get; set; }
        public DateTime? YearStarted { get; set; }
        public string? Position { get; set; }
        public string? Note { get; set; }
        public bool IsInactive { get; set; }

        public ICollection<UserPermission> Permissions { get; set; } = new List<UserPermission>();
    }
}
