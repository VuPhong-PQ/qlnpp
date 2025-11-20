namespace QlnppApi.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string VatName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double ShelfLife { get; set; }
        public string BaseUnit { get; set; } = string.Empty;
        public decimal RetailPrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public double Weight { get; set; }
        public double Volume { get; set; }
        public string Unit1 { get; set; } = string.Empty;
        public int Conversion1 { get; set; }
        public decimal RetailPrice1 { get; set; }
        public decimal WholesalePrice1 { get; set; }
        public double Weight1 { get; set; }
        public double Volume1 { get; set; }
        public string Unit2 { get; set; } = string.Empty;
        public int Conversion2 { get; set; }
        public double Weight2 { get; set; }
        public double Volume2 { get; set; }
        public string DefaultUnit { get; set; } = string.Empty;
        public int MinStock { get; set; }
        public decimal Discount { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Promotion { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
