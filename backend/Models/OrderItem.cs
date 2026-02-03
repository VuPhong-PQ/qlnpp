using System.ComponentModel.DataAnnotations.Schema;

namespace QlnppApi.Models
{
    public class OrderItem
    {
        public int Id { get; set; }

        // Foreign key to Order
        public int OrderId { get; set; }
        public virtual Order? Order { get; set; }

        // Item type: "sale" for hàng bán, "promotion" for hàng khuyến mãi
        public string ItemType { get; set; } = "sale";

        // Product information
        public string ProductCode { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;

        // Quantities and pricing
        [Column(TypeName = "decimal(18,3)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercent { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceAfterCK { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAfterCK { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAfterDiscount { get; set; }

        // Sales information
        public string NvSales { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Unit conversion
        [Column(TypeName = "decimal(18,3)")]
        public decimal Conversion { get; set; } = 1;

        // Calculated amounts
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        // Weight and volume
        [Column(TypeName = "decimal(18,3)")]
        public decimal Weight { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal Volume { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal BaseWeight { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal BaseVolume { get; set; }

        // Export and stock information
        public string ExportType { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,3)")]
        public decimal Stock { get; set; }

        // Tax information
        public string Tax { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceExcludeVAT { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalExcludeVAT { get; set; }
    }
}
