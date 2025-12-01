using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace QlnppApi.Models
{
    public class QuotationItem
    {
        public int Id { get; set; }

        [Required]
        public int QuotationId { get; set; }

        [ForeignKey("QuotationId")]
        [JsonIgnore]
        public Quotation? Quotation { get; set; }

        [MaxLength(200)]
        public string ItemType { get; set; }

        [MaxLength(200)]
        public string Barcode { get; set; }

        [MaxLength(200)]
        public string ItemCode { get; set; }

        [MaxLength(500)]
        public string ItemName { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; }

        [MaxLength(50)]
        public string Unit { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Price { get; set; }

        [MaxLength(50)]
        public string Unit1 { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Price1 { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}
