using System;
using System.ComponentModel.DataAnnotations;

namespace QlnppApi.Models
{
    public class WarehousePermission
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public int WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }
        
        public bool CanView { get; set; }
        public bool CanImport { get; set; }  // Nhập kho
        public bool CanExport { get; set; }  // Xuất kho
        public bool CanTransfer { get; set; } // Chuyển kho
        public bool CanViewStock { get; set; } // Xem tồn kho
        public bool CanAdjustStock { get; set; } // Điều chỉnh tồn kho
    }
}
