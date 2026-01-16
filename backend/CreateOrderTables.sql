-- Script tạo bảng Orders và OrderItems cho hệ thống quản lý đơn hàng
-- Tương ứng với CreateOrderForm.jsx

-- Bảng Orders - Lưu thông tin đơn hàng chính
-- CREATE TABLE Orders (
--     Id int IDENTITY(1,1) PRIMARY KEY,
--     OrderDate date NOT NULL,                    -- Ngày đơn hàng
--     OrderNumber nvarchar(max) NOT NULL,         -- Số đơn hàng (format: BHyyyymmdd-xxxxxx)
--     Customer nvarchar(max) NOT NULL,            -- Mã khách hàng
--     CustomerName nvarchar(max) NOT NULL,        -- Tên khách hàng
--     Phone nvarchar(max) NOT NULL,               -- Số điện thoại
--     CreatedBy nvarchar(max) NOT NULL,           -- Người tạo
--     Address nvarchar(max) NOT NULL,             -- Địa chỉ
--     Vehicle nvarchar(max) NOT NULL,             -- Xe vận chuyển
--     CustomerGroup nvarchar(max) NOT NULL,       -- Nhóm khách hàng
--     SalesSchedule nvarchar(max) NOT NULL,       -- Lịch bán hàng
--     PrintOrder int NOT NULL,                    -- In đơn hàng
--     DeliveryVehicle nvarchar(max) NOT NULL,     -- Xe giao hàng
--     PriceType nvarchar(max) NOT NULL,           -- Loại giá (retail/wholesale)
--     ActiveTab nvarchar(max) NOT NULL,           -- Tab hoạt động (products/promotions)
--     DiscountPercent decimal(5,2) NOT NULL,      -- Phần trăm giảm giá
--     DiscountAmount decimal(18,2) NOT NULL,      -- Số tiền giảm giá
--     DiscountNote nvarchar(max) NOT NULL,        -- Ghi chú giảm giá
--     TotalKg decimal(18,2) NOT NULL,             -- Tổng số kg
--     TotalM3 decimal(18,3) NOT NULL,             -- Tổng số m3
--     Payment decimal(18,2) NOT NULL,             -- Thanh toán
--     AccountFund nvarchar(max) NOT NULL,         -- Quỹ tài khoản
--     Notes nvarchar(max) NOT NULL,               -- Ghi chú
--     
--     -- Calculated fields
--     TotalAmount decimal(18,2) NOT NULL,         -- Tổng tiền
--     TotalAfterDiscount decimal(18,2) NOT NULL,  -- Tổng tiền sau giảm giá
--     
--     -- Legacy fields for backward compatibility
--     Status nvarchar(max) NOT NULL DEFAULT '',
--     CreatedDate nvarchar(max) NOT NULL DEFAULT '',
--     PaymentDate nvarchar(max) NOT NULL DEFAULT '',
--     InvoiceNumber nvarchar(max) NOT NULL DEFAULT '',
--     MergeFromOrder nvarchar(max) NOT NULL DEFAULT '',
--     MergeToOrder nvarchar(max) NOT NULL DEFAULT '',
--     SalesStaff nvarchar(max) NOT NULL DEFAULT '',
--     ProductType nvarchar(max) NOT NULL DEFAULT '',
--     TotalWeight float NOT NULL DEFAULT 0,
--     TotalVolume float NOT NULL DEFAULT 0,
--     Note nvarchar(max) NOT NULL DEFAULT '',
--     DeliveryNote nvarchar(max) NOT NULL DEFAULT '',
--     DeliverySuccessful bit NULL,
--     VatExport bit NULL,
--     Location nvarchar(max) NOT NULL DEFAULT ''
-- );

-- Bảng OrderItems - Lưu chi tiết sản phẩm trong đơn hàng
-- CREATE TABLE OrderItems (
--     Id int IDENTITY(1,1) PRIMARY KEY,
--     OrderId int NOT NULL,                       -- Khóa ngoại đến Orders
--     ProductCode nvarchar(max) NOT NULL,         -- Mã sản phẩm
--     Barcode nvarchar(max) NOT NULL,             -- Mã vạch
--     ProductName nvarchar(max) NOT NULL,         -- Tên sản phẩm
--     Warehouse nvarchar(max) NOT NULL,           -- Kho hàng
--     Unit nvarchar(max) NOT NULL,                -- Đơn vị tính
--     Quantity decimal(18,3) NOT NULL,            -- Số lượng
--     UnitPrice decimal(18,2) NOT NULL,           -- Đơn giá
--     DiscountPercent decimal(5,2) NOT NULL,      -- Phần trăm chiết khấu
--     PriceAfterCK decimal(18,2) NOT NULL,        -- Giá sau chiết khấu
--     TotalAfterCK decimal(18,2) NOT NULL,        -- Tổng tiền sau chiết khấu
--     TotalAfterDiscount decimal(18,2) NOT NULL,  -- Tổng tiền sau giảm giá
--     NvSales nvarchar(max) NOT NULL,             -- Nhân viên sales
--     Description nvarchar(max) NOT NULL,         -- Mô tả chi tiết
--     Conversion decimal(18,3) NOT NULL,          -- Quy đổi
--     Amount decimal(18,2) NOT NULL,              -- Thành tiền
--     Total decimal(18,2) NOT NULL,               -- Tổng tiền
--     Weight decimal(18,3) NOT NULL,              -- Số kg
--     Volume decimal(18,3) NOT NULL,              -- Số khối (m3)
--     BaseWeight decimal(18,3) NOT NULL,          -- Trọng lượng cơ bản
--     BaseVolume decimal(18,3) NOT NULL,          -- Thể tích cơ bản
--     ExportType nvarchar(max) NOT NULL,          -- Loại xuất
--     Stock decimal(18,3) NOT NULL,               -- Tồn kho
--     Tax nvarchar(max) NOT NULL,                 -- Thuế
--     PriceExcludeVAT decimal(18,2) NOT NULL,     -- Giá bán (-VAT)
--     TotalExcludeVAT decimal(18,2) NOT NULL,     -- Tổng tiền (-VAT)
--     
--     FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE
-- );

