namespace QlnppApi.Models
{
    public class Vehicle
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal LoadCapacity { get; set; }
        public decimal Volume { get; set; }
        public int PurchaseYear { get; set; }
        public decimal PurchasePrice { get; set; }
        public int DepreciationMonths { get; set; }
        public decimal DepreciationValue { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
