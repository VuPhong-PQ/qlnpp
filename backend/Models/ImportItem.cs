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
        public string Barcode { get; set; }

        [MaxLength(200)]
        public string ProductCode { get; set; }

        [MaxLength(500)]
        public string ProductName { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; }

        [MaxLength(100)]
        public string Specification { get; set; }

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
        public string Warehouse { get; set; }

        [MaxLength(1000)]
        public string Note { get; set; }
    }
}
