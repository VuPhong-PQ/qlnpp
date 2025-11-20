# ASP.NET Core Backend - QLNPP API

## Cấu trúc dự án

Backend được xây dựng bằng ASP.NET Core 9.0 với Entity Framework Core và SQL Server.

### Thư mục:
- **Models**: Chứa các entity models (Product, Customer, Order, Supplier, Warehouse, v.v.)
- **Controllers**: Chứa các REST API controllers
- **Data**: Chứa ApplicationDbContext và database configuration
- **Migrations**: Chứa các migration files của Entity Framework Core

## Cấu hình Database

### Connection String
Database: QlnppDb
Server: localhost
User: sa
Password: sa@123

Connection string được cấu hình trong `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=QlnppDb;User Id=sa;Password=sa@123;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

## Tạo Database

### Cách 1: Sử dụng Migration
```bash
cd backend
dotnet ef database update
```

### Cách 2: Chạy SQL Script
Chạy file `InitDatabase.sql` trong SQL Server Management Studio hoặc Azure Data Studio.

## API Endpoints

### Products
- GET `/api/products` - Lấy danh sách sản phẩm
- GET `/api/products/{id}` - Lấy chi tiết sản phẩm
- POST `/api/products` - Tạo sản phẩm mới
- PUT `/api/products/{id}` - Cập nhật sản phẩm
- DELETE `/api/products/{id}` - Xóa sản phẩm

### Customers
- GET `/api/customers` - Lấy danh sách khách hàng
- GET `/api/customers/{id}` - Lấy chi tiết khách hàng
- POST `/api/customers` - Tạo khách hàng mới
- PUT `/api/customers/{id}` - Cập nhật khách hàng
- DELETE `/api/customers/{id}` - Xóa khách hàng

### Orders
- GET `/api/orders` - Lấy danh sách đơn hàng
- GET `/api/orders/{id}` - Lấy chi tiết đơn hàng
- POST `/api/orders` - Tạo đơn hàng mới
- PUT `/api/orders/{id}` - Cập nhật đơn hàng
- DELETE `/api/orders/{id}` - Xóa đơn hàng

### Suppliers
- GET `/api/suppliers` - Lấy danh sách nhà cung cấp
- GET `/api/suppliers/{id}` - Lấy chi tiết nhà cung cấp
- POST `/api/suppliers` - Tạo nhà cung cấp mới
- PUT `/api/suppliers/{id}` - Cập nhật nhà cung cấp
- DELETE `/api/suppliers/{id}` - Xóa nhà cung cấp

### Warehouses
- GET `/api/warehouses` - Lấy danh sách kho
- GET `/api/warehouses/{id}` - Lấy chi tiết kho
- POST `/api/warehouses` - Tạo kho mới
- PUT `/api/warehouses/{id}` - Cập nhật kho
- DELETE `/api/warehouses/{id}` - Xóa kho

### Customer Groups
- GET `/api/customergroups` - Lấy danh sách nhóm khách hàng
- GET `/api/customergroups/{id}` - Lấy chi tiết nhóm khách hàng
- POST `/api/customergroups` - Tạo nhóm khách hàng mới
- PUT `/api/customergroups/{id}` - Cập nhật nhóm khách hàng
- DELETE `/api/customergroups/{id}` - Xóa nhóm khách hàng

### Product Categories
- GET `/api/productcategories` - Lấy danh sách loại hàng
- GET `/api/productcategories/{id}` - Lấy chi tiết loại hàng
- POST `/api/productcategories` - Tạo loại hàng mới
- PUT `/api/productcategories/{id}` - Cập nhật loại hàng
- DELETE `/api/productcategories/{id}` - Xóa loại hàng

### Units
- GET `/api/units` - Lấy danh sách đơn vị tính
- GET `/api/units/{id}` - Lấy chi tiết đơn vị tính
- POST `/api/units` - Tạo đơn vị tính mới
- PUT `/api/units/{id}` - Cập nhật đơn vị tính
- DELETE `/api/units/{id}` - Xóa đơn vị tính

### Account Funds
- GET `/api/accountfunds` - Lấy danh sách tài khoản quỹ
- GET `/api/accountfunds/{id}` - Lấy chi tiết tài khoản quỹ
- POST `/api/accountfunds` - Tạo tài khoản quỹ mới
- PUT `/api/accountfunds/{id}` - Cập nhật tài khoản quỹ
- DELETE `/api/accountfunds/{id}` - Xóa tài khoản quỹ

### Transaction Contents
- GET `/api/transactioncontents` - Lấy danh sách nội dung giao dịch
- GET `/api/transactioncontents/{id}` - Lấy chi tiết nội dung giao dịch
- POST `/api/transactioncontents` - Tạo nội dung giao dịch mới
- PUT `/api/transactioncontents/{id}` - Cập nhật nội dung giao dịch
- DELETE `/api/transactioncontents/{id}` - Xóa nội dung giao dịch

### Company Info
- GET `/api/companyinfos` - Lấy thông tin công ty
- GET `/api/companyinfos/{id}` - Lấy chi tiết thông tin công ty
- POST `/api/companyinfos` - Tạo thông tin công ty mới
- PUT `/api/companyinfos/{id}` - Cập nhật thông tin công ty
- DELETE `/api/companyinfos/{id}` - Xóa thông tin công ty

## Chạy ứng dụng

### Development
```bash
cd backend
dotnet run
```

API sẽ chạy tại: `https://localhost:7001` và `http://localhost:5000`

### Build for Production
```bash
cd backend
dotnet publish -c Release -o ./publish
```

## CORS Configuration

CORS đã được cấu hình để cho phép frontend React kết nối:
- Cho phép tất cả origins
- Cho phép tất cả methods
- Cho phép tất cả headers

Trong môi trường production, nên giới hạn CORS chỉ cho phép domain cụ thể.

## Packages sử dụng

- Microsoft.EntityFrameworkCore.SqlServer (9.0.0)
- Microsoft.EntityFrameworkCore.Tools (9.0.0)
- Microsoft.EntityFrameworkCore.Design (9.0.0)
