-- ================================================
-- Script khởi tạo dữ liệu phân quyền
-- Chạy sau khi đã migration database
-- ================================================

-- Tạo nhóm quyền mặc định
INSERT INTO PermissionGroups (Name, Description, IsActive, CreatedAt) VALUES
(N'Quản trị viên', N'Có toàn quyền trong hệ thống', 1, GETDATE()),
(N'Nhân viên bán hàng', N'Quyền truy cập các chức năng bán hàng', 1, GETDATE()),
(N'Nhân viên kho', N'Quyền quản lý kho hàng', 1, GETDATE()),
(N'Kế toán', N'Quyền truy cập các chức năng kế toán, báo cáo', 1, GETDATE()),
(N'Xem báo cáo', N'Chỉ có quyền xem báo cáo', 1, GETDATE());

-- Tạo người dùng admin mặc định (password: admin123)
-- Password hash sử dụng SHA256 của 'admin123'
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Name, Email, Position, IsInactive)
    VALUES ('admin', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', N'Quản trị viên', 'admin@company.com', N'Admin', 0);
END

-- Gán quyền admin cho user admin
DECLARE @AdminUserId INT = (SELECT Id FROM Users WHERE Username = 'admin');
DECLARE @AdminGroupId INT = (SELECT Id FROM PermissionGroups WHERE Name = N'Quản trị viên');

IF @AdminUserId IS NOT NULL AND @AdminGroupId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM UserPermissionGroups WHERE UserId = @AdminUserId AND PermissionGroupId = @AdminGroupId)
    BEGIN
        INSERT INTO UserPermissionGroups (UserId, PermissionGroupId) VALUES (@AdminUserId, @AdminGroupId);
    END
END

