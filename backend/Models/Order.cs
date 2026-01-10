namespace QlnppApi.Models
{
    public class Order
    {
        public int Id { get; set; }
        public string CreatedDate { get; set; } = string.Empty;
        public string PaymentDate { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public string OrderNumber { get; set; } = string.Empty;
        public string MergeFromOrder { get; set; } = string.Empty;
        public string MergeToOrder { get; set; } = string.Empty;
        public string CustomerGroup { get; set; } = string.Empty;
        public string SalesSchedule { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public string Vehicle { get; set; } = string.Empty;
        public string DeliveryVehicle { get; set; } = string.Empty;
        public int PrintOrder { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string SalesStaff { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal TotalAfterDiscount { get; set; }
        public double TotalWeight { get; set; }
        public double TotalVolume { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string DeliveryNote { get; set; } = string.Empty;
        // New fields added to support frontend columns
        public bool? DeliverySuccessful { get; set; }
        public bool? VatExport { get; set; }
        public string Location { get; set; } = string.Empty;
    }
}
