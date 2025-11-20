# Hướng dẫn chạy Backend QLNPP API

## ✅ Đã hoàn thành

### 1. Cấu hình SQL Server
- **Server Instance**: `localhost\KTEAM` (SQL Server 2019)
- **Database**: `QlnppDb`
- **Username**: `sa`
- **Password**: `sa@123`

### 2. Database được tạo với 11 bảng:
- ✅ AccountFunds (Tài khoản quỹ)
- ✅ CompanyInfos (Thông tin công ty)
- ✅ CustomerGroups (Nhóm khách hàng)
- ✅ Customers (Khách hàng)
- ✅ Orders (Đơn hàng)
- ✅ ProductCategories (Loại hàng)
- ✅ Products (Sản phẩm)
- ✅ Suppliers (Nhà cung cấp)
- ✅ TransactionContents (Nội dung giao dịch)
- ✅ Units (Đơn vị tính)
- ✅ Warehouses (Kho)

### 3. Dữ liệu mẫu đã được thêm:
- ✅ 6 đơn vị tính (Units)
- ✅ 5 loại hàng (ProductCategories)
- ✅ 5 nhóm khách hàng (CustomerGroups)
- ✅ 9 nội dung giao dịch (TransactionContents)
- ✅ 4 tài khoản quỹ (AccountFunds)
- ✅ 1 thông tin công ty (CompanyInfos)

### 4. Backend API đang chạy
- **URL**: http://localhost:5238
- **Framework**: ASP.NET Core 9.0
- **Status**: ✅ Running

## 📋 Các lệnh hữu ích

### Chạy Backend
```powershell
cd d:\laptrinh\thiekepm\qlnpp1\backend
dotnet run --project QlnppApi.csproj
```

### Chạy Backend trong PowerShell mới
```powershell
cd d:\laptrinh\thiekepm\qlnpp1\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run --project QlnppApi.csproj"
```

### Thêm dữ liệu mẫu vào Database
```powershell
sqlcmd -S localhost\KTEAM -U sa -P "sa@123" -i "d:\laptrinh\thiekepm\qlnpp1\backend\SeedData.sql"
```

### Kiểm tra Database
```powershell
sqlcmd -S localhost\KTEAM -U sa -P "sa@123" -d QlnppDb -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
```

### Cập nhật Database khi có migration mới
```powershell
cd d:\laptrinh\thiekepm\qlnpp1\backend
dotnet ef database update
```

### Tạo migration mới
```powershell
cd d:\laptrinh\thiekepm\qlnpp1\backend
dotnet ef migrations add TenMigration
```

## 🔗 API Endpoints đã test thành công

### Setup - Thiết lập ban đầu

#### Units (Đơn vị tính)
- ✅ GET http://localhost:5238/api/units
- POST http://localhost:5238/api/units
- PUT http://localhost:5238/api/units/{id}
- DELETE http://localhost:5238/api/units/{id}

**Dữ liệu mẫu**: Cái, Kilogram, Thùng, Gói, Hộp, Chai

#### ProductCategories (Loại hàng)
- ✅ GET http://localhost:5238/api/productcategories
- POST http://localhost:5238/api/productcategories
- PUT http://localhost:5238/api/productcategories/{id}
- DELETE http://localhost:5238/api/productcategories/{id}

**Dữ liệu mẫu**: Điện tử - Gia dụng, Thực phẩm tươi sống, Văn phòng phẩm

#### CustomerGroups (Nhóm khách hàng)
- ✅ GET http://localhost:5238/api/customergroups
- POST http://localhost:5238/api/customergroups
- PUT http://localhost:5238/api/customergroups/{id}
- DELETE http://localhost:5238/api/customergroups/{id}

**Dữ liệu mẫu**: Khách sỉ, Khách lẻ, Siêu thị, Đại lý

#### TransactionContents (Nội dung giao dịch)
- ✅ GET http://localhost:5238/api/transactioncontents
- POST http://localhost:5238/api/transactioncontents
- PUT http://localhost:5238/api/transactioncontents/{id}
- DELETE http://localhost:5238/api/transactioncontents/{id}

**Dữ liệu mẫu**: Thu tiền bán hàng, Chi phí vận chuyển, Xuất bán hàng, Nhập từ nhà cung cấp

#### AccountFunds (Tài khoản quỹ)
- ✅ GET http://localhost:5238/api/accountfunds
- POST http://localhost:5238/api/accountfunds
- PUT http://localhost:5238/api/accountfunds/{id}
- DELETE http://localhost:5238/api/accountfunds/{id}

**Dữ liệu mẫu**: Quỹ tiền mặt, Tài khoản Vietcombank, Tài khoản Techcombank

#### CompanyInfos (Thông tin công ty)
- ✅ GET http://localhost:5238/api/companyinfos
- POST http://localhost:5238/api/companyinfos
- PUT http://localhost:5238/api/companyinfos/{id}
- DELETE http://localhost:5238/api/companyinfos/{id}

