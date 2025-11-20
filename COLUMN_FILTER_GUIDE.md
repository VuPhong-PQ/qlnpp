# Hướng dẫn áp dụng Column Filter cho tất cả các trang

## Đã hoàn thành:
✅ Units.jsx
✅ ProductCategories.jsx  
✅ AccountsFunds.jsx (cả 2 tab: Funds và Bank Loans)

## Cần áp dụng cho:
- CustomerGroups.jsx
- TransactionContents.jsx
- Customers.jsx
- Suppliers.jsx
- Warehouses.jsx
- Products.jsx

## Các bước áp dụng cho mỗi file:

### Bước 1: Import hook
```javascript
// Thay đổi dòng import
import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter';  // ← THÊM DÒNG NÀY
```

### Bước 2: Sử dụng hook trong component
```javascript
const ComponentName = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { applyFilters, FilterIcon } = useColumnFilter();  // ← THÊM DÒNG NÀY
```

### Bước 3: Thay thế logic filter
```javascript
// TÌM DÒNG NÀY:
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.code.toLowerCase().includes(searchTerm.toLowerCase())
);

// THAY BẰNG:
const filteredItems = applyFilters(items, searchTerm, ['name', 'code', 'note']);
// Lưu ý: Thêm các trường muốn search vào array thứ 3
```

### Bước 4: Cập nhật table header
```javascript
// TÌM ĐOẠN CODE:
<th key={col.key} style={{ position: 'relative' }}>
  {col.label}
  {/* Các code resizer */}
</th>

// THAY BẰNG:
<th key={col.key} style={{ position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
    <span>{col.label}</span>
    {col.key !== 'actions' && <FilterIcon columnKey={col.key} columnLabel={col.label} />}
  </div>
  {/* Các code resizer */}
</th>
```

### Bước 5 (Optional): Thêm Date Filter
Nếu có cột ngày tháng, thêm prop `isDateColumn={true}`:
```javascript
<FilterIcon columnKey={col.key} columnLabel={col.label} isDateColumn={true} />
```

## Ví dụ cụ thể cho CustomerGroups.jsx:

### File: CustomerGroups.jsx

1. Import:
```javascript
import { useColumnFilter } from '../../hooks/useColumnFilter';
```

2. Thêm hook:
```javascript
const CustomerGroups = () => {
  // ... existing code
  const { applyFilters, FilterIcon } = useColumnFilter();
```

3. Thay filter:
```javascript
const filteredGroups = applyFilters(groups, searchTerm, ['name', 'code', 'salesSchedule', 'note']);
```

4. Cập nhật header (tìm `<thead>` section):
```javascript
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
  <span>{col.label}</span>
  {col.key !== 'actions' && <FilterIcon columnKey={col.key} columnLabel={col.label} />}
</div>
```

## Checklist cho từng file:

### CustomerGroups.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

### TransactionContents.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

### Customers.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

### Suppliers.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

### Warehouses.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

### Products.jsx
- [ ] Import useColumnFilter
- [ ] Add hook
- [ ] Replace filter logic
- [ ] Update table header
- [ ] Test

## Lưu ý:
- Mỗi file có cấu trúc tương tự nhau
- Chỉ cần thay tên biến cho phù hợp (groups, contents, customers, suppliers, warehouses, products)
- Date columns cần thêm `isDateColumn={true}`
- Có thể thêm nhiều trường vào array search fields
