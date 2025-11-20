# Hướng dẫn cập nhật Frontend kết nối với Backend API

## ✅ Đã cập nhật:
1. ✅ Units.jsx - Đơn vị tính
2. ✅ ProductCategories.jsx - Loại hàng

## 📋 Cần cập nhật:
3. ⏳ CustomerGroups.jsx - Nhóm khách hàng
4. ⏳ TransactionContents.jsx - Nội dung giao dịch
5. ⏳ AccountsFunds.jsx - Tài khoản quỹ (phức tạp hơn, có 2 tabs)
6. ⏳ CompanyInfo.jsx - Thông tin công ty (form đơn giản)
7. ⏳ Customers.jsx - Khách hàng
8. ⏳ Suppliers.jsx - Nhà cung cấp
9. ⏳ Warehouses.jsx - Kho
10. ⏳ Products.jsx - Sản phẩm

## 🔧 Template cập nhật component:

### Bước 1: Import thêm useEffect và API config
```javascript
import React, { useState, useRef, useEffect } from 'react'; // Thêm useEffect
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api'; // Import API
```

### Bước 2: Thay đổi state initialization
```javascript
// Thay vì:
const [items, setItems] = useState([...hardcoded data...]);

// Thành:
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
```

### Bước 3: Thêm useEffect để load data
```javascript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.get(API_ENDPOINTS.xxx); // Thay xxx bằng endpoint phù hợp
    setItems(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API.');
  } finally {
    setLoading(false);
  }
};
```

### Bước 4: Cập nhật handleSubmit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    if (editingItem) {
      // Update
      await api.put(API_ENDPOINTS.xxx, editingItem.id, formData);
      alert('Cập nhật thành công!');
    } else {
      // Create
      await api.post(API_ENDPOINTS.xxx, formData);
      alert('Thêm mới thành công!');
    }
    await fetchData(); // Reload data
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  } catch (error) {
    console.error('Error saving:', error);
    alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};
```

### Bước 5: Cập nhật handleDelete
```javascript
const handleDelete = async (id) => {
  if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
    try {
      setLoading(true);
      await api.delete(API_ENDPOINTS.xxx, id);
      alert('Xóa thành công!');
      await fetchData(); // Reload data
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }
};
```

## 📌 API Endpoints tương ứng:

```javascript
customerGroups: API_ENDPOINTS.customerGroups
transactionContents: API_ENDPOINTS.transactionContents
accountFunds: API_ENDPOINTS.accountFunds
companyInfos: API_ENDPOINTS.companyInfos
customers: API_ENDPOINTS.customers
suppliers: API_ENDPOINTS.suppliers
warehouses: API_ENDPOINTS.warehouses
products: API_ENDPOINTS.products
```

## ⚠️ Lưu ý đặc biệt:

### CompanyInfo.jsx
- Khác biệt: Là form đơn giản, không có danh sách
- Chỉ GET 1 item đầu tiên và PUT để cập nhật
- Không có DELETE

### AccountsFunds.jsx
- Khác biệt: Có 2 tabs (Quỹ tiền và Khoản vay)
- Cần cập nhật cả 2 phần riêng biệt
- Tab "Khoản vay" có thể tạo model riêng sau

## 🧪 Test sau khi cập nhật:

1. Mở trang tương ứng trong browser
2. Kiểm tra console xem có lỗi API không
3. Test các chức năng:
   - ✅ Load danh sách (GET)
   - ✅ Thêm mới (POST)
   - ✅ Sửa (PUT)
   - ✅ Xóa (DELETE)
4. Kiểm tra dữ liệu trong SQL Server