**Dữ liệu mẫu**: Công ty TNHH ABC

### Danh mục chính

#### Products (Sản phẩm)
- ✅ GET http://localhost:5238/api/products
- POST http://localhost:5238/api/products
- PUT http://localhost:5238/api/products/{id}
- DELETE http://localhost:5238/api/products/{id}

#### Customers (Khách hàng)
- ✅ GET http://localhost:5238/api/customers
- POST http://localhost:5238/api/customers
- PUT http://localhost:5238/api/customers/{id}
- DELETE http://localhost:5238/api/customers/{id}

#### Suppliers (Nhà cung cấp)
- ✅ GET http://localhost:5238/api/suppliers
- POST http://localhost:5238/api/suppliers
- PUT http://localhost:5238/api/suppliers/{id}
- DELETE http://localhost:5238/api/suppliers/{id}

#### Warehouses (Kho)
- ✅ GET http://localhost:5238/api/warehouses
- POST http://localhost:5238/api/warehouses
- PUT http://localhost:5238/api/warehouses/{id}
- DELETE http://localhost:5238/api/warehouses/{id}

#### Orders (Đơn hàng)
- ✅ GET http://localhost:5238/api/orders
- POST http://localhost:5238/api/orders
- PUT http://localhost:5238/api/orders/{id}
- DELETE http://localhost:5238/api/orders/{id}

## 🔧 Cấu hình Frontend để kết nối Backend

### Tạo file config API
```javascript
// src/config/api.js
const API_BASE_URL = 'http://localhost:5238/api';

export const api = {
  // Setup
  units: `${API_BASE_URL}/units`,
  productCategories: `${API_BASE_URL}/productcategories`,
  customerGroups: `${API_BASE_URL}/customergroups`,
  transactionContents: `${API_BASE_URL}/transactioncontents`,
  accountFunds: `${API_BASE_URL}/accountfunds`,
  companyInfos: `${API_BASE_URL}/companyinfos`,
  
  // Main
  products: `${API_BASE_URL}/products`,
  customers: `${API_BASE_URL}/customers`,
  suppliers: `${API_BASE_URL}/suppliers`,
  warehouses: `${API_BASE_URL}/warehouses`,
  orders: `${API_BASE_URL}/orders`,
};

export default api;
```

### Sử dụng trong component
```javascript
import api from '../config/api';

// Lấy danh sách đơn vị tính
const fetchUnits = async () => {
  const response = await fetch(api.units);
  const data = await response.json();
  console.log(data);
};

// Thêm đơn vị tính mới
const addUnit = async (unit) => {
  const response = await fetch(api.units, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unit)
  });
  return await response.json();
};

// Cập nhật đơn vị tính
const updateUnit = async (id, unit) => {
  const response = await fetch(`${api.units}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unit)
  });
  return response.ok;
};

// Xóa đơn vị tính
const deleteUnit = async (id) => {
  const response = await fetch(`${api.units}/${id}`, {
    method: 'DELETE'
  });
  return response.ok;
};
```

## ⚠️ Lưu ý

- CORS đã được cấu hình để cho phép tất cả origins
- Backend chạy trên port **5238** (HTTP)
- Dữ liệu mẫu đã được thêm cho các bảng thiết lập ban đầu
- Các models đã được cập nhật để phù hợp với frontend:
  - AccountFund: thêm AccountHolder, AccountNumber, Bank, Branch
  - CustomerGroup: thêm SalesSchedule
  - ProductCategory: thêm NoGroupOrder
  - TransactionContent: sắp xếp lại thứ tự fields

## 📊 Cấu trúc Models

### AccountFund
```csharp
{
  "id": 1,
  "code": "QUY001",
  "name": "Quỹ tiền mặt",
  "accountHolder": "Nguyễn Văn A",
  "accountNumber": "",
  "bank": "",
  "branch": "",
  "initialBalance": 10000000.00,
  "note": "Quỹ tiền mặt tại văn phòng",
  "status": "active"
}
```

### CustomerGroup
```csharp
{
  "id": 1,
  "code": "KH001",
  "name": "Khách sỉ",
  "salesSchedule": "Thứ 2, 4, 6",
  "note": "Nhóm khách hàng sỉ",
  "status": "active"
}
```

### ProductCategory
```csharp
{
  "id": 1,
  "code": "LH001",
  "name": "Điện tử - Gia dụng",
  "noGroupOrder": false,
  "note": "Các sản phẩm điện tử",
  "status": "active"
}
```

### TransactionContent
```csharp
{
  "id": 1,
  "type": "Thu",
  "code": "THU001",
  "name": "Thu tiền bán hàng",
  "note": "Thu tiền từ khách hàng",
  "status": "active"
}
```

### Unit
```csharp
{
  "id": 1,
  "code": "CAI",
  "name": "Cái",
  "note": "Đơn vị đếm",
  "status": "active"
}
```

