using System.ComponentModel.DataAnnotations.Schema;

namespace QlnppApi.Models
{
    public class OrderItem
    {
        public int Id { get; set; }

        // Foreign key to Order
        public int OrderId { get; set; }
        public Order? Order { get; set; }

        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;

        // Quantities/prices
        public double Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        public double DiscountPercent { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAfterDiscount { get; set; }
    }
}
