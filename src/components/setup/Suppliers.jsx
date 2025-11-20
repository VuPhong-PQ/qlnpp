
import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import useColumnFilter from '../../hooks/useColumnFilter.jsx';

function Suppliers() {

  // Tạo các state và hàm tạm thời để tránh lỗi ReferenceError
  const [searchTerm, setSearchTerm] = useState('');
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSupplierColSetting, setShowSupplierColSetting] = useState(false);
  // Key lưu localStorage
  const SUPPLIER_COLS_KEY = 'supplier_table_cols_v1';
  // Lấy cấu hình cột từ localStorage nếu có
  const getInitialCols = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SUPPLIER_COLS_KEY));
      if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
        return [saved.visibleCols, saved.order];
      }
    } catch {}
    return [
      [
        'code',
        'name',
        'phone',
        'address',
        'taxCode',
        'productType',
        'note',
        'status',
        'actions',
      ],
      [
        'code',
        'name',
        'phone',
        'address',
        'taxCode',
        'productType',
        'note',
        'status',
        'actions',
      ]
    ];
  };
  const [[initVisibleCols, initOrder]] = [getInitialCols()];
  const [supplierVisibleCols, setSupplierVisibleCols] = useState(initVisibleCols);
  const [supplierColOrder, setSupplierColOrder] = useState(initOrder);
  const [supplierColWidths, setSupplierColWidths] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([
    {
      id: 1,
      code: 'NCC001',
      name: 'Công ty TNHH ABC',
      phone: '0901234567',
      address: '123 Lê Lợi, Q.1, TP.HCM',
      taxCode: '0301234567',
      productType: 'Thực phẩm',
      note: 'Nhà cung cấp uy tín',
      status: 'active',
    },
    {
      id: 2,
      code: 'NCC002',
      name: 'Công ty CP XYZ',
      phone: '0912345678',
      address: '456 Nguyễn Trãi, Q.5, TP.HCM',
      taxCode: '0312345678',
      productType: 'Đồ uống',
      note: '',
      status: 'inactive',
    },
    {
      id: 3,
      code: 'NCC003',
      name: 'Cửa hàng Minh Châu',
      phone: '0987654321',
      address: '789 Trần Hưng Đạo, Q.1, TP.HCM',
      taxCode: '0323456789',
      productType: 'Gia vị',
      note: 'Chuyên gia vị nhập khẩu',
      status: 'active',
    },
  ]);
  const [formData, setFormData] = useState({ code: '', name: '', phone: '', taxCode: '', productType: '', status: '', address: '', note: '' });
  const [productTypes, setProductTypes] = useState([]);
  const supplierTableRef = useRef(null);
  const supplierColSettingRef = useRef(null);
  const [supplierColumns] = useState([
    { key: 'code', label: 'Mã nhà cung cấp' },
    { key: 'name', label: 'Tên nhà cung cấp' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'productType', label: 'Loại hàng' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Tình trạng' },
    { key: 'actions', label: 'Thao tác', fixed: true },
  ]);
  const [dragColIndex, setDragColIndex] = useState(null);
  const [dragOverColIndex, setDragOverColIndex] = useState(null);
  const defaultSupplierVisible = [
    'code',
    'name',
    'phone',
    'address',
    'taxCode',
    'productType',
    'note',
    'status',
    'actions',
  ];

  // --- Popup drag & drop logic ---
  const [popupDragIndex, setPopupDragIndex] = useState(null);
  const [popupDragOverIndex, setPopupDragOverIndex] = useState(null);
  // Lưu cấu hình cột vào localStorage
  const saveColConfig = (visibleCols, order) => {
    localStorage.setItem(SUPPLIER_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Khi thay đổi cột hiển thị hoặc thứ tự, tự động lưu
  useEffect(() => {
    saveColConfig(supplierVisibleCols, supplierColOrder);
  }, [supplierVisibleCols, supplierColOrder]);

  // Đóng popup khi click ra ngoài và tự động lưu
  useEffect(() => {
    if (!showSupplierColSetting) return;
    const handleClick = (e) => {
      if (supplierColSettingRef.current && !supplierColSettingRef.current.contains(e.target)) {
        setShowSupplierColSetting(false);
        saveColConfig(supplierVisibleCols, supplierColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSupplierColSetting, supplierVisibleCols, supplierColOrder]);

  // Xử lý kéo-thả sắp xếp cột trong popup
  const handlePopupDragStart = (idx) => setPopupDragIndex(idx);
  const handlePopupDragOver = (idx, e) => {
    e.preventDefault();
    setPopupDragOverIndex(idx);
  };
  const handlePopupDrop = () => {
    if (popupDragIndex === null || popupDragOverIndex === null || popupDragIndex === popupDragOverIndex) {
      setPopupDragIndex(null); setPopupDragOverIndex(null); return;
    }
    const cols = supplierColOrder.filter(k => !supplierColumns.find(col => col.key === k)?.fixed);
    const dragged = cols[popupDragIndex];
    cols.splice(popupDragIndex, 1);
    cols.splice(popupDragOverIndex, 0, dragged);
    // Thêm lại các cột fixed cuối cùng
    const newOrder = [...cols, ...supplierColumns.filter(col => col.fixed).map(col => col.key)];
    setSupplierColOrder(newOrder);
    setPopupDragIndex(null); setPopupDragOverIndex(null);
  };

  // Khi click checkbox cột hiển thị
  const handleColVisibleChange = (key, checked) => {
    if (checked) setSupplierVisibleCols(cols => [...cols, key]);
    else setSupplierVisibleCols(cols => cols.filter(k => k !== key));
  };

  // Khi click "Làm lại"
  const handleResetCols = () => {
    setSupplierVisibleCols(defaultSupplierVisible);
    setSupplierColOrder(defaultSupplierVisible);
    saveColConfig(defaultSupplierVisible, defaultSupplierVisible);
  };

  // Dummy handlers để tránh lỗi
  const resetForm = () => {};
  const handleExport = () => {};
  const handleImport = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};
  const handleSubmit = (e) => { e.preventDefault(); };
  const handleInputChange = () => {};
  const handleColDragStart = () => {};
  const handleColDragOver = () => {};
  const handleColDrop = () => {};
  const handleSupplierMouseDown = () => {};

  // Apply column filters
  const displayedSuppliers = applyFilters(filteredSuppliers, searchTerm, ['code', 'name', 'phone', 'taxCode', 'productType']);

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Danh sách nhà cung cấp</h1>
        <p>Quản lý danh sách nhà cung cấp hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã, số điện thoại hoặc loại hàng..."
            className="search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="table-actions">
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
                setEditingItem(null);
              }}
            >
              + Thêm nhà cung cấp
            </button>
            <button className="btn btn-success" onClick={handleExport}>
              📤 Export Excel
            </button>
            <button className="btn btn-secondary" onClick={handleImport}>
              📥 Import Excel
            </button>
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowSupplierColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showSupplierColSetting && (
            <div
              ref={supplierColSettingRef}
              style={{
                position: 'fixed',
                top: '80px',
                right: '40px',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                zIndex: 9999,
                minWidth: 240,
                padding: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={supplierVisibleCols.length === supplierColumns.length && supplierColumns.every(col => supplierVisibleCols.includes(col.key))}
                  onChange={e => setSupplierVisibleCols(e.target.checked ? defaultSupplierVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={handleResetCols}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {supplierColOrder.filter(key => !supplierColumns.find(col => col.key === key)?.fixed).map((key, idx) => {
                const col = supplierColumns.find(c => c.key === key);
                return (
                  <div
                    key={col.key}
                    style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: popupDragOverIndex === idx && popupDragIndex !== null ? '#e6f7ff' : undefined, opacity: popupDragIndex === idx ? 0.5 : 1, cursor: 'move', borderRadius: 4 }}
                    draggable
                    onDragStart={() => setPopupDragIndex(idx)}
                    onDragOver={e => { e.preventDefault(); setPopupDragOverIndex(idx); }}
                    onDrop={() => {
                      if (popupDragIndex === null || popupDragIndex === idx) { setPopupDragIndex(null); setPopupDragOverIndex(null); return; }
                      const cols = supplierColOrder.filter(k => !supplierColumns.find(col => col.key === k)?.fixed);
                      const dragged = cols[popupDragIndex];
                      cols.splice(popupDragIndex, 1);
                      cols.splice(idx, 0, dragged);
                      // Thêm lại các cột fixed cuối cùng
                      const newOrder = [...cols, ...supplierColumns.filter(col => col.fixed).map(col => col.key)];
                      setSupplierColOrder(newOrder);
                      setPopupDragIndex(null); setPopupDragOverIndex(null);
                    }}
                    onDragEnd={() => { setPopupDragIndex(null); setPopupDragOverIndex(null); }}
                  >
                    <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                    <input
                      type="checkbox"
                      checked={supplierVisibleCols.includes(col.key)}
                      onChange={e => {
                        if (e.target.checked) setSupplierVisibleCols(cols => [...cols, col.key]);
                        else setSupplierVisibleCols(cols => cols.filter(k => k !== col.key));
                      }}
                      style={{ marginRight: 6 }}
                    />
                    <span>{col.label}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                <span>Thao tác</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" ref={supplierTableRef}>
            <colgroup>
              {supplierColOrder.map((key, i) => (
                supplierVisibleCols.includes(key) ? <col key={key} style={{ width: supplierColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {supplierColOrder.map((key, idx, arr) => {
                  const col = supplierColumns.find(c => c.key === key);
                  if (!col || !supplierVisibleCols.includes(key)) return null;
                  return (
                    <th
                      key={col.key}
                      style={{
                        position: 'relative',
                        opacity: dragColIndex === idx ? 0.5 : 1,
                        background: dragOverColIndex === idx && dragColIndex !== null ? '#e6f7ff' : undefined,
                        cursor: 'move'
                      }}
                      draggable
                      onDragStart={() => setDragColIndex(idx)}
                      onDragOver={e => { e.preventDefault(); setDragOverColIndex(idx); }}
                      onDrop={() => {
                        if (dragColIndex === null || dragColIndex === idx) { setDragColIndex(null); setDragOverColIndex(null); return; }
                        const newOrder = [...supplierColOrder];
                        const [dragged] = newOrder.splice(dragColIndex, 1);
                        newOrder.splice(idx, 0, dragged);
                        setSupplierColOrder(newOrder);
                        setDragColIndex(null); setDragOverColIndex(null);
                      }}
                      onDragEnd={() => { setDragColIndex(null); setDragOverColIndex(null); }}
                    >
                      {/* Mép trái */}
                      {idx > 0 && supplierVisibleCols.includes(arr[idx - 1]) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleSupplierMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Filter icon - only show for non-actions columns */}
                      {col.key !== 'actions' && (
                        <span
                          onClick={() => setShowFilterPopup(col.key)}
                          style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '14px' }}
                        >
                          🔍
                        </span>
                      )}
                      {/* Filter popup */}
                      {renderFilterPopup(col.key, col.label, false)}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && supplierVisibleCols.includes(arr[idx + 1]) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleSupplierMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayedSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  {supplierColOrder.map((key) => {
                    if (!supplierVisibleCols.includes(key)) return null;
                    const col = supplierColumns.find(c => c.key === key);
                    if (!col) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {supplier.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => handleEdit(supplier)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(supplier.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{supplier[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayedSuppliers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy nhà cung cấp nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} nhà cung cấp</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã nhà cung cấp <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã nhà cung cấp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên nhà cung cấp <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên nhà cung cấp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mã số thuế</label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleInputChange}
                    placeholder="Nhập mã số thuế"
                  />
                </div>
                <div className="form-group">
                  <label>Loại hàng</label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn loại hàng</option>
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tình trạng</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Địa chỉ <span className="required">*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ nhà cung cấp"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về nhà cung cấp"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}

export default Suppliers;
