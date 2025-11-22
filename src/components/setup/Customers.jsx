import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import OpenStreetMapModal from '../OpenStreetMapModal';

const Customers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();

  const [customers, setCustomers] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Google Maps state
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCustomerForMap, setSelectedCustomerForMap] = useState(null);

  // Load customers from API
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.customers);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    customerGroup: '',
    code: '',
    name: '',
    vatName: '',
    address: '',
    vatAddress: '',
    phone: '',
    position: '',
    email: '',
    account: '',
    taxCode: '',
    customerType: '',
    salesSchedule: '',
    vehicle: '',
    printIn: '',
    businessType: '',
    debtLimit: 0,
    debtTerm: '',
    initialDebt: 0,
    note: '',
    exportVat: false,
    isInactive: false
  });

  const customerGroups = ['KH001', 'KH002', 'KH003'];
  const customerTypes = ['Lẻ', 'Sỉ', 'Siêu thị', 'Tạp hóa', 'Nhà hàng'];
  const businessTypes = ['Bán lẻ', 'Bán sỉ', 'Tạp hóa', 'Siêu thị', 'Nhà hàng', 'Khách sạn'];
  const debtTerms = ['1 tuần', '2 tuần', '1 tháng', '2 tháng', '3 tháng'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e, saveAndCopy = false) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        await api.put(API_ENDPOINTS.customers, editingItem.id, formData);
      } else {
        await api.post(API_ENDPOINTS.customers, formData);
      }
      await loadCustomers();
      
      if (saveAndCopy) {
        // Giữ nguyên dữ liệu, chỉ reset một số trường
        setFormData({
          ...formData,
          code: '', // Reset mã KH để tạo mã mới
          id: undefined // Xóa ID để tạo bản ghi mới
        });
        setEditingItem(null);
        // Không đóng modal, không reset form hoàn toàn
      } else {
        // Lưu bình thường - đóng modal và reset form
        setShowModal(false);
        setEditingItem(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Không thể lưu khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndCopy = (e) => {
    handleSubmit(e, true);
  };

  const resetForm = () => {
    setFormData({
      customerGroup: '',
      code: '',
      name: '',
      vatName: '',
      address: '',
      vatAddress: '',
      phone: '',
      position: '',
      email: '',
      account: '',
      taxCode: '',
      customerType: '',
      salesSchedule: '',
      vehicle: '',
      printIn: '',
      businessType: '',
      debtLimit: 0,
      debtTerm: '',
      initialDebt: 0,
      note: '',
      exportVat: false,
      isInactive: false
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.customers, id);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Không thể xóa khách hàng');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCustomers = applyFilters(customers, searchTerm, ['name', 'vatName', 'code', 'phone', 'email', 'customerType', 'position']);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleShowLocation = (customer) => {
    setSelectedCustomerForMap(customer);
    setShowMapModal(true);
  };



  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng khách hàng ---
  const customerTableRef = useRef(null);
  const defaultCustomerColumns = [
    { key: 'customerGroup', label: 'Nhóm KH' },
    { key: 'code', label: 'Mã KH' },
    { key: 'name', label: 'Tên khách hàng' },
    { key: 'vatName', label: 'Tên xuất VAT' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'vatAddress', label: 'Địa chỉ xuất VAT' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'position', label: 'Vị trí' },
    { key: 'email', label: 'Email' },
    { key: 'account', label: 'Tài khoản' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'customerType', label: 'Loại KH' },
    { key: 'salesSchedule', label: 'Lịch bán hàng' },
    { key: 'vehicle', label: 'Xe' },
    { key: 'printIn', label: 'STT in' },
    { key: 'businessType', label: 'Loại hình KD' },
    { key: 'debtLimit', label: 'Hạn mức' },
    { key: 'debtTerm', label: 'Hạn nợ' },
    { key: 'initialDebt', label: 'Nợ ban đầu' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'exportVat', label: 'Xuất VAT' },
    { key: 'isInactive', label: 'Ngưng HĐ' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultCustomerWidths = [100, 100, 160, 160, 180, 180, 110, 100, 120, 100, 110, 100, 120, 80, 80, 120, 110, 100, 110, 150, 90, 90, 110];
  const [customerColumns, setCustomerColumns] = useState(() => {
    const saved = localStorage.getItem('customerColumns');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // Merge saved columns with default columns to include any new columns
        const mergedColumns = [...defaultCustomerColumns];
        const savedKeys = arr.map(c => c.key);
        
        // Update existing columns with saved state
        arr.forEach(savedCol => {
          const index = mergedColumns.findIndex(c => c.key === savedCol.key);
          if (index !== -1) {
            mergedColumns[index] = { ...mergedColumns[index], ...savedCol };
          }
        });
        
        return mergedColumns;
      } catch {
        return defaultCustomerColumns;
      }
    }
    return defaultCustomerColumns;
  });
  const [customerColWidths, setCustomerColWidths] = useState(() => {
    const saved = localStorage.getItem('customerColWidths');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // If saved widths length doesn't match, merge with defaults
        if (Array.isArray(arr)) {
          if (arr.length === defaultCustomerWidths.length) {
            return arr;
          } else if (arr.length < defaultCustomerWidths.length) {
            // Add missing widths from defaults
            return [...arr, ...defaultCustomerWidths.slice(arr.length)];
          }
        }
      } catch {}
    }
    return defaultCustomerWidths;
  });
  const defaultCustomerVisible = defaultCustomerColumns.map(col => col.key);
  const [customerVisibleCols, setCustomerVisibleCols] = useState(() => {
    const saved = localStorage.getItem('customerVisibleCols');
    if (saved) {
      try {
        const savedCols = JSON.parse(saved);
        // Add any new columns that are not in saved list
        const allKeys = defaultCustomerColumns.map(c => c.key);
        const newKeys = allKeys.filter(k => !savedCols.includes(k) && k !== 'actions');
        return [...savedCols, ...newKeys];
      } catch {}
    }
    return defaultCustomerVisible;
  });
  const [showCustomerColSetting, setShowCustomerColSetting] = useState(false);
  const customerColSettingRef = useRef(null);
  // Drag state
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Lưu cấu hình cột vào localStorage
  useEffect(() => {
    localStorage.setItem('customerColumns', JSON.stringify(customerColumns));
  }, [customerColumns]);
  useEffect(() => {
    localStorage.setItem('customerColWidths', JSON.stringify(customerColWidths));
  }, [customerColWidths]);
  useEffect(() => {
    localStorage.setItem('customerVisibleCols', JSON.stringify(customerVisibleCols));
  }, [customerVisibleCols]);

  // Đóng popup + tự động lưu khi click ra ngoài cho popup cài đặt cột khách hàng
  useEffect(() => {
    if (!showCustomerColSetting) return;
    const handleClickOutside = (e) => {
      if (customerColSettingRef.current && !customerColSettingRef.current.contains(e.target)) {
        setShowCustomerColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomerColSetting]);

  // Kéo cột
  const handleCustomerMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...customerColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setCustomerColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right' && index < widths.length - 1) {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
          newWidths[index + 1] = Math.max(50, startWidths[index + 1] - delta);
        } else if (edge === 'left' && index > 0) {
          newWidths[index] = Math.max(50, startWidths[index] - delta);
          newWidths[index - 1] = Math.max(50, startWidths[index - 1] + delta);
        }
        return newWidths;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Khách hàng</h1>
        <p>Quản lý danh sách khách hàng</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã khách hàng hoặc số điện thoại..."
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
              + Thêm khách hàng
            </button>
            <button className="btn btn-success">📤 Export Excel</button>
            <button className="btn btn-secondary">📥 Import Excel</button>
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowCustomerColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showCustomerColSetting && (
            <div
              ref={customerColSettingRef}
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
                  checked={customerVisibleCols.length === customerColumns.length}
                  onChange={e => setCustomerVisibleCols(e.target.checked ? defaultCustomerVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => {
                    setCustomerVisibleCols(defaultCustomerVisible);
                    setCustomerColumns(defaultCustomerColumns);
                    setCustomerColWidths(defaultCustomerWidths);
                  }}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {customerColumns.filter(col => !col.fixed).map((col, idx) => (
                <div
                  key={col.key}
                  style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: dragOverIdx === idx ? '#f0f7ff' : undefined }}
                  draggable
                  onDragStart={() => setDragColIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={() => {
                    if (dragColIdx === null || dragColIdx === idx) return;
                    const newCols = [...customerColumns];
                    const [moved] = newCols.splice(dragColIdx, 1);
                    newCols.splice(idx, 0, moved);
                    setCustomerColumns(newCols);
                    // Cập nhật width theo thứ tự mới
                    const newWidths = [...customerColWidths];
                    const [w] = newWidths.splice(dragColIdx, 1);
                    newWidths.splice(idx, 0, w);
                    setCustomerColWidths(newWidths);
                    setDragColIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragColIdx(null); setDragOverIdx(null); }}
                >
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={customerVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setCustomerVisibleCols(cols => [...cols, col.key]);
                      else setCustomerVisibleCols(cols => cols.filter(k => k !== col.key));
                    }}
                    style={{ marginRight: 6 }}
                  />
                  <span>{col.label}</span>
                </div>
              ))}
              <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                <span>Thao tác</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className="data-table" ref={customerTableRef} style={{ minWidth: '2000px' }}>
            <colgroup>
              {customerColumns.map((col, i) => (
                customerVisibleCols.includes(col.key) ? <col key={col.key} style={{ width: customerColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {customerColumns.map((col, idx, arr) => (
                  customerVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && customerVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleCustomerMouseDown(idx, e, 'left')}
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
                      {idx < arr.length - 1 && customerVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleCustomerMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id}>
                  {customerColumns.map((col, idx) => {
                    if (!customerVisibleCols.includes(col.key)) return null;
                    if (col.key === 'position') {
                      return (
                        <td key={col.key}>
                          <span 
                            onClick={() => handleShowLocation(customer)}
                            style={{ 
                              color: '#2196F3', 
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Xem vị trí trên bản đồ"
                          >
                            📍 {customer.position || 'Chưa có vị trí'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'debtLimit' || col.key === 'initialDebt') {
                      return <td key={col.key}>{formatCurrency(customer[col.key] || 0)}</td>;
                    }
                    if (col.key === 'exportVat' || col.key === 'isInactive') {
                      return (
                        <td key={col.key}>
                          <span>{customer[col.key] ? '✓' : ''}</span>
                        </td>
                      );
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => handleEdit(customer)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(customer.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{customer[col.key] || ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy khách hàng nào
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px' }}>
            <div style={{ color: '#666' }}>
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredCustomers.length)} / {filteredCustomers.length} khách hàng
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ««
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                «
              </button>
              <span style={{ padding: '6px 12px' }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                »
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} khách hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>THÔNG TIN KHÁCH HÀNG</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label><span className="required">*</span> Nhóm khách hàng</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        name="customerGroup"
                        value={formData.customerGroup}
                        onChange={handleInputChange}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">Chọn nhóm khách hàng</option>
                        {customerGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                      <button type="button" style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label><span className="required">*</span> Mã khách hàng</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="Chọn nhóm khách hàng"
                        required
                        style={{ flex: 1 }}
                      />
                      <button type="button" style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    </div>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label><span className="required">*</span> Tên khách hàng</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{ flex: 1 }}
                    />
                    <button type="button" style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Tên xuất VAT</label>
                  <input
                    type="text"
                    name="vatName"
                    value={formData.vatName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ xuất VAT</label>
                  <textarea
                    name="vatAddress"
                    value={formData.vatAddress}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vị trí</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tài khoản</label>
                    <input
                      type="text"
                      name="account"
                      value={formData.account}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mã số thuế</label>
                    <input
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><span className="required">*</span> Loại khách hàng</label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn loại khách hàng</option>
                      {customerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lịch bán hàng</label>
                    <input
                      type="text"
                      name="salesSchedule"
                      value={formData.salesSchedule}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Xe</label>
                    <select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn xe</option>
                      <option value="0">0</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>STT in</label>
                    <input
                      type="text"
                      name="printIn"
                      value={formData.printIn}
                      onChange={handleInputChange}
                      defaultValue="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Loại hình kinh doanh</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn loại hình</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Hạn mức</label>
                    <input
                      type="number"
                      name="debtLimit"
                      value={formData.debtLimit}
                      onChange={handleInputChange}
                      defaultValue="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hạn nợ</label>
                    <input
                      type="text"
                      name="debtTerm"
                      value={formData.debtTerm}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nợ ban đầu</label>
                    <input
                      type="number"
                      name="initialDebt"
                      value={formData.initialDebt}
                      onChange={handleInputChange}
                      defaultValue="0"
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      name="exportVat"
                      checked={formData.exportVat}
                      onChange={(e) => setFormData({...formData, exportVat: e.target.checked})}
                    />
                    Xuất VAT
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      name="isInactive"
                      checked={formData.isInactive}
                      onChange={(e) => setFormData({...formData, isInactive: e.target.checked})}
                    />
                    Ngưng hoạt động
                  </label>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '100px' }}>
                  Lưu lại
                </button>
                <button type="button" onClick={handleSaveAndCopy} className="btn btn-success" style={{ minWidth: '120px' }}>
                  Lưu (copy)
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-danger" style={{ minWidth: '100px' }}>
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OpenStreetMap Modal */}
      <OpenStreetMapModal 
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        customer={selectedCustomerForMap}
      />
    </div>
  );
};

export default Customers;
