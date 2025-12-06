import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import './BusinessPage.css';
import './ImportGoods.css';
import { Table, Button, Space, Popconfirm, Input, Modal, Popover, DatePicker } from 'antd';
import ProductModal from '../common/ProductModal';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { removeVietnameseTones } from '../../utils/searchUtils';

const ImportGoods = () => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, record: null });
  const [isEditing, setIsEditing] = useState(false);
  const [treatNaiveIsoAsUtc, setTreatNaiveIsoAsUtc] = useState(true);
  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    category: '',
    barcode: '',
    productCode: '',
    productName: '',
    productNameVat: '',
    description: '',
    hsdMonths: 0,
    defaultUnit: '',
    priceImport: 0,
    priceRetail: 0,
    priceWholesale: 0,
    // unit variants
    unit1Name: '', unit1Conversion: 0, unit1Price: 0, unit1Discount: 0,
    unit2Name: '', unit2Conversion: 0, unit2Price: 0, unit2Discount: 0,
    unit3Name: '', unit3Conversion: 0, unit3Price: 0, unit3Discount: 0,
    unit4Name: '', unit4Conversion: 0, unit4Price: 0, unit4Discount: 0,
    weight: 0,
    volume: 0,
    warehouse: '',
    note: ''
  });

  // Xử lý chuột phải trên bảng
  const handleTableContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      record: null
    });
  };
  // Đóng menu khi click ngoài
  React.useEffect(() => {
    const handleClick = () => setContextMenu(c => ({ ...c, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);
  const [showModal, setShowModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [dateDraft, setDateDraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-08-01');
  const [dateTo, setDateTo] = useState('2025-08-08');
  const [importType, setImportType] = useState('');
  const [employee, setEmployee] = useState('');

  // Column visibility & header filters for left table
  const IMPORT_LEFT_COLS_KEY = 'import_goods_left_cols_v1';
  const defaultLeftCols = ['checkbox','importNumber','createdDate','total','actions'];
  const [leftVisibleCols, setLeftVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(IMPORT_LEFT_COLS_KEY));
      if (Array.isArray(v)) return v;
    } catch {}
    return defaultLeftCols;
  });
  const [leftFilters, setLeftFilters] = useState({ importNumber: '', createdDate: '', total: '' });
  // modal-based column filters (lists of selected values)
  const [leftFilterLists, setLeftFilterLists] = useState({ importNumber: [], createdDate: [], total: [] });
  const [activeHeaderModalColumn, setActiveHeaderModalColumn] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSelections, setModalSelections] = useState([]);
  const [modalAvailableItems, setModalAvailableItems] = useState([]);
  const [leftPageSize, setLeftPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('import_left_page_size')||'10',10); return isNaN(v)?10:v; } catch { return 10; }
  });

  // Core data state
  const [imports, setImports] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ importNumber: '', createdDate: new Date().toISOString().split('T')[0], employee: '', importType: '', totalWeight: 0, totalVolume: 0, note: '' });
  const [leftPage, setLeftPage] = useState(1);
  const [showLeftSettings, setShowLeftSettings] = useState(false);
  const [showRightSettings, setShowRightSettings] = useState(false);

  // Right-side columns & filters (for items table header filters)
  const RIGHT_COLS_KEY = 'import_goods_right_cols_v1';
  const defaultRightCols = ['barcode','productCode','productName','description','specification','conversion','quantity','unitPrice','total','weight','volume','warehouse','actions'];
  const [rightVisibleCols, setRightVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      if (Array.isArray(v)) return v;
    } catch {}
    return defaultRightCols;
  });

  const [rightFilters, setRightFilters] = useState({});
  const [rightFilterPopup, setRightFilterPopup] = useState({ column: null, term: '' });
  const [rightCurrentPage, setRightCurrentPage] = useState(1);
  const [rightItemsPerPage, setRightItemsPerPage] = useState(10);

  const renderHeaderFilterTH = (colKey, label, placeholder) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>{label}</span>
          <Popover
            content={(
              <div style={{minWidth:240}}>
                <Input
                  placeholder={placeholder}
                  value={rightFilterPopup.column === colKey ? rightFilterPopup.term : (rightFilters[colKey] || '')}
                  onChange={e => setRightFilterPopup(p => ({ ...p, term: e.target.value }))}
                  onPressEnter={() => {
                    setRightFilters(prev => ({ ...prev, [colKey]: rightFilterPopup.term }));
                    setRightFilterPopup({ column: null, term: '' });
                  }}
                />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                  <button className="btn btn-link" onClick={() => { setRightFilterPopup({ column: colKey, term: '' }); setRightFilters(prev => ({ ...prev, [colKey]: '' })); }}>Xem tất cả</button>
                  <div>
                    <button className="btn btn-secondary" onClick={() => { setRightFilterPopup({ column: null, term: '' }); }}>Đóng</button>
                    <button className="btn btn-primary" onClick={() => { setRightFilters(prev => ({ ...prev, [colKey]: rightFilterPopup.term })); setRightFilterPopup({ column: null, term: '' }); }} style={{marginLeft:8}}>Tìm</button>
                  </div>
                </div>
              </div>
            )}
            title={null}
            trigger="click"
            visible={rightFilterPopup.column===colKey}
            onVisibleChange={vis => { if (!vis) setRightFilterPopup({column:null, term:''}); }}
            placement="bottomRight"
          >
            <SearchOutlined style={{color:'#888',cursor:'pointer'}} onClick={(e)=>{ e.stopPropagation(); setRightFilterPopup({column:colKey, term: rightFilters[colKey]||''}); }} />
          </Popover>
        </div>
      </th>
    );
  };

  // Load imports from backend on mount
  React.useEffect(() => {
    loadImports();
  }, []);

  React.useEffect(() => {
    if (imports.length > 0 && !selectedImport) {
      setSelectedImport(imports[0]);
    }
  }, [imports, selectedImport]);

  // reset right table paging when selected import changes
  React.useEffect(() => {
    setRightCurrentPage(1);
  }, [selectedImport]);

  React.useEffect(() => {
    try { localStorage.setItem(RIGHT_COLS_KEY, JSON.stringify(rightVisibleCols)); } catch {}
  }, [rightVisibleCols]);

  const rightPageSizeOptions = [10,20,50,100,200,500,1000,5000];
  const itemsData = selectedImport?.items || [];

  // apply per-column filters before pagination (ignore Vietnamese diacritics)
  const filteredRightItems = itemsData.filter(item => {
    return Object.entries(rightFilters).every(([k, v]) => {
      if (!v) return true;
      const raw = item[k];
      const s = raw === null || raw === undefined ? '' : String(raw);
      const sv = removeVietnameseTones(s.toLowerCase());
      const vv = removeVietnameseTones(String(v).toLowerCase());
      return sv.includes(vv);
    });
  });

  const rightTotal = filteredRightItems.length;
  const rightTotalPages = Math.max(1, Math.ceil(rightTotal / Math.max(1, rightItemsPerPage)));
  const rightStart = rightTotal === 0 ? 0 : (rightCurrentPage - 1) * rightItemsPerPage + 1;
  const rightEnd = Math.min(rightTotal, rightCurrentPage * rightItemsPerPage);
  const paginatedItems = filteredRightItems.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage);

  React.useEffect(() => {
    setRightCurrentPage(p => Math.min(p, rightTotalPages));
  }, [rightItemsPerPage, selectedImport, rightTotalPages]);

  const handleSelectImport = (importItem) => {
    if (!importItem) return;
    if (importItem.id) loadImportDetails(importItem.id);
    else setSelectedImport(importItem);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    try {
      const res = await fetch(`/api/Imports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      // reload list
      await loadImports();
      if (selectedImport && selectedImport.id === id) {
        setSelectedImport(imports.length > 0 ? imports[0] : null);
      }
    } catch (err) {
      console.error('Delete import error', err);
      alert('Xóa phiếu nhập thất bại');
    }
  };

  // Load imports list from backend
  const loadImports = async () => {
    try {
      const res = await fetch('/api/Imports');
      if (!res.ok) throw new Error('Failed to load imports');
      const data = await res.json();
      setImports(data || []);
      if (data && data.length > 0) {
        await loadImportDetails(data[0].id);
      } else {
        setSelectedImport(null);
      }
    } catch (err) {
      console.error('Load imports error', err);
      // fallback to existing sample data
      console.warn('Using local sample imports as fallback');
      // keep current `imports` state as fallback
    }
  };

  const loadImportDetails = async (id) => {
    try {
      const res = await fetch(`/api/Imports/${id}`);
      if (!res.ok) throw new Error('Failed to load import details');
      const data = await res.json();
      // normalize to frontend shape
      const detail = {
        ...data,
        items: (data.items || data.Items || []).map(it => ({ ...it }))
      };
      // if employee missing, keep current formData.employee
      setSelectedImport(detail);
      setFormData({
        importNumber: detail.importNumber || detail.ImportNumber || generateImportNumber(),
        createdDate: detail.date ? dayjs(detail.date).format('YYYY-MM-DD') : (detail.createdDate || new Date().toISOString().split('T')[0]),
        employee: detail.employee || detail.Employee || formData.employee,
        importType: detail.importType || detail.ImportType || '',
        totalWeight: detail.totalWeight || 0,
        totalVolume: detail.totalVolume || 0,
        note: detail.note || detail.Note || ''
      });
      setItems(detail.items || []);
      setIsEditing(false);
    } catch (err) {
      console.error('Load import details error', err);
      alert('Không thể tải chi tiết phiếu nhập');
    }
  };

  const createNewImport = async () => {
    try {
      const payload = {
        importNumber: generateImportNumber(),
        date: new Date().toISOString(),
        note: '',
        employee: formData.employee || '',
        total: 0,
        items: []
      };
      const res = await fetch('/api/Imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create import');
      }
      const created = await res.json();
      await loadImports();
      await loadImportDetails(created.id);
      setIsEditing(true);
    } catch (err) {
      console.error('Create import error', err);
      alert('Tạo phiếu nhập mới thất bại');
    }
  };

  const saveImport = async () => {
    try {
      const payload = {
        importNumber: formData.importNumber,
        date: formData.createdDate ? new Date(formData.createdDate).toISOString() : new Date().toISOString(),
        note: formData.note,
        employee: formData.employee,
        total: (items || []).reduce((s, it) => s + (Number(it.total) || 0), 0),
        items: (items || []).map(it => ({
          barcode: it.barcode,
          productCode: it.productCode,
          productName: it.productName,
          description: it.description,
          specification: it.specification,
          conversion: it.conversion,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          weight: it.weight,
          volume: it.volume,
          warehouse: it.warehouse,
          note: it.note
        }))
      };
      if (selectedImport && selectedImport.id) {
        const res = await fetch(`/api/Imports/${selectedImport.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedImport.id, ...payload })
        });
        if (!res.ok) throw new Error('Save failed');
      } else {
        const res = await fetch('/api/Imports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Create failed');
      }
      await loadImports();
      if (selectedImport && selectedImport.id) await loadImportDetails(selectedImport.id);
      setIsEditing(false);
      alert('Lưu phiếu nhập thành công');
    } catch (err) {
      console.error('Save import error', err);
      alert('Lưu phiếu nhập thất bại');
    }
  };

  // Item modal helpers
  const closeItemModal = () => setShowItemModal(false);

  const saveItemFromModal = () => {
    // basic validation: productName required
    if (!itemForm.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...itemForm };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...itemForm };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    setShowItemModal(false);
  };

  const saveItemAndCopy = () => {
    // Save current item but keep modal open with same values so user can tweak copy
    if (!itemForm.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...itemForm };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...itemForm };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    // keep modal open, but clear editing index so next save creates new item
    setEditingItemIndex(null);
  };

  // wrappers to accept data from ProductModal
  const handleSaveItemFromModal = (data) => {
    if (!data.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...data };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...data };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    setShowItemModal(false);
  };

  const handleSaveItemAndCopy = (data) => {
    if (!data.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...data };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...data };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    // keep modal open for copy
    setEditingItemIndex(null);
    setShowItemModal(true);
  };

  const editItem = (idx) => {
    const it = items[idx];
    if (!it) return;
    setItemForm({ ...it });
    setEditingItemIndex(idx);
    setShowItemModal(true);
  };

  const filteredImports = imports.filter(importItem => {
    const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
    const normalizedNumber = removeVietnameseTones(importItem.importNumber.toLowerCase());
    const normalizedEmployee = removeVietnameseTones(importItem.employee.toLowerCase());
    const matchesSearch = normalizedNumber.includes(normalizedSearch) || normalizedEmployee.includes(normalizedSearch);
    
    const matchesType = !importType || importItem.importType === importType;
    const matchesEmployee = !employee || importItem.employee === employee;
    
    const normalizedCode = removeVietnameseTones(searchCode.toLowerCase());
    const matchesCode = !searchCode || normalizedNumber.includes(normalizedCode);
    
    // Lọc theo khoảng ngày nhập (so sánh yyyy-mm-dd)
    let matchesDate = true;
    if (dateFrom && dateTo) {
      // importItem may provide createdDate (DD/MM/YYYY) or date (ISO). Handle both safely.
      let importDate = null;
      if (importItem.createdDate && typeof importItem.createdDate === 'string' && importItem.createdDate.includes('/')) {
        const parts = importItem.createdDate.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          importDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      } else if (importItem.date) {
        try {
          importDate = dayjs(importItem.date).format('YYYY-MM-DD');
        } catch (e) {
          importDate = null;
        }
      }
      if (!importDate) {
        matchesDate = false;
      } else {
        matchesDate = importDate >= dateFrom && importDate <= dateTo;
      }
    }
    return matchesSearch && matchesType && matchesEmployee && matchesCode && matchesDate;
  });

  // apply header filters for left table (modal-driven list filters)
  const filteredLeft = filteredImports.filter(i => {
    const importMatch = leftFilterLists.importNumber && leftFilterLists.importNumber.length > 0
      ? leftFilterLists.importNumber.includes(i.importNumber)
      : true;
    const dateMatch = leftFilterLists.createdDate && leftFilterLists.createdDate.length > 0
      ? leftFilterLists.createdDate.includes(i.createdDate)
      : true;
    const totalValue = String((i.items||[]).reduce((s,it)=>s+(it.total||0),0));
    const totalMatch = leftFilterLists.total && leftFilterLists.total.length > 0
      ? leftFilterLists.total.includes(totalValue)
      : true;
    return importMatch && dateMatch && totalMatch;
  });

  React.useEffect(() => {
    localStorage.setItem(IMPORT_LEFT_COLS_KEY, JSON.stringify(leftVisibleCols));
  }, [leftVisibleCols]);

  React.useEffect(() => {
    localStorage.setItem('import_left_page_size', String(leftPageSize));
    setLeftPage(1);
  }, [leftPageSize]);

  const handleExport = () => {
    alert('Chức năng xuất Excel đang được phát triển');
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  const handlePrint = () => {
    alert('Chức năng in A4 đang được phát triển');
  };

  const handleAddItem = () => {
    // open item modal for creating a new item
    setItemForm({
      category: '', barcode: '', productCode: '', productName: '', productNameVat: '', description: '', hsdMonths: 0,
      defaultUnit: '', priceImport: 0, priceRetail: 0, priceWholesale: 0,
      unit1Name: '', unit1Conversion: 0, unit1Price: 0, unit1Discount: 0,
      unit2Name: '', unit2Conversion: 0, unit2Price: 0, unit2Discount: 0,
      unit3Name: '', unit3Conversion: 0, unit3Price: 0, unit3Discount: 0,
      unit4Name: '', unit4Conversion: 0, unit4Price: 0, unit4Discount: 0,
      weight: 0, volume: 0, warehouse: '', note: ''
    });
    setEditingItemIndex(null);
    setShowItemModal(true);
  };

  const handleViewHistory = () => {
    alert('Chức năng xem lịch sử nhập hàng đang được phát triển');
  };

  const openModal = () => {
    setShowModal(true);
  };

  const generateImportNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const count = imports.length + 1;
    return `PN${year}${month}${day}-${count.toString().padStart(6, '0')}`;
  };

  // Table row selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
      // Optional: select import in detail panel if only 1 row selected
      if (newSelectedRowKeys.length === 1) {
        const found = filteredImports.find(i => i.id === newSelectedRowKeys[0]);
        if (found) setSelectedImport(found);
      }
    },
  };

  // Modal tìm kiếm số phiếu
  const searchInputRef = useRef();

  const openHeaderModal = (colKey) => {
    setActiveHeaderModalColumn(colKey);
    setModalSearchTerm('');
    setModalSelections(leftFilterLists[colKey] ? [...leftFilterLists[colKey]] : []);
    // prepare available values from current filteredImports
    let items = [];
    if (colKey === 'importNumber') items = Array.from(new Set(filteredImports.map(i => i.importNumber)));
    else if (colKey === 'createdDate') items = Array.from(new Set(filteredImports.map(i => i.createdDate)));
    else if (colKey === 'total') items = Array.from(new Set(filteredImports.map(i => String((i.items||[]).reduce((s,it)=>s+(it.total||0),0)))));
    setModalAvailableItems(items);
    setShowSearchModal(true);
  };

  const columns = [
    {
      title: '',
      dataIndex: 'checkbox',
      width: 40,
      render: (_, record) => null,
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Số phiếu</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('importNumber')} />
          {leftFilterLists.importNumber && leftFilterLists.importNumber.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.importNumber.length})</span>}
        </div>
      ),
      dataIndex: 'importNumber',
      key: 'importNumber',
      render: (text, record) => (
        <span style={{fontWeight: selectedImport?.id === record.id ? 600 : 400, cursor:'pointer'}} onClick={() => handleSelectImport(record)}>{text}</span>
      ),
      sorter: (a, b) => a.importNumber.localeCompare(b.importNumber),
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Ngày nhập</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('createdDate')} />
          {leftFilterLists.createdDate && leftFilterLists.createdDate.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.createdDate.length})</span>}
        </div>
      ),
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text) => text,
      sorter: (a, b) => a.createdDate.localeCompare(b.createdDate),
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Tổng tiền</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('total')} />
          {leftFilterLists.total && leftFilterLists.total.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.total.length})</span>}
        </div>
      ),
      dataIndex: 'total',
      key: 'total',
      render: (_, record) => {
        const total = (record.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
        return total.toLocaleString('vi-VN');
      },
      sorter: (a, b) => {
        const ta = (a.items||[]).reduce((sum, item) => sum + (item.total||0), 0);
        const tb = (b.items||[]).reduce((sum, item) => sum + (item.total||0), 0);
        return ta-tb;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={e => {e.stopPropagation();}} title="Sửa" />
          <Popconfirm title="Bạn có chắc chắn muốn xóa phiếu nhập này?" onConfirm={e => handleDelete(record.id, e)} okText="Có" cancelText="Không">
            <Button icon={<DeleteOutlined />} danger size="small" onClick={e => e.stopPropagation()} title="Xóa" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="import-goods-page">
      {/* Left Panel - Table Search */}
  <div className="search-panel">
        <div className="panel-header">
          <h2>TÌM KIẾM</h2>
        </div>
        <div className="search-panel-controls">
          <div className="search-controls-grid">
            <div className="search-left">
              <div className="search-panel-date-row">
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
              </div>
              <div className="search-panel-select-row">
                <select value={importType} onChange={e=>setImportType(e.target.value)}>
                  <option value="">loại nhập</option>
                  <option value="nhập thường">Nhập thường</option>
                  <option value="nhập khẩn cấp">Nhập khẩn cấp</option>
                  <option value="nhập trả hàng">Nhập trả hàng</option>
                </select>
                <select value={employee} onChange={e=>setEmployee(e.target.value)}>
                  <option value="">nhân viên lập</option>
                  <option value="admin 66">admin 66</option>
                  <option value="user 01">user 01</option>
                </select>
              </div>
            </div>
            <div className="search-panel-button">
              <Button type="primary" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Tìm kiếm</Button>
            </div>
          </div>
        </div>
        <div className="search-panel-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Tổng {filteredLeft.length}</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button style={{background:'#1677ff',color:'#fff',border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer'}} onClick={createNewImport}>+ Tạo mới</button>
            <button style={{background:'transparent',border:'none',cursor:'pointer'}} title="Cài đặt bảng" onClick={()=>setShowLeftSettings(true)}>⚙</button>
          </div>
        </div>
        <div className="table-scroll-x" onContextMenu={handleTableContextMenu} style={{ position: 'relative' }}>
          <Table
            rowKey="id"
            columns={columns.filter(c => leftVisibleCols.includes(c.dataIndex || c.key || ''))}
            dataSource={filteredLeft}
            rowSelection={{
              type: 'checkbox',
              ...rowSelection,
              columnTitle: '',
              columnWidth: 40,
            }}
            pagination={{
              current: leftPage,
              pageSize: leftPageSize,
              total: filteredLeft.length,
              showSizeChanger: true,
              pageSizeOptions: ['10','20','50','100','200','500','1000'],
              onShowSizeChange: (page, size) => { setLeftPageSize(size); },
              onChange: (page, size) => { setLeftPage(page); setLeftPageSize(size); }
            }}
            size="small"
            onRow={record => ({
              onClick: () => handleSelectImport(record)
            })}
            rowClassName={record => selectedImport?.id === record.id ? 'selected' : ''}
            style={{minWidth:600}}
          />
          {contextMenu.visible && (
            <Menu
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              onClick={() => setContextMenu(c => ({ ...c, visible: false }))}
            >
              <Menu.Item key="view">✔️ Xem chi tiết</Menu.Item>
              <Menu.Item key="delete">🗑️ Xóa</Menu.Item>
              <Menu.Item key="print">🖨️ In danh sách đã chọn</Menu.Item>
            </Menu>
          )}
        </div>
        {/* Modal for column header filters (reused for different columns) */}
        <Modal
          open={showSearchModal}
          onCancel={()=>setShowSearchModal(false)}
          onOk={()=>setShowSearchModal(false)}
          title={activeHeaderModalColumn === 'importNumber' ? 'Tìm kiếm theo số phiếu' : activeHeaderModalColumn === 'createdDate' ? 'Lọc theo ngày nhập' : activeHeaderModalColumn === 'total' ? 'Lọc theo tổng tiền' : 'Tìm kiếm'}
          footer={null}
        >
          <Input
            placeholder={activeHeaderModalColumn === 'importNumber' ? 'Tìm kiếm theo mã' : activeHeaderModalColumn === 'createdDate' ? 'Tìm ngày (DD/MM/YYYY)' : 'Tìm...'}
            value={modalSearchTerm}
            onChange={e=>setModalSearchTerm(e.target.value)}
            allowClear
            style={{marginBottom:12}}
            onPressEnter={()=>{}}
          />
          <div style={{maxHeight:240, overflowY:'auto', paddingRight:8}}>
            {modalAvailableItems.filter(v => {
              if (!modalSearchTerm) return true;
              return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(modalSearchTerm.toLowerCase()));
            }).map(v => (
              <div key={v} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
                <input type="checkbox" checked={modalSelections.includes(v)} onChange={() => {
                  setModalSelections(prev => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev, v]);
                }} />
                <div style={{flex:1, wordBreak:'break-word'}}>{v}</div>
              </div>
            ))}
            {modalAvailableItems.filter(v => {
              if (!modalSearchTerm) return true;
              return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(modalSearchTerm.toLowerCase()));
            }).length === 0 && <div style={{color:'#bbb'}}>Không có dữ liệu</div>}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
            <div>
              <button className="btn btn-link" onClick={()=>{ setModalSearchTerm(''); }}>Xem tất cả</button>
              <button className="btn btn-link" onClick={()=>{ setModalSelections([]); }}>Bỏ chọn</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-secondary" onClick={()=>{ setModalSelections([]); setLeftFilterLists(prev=>({ ...prev, [activeHeaderModalColumn]: [] })); setShowSearchModal(false); }}>Xóa bộ lọc</button>
              <button className="btn btn-primary" onClick={()=>{
                setLeftFilterLists(prev=>({ ...prev, [activeHeaderModalColumn]: modalSelections }));
                setShowSearchModal(false);
              }}>Tìm</button>
            </div>
          </div>
        </Modal>
        {/* Left table settings modal */}
        <Modal
          open={showLeftSettings}
          onCancel={()=>setShowLeftSettings(false)}
          title="Cài đặt hiển thị cột"
          footer={null}
        >
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {defaultLeftCols.map(colKey=>{
              const label = colKey==='checkbox'?'':(colKey==='importNumber'?'Số phiếu':colKey==='createdDate'?'Ngày nhập':colKey==='total'?'Tổng tiền':colKey==='actions'?'Thao tác':colKey);
              return (
                <label key={colKey} style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={leftVisibleCols.includes(colKey)} onChange={()=>{
                    setLeftVisibleCols(prev=> prev.includes(colKey)? prev.filter(k=>k!==colKey) : [...prev, colKey]);
                  }} />
                  <span>{label}</span>
                </label>
              );
            })}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button onClick={()=>{ setLeftVisibleCols(defaultLeftCols); }} className="btn btn-secondary">Làm lại</button>
              <button onClick={()=>setShowLeftSettings(false)} className="btn btn-primary">Đóng</button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Right Panel - Import Details */}
  <div className="import-detail-panel">
        {selectedImport ? (
          <>
            <div className="detail-header">
              <h2>THÔNG TIN NHẬP HÀNG</h2>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={openModal}>
                  + Tạo mới
                </button>
                <button className="btn btn-success" onClick={handleAddItem}>
                  📦 Thêm hàng hóa
                </button>
                <button className="btn btn-info" onClick={handleViewHistory}>
                  📋 Xem lịch sử nhập hàng
                </button>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Top row: Ngày lập, Nhân viên, Loại nhập, Tổng số kg, Tổng số khối (each 20%) */}
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:'0 0 20%'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                      <input type="text" value={selectedImport?.createdDate ? dayjs(selectedImport.createdDate).format('DD/MM/YYYY') : ''} readOnly style={{width:'100%',cursor:'pointer'}} onClick={()=>{
                        setDateDraft(selectedImport?.createdDate ? dayjs(selectedImport.createdDate) : dayjs());
                        setShowDatePickerModal(true);
                      }} />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                    <select style={{width:'100%'}}>
                      <option value={selectedImport.employee}>{selectedImport.employee}</option>
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại nhập</label>
                    <select style={{width:'100%'}}>
                      <option value={selectedImport.importType}>{selectedImport.importType}</option>
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số kg</label>
                    <input type="number" value={selectedImport.totalWeight} readOnly style={{width:'100%'}} />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số khối</label>
                    <input type="number" value={selectedImport.totalVolume} readOnly style={{width:'100%'}} />
                  </div>
                </div>

                {/* Date picker modal for Ngày lập */}
                <Modal
                  open={showDatePickerModal}
                  onCancel={() => setShowDatePickerModal(false)}
                  title={null}
                  width={280}
                  footer={null}
                  bodyStyle={{padding:0}}
                >
                  <div style={{padding:16}}>
                    <div style={{marginBottom:16}}>
                      <select 
                        value={dateDraft ? dateDraft.format('MMMM YYYY') : dayjs().format('MMMM YYYY')}
                        onChange={(e) => {
                          const [month, year] = e.target.value.split(' ');
                          const newDate = dayjs().month(dayjs().month(month)).year(parseInt(year));
                          setDateDraft(newDate);
                        }}
                        style={{width:'60%',border:'none',background:'transparent',fontWeight:'bold'}}
                      >
                        {Array.from({length:12}, (_, i) => {
                          const date = dayjs().month(i);
                          return (
                            <option key={i} value={date.format('MMMM YYYY')}>
                              {date.format('MMMM YYYY')}
                            </option>
                          );
                        })}
                      </select>
                      <div style={{float:'right'}}>
                        <button style={{border:'none',background:'transparent',cursor:'pointer',fontSize:18}} onClick={() => {
                          const prev = (dateDraft || dayjs()).subtract(1, 'month');
                          setDateDraft(prev);
                        }}>‹</button>
                        <button style={{border:'none',background:'transparent',cursor:'pointer',fontSize:18}} onClick={() => {
                          const next = (dateDraft || dayjs()).add(1, 'month');
                          setDateDraft(next);
                        }}>›</button>
                      </div>
                    </div>
                    
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,textAlign:'center',fontSize:12}}>
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
                        <div key={day} style={{padding:4,color:'#999',fontWeight:'bold'}}>{day}</div>
                      ))}
                      
                      {Array.from({length:42}, (_, i) => {
                        const startOfMonth = (dateDraft || dayjs()).startOf('month');
                        const startOfWeek = startOfMonth.startOf('week');
                        const date = startOfWeek.add(i, 'day');
                        const isCurrentMonth = date.month() === (dateDraft || dayjs()).month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = dateDraft && date.isSame(dateDraft, 'day');
                        
                        return (
                          <div
                            key={i}
                            onClick={() => setDateDraft(date)}
                            style={{
                              padding:'6px 4px',
                              cursor:'pointer',
                              color: isCurrentMonth ? '#000' : '#ccc',
                              background: isSelected ? '#1890ff' : isToday ? '#e6f7ff' : 'transparent',
                              color: isSelected ? '#fff' : isCurrentMonth ? '#000' : '#ccc',
                              borderRadius:2,
                              fontSize:13
                            }}
                          >
                            {date.date()}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:16,borderTop:'1px solid #f0f0f0',paddingTop:12}}>
                      <button 
                        style={{background:'transparent',border:'none',color:'#1890ff',cursor:'pointer'}} 
                        onClick={()=>{setDateDraft(null); setShowDatePickerModal(false);}}>
                        Clear
                      </button>
                      <button 
                        style={{background:'transparent',border:'none',color:'#1890ff',cursor:'pointer'}} 
                        onClick={()=>{setDateDraft(dayjs());}}>
                        Today
                      </button>
                    </div>
                    
                    {dateDraft && (
                      <div style={{textAlign:'center',marginTop:8}}>
                        <button 
                          className="btn btn-primary" 
                          style={{width:'100%'}}
                          onClick={()=>{
                            const iso = dateDraft.format('YYYY-MM-DD');
                            setSelectedImport(si => ({ ...si, createdDate: iso }));
                            setShowDatePickerModal(false);
                          }}>
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </Modal>

                {/* Second row: Số phiếu (30%) and Ghi chú (70%) */}
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{flex:'0 0 30%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số phiếu</label>
                    <div className="input-with-status">
                      <input type="text" value={selectedImport.importNumber} readOnly style={{width:'100%'}} />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div style={{flex:'1 1 70%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú</label>
                    <input type="text" value={selectedImport.note} readOnly style={{width:'100%'}} />
                  </div>
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <span>Tổng {selectedImport.items?.length || 0}</span>
                  <div className="items-actions">
                    <button className="icon-btn create-btn" onClick={handleAddItem} title="Thêm hàng">
                      <span>+</span>
                    </button>
                    <button className="icon-btn settings-btn" onClick={()=>setShowRightSettings(true)} title="Cài đặt hiển thị cột">
                      <span>⚙</span>
                    </button>
                  </div>
                </div>

                <div className="items-table-container">
                  <div style={{margin: '12px 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14}}>
                    <div>{`Dòng ${rightStart}-${rightEnd} trên tổng ${rightTotal} dòng`}</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                      <span style={{fontWeight: 600}}>{rightCurrentPage}</span>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))}>{'>'}</button>
                      <select value={rightItemsPerPage} onChange={(e) => { setRightItemsPerPage(parseInt(e.target.value, 10)); setRightCurrentPage(1); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                        <option value={200}>200 / trang</option>
                        <option value={500}>500 / trang</option>
                        <option value={1000}>1000 / trang</option>
                        <option value={5000}>5000 / trang</option>
                      </select>
                    </div>
                  </div>

                  <table className="items-table" style={{minWidth:1300}}>
                    <thead>
                      <tr>
                        {renderHeaderFilterTH('barcode','Mã vạch','nhập mã vạch')}
                        {renderHeaderFilterTH('productCode','Mã hàng','nhập mã hàng')}
                        {renderHeaderFilterTH('productName','Hàng hóa','nhập tên hàng')}
                        {renderHeaderFilterTH('description','Mô tả','nhập mô tả')}
                        {renderHeaderFilterTH('specification','Quy cách','nhập quy cách')}
                        {renderHeaderFilterTH('conversion','Quy đổi','nhập quy đổi')}
                        {renderHeaderFilterTH('quantity','Số lượng','nhập số lượng')}
                        {renderHeaderFilterTH('unitPrice','Đơn giá','nhập đơn giá')}
                        {renderHeaderFilterTH('total','Thành tiền','nhập thành tiền')}
                        {renderHeaderFilterTH('weight','Số kg','nhập số kg')}
                        {renderHeaderFilterTH('volume','Số khối','nhập số khối')}
                        {renderHeaderFilterTH('warehouse','Kho hàng','nhập kho hàng')}
                        {rightVisibleCols.includes('actions') && <th>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems?.length > 0 ? (
                        paginatedItems.map((item) => (
                          <tr key={item.id}>
                            {rightVisibleCols.includes('barcode') && <td>{item.barcode}</td>}
                            {rightVisibleCols.includes('productCode') && <td>{item.productCode}</td>}
                            {rightVisibleCols.includes('productName') && <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}} title={item.productName}>{item.productName}</td>}
                            {rightVisibleCols.includes('description') && <td style={{maxWidth:240,overflow:'hidden',textOverflow:'ellipsis'}} title={item.description}>{item.description}</td>}
                            {rightVisibleCols.includes('specification') && <td>{item.specification}</td>}
                            {rightVisibleCols.includes('conversion') && <td>{item.conversion}</td>}
                            {rightVisibleCols.includes('quantity') && <td>{item.quantity}</td>}
                            {rightVisibleCols.includes('unitPrice') && <td>{(item.unitPrice||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('total') && <td>{(item.total||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('weight') && <td>{item.weight}</td>}
                            {rightVisibleCols.includes('volume') && <td>{item.volume}</td>}
                            {rightVisibleCols.includes('warehouse') && <td>{item.warehouse}</td>}
                            {rightVisibleCols.includes('actions') && <td>
                              <div className="action-up-down">
                                <button onClick={() => editItem((paginatedItems.indexOf(item) + (rightCurrentPage-1)*rightItemsPerPage))}>Sửa</button>
                                <button>▼</button>
                              </div>
                            </td>}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={rightVisibleCols.length || 1} className="no-data">
                            <div className="empty-state">
                              <div className="empty-icon">📋</div>
                              <div>Trống</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-summary">
                  <span>Tổng tiền: <strong>0</strong></span>
                </div>
              </div>

              {/* Right-side column settings modal */}
              <Modal
                open={showRightSettings}
                onCancel={()=>setShowRightSettings(false)}
                title="Cài đặt cột bảng hàng hóa"
                footer={null}
              >
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {defaultRightCols.map(colKey=>{
                    const label = colKey==='barcode'?'Mã vạch':colKey==='productCode'?'Mã hàng':colKey==='productName'?'Hàng hóa':colKey==='description'?'Mô tả':colKey==='specification'?'Quy cách':colKey==='conversion'?'Quy đổi':colKey==='quantity'?'Số lượng':colKey==='unitPrice'?'Đơn giá':colKey==='total'?'Thành tiền':colKey==='weight'?'Số kg':colKey==='volume'?'Số khối':colKey==='warehouse'?'Kho hàng':colKey==='actions'?'Thao tác':colKey;
                    return (
                      <label key={colKey} style={{display:'flex',alignItems:'center',gap:8}}>
                        <input type="checkbox" checked={rightVisibleCols.includes(colKey)} onChange={()=>{
                          setRightVisibleCols(prev=> prev.includes(colKey)? prev.filter(k=>k!==colKey) : [...prev, colKey]);
                        }} />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                    <button className="btn btn-secondary" onClick={()=>setRightVisibleCols(defaultRightCols)}>Làm lại</button>
                    <button className="btn btn-primary" onClick={()=>setShowRightSettings(false)}>Đóng</button>
                  </div>
                </div>
              </Modal>

              {/* Item add/edit modal uses shared ProductModal component */}
              <ProductModal
                open={showItemModal}
                onClose={closeItemModal}
                initialData={itemForm}
                onSave={handleSaveItemFromModal}
                onSaveCopy={handleSaveItemAndCopy}
              />

              <div className="detail-actions">
                  <button className="btn btn-info" onClick={saveImport} disabled={!isEditing}>
                    📁 Lưu lại
                  </button>
                <button className="btn btn-purple" onClick={handlePrint}>
                  🖨 In A4
                </button>
                <button className="btn btn-success" onClick={handleExport}>
                  📤 Xuất Excel
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <h3>Chọn một phiếu nhập để xem chi tiết</h3>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo mới phiếu nhập</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Chức năng tạo phiếu nhập đang được phát triển...</p>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportGoods;
