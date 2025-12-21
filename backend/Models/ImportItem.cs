using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace QlnppApi.Models
{
    public class ImportItem
    {
        public int Id { get; set; }

        [Required]
        public int ImportId { get; set; }

        [ForeignKey("ImportId")]
        [JsonIgnore]
        public Import? Import { get; set; }

        [MaxLength(200)]
        public string Barcode { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ProductCode { get; set; } = string.Empty;

        [MaxLength(500)]
        public string ProductName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Specification { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Unit { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,4)")]
        public decimal? Conversion { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal? Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Total { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Weight { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Volume { get; set; }

        [MaxLength(200)]
        public string Warehouse { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Note { get; set; } = string.Empty;

        public DateTime? NoteDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TransportCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalTransport { get; set; }
    }
}
