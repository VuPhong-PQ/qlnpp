using System.ComponentModel.DataAnnotations.Schema;

namespace QlnppApi.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        [Column(TypeName = "date")]
        public DateTime OrderDate { get; set; }
        
        public string OrderNumber { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Vehicle { get; set; } = string.Empty;
        public string CustomerGroup { get; set; } = string.Empty;
        public string SalesSchedule { get; set; } = string.Empty;
        public int PrintOrder { get; set; }
        public string DeliveryVehicle { get; set; } = string.Empty;
        public string PriceType { get; set; } = string.Empty; // retail or wholesale
        public string ActiveTab { get; set; } = string.Empty; // products or promotions
        
        // Hàng bán fields
        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercent { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }
        
        public string DiscountNote { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalKg { get; set; }
        
        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalM3 { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Payment { get; set; }
        
        public string AccountFund { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        
        // Hàng khuyến mãi fields (riêng biệt)
        [Column(TypeName = "decimal(5,2)")]
        public decimal PromoDiscountPercent { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal PromoDiscountAmount { get; set; }
        
        public string PromoDiscountNote { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal PromoTotalKg { get; set; }
        
        [Column(TypeName = "decimal(18,3)")]
        public decimal PromoTotalM3 { get; set; }
        
        public string PromoNotes { get; set; } = string.Empty;
        
        // Calculated fields
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAfterDiscount { get; set; }
        
        // Legacy fields for backward compatibility
        public string Status { get; set; } = string.Empty;
        public string CreatedDate { get; set; } = string.Empty;
        public string PaymentDate { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public string MergeFromOrder { get; set; } = string.Empty;
        public string MergeToOrder { get; set; } = string.Empty;
        public string SalesStaff { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public double TotalWeight { get; set; }
        public double TotalVolume { get; set; }
        public string Note { get; set; } = string.Empty;
        public string DeliveryNote { get; set; } = string.Empty;
        public bool? DeliverySuccessful { get; set; }
        public bool? VatExport { get; set; }
        public string Location { get; set; } = string.Empty;
        
        // Navigation property
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