-- Phân quyền chi tiết cho nhóm Quản trị viên (toàn quyền)
IF @AdminGroupId IS NOT NULL
BEGIN
    -- Xóa quyền cũ nếu có
    DELETE FROM PermissionGroupDetails WHERE PermissionGroupId = @AdminGroupId;
    
    -- Thêm quyền mới
    INSERT INTO PermissionGroupDetails (PermissionGroupId, ResourceKey, ResourceName, CanView, CanAdd, CanEdit, CanDelete, CanPrint, CanImport, CanExport) VALUES
    (@AdminGroupId, 'dashboard', N'Trang chủ', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'company_info', N'Thông tin công ty', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'accounts_funds', N'Tài khoản/Quỹ', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'customer_groups', N'Nhóm khách hàng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'customers', N'Khách hàng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'suppliers', N'Nhà cung cấp', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'product_categories', N'Danh mục hàng hóa', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'products', N'Hàng hóa', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'units', N'Đơn vị tính', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'transaction_contents', N'Nội dung giao dịch', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'warehouses', N'Kho hàng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'vehicles', N'Phương tiện', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'users', N'Nhân viên', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'permission_groups', N'Nhóm quyền', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'user_permissions', N'Phân quyền người dùng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'quotations', N'Báo giá', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'imports', N'Nhập kho', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'exports', N'Xuất kho', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'warehouse_transfers', N'Chuyển kho', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'orders', N'Đơn hàng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'receipts', N'Phiếu thu', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'expenses', N'Phiếu chi', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'cost_calculation', N'Tính giá vốn', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'report_sales', N'Báo cáo bán hàng', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'report_inventory', N'Báo cáo tồn kho', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'report_debt', N'Báo cáo công nợ', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'report_revenue', N'Báo cáo doanh thu', 1, 1, 1, 1, 1, 1, 1),
    (@AdminGroupId, 'admin', N'Quản trị hệ thống', 1, 1, 1, 1, 1, 1, 1);
END

-- Phân quyền cho nhóm Nhân viên bán hàng
DECLARE @SalesGroupId INT = (SELECT Id FROM PermissionGroups WHERE Name = N'Nhân viên bán hàng');
IF @SalesGroupId IS NOT NULL
BEGIN
    DELETE FROM PermissionGroupDetails WHERE PermissionGroupId = @SalesGroupId;
    
    INSERT INTO PermissionGroupDetails (PermissionGroupId, ResourceKey, ResourceName, CanView, CanAdd, CanEdit, CanDelete, CanPrint, CanImport, CanExport) VALUES
    (@SalesGroupId, 'dashboard', N'Trang chủ', 1, 0, 0, 0, 0, 0, 0),
    (@SalesGroupId, 'customers', N'Khách hàng', 1, 1, 1, 0, 1, 0, 1),
    (@SalesGroupId, 'products', N'Hàng hóa', 1, 0, 0, 0, 0, 0, 1),
    (@SalesGroupId, 'quotations', N'Báo giá', 1, 1, 1, 1, 1, 0, 1),
    (@SalesGroupId, 'orders', N'Đơn hàng', 1, 1, 1, 0, 1, 0, 1),
    (@SalesGroupId, 'receipts', N'Phiếu thu', 1, 1, 0, 0, 1, 0, 0);
END

-- Phân quyền cho nhóm Nhân viên kho
DECLARE @WarehouseGroupId INT = (SELECT Id FROM PermissionGroups WHERE Name = N'Nhân viên kho');
IF @WarehouseGroupId IS NOT NULL
BEGIN
    DELETE FROM PermissionGroupDetails WHERE PermissionGroupId = @WarehouseGroupId;
    
    INSERT INTO PermissionGroupDetails (PermissionGroupId, ResourceKey, ResourceName, CanView, CanAdd, CanEdit, CanDelete, CanPrint, CanImport, CanExport) VALUES
    (@WarehouseGroupId, 'dashboard', N'Trang chủ', 1, 0, 0, 0, 0, 0, 0),
    (@WarehouseGroupId, 'products', N'Hàng hóa', 1, 0, 0, 0, 0, 0, 1),
    (@WarehouseGroupId, 'warehouses', N'Kho hàng', 1, 0, 0, 0, 0, 0, 1),
    (@WarehouseGroupId, 'imports', N'Nhập kho', 1, 1, 1, 0, 1, 1, 1),
    (@WarehouseGroupId, 'exports', N'Xuất kho', 1, 1, 1, 0, 1, 0, 1),
    (@WarehouseGroupId, 'warehouse_transfers', N'Chuyển kho', 1, 1, 1, 0, 1, 0, 1),
    (@WarehouseGroupId, 'report_inventory', N'Báo cáo tồn kho', 1, 0, 0, 0, 1, 0, 1);
END

-- Phân quyền cho nhóm Kế toán
DECLARE @AccountingGroupId INT = (SELECT Id FROM PermissionGroups WHERE Name = N'Kế toán');
IF @AccountingGroupId IS NOT NULL
BEGIN
    DELETE FROM PermissionGroupDetails WHERE PermissionGroupId = @AccountingGroupId;
    
    INSERT INTO PermissionGroupDetails (PermissionGroupId, ResourceKey, ResourceName, CanView, CanAdd, CanEdit, CanDelete, CanPrint, CanImport, CanExport) VALUES
    (@AccountingGroupId, 'dashboard', N'Trang chủ', 1, 0, 0, 0, 0, 0, 0),
    (@AccountingGroupId, 'accounts_funds', N'Tài khoản/Quỹ', 1, 1, 1, 0, 1, 0, 1),
    (@AccountingGroupId, 'customers', N'Khách hàng', 1, 0, 0, 0, 0, 0, 1),
    (@AccountingGroupId, 'suppliers', N'Nhà cung cấp', 1, 0, 0, 0, 0, 0, 1),
    (@AccountingGroupId, 'receipts', N'Phiếu thu', 1, 1, 1, 0, 1, 0, 1),
    (@AccountingGroupId, 'expenses', N'Phiếu chi', 1, 1, 1, 0, 1, 0, 1),
    (@AccountingGroupId, 'cost_calculation', N'Tính giá vốn', 1, 1, 1, 0, 1, 0, 1),
    (@AccountingGroupId, 'report_sales', N'Báo cáo bán hàng', 1, 0, 0, 0, 1, 0, 1),
    (@AccountingGroupId, 'report_inventory', N'Báo cáo tồn kho', 1, 0, 0, 0, 1, 0, 1),
    (@AccountingGroupId, 'report_debt', N'Báo cáo công nợ', 1, 0, 0, 0, 1, 0, 1),
    (@AccountingGroupId, 'report_revenue', N'Báo cáo doanh thu', 1, 0, 0, 0, 1, 0, 1);
END

-- Tạo danh sách báo cáo mặc định
IF NOT EXISTS (SELECT 1 FROM ReportCategories)
BEGIN
    INSERT INTO ReportCategories ([Key], Name, Description, SortOrder, IsActive) VALUES
    ('sales', N'Bán hàng', N'Các báo cáo liên quan đến bán hàng', 1, 1),
    ('revenue', N'Doanh thu', N'Các báo cáo doanh thu', 2, 1),
    ('inventory', N'Tồn kho', N'Các báo cáo tồn kho', 3, 1),
    ('purchase', N'Mua hàng', N'Các báo cáo mua hàng', 4, 1),
    ('debt', N'Công nợ', N'Các báo cáo công nợ', 5, 1),
    ('accounting', N'Kế toán', N'Các báo cáo kế toán', 6, 1);
END

PRINT N'Đã khởi tạo dữ liệu phân quyền thành công!';
PRINT N'Tài khoản admin mặc định: admin / admin123';
GO
