namespace QlnppApi.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string VatName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double ShelfLife { get; set; }
        
        // ĐVT (Đơn vị tính)
        public string BaseUnit { get; set; } = string.Empty; // ĐVT gốc
        public string Unit1 { get; set; } = string.Empty;
        public string Unit2 { get; set; } = string.Empty;
        public string Unit3 { get; set; } = string.Empty;
        public string Unit4 { get; set; } = string.Empty;
        public string DefaultUnit { get; set; } = string.Empty;
        
        // Quy đổi
        public decimal Conversion1 { get; set; }
        public decimal Conversion2 { get; set; }
        public decimal Conversion3 { get; set; }
        public decimal Conversion4 { get; set; }
        
        // Giá nhập
        public decimal ImportPrice { get; set; }
        public decimal ImportPrice1 { get; set; }
        public decimal ImportPrice2 { get; set; }
        public decimal ImportPrice3 { get; set; }
        public decimal ImportPrice4 { get; set; }
        
        // Giá bán lẻ
        public decimal RetailPrice { get; set; }
        public decimal RetailPrice1 { get; set; }
        public decimal RetailPrice2 { get; set; }
        public decimal RetailPrice3 { get; set; }
        public decimal RetailPrice4 { get; set; }
        
        // Giảm bán lẻ
        public decimal RetailDiscount1 { get; set; }
        public decimal RetailDiscount2 { get; set; }
        public decimal RetailDiscount3 { get; set; }
        public decimal RetailDiscount4 { get; set; }
        
        // Giá bán sỉ
        public decimal WholesalePrice { get; set; }
        public decimal WholesalePrice1 { get; set; }
        public decimal WholesalePrice2 { get; set; }
        public decimal WholesalePrice3 { get; set; }
        public decimal WholesalePrice4 { get; set; }
        
        // Giảm bán sỉ
        public decimal WholesaleDiscount1 { get; set; }
        public decimal WholesaleDiscount2 { get; set; }
        public decimal WholesaleDiscount3 { get; set; }
        public decimal WholesaleDiscount4 { get; set; }
        
        // Số Kg
        public double Weight { get; set; }
        public double Weight1 { get; set; }
        public double Weight2 { get; set; }
        public double Weight3 { get; set; }
        public double Weight4 { get; set; }
        
        // Số khối
        public double Volume { get; set; }
        public double Volume1 { get; set; }
        public double Volume2 { get; set; }
        public double Volume3 { get; set; }
        public double Volume4 { get; set; }
        
        // Phí vận chuyển
        public decimal ShippingFee { get; set; }
        public decimal ShippingFee1 { get; set; }
        public decimal ShippingFee2 { get; set; }
        public decimal ShippingFee3 { get; set; }
        public decimal ShippingFee4 { get; set; }
        
        // Thông tin khác
        public int MinStock { get; set; }
        public decimal Discount { get; set; }
        public string Note { get; set; } = string.Empty;
        public string Promotion { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
