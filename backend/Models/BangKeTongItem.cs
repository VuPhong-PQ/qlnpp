using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace QlnppApi.Models
{
    public class BangKeTongItem
    {
        public int Id { get; set; }

        [Required]
        public int BangKeTongId { get; set; }

        [ForeignKey("BangKeTongId")]
        [JsonIgnore]
        public BangKeTong? BangKeTong { get; set; }

        [MaxLength(200)]
        public string MaPhieu { get; set; } = string.Empty;

        [MaxLength(200)]
        public string MaVach { get; set; } = string.Empty;

        [MaxLength(200)]
        public string MaHang { get; set; } = string.Empty;

        [MaxLength(500)]
        public string TenHang { get; set; } = string.Empty;

        [MaxLength(100)]
        public string DonViTinh1 { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,3)")]
        public decimal SoLuongDVT1 { get; set; }

        [MaxLength(100)]
        public string DonViGoc { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,3)")]
        public decimal SoLuongDVTGoc { get; set; }

        [MaxLength(500)]
        public string MoTa { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,3)")]
        public decimal SlBanTheoDVTGoc { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal QuyDoi { get; set; } = 1;

        [MaxLength(200)]
        public string LoaiHang { get; set; } = string.Empty;
    }
}
