# Hướng dẫn thêm Import/Export Excel cho các trang Thiết lập ban đầu

## Đã hoàn thành:
- ✅ Khách hàng (Customers)
- ✅ Đơn vị tính (Units)

## Cần thêm:
- 📋 Nhóm khách hàng (CustomerGroups)
- 📋 Danh mục sản phẩm (ProductCategories)
- 📋 Nội dung giao dịch (TransactionContents)
- 📋 Quỹ tài khoản (AccountsFunds)
- 📋 Vay ngân hàng (BankLoans - nếu có)

## Các bước thực hiện:

### 1. Import các dependencies cần thiết

```javascript
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { ExcelButtons } from '../common/ExcelButtons.jsx';
```

### 2. Thêm hook useExcelImportExport

Thêm sau phần useState, trước các handler functions:

```javascript
// Excel Import/Export configuration
const {
  handleExportExcel,
  handleImportExcel,
  handleFileChange,
  fileInputRef
} = useExcelImportExport({
  data: yourDataArray,              // Mảng dữ liệu hiện tại
  loadData: yourLoadFunction,        // Hàm load lại dữ liệu
  apiPost: (data) => api.post(YOUR_ENDPOINT, data),  // API endpoint
  columnMapping: {
    // Map giữa tên cột Excel và field trong data
    'Tên cột Excel 1': 'fieldName1',
    'Tên cột Excel 2': 'fieldName2',
    // ...
  },
  requiredFields: ['Tên cột Excel bắt buộc 1', 'Tên cột Excel bắt buộc 2'],
  filename: 'Ten_file_export',       // Tên file khi export
  sheetName: 'Tên sheet',           // Tên sheet trong Excel
  transformDataForExport: (item) => ({
    // Transform data khi export
    'Tên cột Excel 1': item.fieldName1 || '',
    'Tên cột Excel 2': item.fieldName2 || '',
  }),
  transformDataForImport: (row) => ({
    // Transform data khi import
    fieldName1: row['Tên cột Excel 1'],
    fieldName2: row['Tên cột Excel 2'],
  }),
  onImportStart: () => setLoading(true),
  onImportComplete: () => setLoading(false)
});
```

### 3. Thêm nút vào UI

Thay thế các nút Export/Import cũ hoặc thêm mới:

```jsx
<ExcelButtons 
  onExport={handleExportExcel}
  onImport={handleImportExcel}
  onFileChange={handleFileChange}
  fileInputRef={fileInputRef}
  disabled={loading}
/>
```

## Ví dụ cấu hình cho từng trang:

### CustomerGroups (Nhóm khách hàng)

```javascript
columnMapping: {
  'Mã nhóm': 'code',
  'Tên nhóm': 'name',
  'Ghi chú': 'note',
  'Trạng thái': 'status'
},
requiredFields: ['Mã nhóm', 'Tên nhóm'],
filename: 'Danh_sach_nhom_khach_hang',
sheetName: 'Nhóm khách hàng'
```

### ProductCategories (Danh mục sản phẩm)

```javascript
columnMapping: {
  'Mã danh mục': 'code',
  'Tên danh mục': 'name',
  'Ghi chú': 'note',
  'Trạng thái': 'status'
},
requiredFields: ['Mã danh mục', 'Tên danh mục'],
filename: 'Danh_sach_danh_muc_san_pham',
sheetName: 'Danh mục sản phẩm'
```

### TransactionContents (Nội dung giao dịch)

```javascript
columnMapping: {
  'Mã nội dung': 'code',
  'Tên nội dung': 'name',
  'Ghi chú': 'note',
  'Trạng thái': 'status'
},
requiredFields: ['Mã nội dung', 'Tên nội dung'],
filename: 'Danh_sach_noi_dung_giao_dich',
sheetName: 'Nội dung GD'
```

### AccountsFunds (Quỹ tài khoản)

```javascript
columnMapping: {
  'Mã quỹ': 'code',
  'Tên quỹ': 'name',
  'Số dư ban đầu': 'initialBalance',
  'Ghi chú': 'note',
  'Trạng thái': 'status'
},
requiredFields: ['Mã quỹ', 'Tên quỹ'],
filename: 'Danh_sach_quy_tai_khoan',
sheetName: 'Quỹ tài khoản',
transformDataForExport: (item) => ({
  'Mã quỹ': item.code || '',
  'Tên quỹ': item.name || '',
  'Số dư ban đầu': item.initialBalance || 0,
  'Ghi chú': item.note || '',
  'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
}),
transformDataForImport: (row) => ({
  code: row['Mã quỹ'],
  name: row['Tên quỹ'],
  initialBalance: parseFloat(row['Số dư ban đầu']) || 0,
  note: row['Ghi chú'] || '',
  status: row['Trạng thái'] === 'Ngưng hoạt động' ? 'inactive' : 'active'
})
```

## Lưu ý:

1. **Transform functions**: Bắt buộc phải có nếu dữ liệu cần chuyển đổi (ví dụ: status "active" → "Hoạt động")
2. **Required fields**: Danh sách các cột bắt buộc trong file Excel
3. **Column mapping**: Phải khớp chính xác giữa tên cột Excel và field trong database
4. **Loading state**: Nên set loading khi import để người dùng biết hệ thống đang xử lý

## Test:

1. Test Export: Click Export Excel → Kiểm tra file có đủ dữ liệu không
2. Test Import: 
   - Export ra file
   - Sửa một số dòng
   - Import lại
   - Kiểm tra dữ liệu đã được cập nhật chưa
3. Test validation: Import file thiếu cột hoặc dữ liệu không hợp lệ

## Các file đã tạo:

- ✅ `/src/utils/excelUtils.js` - Utility functions xử lý Excel
- ✅ `/src/hooks/useExcelImportExport.jsx` - Custom hook tái sử dụng
- ✅ `/src/components/common/ExcelButtons.jsx` - Component nút Import/Export
