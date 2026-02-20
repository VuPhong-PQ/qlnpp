-- =====================================================
-- Create tables for "In Bảng Kê Tổng" feature
-- Run this script against the QlnppDb database
-- =====================================================

-- 1. Main header table: BangKeTongs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BangKeTongs')
BEGIN
    CREATE TABLE [dbo].[BangKeTongs] (
        [Id]            INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ImportNumber]  NVARCHAR(100)   NOT NULL,           -- Số bảng kê tổng (BKT-...)
        [CreatedDate]   DATETIME2       NOT NULL,           -- Ngày lập
        [Employee]      NVARCHAR(250)   NOT NULL DEFAULT '',-- Nhân viên lập
        [ImportType]    NVARCHAR(200)   NOT NULL DEFAULT '',-- Bảng kê tổng (loại)
        [DsHoaDon]      NVARCHAR(500)   NOT NULL DEFAULT '',-- DS hóa đơn (reference)
        [Note]          NVARCHAR(1000)  NOT NULL DEFAULT '',-- Ghi chú bảng kê
        [TotalAmount]   DECIMAL(18,2)   NOT NULL DEFAULT 0, -- Tổng tiền
    );
    PRINT 'Created table BangKeTongs';
END
GO

-- 2. Child table: BangKeTongItems (tab "Bảng kê tổng")
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BangKeTongItems')
BEGIN
    CREATE TABLE [dbo].[BangKeTongItems] (
        [Id]                INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [BangKeTongId]      INT             NOT NULL,
        [MaPhieu]           NVARCHAR(200)   NOT NULL DEFAULT '',  -- Mã phiếu
        [TenKhachHang]      NVARCHAR(500)   NOT NULL DEFAULT '',  -- Tên khách hàng
        [TongTien]          DECIMAL(18,2)   NOT NULL DEFAULT 0,   -- Tổng tiền
        [TongTienSauGiam]   DECIMAL(18,2)   NOT NULL DEFAULT 0,   -- Tổng tiền sau giảm
        [NvSale]            NVARCHAR(250)   NOT NULL DEFAULT '',  -- NV Sale
        [LoaiHang]          NVARCHAR(200)   NOT NULL DEFAULT '',  -- Loại hàng
        CONSTRAINT [FK_BangKeTongItems_BangKeTongs] FOREIGN KEY ([BangKeTongId])
            REFERENCES [dbo].[BangKeTongs]([Id]) ON DELETE CASCADE
    );
    PRINT 'Created table BangKeTongItems';
END
GO

-- 3. Child table: BangKeTongHoaDons (tab "DS hóa đơn")
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BangKeTongHoaDons')
BEGIN
    CREATE TABLE [dbo].[BangKeTongHoaDons] (
        [Id]                INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [BangKeTongId]      INT             NOT NULL,
        [SoHoaDon]          NVARCHAR(200)   NOT NULL DEFAULT '',  -- Số hóa đơn
        [NgayHoaDon]        DATETIME2       NULL,                 -- Ngày hóa đơn
        [TenKhachHang]      NVARCHAR(500)   NOT NULL DEFAULT '',  -- Tên khách hàng
        [TongTien]          DECIMAL(18,2)   NOT NULL DEFAULT 0,   -- Tổng tiền
        [TrangThai]         NVARCHAR(200)   NOT NULL DEFAULT '',  -- Trạng thái
        CONSTRAINT [FK_BangKeTongHoaDons_BangKeTongs] FOREIGN KEY ([BangKeTongId])
            REFERENCES [dbo].[BangKeTongs]([Id]) ON DELETE CASCADE
    );
    PRINT 'Created table BangKeTongHoaDons';
END
GO
