using System;

namespace QlnppApi.Models
{
    public class UserPermission
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }

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
