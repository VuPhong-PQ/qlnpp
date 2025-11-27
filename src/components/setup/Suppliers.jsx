
import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import useColumnFilter from '../../hooks/useColumnFilter.jsx';
import { API_ENDPOINTS, api } from '../../config/api';
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { Pagination } from '../common/Pagination';

function Suppliers() {

  // Tạo các state và hàm tạm thời để tránh lỗi ReferenceError
  const [searchTerm, setSearchTerm] = useState('');
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSupplierColSetting, setShowSupplierColSetting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const contextMenuRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Key lưu localStorage - đổi v2 để reset cấu hình cũ
  const SUPPLIER_COLS_KEY = 'supplier_table_cols_v2';
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
        'vatName',
        'vatExportName',
        'customerGroup',
        'customerType',
        'phone',
        'fax',
        'email',
        'address',
        'vatAddress',
        'taxCode',
        'account',
        'salesSchedule',
        'vehicle',
        'printOrder',
        'businessType',
        'debtLimit',
        'debtTerm',
        'initialDebt',
        'note',
        'exportVAT',
        'status',
        'actions',
      ],
      [
        'code',
        'vatName',
        'vatExportName',
        'customerGroup',
        'customerType',
        'phone',
        'fax',
        'email',
        'address',
        'vatAddress',
        'taxCode',
        'account',
        'salesSchedule',
        'vehicle',
        'printOrder',
        'businessType',
        'debtLimit',
        'debtTerm',
        'initialDebt',
        'note',
        'exportVAT',
        'status',
        'actions',
      ]
    ];
  };
  const [[initVisibleCols, initOrder]] = [getInitialCols()];
  const [supplierVisibleCols, setSupplierVisibleCols] = useState(initVisibleCols);
  const [supplierColOrder, setSupplierColOrder] = useState(initOrder);
  const [supplierColWidths, setSupplierColWidths] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ 
    code: '', 
    vatName: '', 
    vatExportName: '',
    address: '',
    vatAddress: '', 
    phone: '', 
    fax: '',
    email: '',
    taxCode: '',
    account: '',
    customerGroup: '',
    customerType: 'Lẻ',
    salesSchedule: '',
    vehicle: '',
    printOrder: 0,
    businessType: '',
    debtLimit: 0,
    debtTerm: '',
    initialDebt: 0,
    note: '', 
    exportVAT: false,
    status: 'active' 
  });
  const [productTypes, setProductTypes] = useState([]);
  const supplierTableRef = useRef(null);
  const supplierColSettingRef = useRef(null);
  const [supplierColumns] = useState([
    { key: 'code', label: 'Mã nhà cung cấp' },
    { key: 'vatName', label: 'Tên khách hàng' },
    { key: 'vatExportName', label: 'Tên xuất VAT' },
    { key: 'customerGroup', label: 'Nhóm khách hàng' },
    { key: 'customerType', label: 'Loại khách hàng' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'fax', label: 'Fax' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'vatAddress', label: 'Địa chỉ xuất VAT' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'account', label: 'Tài khoản' },
    { key: 'salesSchedule', label: 'Lịch bán hàng' },
    { key: 'vehicle', label: 'Xe' },
    { key: 'printOrder', label: 'STT in' },
    { key: 'businessType', label: 'Loại hình kinh doanh' },
    { key: 'debtLimit', label: 'Hạn mức' },
    { key: 'debtTerm', label: 'Hạn nợ' },
    { key: 'initialDebt', label: 'Nợ ban đầu' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'exportVAT', label: 'Xuất VAT' },
    { key: 'status', label: 'Tình trạng' },
    { key: 'actions', label: 'Thao tác', fixed: true },
  ]);
  const [dragColIndex, setDragColIndex] = useState(null);
  const [dragOverColIndex, setDragOverColIndex] = useState(null);
  const defaultSupplierVisible = [
    'code',
    'vatName',
    'vatExportName',
    'customerGroup',
    'customerType',
    'phone',
    'fax',
    'email',
    'address',
    'vatAddress',
    'taxCode',
    'account',
    'salesSchedule',
    'vehicle',
    'printOrder',
    'businessType',
    'debtLimit',
    'debtTerm',
    'initialDebt',
    'note',
    'exportVAT',
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

  // Đóng context menu khi click ra ngoài
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

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
  const resetForm = () => {
    setFormData({ 
      code: '', 
      vatName: '', 
      vatExportName: '',
      address: '',
      vatAddress: '',
      phone: '', 
      fax: '',
      email: '',
      taxCode: '', 
      account: '',
      customerGroup: '',
      customerType: 'retail',
      salesSchedule: '',
      vehicle: '',
      printOrder: 0,
      businessType: '',
      debtLimit: 0,
      debtTerm: '',
      initialDebt: 0,
      note: '',
      exportVAT: false,
      status: 'active' 
    });
    setEditingItem(null);
  };
  
  const handleExport = () => {
    console.log('Export Excel');
  };
  
  const handleImport = () => {
    console.log('Import Excel');
  };
  
  // Context menu handlers
  const handleRowRightClick = (e, supplier) => {
    e.preventDefault();
    setSelectedSupplier(supplier);
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleViewDetail = () => {
    if (selectedSupplier) {
      handleEdit(selectedSupplier);
      setContextMenu(null);
    }
  };

  const handleContextEdit = () => {
    if (selectedSupplier) {
      handleEdit(selectedSupplier);
      setContextMenu(null);
    }
  };

  const handleContextDelete = () => {
    if (selectedSupplier) {
      handleDelete(selectedSupplier.id);
      setContextMenu(null);
    }
  };
  
  const handleEdit = (supplier) => {
    setEditingItem(supplier);
    setFormData({
      code: supplier.code,
      vatName: supplier.vatName || '',
      vatExportName: supplier.vatExportName || '',
      address: supplier.address || '',
      vatAddress: supplier.vatAddress || '',
      phone: supplier.phone || '',
      fax: supplier.fax || '',
      email: supplier.email || '',
      taxCode: supplier.taxCode || '',
      account: supplier.account || '',
      customerGroup: supplier.customerGroup || '',
      customerType: supplier.customerType || 'retail',
      salesSchedule: supplier.salesSchedule || '',
      vehicle: supplier.vehicle || '',
      printOrder: supplier.printOrder || 0,
      businessType: supplier.businessType || '',
      debtLimit: supplier.debtLimit || 0,
      debtTerm: supplier.debtTerm || '',
      initialDebt: supplier.initialDebt || 0,
      note: supplier.note || '',
      exportVAT: supplier.exportVAT || false,
      status: supplier.status || 'active'
    });
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) return;
    
    setLoading(true);
    try {
      await api.delete(`${API_ENDPOINTS.suppliers}/${id}`);
      await fetchSuppliers();
      alert('Xóa thành công!');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Có lỗi xảy ra khi xóa!');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vatName || !formData.code || !formData.customerGroup || !formData.customerType) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }
    
    setLoading(true);
    try {
      if (editingItem) {
        await api.put(`${API_ENDPOINTS.suppliers}/${editingItem.id}`, formData);
        alert('Cập nhật thành công!');
      } else {
        await api.post(API_ENDPOINTS.suppliers, formData);
        alert('Thêm mới thành công!');
      }
      await fetchSuppliers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'active' : 'inactive') : value
    }));
  };
  
  // Load suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.get(API_ENDPOINTS.suppliers);
      console.log('Fetched suppliers:', data);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Không thể tải dữ liệu nhà cung cấp!');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  // Excel Import/Export hook for Suppliers
  const {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  } = useExcelImportExport({
    data: suppliers,
    loadData: fetchSuppliers,
    apiPost: (data) => api.post(API_ENDPOINTS.suppliers, data),
    columnMapping: {
      'Mã NCC': 'code',
      'Tên nhà cung cấp': 'vatName',
      'Tên xuất VAT': 'vatExportName',
      'Địa chỉ': 'address',
      'Địa chỉ VAT': 'vatAddress',
      'Điện thoại': 'phone',
      'Fax': 'fax',
      'Email': 'email',
      'Mã số thuế': 'taxCode',
      'Tài khoản': 'account',
      'Nhóm KH': 'customerGroup',
      'Loại KH': 'customerType',
      'Lịch bán hàng': 'salesSchedule',
      'Xe': 'vehicle',
      'STT in': 'printOrder',
      'Loại hình KD': 'businessType',
      'Hạn mức': 'debtLimit',
      'Hạn nợ': 'debtTerm',
      'Nợ ban đầu': 'initialDebt',
      'Ghi chú': 'note',
      'Xuất VAT': 'exportVAT',
      'Trạng thái': 'status'
    },
    requiredFields: ['Mã NCC', 'Tên nhà cung cấp'],
    filename: 'Danh_sach_nha_cung_cap',
    sheetName: 'Nhà cung cấp',
    transformDataForExport: (item) => ({
      'Mã NCC': item.code || '',
      'Tên nhà cung cấp': item.vatName || '',
      'Tên xuất VAT': item.vatExportName || '',
      'Địa chỉ': item.address || '',
      'Địa chỉ VAT': item.vatAddress || '',
      'Điện thoại': item.phone || '',
      'Fax': item.fax || '',
      'Email': item.email || '',
      'Mã số thuế': item.taxCode || '',
      'Tài khoản': item.account || '',
      'Nhóm KH': item.customerGroup || '',
      'Loại KH': item.customerType || '',
      'Lịch bán hàng': item.salesSchedule || '',
      'Xe': item.vehicle || '',
      'STT in': item.printOrder || '',
      'Loại hình KD': item.businessType || '',
      'Hạn mức': item.debtLimit || 0,
      'Hạn nợ': item.debtTerm || '',
      'Nợ ban đầu': item.initialDebt || 0,
      'Ghi chú': item.note || '',
      'Xuất VAT': item.exportVAT ? 'Có' : 'Không',
      'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
    }),
    transformDataForImport: (row) => ({
      code: row['Mã NCC']?.toString().trim() || '',
      vatName: row['Tên nhà cung cấp']?.toString().trim() || '',
      vatExportName: row['Tên xuất VAT']?.toString().trim() || '',
      address: row['Địa chỉ']?.toString().trim() || '',
      vatAddress: row['Địa chỉ VAT']?.toString().trim() || '',
      phone: row['Điện thoại']?.toString().trim() || '',
      fax: row['Fax']?.toString().trim() || '',
      email: row['Email']?.toString().trim() || '',
      taxCode: row['Mã số thuế']?.toString().trim() || '',
      account: row['Tài khoản']?.toString().trim() || '',
      customerGroup: row['Nhóm KH']?.toString().trim() || '',
      customerType: row['Loại KH']?.toString().trim() || '',
      salesSchedule: row['Lịch bán hàng']?.toString().trim() || '',
      vehicle: row['Xe']?.toString().trim() || '',
      printOrder: row['STT in']?.toString().trim() || '',
      businessType: row['Loại hình KD']?.toString().trim() || '',
      debtLimit: parseFloat(row['Hạn mức']) || 0,
      debtTerm: row['Hạn nợ']?.toString().trim() || '',
      initialDebt: parseFloat(row['Nợ ban đầu']) || 0,
      note: row['Ghi chú']?.toString().trim() || '',
      exportVAT: row['Xuất VAT']?.toString().toLowerCase() === 'có' || row['Xuất VAT']?.toString().toLowerCase() === 'true',
      status: row['Trạng thái']?.toString().toLowerCase().includes('ngưng') ? 'inactive' : 'active'
    }),
    onImportStart: () => setLoading(true),
    onImportComplete: () => setLoading(false)
  });
  
  const handleColDragStart = () => {};
  const handleColDragOver = () => {};
  const handleColDrop = () => {};
  const handleSupplierMouseDown = () => {};

  // Apply column filters
  const filteredSuppliers = applyFilters(suppliers, searchTerm, ['code', 'vatName', 'vatExportName', 'phone', 'email', 'taxCode', 'customerGroup', 'customerType', 'address', 'vatAddress', 'note']);
  
  // Pagination calculation
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedSuppliers = filteredSuppliers.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);

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
            <button className="btn btn-success" onClick={handleExportExcel} disabled={loading}>
              📤 Export Excel
            </button>
            <button className="btn btn-secondary" onClick={handleImportExcel} disabled={loading}>
              📥 Import Excel
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
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
                <tr 
                  key={supplier.id}
                  onContextMenu={(e) => handleRowRightClick(e, supplier)}
                  style={{ cursor: 'context-menu' }}
                >
                  {supplierColOrder.map((key) => {
                    if (!supplierVisibleCols.includes(key)) return null;
                    const col = supplierColumns.find(c => c.key === key);
                    if (!col) return null;
                    
                    if (col.key === 'exportVAT') {
                      return (
                        <td key={col.key}>
                          <input type="checkbox" checked={supplier.exportVAT} disabled />
                        </td>
                      );
                    }
                    
                    if (col.key === 'debtLimit' || col.key === 'initialDebt') {
                      return (
                        <td key={col.key} style={{ textAlign: 'right' }}>
                          {supplier[col.key]?.toLocaleString('vi-VN')}
                        </td>
                      );
                    }
                    
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

        {/* Pagination */}
        {filteredSuppliers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredSuppliers.length}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        )}

        {displayedSuppliers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy nhà cung cấp nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>THÔNG TIN KHÁCH HÀNG</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Row 1 */}
                <div className="form-group">
                  <label>Nhóm khách hàng <span className="required">*</span></label>
                  <select
                    name="customerGroup"
                    value={formData.customerGroup || ''}
                    onChange={handleInputChange}
                    required
                    style={{ border: '1px solid #ddd' }}
                  >
                    <option value="">Chọn nhóm khách hàng</option>
                    <option value="retail">Khách lẻ</option>
                    <option value="wholesale">Khách sỉ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mã khách hàng <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 2 */}
                <div className="form-group">
                  <label>Tên khách hàng <span className="required">*</span></label>
                  <input
                    type="text"
                    name="vatName"
                    value={formData.vatName}
                    onChange={handleInputChange}
                    required
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Tên xuất VAT</label>
                  <input
                    type="text"
                    name="vatExportName"
                    value={formData.vatExportName || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 3 */}
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ xuất VAT</label>
                  <input
                    type="text"
                    name="vatAddress"
                    value={formData.vatAddress}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 4 */}
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Fax</label>
                  <input
                    type="text"
                    name="fax"
                    value={formData.fax || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 5 */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Địa chỉ mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 6 */}
                <div className="form-group">
                  <label>Tài khoản</label>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Mã số thuế</label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 7 */}
                <div className="form-group">
                  <label>Loại khách hàng <span className="required">*</span></label>
                  <select
                    name="customerType"
                    value={formData.customerType || 'retail'}
                    onChange={handleInputChange}
                    required
                    style={{ border: '1px solid #ddd' }}
                  >
                    <option value="retail">Lẻ</option>
                    <option value="wholesale">Sỉ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lịch bán hàng</label>
                  <input
                    type="text"
                    name="salesSchedule"
                    value={formData.salesSchedule || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 8 */}
                <div className="form-group">
                  <label>Xe</label>
                  <select
                    name="vehicle"
                    value={formData.vehicle || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  >
                    <option value="">Chọn xe</option>
                    <option value="xe1">Xe 1</option>
                    <option value="xe2">Xe 2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>STT in</label>
                  <input
                    type="number"
                    name="printOrder"
                    value={formData.printOrder || 0}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 9 */}
                <div className="form-group">
                  <label>Loại hình kinh doanh</label>
                  <input
                    type="text"
                    name="businessType"
                    value={formData.businessType || ''}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Hạn mức</label>
                  <input
                    type="number"
                    name="debtLimit"
                    value={formData.debtLimit}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 10 */}
                <div className="form-group">
                  <label>Hạn nợ</label>
                  <input
                    type="date"
                    name="debtTerm"
                    value={formData.debtTerm}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label>Nợ ban đầu</label>
                  <input
                    type="number"
                    name="initialDebt"
                    value={formData.initialDebt}
                    onChange={handleInputChange}
                    style={{ border: '1px solid #ddd' }}
                  />
                </div>

                {/* Row 11 - Full width */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                    style={{ border: '1px solid #ddd', resize: 'vertical' }}
                  />
                </div>

                {/* Row 12 - Checkboxes */}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <input
                      type="checkbox"
                      name="exportVAT"
                      checked={formData.exportVAT || false}
                      onChange={(e) => setFormData({ ...formData, exportVAT: e.target.checked })}
                    />
                    <span>Xuất VAT</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <input
                      type="checkbox"
                      name="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'inactive' : 'active' })}
                    />
                    <span>Ngưng hoạt động</span>
                  </label>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ minWidth: '100px' }}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '100px', background: '#52c41a', borderColor: '#52c41a' }}>
                  {editingItem ? 'Lưu lại' : 'Lưu (Ctrl+Y)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '160px',
            padding: '4px 0'
          }}
        >
          <div
            onClick={handleViewDetail}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ marginRight: '8px' }}>👁️</span>
            Xem chi tiết
          </div>
          <div
            onClick={handleContextEdit}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ marginRight: '8px' }}>✏️</span>
            Sửa
          </div>
          <div
            onClick={handleContextDelete}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              color: '#ff4d4f'
            }}
            onMouseEnter={(e) => e.target.style.background = '#fff1f0'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ marginRight: '8px' }}>🗑️</span>
            Xóa
          </div>
        </div>
      )}
    </div>

  );
}

export default Suppliers;