-- Index để tối ưu hiệu năng
-- CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
-- CREATE INDEX IX_Orders_Customer ON Orders(Customer);
-- CREATE INDEX IX_Orders_OrderNumber ON Orders(OrderNumber);
-- CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
-- CREATE INDEX IX_OrderItems_ProductCode ON OrderItems(ProductCode);

-- Sample data cho testing
INSERT INTO Orders (
    OrderDate, OrderNumber, Customer, CustomerName, Phone, CreatedBy,
    Address, Vehicle, CustomerGroup, SalesSchedule, PrintOrder, DeliveryVehicle,
    PriceType, ActiveTab, DiscountPercent, DiscountAmount, DiscountNote,
    TotalKg, TotalM3, Payment, AccountFund, Notes,
    TotalAmount, TotalAfterDiscount, Status
) VALUES (
    '2026-01-15', 'BH20260115-000001', 'KH001', 'Công ty ABC', '0123456789', 'NV001',
    '123 Đường ABC, Quận 1, TP.HCM', 'XE001', 'VIP', 'Hàng ngày', 1, 'XE002',
    'retail', 'products', 5.00, 50000.00, 'Giảm 5%',
    100.50, 2.500, 950000.00, 'QUY001', 'Đơn hàng mẫu',
    1000000.00, 950000.00, 'pending'
);

-- Lấy ID của order vừa tạo
DECLARE @OrderId int = SCOPE_IDENTITY();

-- Sample data cho OrderItems
INSERT INTO OrderItems (
    OrderId, ProductCode, Barcode, ProductName, Warehouse, Unit,
    Quantity, UnitPrice, DiscountPercent, PriceAfterCK, TotalAfterCK,
    TotalAfterDiscount, NvSales, Description, Conversion,
    Amount, Total, Weight, Volume, BaseWeight, BaseVolume,
    ExportType, Stock, Tax, PriceExcludeVAT, TotalExcludeVAT
) VALUES 
(
    @OrderId, 'SP001', '1234567890123', 'Sản phẩm A', 'KHO001', 'Thùng',
    10.000, 100000.00, 0.00, 100000.00, 1000000.00,
    950000.00, 'NV001', 'Sản phẩm chất lượng cao', 1.000,
    1000000.00, 950000.00, 100.500, 2.500, 10.050, 0.250,
    'xuất bán', 500.000, 'KCT', 90909.09, 863636.36
);

-- Thêm một order item nữa
INSERT INTO OrderItems (
    OrderId, ProductCode, Barcode, ProductName, Warehouse, Unit,
    Quantity, UnitPrice, DiscountPercent, PriceAfterCK, TotalAfterCK,
    TotalAfterDiscount, NvSales, Description, Conversion,
    Amount, Total, Weight, Volume, BaseWeight, BaseVolume,
    ExportType, Stock, Tax, PriceExcludeVAT, TotalExcludeVAT
) VALUES 
(
    @OrderId, 'SP002', '1234567890124', 'Sản phẩm B', 'KHO001', 'Kg',
    5.500, 50000.00, 2.00, 49000.00, 269500.00,
    256025.00, 'NV001', 'Sản phẩm phụ', 1.000,
    275000.00, 256025.00, 5.500, 0.100, 1.000, 0.018,
    'xuất bán', 200.000, '10%', 44545.45, 232750.00
);

PRINT 'Đã tạo thành công bảng Orders và OrderItems với sample data';
PRINT 'Order ID được tạo: ' + CAST(@OrderId AS NVARCHAR(10));

-- View để xem dữ liệu
SELECT 
    o.Id,
    o.OrderNumber,
    o.CustomerName,
    o.TotalAmount,
    o.TotalAfterDiscount,
    COUNT(oi.Id) as ItemCount
FROM Orders o
LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
GROUP BY o.Id, o.OrderNumber, o.CustomerName, o.TotalAmount, o.TotalAfterDiscount
ORDER BY o.OrderDate DESC;