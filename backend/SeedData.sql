USE QlnppDb;
GO

-- Xóa dữ liệu cũ nếu có
DELETE FROM Units;
DELETE FROM ProductCategories;
DELETE FROM CustomerGroups;
DELETE FROM TransactionContents;
DELETE FROM AccountFunds;
DELETE FROM CompanyInfos;
GO

-- Seed data cho Units (Đơn vị tính)
INSERT INTO Units (Code, Name, Note, Status) VALUES
('CAI', N'Cái', N'Đơn vị đếm cho các sản phẩm rời', 'active'),
('KG', N'Kilogram', N'Đơn vị khối lượng', 'active'),
('THUNG', N'Thùng', N'Đơn vị đóng gói lớn', 'active'),
('GOI', N'Gói', N'Đơn vị đóng gói nhỏ', 'active'),
('HOP', N'Hộp', N'Đơn vị đóng gói', 'active'),
('CHAI', N'Chai', N'Đơn vị đựng chất lỏng', 'active');
GO

-- Seed data cho ProductCategories (Loại hàng)
INSERT INTO ProductCategories (Code, Name, NoGroupOrder, Note, Status) VALUES
('LH001', N'Điện tử - Gia dụng', 0, N'Các sản phẩm điện tử và gia dụng', 'active'),
('LH002', N'Thực phẩm tươi sống', 1, N'Thực phẩm cần bảo quản lạnh, không gộp đơn', 'active'),
('LH003', N'Văn phòng phẩm', 0, N'Đồ dùng văn phòng, học tập', 'active'),
('LH004', N'Thực phẩm khô', 0, N'Thực phẩm đóng gói, hạn sử dụng dài', 'active'),
('LH005', N'Đồ uống', 0, N'Nước giải khát, đồ uống các loại', 'active');
GO

-- Seed data cho CustomerGroups (Nhóm khách hàng)
INSERT INTO CustomerGroups (Code, Name, SalesSchedule, Note, Status) VALUES
('KH001', N'Khách sỉ', N'Thứ 2, 4, 6', N'Nhóm khách hàng sỉ, ưu tiên giao hàng', 'active'),
('KH002', N'Khách lẻ', N'Hàng ngày', N'Nhóm khách hàng lẻ', 'active'),
('KH003', N'Siêu thị', N'Thứ 3, 5, 7', N'Nhóm siêu thị, cần hỗ trợ đặc biệt', 'active'),
('KH004', N'Đại lý', N'Thứ 2, 5', N'Đại lý phân phối, chiết khấu cao', 'active'),
('KH005', N'Cửa hàng tiện lợi', N'Hàng ngày', N'Chuỗi cửa hàng tiện lợi', 'active');
GO

-- Seed data cho TransactionContents (Nội dung giao dịch)
INSERT INTO TransactionContents (Type, Code, Name, Note, Status) VALUES
(N'Thu', 'THU001', N'Thu tiền bán hàng', N'Thu tiền từ khách hàng khi bán hàng', 'active'),
(N'Thu', 'THU002', N'Thu tiền nợ', N'Thu tiền công nợ từ khách hàng', 'active'),
(N'Chi', 'CHI001', N'Chi phí vận chuyển', N'Chi phí vận chuyển hàng hóa', 'active'),
(N'Chi', 'CHI002', N'Chi phí điện nước', N'Chi phí điện nước văn phòng', 'active'),
(N'Chi', 'CHI003', N'Thanh toán nhà cung cấp', N'Trả tiền mua hàng cho nhà cung cấp', 'active'),
(N'Xuất', 'XUAT001', N'Xuất bán hàng', N'Xuất hàng để bán cho khách', 'active'),
(N'Xuất', 'XUAT002', N'Xuất hủy', N'Xuất hàng hủy, hết hạn', 'active'),
(N'Nhập', 'NHAP001', N'Nhập từ nhà cung cấp', N'Nhập hàng từ nhà cung cấp', 'active'),
(N'Nhập', 'NHAP002', N'Nhập trả lại', N'Nhập hàng trả lại từ khách', 'active');
GO

-- Seed data cho AccountFunds (Tài khoản quỹ)
INSERT INTO AccountFunds (Code, Name, AccountHolder, AccountNumber, Bank, Branch, InitialBalance, Note, Status) VALUES
('QUY001', N'Quỹ tiền mặt', N'Nguyễn Văn A', '', '', '', 10000000, N'Quỹ tiền mặt tại văn phòng', 'active'),
('QUY002', N'Tài khoản Vietcombank', N'Công ty TNHH ABC', '1234567890', 'Vietcombank', N'Chi nhánh TP.HCM', 50000000, N'Tài khoản chính', 'active'),
('QUY003', N'Tài khoản Techcombank', N'Công ty TNHH ABC', '0987654321', 'Techcombank', N'Chi nhánh Hà Nội', 30000000, N'Tài khoản phụ', 'active'),
('QUY004', N'Quỹ dự phòng', N'Nguyễn Văn B', '', '', '', 20000000, N'Quỹ dự phòng khẩn cấp', 'active');
GO

-- Seed data cho CompanyInfos (Thông tin công ty)
INSERT INTO CompanyInfos (Name, Address, Phone, Email, TaxCode, Website, Logo, Representative, Position) VALUES
(N'Công ty TNHH ABC', 
 N'123 Đường Nguyễn Văn A, Quận 1, TP.HCM', 
 '0901234567', 
 'info@abc.com', 
 '0123456789', 
 'https://www.abc.com', 
 '', 
 N'Nguyễn Văn A', 
 N'Giám đốc');
GO

-- Seed data cho Warehouses (Kho hàng)
INSERT INTO Warehouses (Code, Name, Address, Manager, Phone, Note, Status) VALUES
(N'KHO001', N'Kho tổng', N'123 Đường ABC, Quận 1, TP.HCM', N'Nguyễn Văn A', '0123456789', N'Kho chính lưu trữ hàng hóa', 'active'),
(N'KHO002', N'Kho chi nhánh 1', N'456 Đường XYZ, Quận 2, TP.HCM', N'Trần Thị B', '0987654321', N'Kho chi nhánh khu vực phía Nam', 'active'),
(N'KHO003', N'Kho chi nhánh 2', N'789 Đường DEF, Quận 3, TP.HCM', N'Lê Văn C', '0369852147', N'Kho chi nhánh khu vực phía Bắc', 'active'),
(N'KHO004', N'Kho tạm thời', N'321 Đường GHI, Quận 4, TP.HCM', N'Phạm Thị D', '0147258369', N'Kho lưu trữ tạm thời', 'inactive');
GO

PRINT N'Đã thêm dữ liệu mẫu thành công!';
PRINT N'- Units: 6 đơn vị tính';
PRINT N'- ProductCategories: 5 loại hàng';
PRINT N'- CustomerGroups: 5 nhóm khách hàng';
PRINT N'- TransactionContents: 9 nội dung giao dịch';
PRINT N'- AccountFunds: 4 tài khoản quỹ';
PRINT N'- CompanyInfos: 1 thông tin công ty';
GO
