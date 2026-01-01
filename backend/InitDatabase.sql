-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'QlnppDb')
BEGIN
    CREATE DATABASE QlnppDb;
END
GO

USE QlnppDb;
GO

-- Create Products Table
CREATE TABLE Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Category NVARCHAR(100) NOT NULL,
    Barcode NVARCHAR(50) NOT NULL,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    VatName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    ShelfLife FLOAT,
    BaseUnit NVARCHAR(50) NOT NULL,
    RetailPrice DECIMAL(18,2),
    WholesalePrice DECIMAL(18,2),
    Weight FLOAT,
    Volume FLOAT,
    Unit1 NVARCHAR(50),
    Conversion1 INT,
    RetailPrice1 DECIMAL(18,2),
    WholesalePrice1 DECIMAL(18,2),
    Weight1 FLOAT,
    Volume1 FLOAT,
    Unit2 NVARCHAR(50),
    Conversion2 INT,
    Weight2 FLOAT,
    Volume2 FLOAT,
    DefaultUnit NVARCHAR(50),
    MinStock INT,
    Discount DECIMAL(18,2),
    Note NVARCHAR(500),
    Promotion NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create Customers Table
CREATE TABLE Customers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerGroup NVARCHAR(100),
    Code NVARCHAR(50) NOT NULL,
    VatName NVARCHAR(200) NOT NULL,
    VatAddress NVARCHAR(500),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Account NVARCHAR(50),
    TaxCode NVARCHAR(50),
    CustomerType NVARCHAR(50),
    Vehicle NVARCHAR(100),
    PrintOrder INT,
    BusinessType NVARCHAR(100),
    DebtLimit DECIMAL(18,2),
    DebtTerm NVARCHAR(50),
    InitialDebt DECIMAL(18,2),
    Note NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create Orders Table
CREATE TABLE Orders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CreatedDate NVARCHAR(50),
    PaymentDate NVARCHAR(50),
    InvoiceNumber NVARCHAR(100),
    OrderNumber NVARCHAR(100),
    MergeFromOrder NVARCHAR(100),
    MergeToOrder NVARCHAR(100),
    CustomerGroup NVARCHAR(100),
    SalesSchedule NVARCHAR(100),
    Customer NVARCHAR(200),
    Vehicle NVARCHAR(100),
    DeliveryVehicle NVARCHAR(100),
    PrintOrder INT,
    CreatedBy NVARCHAR(100),
    SalesStaff NVARCHAR(100),
    ProductType NVARCHAR(100),
    TotalAmount DECIMAL(18,2),
    TotalAfterDiscount DECIMAL(18,2),
    TotalWeight FLOAT,
    TotalVolume FLOAT,
    Status NVARCHAR(50),
    Note NVARCHAR(500),
    DeliveryNote NVARCHAR(500)
);

-- Create Suppliers Table
CREATE TABLE Suppliers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    VatName NVARCHAR(200) NOT NULL,
    VatAddress NVARCHAR(500),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    TaxCode NVARCHAR(50),
    Account NVARCHAR(50),
    ContactPerson NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    DebtLimit DECIMAL(18,2),
    DebtTerm NVARCHAR(50),
    InitialDebt DECIMAL(18,2),
    Note NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create Warehouses Table
CREATE TABLE Warehouses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    Manager NVARCHAR(100),
    Phone NVARCHAR(20),
    Note NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create CustomerGroups Table
CREATE TABLE CustomerGroups (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create ProductCategories Table
CREATE TABLE ProductCategories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create Units Table
CREATE TABLE Units (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create AccountFunds Table
CREATE TABLE AccountFunds (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50),
    Balance DECIMAL(18,2),
    Description NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create TransactionContents Table
CREATE TABLE TransactionContents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50),
    Description NVARCHAR(500),
    Status NVARCHAR(50)
);

-- Create CompanyInfos Table
CREATE TABLE CompanyInfos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    TaxCode NVARCHAR(50),
    Website NVARCHAR(200),
    Logo NVARCHAR(500),
    Representative NVARCHAR(100),
    Position NVARCHAR(100)
);

GO

PRINT 'Database và các bảng đã được tạo thành công!';

-- Create WarehouseTransfers table (for transfer between warehouses)
IF OBJECT_ID('dbo.WarehouseTransfers', 'U') IS NULL
BEGIN
    CREATE TABLE WarehouseTransfers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TransferNumber NVARCHAR(100) NOT NULL,
        Date DATETIME NOT NULL,
        Note NVARCHAR(1000),
        Employee NVARCHAR(250),
        TransferType NVARCHAR(100),
        SourceWarehouse NVARCHAR(100),
        DestWarehouse NVARCHAR(100),
        Total DECIMAL(18,2) DEFAULT 0,
        TotalWeight DECIMAL(18,2) DEFAULT 0,
        TotalVolume DECIMAL(18,2) DEFAULT 0,
        TotalText NVARCHAR(500)
    );
END

IF OBJECT_ID('dbo.WarehouseTransferItems', 'U') IS NULL
BEGIN
    CREATE TABLE WarehouseTransferItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        WarehouseTransferId INT NOT NULL,
        Barcode NVARCHAR(200),
        ProductCode NVARCHAR(200),
        ProductName NVARCHAR(500),
        Description NVARCHAR(1000),
        Unit NVARCHAR(100),
        Conversion DECIMAL(18,4),
        Quantity DECIMAL(18,4),
        UnitPrice DECIMAL(18,2),
        Total DECIMAL(18,2),
        Weight DECIMAL(18,2),
        Volume DECIMAL(18,2),
        Warehouse NVARCHAR(200),
        Note NVARCHAR(1000),
        NoteDate DATETIME,
        TransportCost DECIMAL(18,2),
        TotalTransport DECIMAL(18,2),
        CONSTRAINT FK_WarehouseTransfer_Items FOREIGN KEY (WarehouseTransferId) REFERENCES WarehouseTransfers(Id) ON DELETE CASCADE
    );
END
