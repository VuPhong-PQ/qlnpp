-- SQL script to create Orders and OrderItems tables
IF OBJECT_ID('dbo.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CreatedDate NVARCHAR(100) NULL,
        PaymentDate NVARCHAR(100) NULL,
        InvoiceNumber NVARCHAR(200) NULL,
        OrderNumber NVARCHAR(200) NULL,
        MergeFromOrder NVARCHAR(200) NULL,
        MergeToOrder NVARCHAR(200) NULL,
        CustomerGroup NVARCHAR(200) NULL,
        SalesSchedule NVARCHAR(200) NULL,
        Customer NVARCHAR(200) NULL,
        CustomerName NVARCHAR(250) NULL,
        Phone NVARCHAR(50) NULL,
        Address NVARCHAR(500) NULL,
        Vehicle NVARCHAR(200) NULL,
        DeliveryVehicle NVARCHAR(200) NULL,
        PrintOrder INT NULL,
        CreatedBy NVARCHAR(200) NULL,
        SalesStaff NVARCHAR(200) NULL,
        ProductType NVARCHAR(200) NULL,
        PriceType NVARCHAR(50) NULL,
        DiscountPercent FLOAT NULL,
        DiscountAmount DECIMAL(18,2) NULL,
        TotalAmount DECIMAL(18,2) NULL,
        TotalAfterDiscount DECIMAL(18,2) NULL,
        TotalWeight FLOAT NULL,
        TotalVolume FLOAT NULL,
        TotalKg FLOAT NULL,
        TotalM3 FLOAT NULL,
        Payment DECIMAL(18,2) NULL,
        AccountFund NVARCHAR(200) NULL,
        Status NVARCHAR(100) NULL,
        Note NVARCHAR(1000) NULL,
        DeliveryNote NVARCHAR(1000) NULL,
        Notes NVARCHAR(1000) NULL
    );
END

IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductCode NVARCHAR(100) NULL,
        ProductName NVARCHAR(250) NULL,
        Warehouse NVARCHAR(200) NULL,
        Unit NVARCHAR(50) NULL,
        Quantity FLOAT NULL,
        UnitPrice DECIMAL(18,2) NULL,
        DiscountPercent FLOAT NULL,
        TotalAfterDiscount DECIMAL(18,2) NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE
    );
END
