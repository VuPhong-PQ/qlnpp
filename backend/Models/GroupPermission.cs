using System;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class GroupPermission
    {
        public int Id { get; set; }
        public int? GroupId { get; set; }
        [Required]
        [MaxLength(200)]
        public string ResourceKey { get; set; }
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanPrint { get; set; }
        public bool CanImport { get; set; }
        public bool CanExport { get; set; }
    }
}
