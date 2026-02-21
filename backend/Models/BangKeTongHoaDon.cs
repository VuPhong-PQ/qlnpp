using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace QlnppApi.Models
{
    public class BangKeTongHoaDon
    {
        public int Id { get; set; }

        [Required]
        public int BangKeTongId { get; set; }

        [ForeignKey("BangKeTongId")]
        [JsonIgnore]
        public BangKeTong? BangKeTong { get; set; }

        // Reference to the original Order (nullable for backward compatibility)
        public int? OrderId { get; set; }

        [MaxLength(200)]
        public string MaPhieu { get; set; } = string.Empty;

        [MaxLength(500)]
        public string TenKhachHang { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TongTien { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TongTienSauGiam { get; set; }

        [MaxLength(200)]
        public string NvSale { get; set; } = string.Empty;

        [MaxLength(200)]
        public string LoaiHang { get; set; } = string.Empty;
    }
}
