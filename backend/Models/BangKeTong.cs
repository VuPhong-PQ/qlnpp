using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QlnppApi.Models
{
    public class BangKeTong
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string ImportNumber { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; }

        [MaxLength(250)]
        public string Employee { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ImportType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string DsHoaDon { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Note { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public ICollection<BangKeTongItem> Items { get; set; } = new List<BangKeTongItem>();

        public ICollection<BangKeTongHoaDon> HoaDons { get; set; } = new List<BangKeTongHoaDon>();
    }
}
