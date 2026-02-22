import React, { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Menu } from 'antd';
import './BusinessPage.css';
import './InBangKeTong.css';
import { Table, Button, Space, Popconfirm, Input, Modal, Popover, DatePicker, Select } from 'antd';
import ProductModal from '../common/ProductModal';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { API_ENDPOINTS, api } from '../../config/api';
import { removeVietnameseTones } from '../../utils/searchUtils';
import { useAuth } from '../../contexts/AuthContext';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');

const InBangKeTong = () => {
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
    unit: '',
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
    note: '',
    transportCost: 0,
    totalTransport: 0,
    noteDate: null
  });

  // Xử lý chuột phải trên bảng
  const handleTableContextMenu = (event, record) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      record: record
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
  const [selectedImport, setSelectedImport] = useState(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [dateDraft, setDateDraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [dateFrom, setDateFrom] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(() => dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD'));
  const [importType, setImportType] = useState('');
  const [employee, setEmployee] = useState('');

  // Column visibility & header filters for left table
  const LEFT_COL_KEY = 'bkt_leftColumnSettings';
  const defaultLeftColumns = [
    { id: 'importNumber', label: 'Số bảng kê tổng', width: 140, visible: true, align: 'left' },
    { id: 'createdDate', label: 'Ngày nhập', width: 110, visible: true, align: 'center' },
    { id: 'employee', label: 'Người lập', width: 120, visible: true, align: 'left' },
    { id: 'total', label: 'Tổng tiền', width: 110, visible: true, align: 'right' },
    { id: 'note', label: 'Ghi chú', width: 180, visible: true, align: 'left' },
  ];
  const [leftColumns, setLeftColumns] = useState(() => {
    try {
      const s = localStorage.getItem(LEFT_COL_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map(c => c && c.id === 'importNumber' ? { ...c, label: 'Số bảng kê tổng' } : c);
        }
      }
      return defaultLeftColumns;
    } catch {
      return defaultLeftColumns;
    }
  });
  const [showLeftColSettings, setShowLeftColSettings] = useState(false);
  const [leftDragColumn, setLeftDragColumn] = useState(null);
  const [leftSettingsDrag, setLeftSettingsDrag] = useState(null);
  const [showLeftSearchModal, setShowLeftSearchModal] = useState(false);
  const [leftSearchColumn, setLeftSearchColumn] = useState(null);
  const [leftSearchQuery, setLeftSearchQuery] = useState('');
  const [leftColumnFilters, setLeftColumnFilters] = useState({});
  const [leftSelectedRows, setLeftSelectedRows] = useState(new Set());

  const [leftPageSize, setLeftPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('import_left_page_size')||'10',10); return isNaN(v)?10:v; } catch { return 10; }
  });

  // Save left column settings
  useEffect(() => { try { localStorage.setItem(LEFT_COL_KEY, JSON.stringify(leftColumns)); } catch {} }, [leftColumns]);

  // Left cell renderer
  const renderLeftCell = (record, key) => {
    switch (key) {
      case 'importNumber': return record.importNumber || '';
      case 'createdDate': return record.createdDate || '';
      case 'employee': return record.employee || record.Employee || '';
      case 'total': {
        // Prefer sum of tongTienSauGiam from dsHoaDonItems when available
        const totalFromHoaDons = (record.dsHoaDonItems || []).reduce((s, h) => s + (Number(h.tongTienSauGiam ?? h.tongTien ?? 0) || 0), 0);
        const total = (totalFromHoaDons && totalFromHoaDons > 0)
          ? totalFromHoaDons
          : ((record.totalAmount !== undefined && record.totalAmount !== null)
              ? Number(record.totalAmount)
              : (record.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0));
        return (Number(total) || 0).toLocaleString('vi-VN');
      }
      case 'note': return record.note || '';
      default: return '';
    }
  };

  // Left unique values for search
  const getLeftUniqueValues = (colId) => {
    const values = new Set();
    (filteredImports || []).forEach(record => {
      const v = String(renderLeftCell(record, colId) || '').trim();
      if (v) values.add(v);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Left search modal functions
  const openLeftSearch = (colId, colLabel) => { setLeftSearchColumn({ id: colId, label: colLabel }); setLeftSearchQuery(leftColumnFilters[colId] || ''); setShowLeftSearchModal(true); };
  const closeLeftSearch = () => { setShowLeftSearchModal(false); setLeftSearchColumn(null); setLeftSearchQuery(''); };
  const applyLeftSearch = () => {
    const nf = { ...leftColumnFilters };
    if (leftSearchQuery.trim()) nf[leftSearchColumn.id] = leftSearchQuery.trim(); else delete nf[leftSearchColumn.id];
    setLeftColumnFilters(nf); setShowLeftSearchModal(false);
  };
  const clearLeftFilter = (colId) => { const nf = { ...leftColumnFilters }; delete nf[colId]; setLeftColumnFilters(nf); };

  // Left select all/single row
  const handleLeftSelectAll = (checked, rows) => {
    if (checked) { setLeftSelectedRows(new Set(rows.map(r => r.id))); } else { setLeftSelectedRows(new Set()); }
  };
  const handleLeftSelectRow = (id) => {
    setLeftSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // Core data state
  const [imports, setImports] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transactionContents, setTransactionContents] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [dsHoaDons, setDsHoaDons] = useState([]);
  const [activeTab, setActiveTab] = useState('bangKeTong'); // 'bangKeTong' or 'dsHoaDon'

  // Order selection modal state
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [orderSelectDateRange, setOrderSelectDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [ordersForSelect, setOrdersForSelect] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [loadingOrders, setLoadingOrders] = useState(false);
  // Modal table pagination and filtering
  const [orderSelectPageSize, setOrderSelectPageSize] = useState(50);
  const [orderSelectCurrentPage, setOrderSelectCurrentPage] = useState(1);
  // Modal-specific column settings (allow drag/resize inside order-select modal)
  const defaultOrderSelectCols = [
    { id: 'orderDate', label: 'Ngày lập', width: 110, visible: true, align: 'center' },
    { id: 'maPhieu', label: 'Số phiếu', width: 140, visible: true, align: 'left' },
    { id: 'tenKhachHang', label: 'Khách hàng', width: 200, visible: true, align: 'left' },
    { id: 'tongTienSauGiam', label: 'Tổng tiền sau giảm', width: 140, visible: true, align: 'right' },
    { id: 'status', label: 'Trạng thái', width: 110, visible: true, align: 'center' },
    { id: 'createdBy', label: 'Nhân viên lập', width: 140, visible: true, align: 'left' },
    { id: 'taxRates', label: 'Thuế suất', width: 100, visible: true, align: 'left' },
    { id: 'loaiHang', label: 'Loại hàng', width: 120, visible: true, align: 'left' },
    { id: 'nvSale', label: 'Nhân viên sale', width: 140, visible: true, align: 'left' },
    { id: 'customerGroup', label: 'Nhóm khách hàng', width: 120, visible: true, align: 'left' },
    { id: 'salesSchedule', label: 'Lịch bán hàng', width: 140, visible: true, align: 'left' },
    { id: 'tongTien', label: 'Tổng tiền', width: 120, visible: true, align: 'right' },
    { id: 'totalKg', label: 'Tổng số kg', width: 100, visible: true, align: 'right' },
    { id: 'totalM3', label: 'Tổng số khối', width: 100, visible: true, align: 'right' },
    { id: 'printOrder', label: 'STT in', width: 80, visible: true, align: 'center' },
    { id: 'vehicle', label: 'Xe', width: 140, visible: true, align: 'left' },
    { id: 'deliveryVehicle', label: 'Xe giao hàng', width: 140, visible: true, align: 'left' },
    { id: 'printStatus', label: 'Trạng thái in', width: 120, visible: true, align: 'center' },
    { id: 'printCount', label: 'Số lần in', width: 90, visible: true, align: 'center' },
    { id: 'printDate', label: 'Ngày in', width: 110, visible: true, align: 'center' },
    { id: 'actions', label: 'Thao tác', width: 110, visible: true, align: 'center' }
  ];
  const [modalDshdColumns, setModalDshdColumns] = useState(() => {
    try { const s = localStorage.getItem('order_select_cols_v1'); return s ? JSON.parse(s) : defaultOrderSelectCols; } catch { return defaultOrderSelectCols; }
  });
  const [modalDshdDragColumn, setModalDshdDragColumn] = useState(null);
  const [modalDshdSettingsDrag, setModalDshdSettingsDrag] = useState(null);
  // map of customer group code/id -> group name for display in order-select modal
  const [customerGroupsMap, setCustomerGroupsMap] = useState({});
  

  // current logged-in user and permissions
  const { user, permissions } = useAuth();

  // map: normalized customer name → customerGroup code (loaded from Customers API)
  const [customerNameToGroupMap, setCustomerNameToGroupMap] = useState({});

  // Load customer groups mapping for displaying group names in modal
  useEffect(() => {
    let mounted = true;
    const loadGroups = async () => {
      try {
        const groups = await api.get(API_ENDPOINTS.customerGroups);
        if (!mounted || !groups) return;
        const map = {};
        groups.forEach(g => {
          if (g.id) map[g.id] = g.name || g.title || g.code || '';
          if (g.code) map[g.code] = g.name || g.title || g.code || '';
          // Also map by name for reverse lookup
          if (g.name) map[g.name] = g.name;
        });
        setCustomerGroupsMap(map);
      } catch (e) {
        console.error('Failed to load customer groups for modal:', e);
      }
    };
    loadGroups();
    return () => { mounted = false; };
  }, []);

  // Load customer name → group mapping (for resolving group in DS hóa đơn)
  useEffect(() => {
    let mounted = true;
    const loadCustomerGroups = async () => {
      try {
        const customers = await api.get(API_ENDPOINTS.customers);
        if (!mounted || !customers) return;
        const map = {};
        customers.forEach(c => {
          const n = (c.name || '').toString().trim().toLowerCase();
          if (n && c.customerGroup) map[n] = c.customerGroup;
        });
        setCustomerNameToGroupMap(map);
      } catch (e) {
        console.error('Failed to load customers for group mapping:', e);
      }
    };
    loadCustomerGroups();
    return () => { mounted = false; };
  }, []);

  // determine admin-like users: username/name 'admin' or 'superadmin', or explicit admin permission
  const isAdminUser = (() => {
    const name = (user?.username || user?.name || user?.role || '').toString().toLowerCase();
    if (name === 'admin' || name === 'superadmin' || user?.isSuperAdmin === true) return true;
    if (Array.isArray(permissions) && permissions.includes('admin:full-access')) return true;
    return false;
  })();

  // ===== Column management for Bảng kê tổng tab =====
  const BKT_COL_KEY = 'bktColumnSettings_v2';
  const defaultBktColumns = [
    { id: 'maPhieu', label: 'Mã phiếu', width: 140, visible: true, align: 'left' },
    { id: 'maVach', label: 'Mã vạch', width: 130, visible: true, align: 'left' },
    { id: 'maHang', label: 'Mã hàng', width: 140, visible: true, align: 'left' },
    { id: 'tenHang', label: 'Tên hàng', width: 280, visible: true, align: 'left' },
    { id: 'donViTinh1', label: 'Đơn vị tính 1', width: 100, visible: true, align: 'center' },
    { id: 'soLuongDVT1', label: 'Số lượng ĐVT 1', width: 120, visible: true, align: 'right' },
    { id: 'donViGoc', label: 'Đơn vị gốc', width: 100, visible: true, align: 'center' },
    { id: 'soLuongDVTGoc', label: 'Số lượng ĐVT gốc', width: 130, visible: true, align: 'right' },
    { id: 'moTa', label: 'Mô tả', width: 200, visible: true, align: 'left' },
    { id: 'slBanTheoDVTGoc', label: 'SL bán theo ĐVT Gốc', width: 150, visible: true, align: 'right' },
    { id: 'quyDoi', label: 'Quy đổi', width: 80, visible: true, align: 'right' },
    { id: 'loaiHang', label: 'Loại hàng', width: 150, visible: true, align: 'left' },
  ];
  const [bktColumns, setBktColumns] = useState(() => {
    try { const s = localStorage.getItem(BKT_COL_KEY); return s ? JSON.parse(s) : defaultBktColumns; } catch { return defaultBktColumns; }
  });
  const [showBktSettings, setShowBktSettings] = useState(false);
  const [bktDragColumn, setBktDragColumn] = useState(null);
  const [bktSettingsDrag, setBktSettingsDrag] = useState(null);
  const [showBktSearchModal, setShowBktSearchModal] = useState(false);
  const [bktSearchColumn, setBktSearchColumn] = useState(null);
  const [bktSearchQuery, setBktSearchQuery] = useState('');
  const [bktColumnFilters, setBktColumnFilters] = useState({});

  // ===== Column management for DS hóa đơn tab =====
  const DSHD_COL_KEY = 'dshdColumnSettings_v2';
  const defaultDshdColumns = [
    { id: 'stt', label: 'Số TT', width: 60, visible: true, align: 'center' },
    { id: 'maPhieu', label: 'Mã phiếu', width: 120, visible: true, align: 'center' },
    { id: 'tenKhachHang', label: 'Tên khách hàng', width: 200, visible: true, align: 'left' },
    { id: 'tongTien', label: 'Tổng tiền', width: 130, visible: true, align: 'right' },
    { id: 'tongTienSauGiam', label: 'Tổng tiền sau giảm', width: 150, visible: true, align: 'right' },
    { id: 'nvSale', label: 'NV Sale', width: 120, visible: true, align: 'left' },
    { id: 'customerGroup', label: 'Nhóm khách hàng', width: 140, visible: true, align: 'left' },
    { id: 'loaiHang', label: 'Loại hàng', width: 120, visible: true, align: 'left' },
  ];
  const [dshdColumns, setDshdColumns] = useState(() => {
    try { const s = localStorage.getItem(DSHD_COL_KEY); return s ? JSON.parse(s) : defaultDshdColumns; } catch { return defaultDshdColumns; }
  });
  const [showDshdSettings, setShowDshdSettings] = useState(false);
  const [dshdDragColumn, setDshdDragColumn] = useState(null);
  const [dshdSettingsDrag, setDshdSettingsDrag] = useState(null);
  // Modal-specific settings visibility
  const [showModalDshdSettings, setShowModalDshdSettings] = useState(false);
  const [showDshdSearchModal, setShowDshdSearchModal] = useState(false);
  const [dshdSearchColumn, setDshdSearchColumn] = useState(null);
  const [dshdSearchQuery, setDshdSearchQuery] = useState('');
  const [dshdColumnFilters, setDshdColumnFilters] = useState({});
  // Source for DSHD column-search: 'selectedImport' (default) or 'orderSelect'
  const [dshdSearchSource, setDshdSearchSource] = useState('selectedImport');
  const [dshdSearchSourceRows, setDshdSearchSourceRows] = useState([]);

  // Save column settings to localStorage
  useEffect(() => { try { localStorage.setItem(BKT_COL_KEY, JSON.stringify(bktColumns)); } catch {} }, [bktColumns]);
  useEffect(() => { try { localStorage.setItem(DSHD_COL_KEY, JSON.stringify(dshdColumns)); } catch {} }, [dshdColumns]);

  // Reset modal pagination when orders, filters or page size change
  React.useEffect(() => {
    setOrderSelectCurrentPage(1);
  }, [ordersForSelect, dshdColumnFilters, orderSelectPageSize]);

  // Generic column handlers (factory functions)
  const makeColHandlers = (setCols, setDragCol, setSettingsDrag) => ({
    toggleVisibility: (id) => setCols(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c)),
    resetCols: (defaults) => setCols(defaults),
    // Settings modal drag
    settingsDragStart: (e, index) => { setSettingsDrag(index); e.dataTransfer.effectAllowed = 'move'; },
    settingsDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    settingsDrop: (e, index, settingsDragItem) => {
      e.preventDefault();
      setCols(prev => { const arr = [...prev]; const item = arr.splice(settingsDragItem, 1)[0]; arr.splice(index, 0, item); return arr; });
      setSettingsDrag(null);
    },
    settingsDragEnd: () => setSettingsDrag(null),
    // Header drag reorder
    colDragStart: (e, id) => { setDragCol(id); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(id)); } catch (ex) { /* ignore for browsers that restrict setData */ } },
    colDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    colDrop: (e, id, dragCol) => {
      e.preventDefault();
      if (!dragCol || dragCol === id) return;
      setCols(prev => { const arr = [...prev]; const from = arr.findIndex(c => c.id === dragCol); const to = arr.findIndex(c => c.id === id); if (from < 0 || to < 0) return prev; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
      setDragCol(null);
    },
    colDragEnd: () => setDragCol(null),
    // Resize
    resizeStart: (e, id, cols) => {
      e.preventDefault();
      const sX = e.clientX;
      const col = cols.find(c => c.id === id);
      const sW = col ? col.width : 120;
      // prevent text selection while resizing
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      const onMove = (ev) => { const dx = ev.clientX - sX; setCols(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(60, sW + dx) } : c)); };
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.userSelect = prevUserSelect || ''; document.body.style.cursor = prevCursor || ''; };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
  });

  const leftH = makeColHandlers(setLeftColumns, setLeftDragColumn, setLeftSettingsDrag);
  const bktH = makeColHandlers(setBktColumns, setBktDragColumn, setBktSettingsDrag);
  const dshdH = makeColHandlers(setDshdColumns, setDshdDragColumn, setDshdSettingsDrag);
  // modal column handlers (must be created after makeColHandlers is defined)
  const modalH = makeColHandlers(setModalDshdColumns, setModalDshdDragColumn, setModalDshdSettingsDrag);

  // Helper: aggregate bangKeTongItems – group by product key, merge maPhieu (last 3 chars), sum slBanTheoDVTGoc
  const aggregateBktItems = (rawItems) => {
    const getShort = (maPhieu) => String(maPhieu || '').slice(-3);
    const productMap = new Map();
    (rawItems || []).forEach(item => {
      const key = item.maVach || item.maHang || item.tenHang;
      if (!key) return;
      const short = getShort(item.maPhieu);
      const conv = parseFloat(item.quyDoi) || 1;
      const baseQty = parseFloat(item.slBanTheoDVTGoc) || ((parseFloat(item.soLuongDVT1) || 0) * conv + (parseFloat(item.soLuongDVTGoc) || 0));
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        if (short && !existing.orderNumbers.includes(short)) {
          existing.orderNumbers.push(short);
        }
        existing.totalBaseQty += baseQty;
      } else {
        productMap.set(key, {
          orderNumbers: short ? [short] : [],
          maVach: item.maVach || '',
          maHang: item.maHang || '',
          tenHang: item.tenHang || '',
          donViTinh1: item.donViTinh1 || '',
          donViGoc: item.donViGoc || '',
          moTa: item.moTa || '',
          conv: conv,
          totalBaseQty: baseQty,
          loaiHang: item.loaiHang || '',
        });
      }
    });
    const result = [];
    productMap.forEach((data) => {
      const sl1 = Math.floor(data.totalBaseQty / data.conv);
      const baseRemaining = data.totalBaseQty - (sl1 * data.conv);
      result.push({
        maPhieu: data.orderNumbers.join(', '),
        maVach: data.maVach,
        maHang: data.maHang,
        tenHang: data.tenHang,
        donViTinh1: data.donViTinh1,
        soLuongDVT1: sl1,
        donViGoc: data.donViGoc,
        soLuongDVTGoc: Math.round(baseRemaining * 1000) / 1000,
        moTa: data.moTa,
        slBanTheoDVTGoc: Math.round(data.totalBaseQty * 1000) / 1000,
        quyDoi: Math.round(data.conv * 1000) / 1000,
        loaiHang: data.loaiHang,
      });
    });
    return result;
  };

  // BKT cell renderer
  const renderBktCell = (item, key, idx) => {
    switch (key) {
      case 'maPhieu': return item.maPhieu || '';
      case 'maVach': return item.maVach || '';
      case 'maHang': return item.maHang || '';
      case 'tenHang': return item.tenHang || '';
      case 'donViTinh1': return item.donViTinh1 || '';
      case 'soLuongDVT1': return item.soLuongDVT1 != null ? Number(item.soLuongDVT1).toLocaleString('vi-VN') : '';
      case 'donViGoc': return item.donViGoc || '';
      case 'soLuongDVTGoc': return item.soLuongDVTGoc != null ? Number(item.soLuongDVTGoc).toLocaleString('vi-VN') : '';
      case 'moTa': return item.moTa || '';
      case 'slBanTheoDVTGoc': return item.slBanTheoDVTGoc != null ? Number(item.slBanTheoDVTGoc).toLocaleString('vi-VN') : '';
      case 'quyDoi': return item.quyDoi != null ? Number(item.quyDoi).toLocaleString('vi-VN') : '';
      case 'loaiHang': return item.loaiHang || '';
      default: return '';
    }
  };

  // DSHD cell renderer
  const renderDshdCell = (item, key, idx) => {
    switch (key) {
      case 'stt': return idx + 1;
      case 'maPhieu': {
        const code = item.maPhieu || '';
        // Only use orderId (the actual Order table id) for id-based link
        const orderId = item.orderId || null;
        if (!code) return '';
        // If we have the real orderId, use ?id=, otherwise fall back to ?orderNumber=
        const href = orderId ? `/business/sales/create-order-form?id=${encodeURIComponent(orderId)}` : `/business/sales/create-order-form?orderNumber=${encodeURIComponent(code)}`;
        return (
          <a
            href={`#${href}`}
            onClick={(e) => { e.preventDefault(); try { window.open(href, '_blank'); } catch (err) { console.error(err); } }}
            style={{ color: '#1677ff', textDecoration: 'underline', cursor: 'pointer' }}
            title="Mở chi tiết đơn hàng trong tab mới"
          >{code}</a>
        );
      }
      case 'tenKhachHang': return item.tenKhachHang || '';
      case 'tongTien': return formatCurrency(item.tongTien);
      case 'tongTienSauGiam': return formatCurrency(item.tongTienSauGiam);
      case 'nvSale': return item.nvSale || '';
      case 'customerGroup': {
        // Resolve via: item field → customer name lookup → customerGroupsMap
        let groupCode = item.customerGroup || item.customerGroupId || item.customerGroupCode || '';
        if (!groupCode) {
          const custName = (item.tenKhachHang || '').toString().trim().toLowerCase();
          groupCode = customerNameToGroupMap[custName] || '';
        }
        return customerGroupsMap[groupCode] || item.customerGroupName || groupCode || '';
      }
      case 'loaiHang': return item.loaiHang || '';
      default: return '';
    }
  };

  // Get unique values for column search
  const getBktUniqueValues = (colId) => {
    const items = selectedImport?.bangKeTongItems || [];
    const values = new Set();
    items.forEach(item => {
      const v = String(renderBktCell(item, colId, 0) || '').trim();
      if (v && v !== '0') values.add(v);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  const getDshdUniqueValues = (colId) => {
    const items = selectedImport?.dsHoaDonItems || [];
    const values = new Set();
    items.forEach(item => {
      const v = String(renderDshdCell(item, colId, 0) || '').trim();
      if (v && v !== '0') values.add(v);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Open/close search modals
  const openBktSearch = (colId, colLabel) => {
    setBktSearchColumn({ id: colId, label: colLabel });
    const existing = bktColumnFilters[colId];
    setBktSearchQuery(existing && typeof existing === 'object' && existing.type === 'exact' ? existing.value : (existing || ''));
    setShowBktSearchModal(true);
  };
  const closeBktSearch = () => { setShowBktSearchModal(false); setBktSearchColumn(null); setBktSearchQuery(''); };
  const applyBktSearch = () => {
    const nf = { ...bktColumnFilters };
    const q = bktSearchQuery.trim();
    if (q) {
      // if the query exactly matches one of the unique values, treat as exact match
      const uniques = getBktUniqueValues(bktSearchColumn.id) || [];
      const foundExact = uniques.find(u => String(u) === q);
      if (foundExact) nf[bktSearchColumn.id] = { type: 'exact', value: q }; else nf[bktSearchColumn.id] = q;
    } else {
      delete nf[bktSearchColumn.id];
    }
    setBktColumnFilters(nf); setShowBktSearchModal(false);
  };
  const clearBktFilter = (colId) => { const nf = { ...bktColumnFilters }; delete nf[colId]; setBktColumnFilters(nf); };

  const openDshdSearch = (colId, colLabel) => {
    setDshdSearchColumn({ id: colId, label: colLabel });
    const existing = dshdColumnFilters[colId];
    setDshdSearchQuery(existing && typeof existing === 'object' && existing.type === 'exact' ? existing.value : (existing || ''));
    setShowDshdSearchModal(true);
  };
  const closeDshdSearch = () => { setShowDshdSearchModal(false); setDshdSearchColumn(null); setDshdSearchQuery(''); resetDshdSearchSource(); };
  const applyDshdSearch = () => {
    const nf = { ...dshdColumnFilters };
    const q = dshdSearchQuery.trim();
    if (q) {
      // derive unique values depending on source
      let uniques = [];
      if (dshdSearchSource === 'orderSelect' && Array.isArray(dshdSearchSourceRows)) {
        const vals = new Set();
        dshdSearchSourceRows.forEach(order => {
          let v = '';
          switch (dshdSearchColumn.id) {
            case 'maPhieu': v = order.orderNumber || order.orderNo || ''; break;
            case 'tenKhachHang': v = order.customerName || order.customer || ''; break;
            case 'tongTien': v = String(order.totalAmount || order.total || ''); break;
            case 'tongTienSauGiam': v = String(order.totalAfterDiscount || order.totalAmount || ''); break;
            case 'nvSale': v = order.salesStaff || order.createdBy || ''; break;
            case 'loaiHang': v = order.productType || order.ProductType || ''; break;
            case 'orderDate': v = order.orderDate ? dayjs(order.orderDate).format('DD/MM/YYYY') : ''; break;
            case 'customerName': v = order.customerName || ''; break;
            case 'totalAfterDiscount': v = String(order.totalAfterDiscount || order.totalAmount || ''); break;
            case 'taxRates': v = order.taxRates || order.TaxRates || ''; break;
            case 'totalKg': v = String(order.totalKg || order.kg || ''); break;
            case 'totalM3': v = String(order.totalM3 || order.m3 || ''); break;
            default: v = String(order[dshdSearchColumn.id] || '');
          }
          v = (v || '').toString().trim();
          if (v && v !== '0') vals.add(v);
        });
        uniques = Array.from(vals);
      } else {
        uniques = getDshdUniqueValues(dshdSearchColumn.id) || [];
      }
      const foundExact = uniques.find(u => String(u) === q);
      if (foundExact) nf[dshdSearchColumn.id] = { type: 'exact', value: q }; else nf[dshdSearchColumn.id] = q;
    } else {
      delete nf[dshdSearchColumn.id];
    }
    setDshdColumnFilters(nf); setShowDshdSearchModal(false); resetDshdSearchSource();
  };
  // Open DSHD search modal but use orders list as source (when opened from order-select modal)
  const openDshdSearchFromOrderSelect = (colId, colLabel, rows) => {
    setDshdSearchSource('orderSelect');
    setDshdSearchSourceRows(Array.isArray(rows) ? rows : []);
    setDshdSearchColumn({ id: colId, label: colLabel });
    setDshdSearchQuery(dshdColumnFilters[colId] || '');
    setShowDshdSearchModal(true);
  };
  const resetDshdSearchSource = () => { setDshdSearchSource('selectedImport'); setDshdSearchSourceRows([]); };

  // Save modal column settings to localStorage when changed
  useEffect(() => { try { localStorage.setItem('order_select_cols_v1', JSON.stringify(modalDshdColumns)); } catch {} }, [modalDshdColumns]);
  const clearDshdFilter = (colId) => { const nf = { ...dshdColumnFilters }; delete nf[colId]; setDshdColumnFilters(nf); };

  // Filter items by column filters
  const filterBktItems = (items) => {
    if (!items || Object.keys(bktColumnFilters).length === 0) return items;
    return items.filter(item => {
      return Object.entries(bktColumnFilters).every(([colId, query]) => {
        const val = String(renderBktCell(item, colId, 0) || '').toLowerCase();
        if (query && typeof query === 'object' && query.type === 'exact') {
          return val === String(query.value).toLowerCase();
        }
        return val.includes(String(query).toLowerCase());
      });
    });
  };
  const filterDshdItems = (items) => {
    if (!items || Object.keys(dshdColumnFilters).length === 0) return items;
    return items.filter(item => {
      return Object.entries(dshdColumnFilters).every(([colId, query]) => {
        const val = String(renderDshdCell(item, colId, 0) || '').toLowerCase();
        if (query && typeof query === 'object' && query.type === 'exact') {
          return val === String(query.value).toLowerCase();
        }
        return val.includes(String(query).toLowerCase());
      });
    });
  };

  // Filter ordersForSelect according to dshdColumnFilters (used in selection modal)
  const filterOrdersForSelect = (orders) => {
    if (!orders || Object.keys(dshdColumnFilters).length === 0) return orders;
    return orders.filter(order => {
      return Object.entries(dshdColumnFilters).every(([colId, query]) => {
        const qObj = query;
        const q = String((typeof query === 'object' && query.type === 'exact') ? query.value : (query || '')).toLowerCase();
        let val = '';
        switch (colId) {
          case 'maPhieu': val = order.orderNumber || order.orderNo || '' ; break;
          case 'tenKhachHang': val = order.customerName || order.customer || '' ; break;
          case 'tongTien': val = String(order.totalAmount || order.total || ''); break;
          case 'tongTienSauGiam': val = String(order.totalAfterDiscount || order.totalAmount || ''); break;
          case 'nvSale': val = order.salesStaff || order.createdBy || '' ; break;
          case 'loaiHang': val = order.productType || order.ProductType || '' ; break;
          case 'orderNumber': val = order.orderNumber || '' ; break;
          case 'customerName': val = order.customerName || '' ; break;
          case 'totalAfterDiscount': val = String(order.totalAfterDiscount || order.totalAmount || ''); break;
          case 'taxRates': val = order.taxRates || order.TaxRates || ''; break;
          case 'totalKg': val = String(order.totalKg || order.kg || ''); break;
          case 'totalM3': val = String(order.totalM3 || order.m3 || ''); break;
          default:
            val = String(order[colId] || '').toLowerCase();
        }
        if (qObj && typeof qObj === 'object' && qObj.type === 'exact') {
          return String(val).toLowerCase() === q;
        }
        // If the user typed a numeric-only query (e.g., "42"), match against numeric suffixes like "...-000042"
        if (colId === 'maPhieu' && /^\d+$/.test(q)) {
          try {
            const digits = (String(val).match(/\d+/g) || []).pop() || '';
            const digitsNoZero = digits.replace(/^0+/, '') || digits;
            return String(val).toLowerCase().includes(q) || String(digitsNoZero).includes(q);
          } catch (e) {
            return String(val).toLowerCase().includes(q);
          }
        }
        return String(val).toLowerCase().includes(q);
      });
    });
  };

  // Helper to render a dynamic table for tab (reusable for both branches)
  const renderTabTable = (tabType, dataItems) => {
    const isBkt = tabType === 'bkt';
    const cols = isBkt ? bktColumns : dshdColumns;
    const dragCol = isBkt ? bktDragColumn : dshdDragColumn;
    const h = isBkt ? bktH : dshdH;
    const colFilters = isBkt ? bktColumnFilters : dshdColumnFilters;
    const openSearch = isBkt ? openBktSearch : openDshdSearch;
    const clearFilter = isBkt ? clearBktFilter : clearDshdFilter;
    const renderCell = isBkt ? renderBktCell : renderDshdCell;
    const filterItems = isBkt ? filterBktItems : filterDshdItems;
    const setShowSettings = isBkt ? setShowBktSettings : setShowDshdSettings;
    const tabLabel = isBkt ? 'Bảng kê tổng' : 'DS hóa đơn';
    const noDataMsg = isBkt ? 'Không có dữ liệu bảng kê tổng' : 'Không có dữ liệu DS hóa đơn';
    const visibleCols = cols.filter(c => c.visible);
    const filteredItems = filterItems(dataItems || []);
    // totals for visible DS hóa đơn items (used to render footer "Tổng cộng")
    const totalTongTien = filteredItems.reduce((s, it) => s + (Number(it.tongTien || it.total || 0) || 0), 0);
    const totalTongTienSauGiam = filteredItems.reduce((s, it) => s + (Number(it.tongTienSauGiam ?? it.tongTien ?? 0) || 0), 0);
    // totals for Bảng kê tổng quantities
    const totalSoLuongDVT1 = isBkt ? filteredItems.reduce((s, it) => s + (Number(it.soLuongDVT1) || 0), 0) : 0;
    const totalSoLuongDVTGoc = isBkt ? filteredItems.reduce((s, it) => s + (Number(it.soLuongDVTGoc) || 0), 0) : 0;
    const totalSlBanTheoDVTGoc = isBkt ? filteredItems.reduce((s, it) => s + (Number(it.slBanTheoDVTGoc) || 0), 0) : 0;
    const footerLabelColId = (visibleCols && visibleCols.length) ? visibleCols[0].id : null;

    return (
      <div className="order-items-section">
        <div className="order-items-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="items-total">{tabLabel}</span>
          <button
            className="action-btn btn-settings"
            title="Cài đặt cột"
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          >
            ⚙️
          </button>
        </div>
        <div className="order-items-table-container" style={{ overflowX: 'auto' }}>
          <table className="order-items-table bkt-dynamic-table" style={{ borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: '#f0f5ff' }}>
                {visibleCols.map(col => (
                  <th
                    key={col.id}
                    style={{
                      border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: col.align || 'center',
                      fontWeight: 600, width: col.width + 'px', minWidth: col.width + 'px', position: 'relative',
                      cursor: dragCol === col.id ? 'grabbing' : 'grab', userSelect: 'none',
                    }}
                    draggable
                    onDragStart={(e) => h.colDragStart(e, col.id)}
                    onDragOver={h.colDragOver}
                    onDrop={(e) => h.colDrop(e, col.id, dragCol)}
                    onDragEnd={h.colDragEnd}
                    className={dragCol === col.id ? 'dragging' : ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ flex: 1 }}>{col.label}</span>
                      {col.id !== 'stt' && (
                        <React.Fragment>
                          <button
                            className="col-search-btn"
                            onClick={(e) => { e.stopPropagation(); openSearch(col.id, col.label); }}
                            title={`Tìm kiếm theo ${col.label}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.6, padding: '1px 2px' }}
                          >🔍</button>
                          {colFilters[col.id] && (
                            <button
                              className="col-clear-btn"
                              onClick={(e) => { e.stopPropagation(); clearFilter(col.id); }}
                              title="Xóa bộ lọc"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#c9302c', padding: '1px 2px' }}
                            >✖</button>
                          )}
                        </React.Fragment>
                      )}
                    </div>
                    {col.id !== 'stt' && (
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => { e.stopPropagation(); h.resizeStart(e, col.id, cols); }}
                        style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 2 }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {visibleCols.map(col => (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '5px 8px', textAlign: col.align || 'center' }}>
                        {renderCell(item, col.id, idx)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleCols.length} style={{ border: '1px solid #d9d9d9', padding: '20px', textAlign: 'center', color: '#999' }}>
                    {noDataMsg}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#fafafa', fontWeight: 700 }}>
                {visibleCols.map(col => {
                  if (col.id === footerLabelColId) {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'left' }}>
                        Tổng cộng
                      </td>
                    );
                  }
                  if (col.id === 'tongTien') {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: col.align || 'right', color: '#000' }}>
                        {formatCurrency(totalTongTien)}
                      </td>
                    );
                  }
                  if (col.id === 'tongTienSauGiam') {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: col.align || 'right', color: '#000' }}>
                        {formatCurrency(totalTongTienSauGiam)}
                      </td>
                    );
                  }
                  if (isBkt && col.id === 'soLuongDVT1') {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'right', color: '#000' }}>
                        {(Number(totalSoLuongDVT1) || 0).toLocaleString('vi-VN')}
                      </td>
                    );
                  }
                  if (isBkt && col.id === 'soLuongDVTGoc') {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'right', color: '#000' }}>
                        {(Number(totalSoLuongDVTGoc) || 0).toLocaleString('vi-VN')}
                      </td>
                    );
                  }
                  if (isBkt && col.id === 'slBanTheoDVTGoc') {
                    return (
                      <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: 'right', color: '#000' }}>
                        {(Number(totalSlBanTheoDVTGoc) || 0).toLocaleString('vi-VN')}
                      </td>
                    );
                  }
                  return <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px 8px', textAlign: col.align || 'center' }} />;
                })}
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderTop: '1px solid #eee', fontSize: 12 }}>
          <span style={{ color: '#888' }}>Trang {rightCurrentPage}/{rightTotalPages || 1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))} disabled={rightCurrentPage <= 1} style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 3, cursor: rightCurrentPage <= 1 ? 'default' : 'pointer', background: '#fff', fontSize: 11 }}>‹</button>
            <button onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))} disabled={rightCurrentPage >= rightTotalPages} style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 3, cursor: rightCurrentPage >= rightTotalPages ? 'default' : 'pointer', background: '#fff', fontSize: 11 }}>›</button>
            <select
              value={(rightTotal && rightItemsPerPage >= rightTotal) ? 'all' : rightItemsPerPage}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'all') {
                  setRightItemsPerPage(rightTotal || 1);
                  setRightCurrentPage(1);
                } else {
                  setRightItemsPerPage(parseInt(v, 10));
                  setRightCurrentPage(1);
                }
              }}
              style={{ padding: '2px 4px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11 }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
              <option value={10000}>10000</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
          
        </div>
      </div>
    );
  };

  // Helper to render column settings modal
  const renderColumnSettingsModal = (tabType) => {
    const isBkt = tabType === 'bkt';
    const show = isBkt ? showBktSettings : showDshdSettings;
    const setShow = isBkt ? setShowBktSettings : setShowDshdSettings;
    const cols = isBkt ? bktColumns : dshdColumns;
    const defaults = isBkt ? defaultBktColumns : defaultDshdColumns;
    const h = isBkt ? bktH : dshdH;
    const settingsDrag = isBkt ? bktSettingsDrag : dshdSettingsDrag;
    const tabLabel = isBkt ? 'Bảng kê tổng' : 'DS hóa đơn';

    if (!show) return null;
    return (
      <div className="search-modal-overlay" onClick={() => setShow(false)}>
        <div className="column-settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => h.resetCols(defaults)} title="Reset về mặc định" style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #e6eefc', background: '#f5f8ff', color: '#2b6cb0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔄</span>
                <span>Reset về mặc định</span>
              </button>
              <h3 style={{ margin: 0, fontSize: 15 }}>⚙️ Cài đặt cột - {tabLabel}</h3>
            </div>
            <button className="search-modal-close" onClick={() => setShow(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
          </div>
          <div className="column-settings-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Hiển thị {cols.filter(c => c.visible).length}/{cols.length} cột</span>
            </div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>💡 Kéo thả để sắp xếp, tick/untick để ẩn/hiện cột</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {cols.map((column, index) => (
                <div
                  key={column.id}
                  className={`column-settings-item ${settingsDrag === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => h.settingsDragStart(e, index)}
                  onDragOver={h.settingsDragOver}
                  onDrop={(e) => h.settingsDrop(e, index, settingsDrag)}
                  onDragEnd={h.settingsDragEnd}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'grab', background: settingsDrag === index ? '#e3f2fd' : 'transparent' }}
                >
                  <span style={{ cursor: 'grab', color: '#aaa', fontSize: 14, userSelect: 'none' }}>⋮⋮</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, cursor: 'pointer' }}>
                    <input type="checkbox" checked={column.visible} onChange={() => h.toggleVisibility(column.id)} style={{ accentColor: '#667eea' }} />
                    <span style={{ fontSize: 13 }}>{column.label}</span>
                  </label>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{column.width}px</span>
                  {!column.visible && <span style={{ fontSize: 10, color: '#f5222d', background: '#fff1f0', padding: '1px 6px', borderRadius: 8 }}>Ẩn</span>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button className="apply-settings-btn" onClick={() => setShow(false)} style={{ padding: '6px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                ✓ Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Column settings modal specifically for the Order Select modal
  const renderModalColumnSettingsModal = () => {
    const show = showModalDshdSettings;
    const setShow = setShowModalDshdSettings;
    const cols = modalDshdColumns;
    const defaults = defaultOrderSelectCols;
    const h = modalH;
    const settingsDrag = modalDshdSettingsDrag;
    const tabLabel = 'DS hóa đơn (Chọn đơn hàng)';

    if (!show) return null;
    return (
      <div className="search-modal-overlay" onClick={() => setShow(false)}>
        <div className="column-settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => h.resetCols(defaults)} title="Reset về mặc định" style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #e6eefc', background: '#f5f8ff', color: '#2b6cb0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔄</span>
                <span>Reset về mặc định</span>
              </button>
              <h3 style={{ margin: 0, fontSize: 15 }}>⚙️ Cài đặt cột - {tabLabel}</h3>
            </div>
            <button className="search-modal-close" onClick={() => setShow(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
          </div>
          <div className="column-settings-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Hiển thị {cols.filter(c => c.visible).length}/{cols.length} cột</span>
            </div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>💡 Kéo thả để sắp xếp, tick/untick để ẩn/hiện cột</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {cols.map((column, index) => (
                <div
                  key={column.id}
                  className={`column-settings-item ${settingsDrag === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => h.settingsDragStart(e, index)}
                  onDragOver={h.settingsDragOver}
                  onDrop={(e) => h.settingsDrop(e, index, settingsDrag)}
                  onDragEnd={h.settingsDragEnd}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'grab', background: settingsDrag === index ? '#e3f2fd' : 'transparent' }}
                >
                  <span style={{ cursor: 'grab', color: '#aaa', fontSize: 14, userSelect: 'none' }}>⋮⋮</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, cursor: 'pointer' }}>
                    <input type="checkbox" checked={column.visible} onChange={() => h.toggleVisibility(column.id)} style={{ accentColor: '#667eea' }} />
                    <span style={{ fontSize: 13 }}>{column.label}</span>
                  </label>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{column.width}px</span>
                  {!column.visible && <span style={{ fontSize: 10, color: '#f5222d', background: '#fff1f0', padding: '1px 6px', borderRadius: 8 }}>Ẩn</span>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button className="apply-settings-btn" onClick={() => setShow(false)} style={{ padding: '6px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                ✓ Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render column search modal
  const renderColumnSearchModal = (tabType) => {
    const isBkt = tabType === 'bkt';
    const show = isBkt ? showBktSearchModal : showDshdSearchModal;
    const searchCol = isBkt ? bktSearchColumn : dshdSearchColumn;
    const query = isBkt ? bktSearchQuery : dshdSearchQuery;
    const setQuery = isBkt ? setBktSearchQuery : setDshdSearchQuery;
    const closeModal = isBkt ? closeBktSearch : closeDshdSearch;
    const applySearch = isBkt ? applyBktSearch : applyDshdSearch;
    const getUniqueValues = isBkt ? getBktUniqueValues : getDshdUniqueValues;
    const setFilters = isBkt ? setBktColumnFilters : setDshdColumnFilters;

    if (!show || !searchCol) return null;
    // If DSHD search was opened from order-select, use the provided rows as source
    let uniqueValues = [];
    if (!isBkt && dshdSearchSource === 'orderSelect' && Array.isArray(dshdSearchSourceRows)) {
      // derive unique values from orders list
      const vals = new Set();
      dshdSearchSourceRows.forEach(order => {
        let v = '';
        switch (searchCol.id) {
          case 'maPhieu': v = order.orderNumber || order.orderNo || ''; break;
          case 'tenKhachHang': v = order.customerName || order.customer || ''; break;
          case 'tongTien': v = String(order.totalAmount || order.total || ''); break;
          case 'tongTienSauGiam': v = String(order.totalAfterDiscount || order.totalAmount || ''); break;
          case 'nvSale': v = order.salesStaff || order.createdBy || ''; break;
          case 'loaiHang': v = order.productType || order.ProductType || ''; break;
          case 'orderDate': v = order.orderDate ? dayjs(order.orderDate).format('DD/MM/YYYY') : ''; break;
          case 'customerName': v = order.customerName || ''; break;
          case 'totalAfterDiscount': v = String(order.totalAfterDiscount || order.totalAmount || ''); break;
          case 'taxRates': v = order.taxRates || order.TaxRates || ''; break;
          case 'totalKg': v = String(order.totalKg || order.kg || ''); break;
          case 'totalM3': v = String(order.totalM3 || order.m3 || ''); break;
          default: v = String(order[searchCol.id] || '');
        }
        v = (v || '').toString().trim();
        if (v && v !== '0') vals.add(v);
      });
      uniqueValues = Array.from(vals).sort((a, b) => a.localeCompare(b, 'vi'));
      // filter suggestions by query (support numeric-only queries matching numeric suffixes)
      const q = (query || '').toString().trim();
      if (q) {
        if (/^\d+$/.test(q)) {
          uniqueValues = uniqueValues.filter(v => {
            try {
              const digits = (String(v).match(/\d+/g) || []).pop() || '';
              const digitsNoZero = digits.replace(/^0+/, '') || digits;
              return String(v).toLowerCase().includes(q.toLowerCase()) || String(digitsNoZero).includes(q);
            } catch (e) {
              return String(v).toLowerCase().includes(q.toLowerCase());
            }
          }).slice(0, 50);
        } else {
          uniqueValues = uniqueValues.filter(v => String(v).toLowerCase().includes(q.toLowerCase())).slice(0, 50);
        }
      } else {
        uniqueValues = uniqueValues.slice(0, 50);
      }
    } else {
      uniqueValues = getUniqueValues(searchCol.id).filter(v => {
        if (!query.trim()) return true;
        return v.toLowerCase().includes(query.toLowerCase());
      }).slice(0, 50);
    }

    return (
      <div className="search-modal-overlay" onClick={closeModal}>
        <div className="search-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 380, maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>🔍 Tìm kiếm theo "{searchCol.label}"</h3>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde2e8', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto', padding: '0 16px' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Các giá trị có trong cột (click để chọn):</div>
            {uniqueValues.length === 0 ? (
              <div style={{ padding: 10, color: '#999', textAlign: 'center' }}>Không có dữ liệu</div>
            ) : (
              uniqueValues.map((value, i) => (
                <div
                  key={i}
                  onClick={() => { setQuery(value); }}
                  style={{ padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: query === value ? '#e3f2fd' : 'transparent', fontSize: 13 }}
                  onMouseEnter={(e) => { e.target.style.background = '#f5f5f5'; }}
                  onMouseLeave={(e) => { e.target.style.background = query === value ? '#e3f2fd' : 'transparent'; }}
                >
                  {value}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setQuery(''); setFilters({}); closeModal(); resetDshdSearchSource(); }} style={{ padding: '6px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Xóa bộ lọc
            </button>
            <button onClick={applySearch} style={{ padding: '6px 14px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Áp dụng
            </button>
            <button onClick={closeModal} style={{ padding: '6px 14px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [selectedProducts, setSelectedProducts] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [formData, setFormData] = useState(() => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    
    return { 
      importNumber: `BKT-${day}${month}${year}-${timestamp}`, 
      createdDate: new Date().toISOString().split('T')[0], 
      employee: '', 
      importType: '', 
      dsHoaDon: '',
      totalWeight: 0, 
      totalVolume: 0, 
      note: '' 
    };
  });

  // Ensure import type is selected before product actions
  const ensureImportTypeSelected = () => {
    const it = (selectedImport && selectedImport.importType) || formData.importType;
    if (!it || String(it).trim() === '') {
      Modal.warning({ title: 'Chưa chọn bảng kê tổng', content: 'vui lòng chọn bảng kê tổng trước khi thao tác' });
      return false;
    }
    return true;
  };

  // Helper to get default warehouse id (prefer one that contains 'NPP')
  const getDefaultWarehouseName = () => {
    try {
      if (!warehouses || warehouses.length === 0) return '';
      const found = warehouses.find(w => {
        if (!w || !w.name) return false;
        const n = String(w.name).toLowerCase();
        return n.includes('npp') || n.includes('kho npp') || n.includes('kho_npp');
      });
      if (found) return String(found.id);
      return String(warehouses[0].id || '');
    } catch (e) {
      return '';
    }
  };

  // Ref to temporarily suppress auto-selecting the first import when imports refresh
  const suppressAutoSelectRef = React.useRef(false);
  // Control whether right layout content is visible
  const [showRightContent, setShowRightContent] = useState(true);
  // Control edit mode - true: show full edit with products table, false: show basic info only
  const [isEditMode, setIsEditMode] = useState(false);
  const [leftPage, setLeftPage] = useState(1);
  const [showRightSettings, setShowRightSettings] = useState(false);
  const itemsTableRef = useRef(null);
  const productSelectRefs = useRef({});
  const [headerRows, setHeaderRows] = useState(() => [{ id: Date.now(), values: {} }]);
  const [headerFilter, setHeaderFilter] = useState(null); // { productCode, barcode, productName } or null

  // Simple resize handler that works directly on th elements
  const handleThMouseDown = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = rightColWidths[colKey] || 100;

    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(40, startWidth + delta);
      setRightColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Helper function to calculate totals from items
  const calculateTotals = (itemsList) => {
    const result = itemsList.reduce((totals, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const weight = parseFloat(item.weight) || 0; 
      const volume = parseFloat(item.volume) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const transportCost = parseFloat(item.transportCost) || 0;
      
      return {
        totalWeight: totals.totalWeight + weight, // Don't round yet
        totalVolume: totals.totalVolume + volume, // Don't round yet
        totalAmount: totals.totalAmount + (quantity * unitPrice),
        totalTransport: totals.totalTransport + (transportCost * quantity)
      };
    }, { totalWeight: 0, totalVolume: 0, totalAmount: 0, totalTransport: 0 });
    
    // No rounding - preserve exact values
    return {
      totalWeight: result.totalWeight,
      totalVolume: result.totalVolume,
      totalAmount: result.totalAmount,
      totalTransport: result.totalTransport
    };
  };

  // Helper function to format currency (with comma separators)
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value) || 0;
    // No decimal places for display, use grouping separators
    try {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } catch (e) {
      return String(Math.round(num));
    }
  };

  // Helper to format weight (3 decimal places, simple rounding)
  const formatWeight = (w) => {
    if (w === null || w === undefined || w === '') return '0.000';
    const num = Number(w) || 0;
    return num.toFixed(3);
  };

  // Helper function to get product weight/volume/price/conversion based on selected unit
  const getProductDataByUnit = (product, unitName) => {
    if (!product || !unitName) return { weight: 0, volume: 0, price: 0, conversion: 1 };

    const baseWeight = parseFloat(product.weight) || 0;
    const baseVolume = parseFloat(product.volume) || 0;
    // Build unit list with conversions
    const units = [];
    const baseUnit = product.baseUnit || product.defaultUnit || product.DefaultUnit || product.unit;
    if (baseUnit) units.push({ name: baseUnit, conv: 1 });
    if (product.unit1) units.push({ name: product.unit1, conv: Number(product.conversion1) || 1 });
    if (product.unit2) units.push({ name: product.unit2, conv: Number(product.conversion2) || 1 });
    if (product.unit3) units.push({ name: product.unit3, conv: Number(product.conversion3) || 1 });
    if (product.unit4) units.push({ name: product.unit4, conv: Number(product.conversion4) || 1 });

    // Find matching unit
    const u = units.find(x => String(x.name) === String(unitName));
    const conversion = u ? (Number(u.conv) || 1) : 1;

    return {
      weight: baseWeight * conversion,
      volume: baseVolume * conversion,
      price: (parseFloat(product.unitPrice) || parseFloat(product.price) || 0) * conversion,
      conversion: conversion
    };
  };

  // Helper function to format volume (4 decimal places)
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined || volume === '') return '0.0000';
    const num = Number(volume) || 0;
    if (num === 0) return '0.0000';
    // Convert to string and truncate to 4 decimal places without rounding
    const str = num.toString();
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str + '.0000';
    const neededLen = dotIndex + 1 + 4; // dot + 4 decimals
    let out = str.substring(0, Math.min(neededLen, str.length));
    // pad zeros if necessary
    const decimals = out.length - dotIndex - 1;
    if (decimals < 4) out = out + '0'.repeat(4 - decimals);
    return out;
  };

  // Helper function to format input value for display
  const formatInputDisplay = (value, type) => {
    if (!value || value === '') return '';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'weight':
        return formatWeight(value);
      case 'volume':
        return formatVolume(value);
      case 'number':
        return value.toString();
      default:
        return value;
    }
  };

  // Helper function to parse display value back to number
  const parseDisplayValue = (displayValue) => {
    if (!displayValue || displayValue === '') return '';
    // Remove commas and parse as number
    return displayValue.toString().replace(/,/g, '');
  };

  // Helper function to convert number to Vietnamese text
  const numberToVietnameseText = (num) => {
    if (!num || num === 0) return 'không đồng';
    
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];

    if (num < 0) return 'âm ' + numberToVietnameseText(-num);
    if (num === 0) return 'không';

    const convertHundreds = (n) => {
      let result = '';
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      
      if (hundreds > 0) {
        result += ones[hundreds] + ' trăm';
        if (remainder > 0) result += ' ';
      }
      
      if (remainder >= 20) {
        const tensDigit = Math.floor(remainder / 10);
        const onesDigit = remainder % 10;
        result += tens[tensDigit];
        if (onesDigit > 0) {
          result += ' ' + ones[onesDigit];
        }
      } else if (remainder >= 10) {
        if (remainder === 10) {
          result += 'mười';
        } else {
          result += 'mười ' + ones[remainder - 10];
        }
      } else if (remainder > 0) {
        if (hundreds > 0) {
          result += 'lẻ ' + ones[remainder];
        } else {
          result += ones[remainder];
        }
      }
      
      return result;
    };

    let result = '';
    let scaleIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkText = convertHundreds(chunk);
        if (scaleIndex > 0) {
          result = chunkText + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
        } else {
          result = chunkText;
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return result + ' đồng';
  };

  // Helper function to format product option labels
  const getProductOptionLabel = (product) => {
    // Show: mã vạch - mã hàng - tên sản phẩm - giá bán lẻ - tồn kho
    // Try explicit common fields first
    const priceCandidates = [
      'priceRetail','retailPrice','giaBanLe','GiaBanLe','price','importPrice','PriceRetail','gia_ban_le','giabanle','giá_bán_lẻ'
    ];
    let priceVal = null;
    for (const k of priceCandidates) {
      if (product && Object.prototype.hasOwnProperty.call(product, k)) {
        const v = product[k];
        if (v !== null && v !== undefined && v !== '') { priceVal = v; break; }
      }
    }
    // fallback: scan keys for anything that looks like price/gia
    if ((priceVal === null || priceVal === undefined) && product) {
      const pk = Object.keys(product).find(k => /gia|price|banle|retail/i.test(k));
      if (pk) priceVal = product[pk];
    }
    const priceNumber = Number(priceVal) || 0;
    const priceText = priceNumber.toLocaleString('vi-VN');

    // Stock candidates
    const stockCandidates = ['stock','quantity','qty','available','onHand','tonkho','soLuong','so_luong','tồnKho','TồnKho','SoKg'];
    let stockVal = null;
    for (const k of stockCandidates) {
      if (product && Object.prototype.hasOwnProperty.call(product, k)) {
        const v = product[k];
        if (v !== null && v !== undefined && v !== '') { stockVal = v; break; }
      }
    }
    if ((stockVal === null || stockVal === undefined) && product) {
      const sk = Object.keys(product).find(k => /stock|qty|quantity|so|ton|onHand|available/i.test(k));
      if (sk) stockVal = product[sk];
    }
    const stockText = (stockVal === null || stockVal === undefined) ? '0' : String(stockVal);

    return `${product.barcode || ''} - ${product.code || ''} - ${product.name || ''} - ${priceText} - ${stockText}`;
  };

  // Helper function to get selected display value (for productName column, show only name)
  const getSelectedDisplayValue = (product, colKey) => {
    if (colKey === 'productName') {
      return product.name || '';
    }
    return getProductOptionLabel(product);
  };

  // Render header with product dropdown
  const renderProductDropdownTH = (colKey, label) => {
    const getDisplayText = (product) => {
      switch(colKey) {
        case 'productCode': return product.code || 'N/A';
        case 'productName': return product.name || 'N/A';
        case 'barcode': return product.barcode || 'N/A';
        default: return product.name || 'N/A';
      }
    };
    
    const getSearchText = (product) => {
        return `${product.code || ''} - ${product.name || ''} - ${product.barcode || ''}`.toLowerCase();
    };
    
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontWeight: 'bold'}}>{label}</span>
            <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => {
              if (!ensureImportTypeSelected()) return;
              // Open product modal but restrict results to products present in this import
              setProductModalColumn(colKey);
              setProductModalRowIndex(null);
              setProductModalSearch('');
              setSelectedModalProducts([]);
              setModalCurrentPage(1);
              setProductModalScope('currentImport');
              setShowProductModal(true);
            }} />
          </div>
          <Input
            placeholder={`nhập ${label.toLowerCase()}`}
            size="small"
            style={{ width: '100%' }}
            readOnly
          />
        </div>
      </th>
    );
  };

  // Handle product selection from dropdown
  const handleProductSelect = (colKey, productId) => {
    if (!ensureImportTypeSelected()) return;
    // Update all product-related dropdowns to show the same selected product
    if (productId) {
      setSelectedProducts(prev => ({ 
        ...prev, 
        productCode: productId,
        productName: productId, 
        barcode: productId 
      }));
    } else {
      setSelectedProducts(prev => ({ ...prev, [colKey]: productId }));
    }
    
    if (productId && selectedImport) {
      const selectedProduct = products.find(p => p.id.toString() === productId);
      if (selectedProduct) {
        // Work with the current right-side items (from selectedImport if present)
        const currentRightItems = (selectedImport && selectedImport.items) ? selectedImport.items : items;
        // Check if product already exists in items
        const existingItem = currentRightItems.find(item => 
          item.productCode === selectedProduct.code || 
          item.barcode === selectedProduct.barcode
        );

        if (existingItem) {
          // If product already exists, just increase quantity
          const updatedItems = currentRightItems.map(item => 
            item.id === existingItem.id 
              ? { ...item, quantity: ((item.quantity || 1) + 1), total: ((item.quantity || 1) + 1) * (item.unitPrice || 0) }
              : item
          );
          setItems(updatedItems);
          if (selectedImport) setSelectedImport(prev => ({ ...prev, items: updatedItems }));
        } else {
          // Try to find the most recent import that contains this product and use its prices/units
          let lastMatch = null;
          try {
            if (imports && imports.length > 0) {
              // Filter out current import and temp imports to find actual last prices
              const currentImportId = selectedImport?.id;
              const filteredImports = imports.filter(imp => {
                // Exclude current import being edited
                if (currentImportId && imp.id === currentImportId) return false;
                // Exclude temp imports (not yet saved)
                if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                return true;
              });
              
              // Improved date parsing with ID fallback for accurate newest-first sorting
              const withDates = filteredImports.map(imp => {
                let parsedDate = new Date(0);
                
                if (imp.date) {
                  try {
                    const d = new Date(imp.date);
                    if (!isNaN(d.getTime())) parsedDate = d;
                  } catch (e) {}
                }
                
                if (parsedDate.getTime() === 0 && imp.createdDate) {
                  try {
                    if (imp.createdDate.includes('/')) {
                      const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                      if (djs.isValid()) parsedDate = djs.toDate();
                    } else {
                      const d = new Date(imp.createdDate);
                      if (!isNaN(d.getTime())) parsedDate = d;
                    }
                  } catch (e) {}
                }
                
                const fallbackSort = parseInt(imp.id) || 0;
                
                return {
                  imp,
                  _date: parsedDate,
                  _fallbackSort: fallbackSort
                };
              });
              
              // Sort by ID desc (most reliable - auto increment means higher ID = newer)
              withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
              for (const w of withDates) {
                const itemsList = w.imp.items || w.imp.Items || [];
                const match = itemsList.find(it => (it.productCode && it.productCode === selectedProduct.code) || (it.barcode && it.barcode === selectedProduct.barcode) || (it.productName && it.productName === selectedProduct.name));
                if (match) { lastMatch = match; break; }
              }
            }
          } catch (e) {
            // ignore
          }
          // Add new item to the current import with complete product information
          const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                             (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));
          
          // Always prioritize base unit first, then fallback to last match
          const baseUnit = selectedProduct.baseUnit || selectedProduct.defaultUnit || selectedProduct.unit || '';
          const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
          
          const productData = getProductDataByUnit(selectedProduct, defaultUnit);
          
          // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất (conversion = 1)
          let convertedUnitPrice = 0;
          let convertedTransportCost = 0;
          
          // Kiểm tra loại nhập có phải "Nhập mua" không
          const importType = formData.importType || selectedImport?.importType || '';
          const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
          
          if (lastMatch) {
            const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
            const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
            const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
            
            // Quy đổi về đơn vị nhỏ nhất: giá_mới = giá_cũ / hệ_số_cũ × hệ_số_mới
            // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
            if (isNhapMua && !isKMImport) {
              convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
            }
            // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
            convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
          }
          
          const newItem = {
            id: Date.now() + Math.random(),
            barcode: selectedProduct.barcode || '',
            productCode: selectedProduct.code || '',
            productName: selectedProduct.name || '',
            description: selectedProduct.description || '',
            conversion: productData.conversion,
            unit: defaultUnit,
            quantity: 1,
            // Sử dụng giá đã quy đổi về đơn vị nhỏ nhất
            unitPrice: convertedUnitPrice,
            transportCost: convertedTransportCost,
            noteDate: (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null,
            total: convertedUnitPrice,
            totalTransport: convertedTransportCost,
            weight: productData.weight * 1, // số kg = weight_theo_đơn_vị × số_lượng (1)
            volume: productData.volume * 1, // số khối = volume_theo_đơn_vị × số_lượng (1)
            warehouse: getDefaultWarehouseName(),
          };

          // Prepare an empty row so user can continue entering next item immediately
          // Blank item: dòng trống để nhập sản phẩm tiếp theo, không cần copy giá
          const blankItem = {
            id: Date.now() + Math.random() + 1,
            barcode: '',
            productCode: '',
            productName: '',
            description: '',
            conversion: 1,
            unit: '',
            quantity: 1,
            unitPrice: 0,
            transportCost: 0,
            noteDate: null,
            total: '',
            totalTransport: '',
            weight: '',
            volume: '',
            warehouse: getDefaultWarehouseName(),
          };

          // Append product row + blank row, then move pagination to show the new rows
          const next = [...currentRightItems, newItem, blankItem];
          setItems(next);
          if (selectedImport) setSelectedImport(prev => ({ ...prev, items: next }));
          // Move to last page so the new blank row is visible
          setTimeout(() => {
            try {
              const lastPage = Math.max(1, Math.ceil(next.length / rightItemsPerPage));
              setRightCurrentPage(lastPage);
              // scroll the table container to end so new row is visible
              setTimeout(() => {
                try {
                  if (itemsTableRef && itemsTableRef.current) {
                    itemsTableRef.current.scrollLeft = itemsTableRef.current.scrollWidth;
                    itemsTableRef.current.scrollTop = itemsTableRef.current.scrollHeight;
                  }
                } catch (e) {}
              }, 120);
              // focus the barcode header select so user can pick next product
              setTimeout(() => {
                try {
                  const s = productSelectRefs.current && productSelectRefs.current['barcode'];
                  if (s && typeof s.focus === 'function') s.focus();
                } catch (e) {}
              }, 600);
            } catch (e) {}
          }, 80);
        }
        
        // Clear all product dropdowns after adding item
        setTimeout(() => {
          setSelectedProducts(prev => ({ 
            ...prev, 
            productCode: '',
            productName: '', 
            barcode: '' 
          }));
        }, 500);
      }
    }
  };

  // Render warehouse dropdown
  const renderWarehouseDropdownTH = (colKey, label) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Select 
            value={selectedProducts[colKey] || null}
            onChange={(value) => handleWarehouseSelect(colKey, value)}
            style={{ width: '100%' }}
            size="small"
            placeholder="-- Chọn kho --"
            allowClear
          >
            {warehouses.map(warehouse => (
              <Select.Option key={warehouse.id} value={warehouse.id}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{warehouse.name}</span>
                  <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                    {warehouse.code}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      </th>
    );
  };

  // Handle product selection in a header input row (rowIndex). If selecting in the last row, append a new blank header row.
  const handleHeaderRowProductSelect = (rowIndex, colKey, productId) => {
    if (!ensureImportTypeSelected()) return;
    const selectedProduct = products.find(p => p.id.toString() === productId);
    
    setHeaderRows(prev => {
      const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
      
      if (selectedProduct) {
        // Try to find most recent import item for this product to reuse last prices/units
        let lastMatch = null;
        try {
          if (imports && imports.length > 0) {
            // Filter out current import and temp imports to find actual last prices
            const currentImportId = selectedImport?.id;
            const filteredImports = imports.filter(imp => {
              // Exclude current import being edited
              if (currentImportId && imp.id === currentImportId) return false;
              // Exclude temp imports (not yet saved)
              if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
              return true;
            });
            
            // Improved date parsing with ID fallback for accurate newest-first sorting
            const withDates = filteredImports.map(imp => {
              let parsedDate = new Date(0);
              
              // Try imp.date first (ISO format)
              if (imp.date) {
                try {
                  const d = new Date(imp.date);
                  if (!isNaN(d.getTime())) parsedDate = d;
                } catch (e) {}
              }
              
              // Fallback to createdDate
              if (parsedDate.getTime() === 0 && imp.createdDate) {
                try {
                  if (imp.createdDate.includes('/')) {
                    const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                    if (djs.isValid()) parsedDate = djs.toDate();
                  } else {
                    const d = new Date(imp.createdDate);
                    if (!isNaN(d.getTime())) parsedDate = d;
                  }
                } catch (e) {}
              }
              
              const fallbackSort = parseInt(imp.id) || 0;
              
              return {
                imp,
                _date: parsedDate,
                _fallbackSort: fallbackSort
              };
            });
            
            // Sort by ID desc (most reliable - auto increment means higher ID = newer)
            withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
            for (const w of withDates) {
              const itemsList = w.imp.items || w.imp.Items || [];
              const match = itemsList.find(it => (it.productCode && it.productCode === selectedProduct.code) || (it.barcode && it.barcode === selectedProduct.barcode) || (it.productName && it.productName === selectedProduct.name));
              if (match) { lastMatch = match; break; }
            }
          }
        } catch (e) {
          // ignore
        }
        // Store actual field values instead of productId
        const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                           (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));
        
        copy[rowIndex].values['productCode'] = selectedProduct.code || '';
        copy[rowIndex].values['productName'] = selectedProduct.name || '';
        copy[rowIndex].values['barcode'] = selectedProduct.barcode || '';
        copy[rowIndex].values['description'] = selectedProduct.description || '';
        // Always prioritize base unit first, then fallback to last match
        const baseUnit = selectedProduct.baseUnit || selectedProduct.defaultUnit || selectedProduct.unit || '';
        copy[rowIndex].values['unit'] = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
        
        // Get product data for initial unit to set correct values
        const initialUnit = copy[rowIndex].values['unit'];
        const productData = getProductDataByUnit(selectedProduct, initialUnit);
        
        // Update with correct unit-specific data including conversion
        copy[rowIndex].values['conversion'] = productData.conversion.toString();
        
        // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
        let convertedUnitPrice = 0;
        let convertedTransportCost = 0;
        
        // Kiểm tra loại nhập có phải "Nhập mua" không
        const importType = formData.importType || selectedImport?.importType || '';
        const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
        
        if (lastMatch) {
          const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
          const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
          const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
          
          // Quy đổi: giá_mới = giá_cũ / hệ_số_cũ × hệ_số_mới
          // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
          if (isNhapMua && !isKMImport) {
            convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
          }
          // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
          convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
        }
        
        copy[rowIndex].values['unitPrice'] = convertedUnitPrice;
        copy[rowIndex].values['transportCost'] = convertedTransportCost;
        copy[rowIndex].values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || copy[rowIndex].values.noteDate || null;
        
        // Auto-calculate initial totals
        const quantity = parseFloat(copy[rowIndex].values.quantity) || 1;
        
        copy[rowIndex].values.total = (quantity * convertedUnitPrice).toString();
        copy[rowIndex].values.totalTransport = (quantity * convertedTransportCost).toString();
        // calculate derived fields based on selected product
        try {
          const prodId = copy[rowIndex].values.productName_id || copy[rowIndex].values.productCode_id || copy[rowIndex].values.barcode_id || null;
          let prod = null;
          if (prodId && products && products.length > 0) prod = products.find(p => String(p.id) === String(prodId));
          if (!prod) {
            const code = copy[rowIndex].values.productCode || copy[rowIndex].values.barcode || copy[rowIndex].values.productName || '';
            if (code) prod = products.find(p => p.code === code || p.barcode === code || p.name === code);
          }
          if (prod) {
            const selectedUnit = copy[rowIndex].values.unit || '';
            const productData = getProductDataByUnit(prod, selectedUnit);
            
            // Use weight/volume based on selected unit
            if (productData.weight !== undefined) copy[rowIndex].values.weight = (productData.weight * quantity) + '';
            if (productData.volume !== undefined) copy[rowIndex].values.volume = (productData.volume * quantity) + '';
          }
        } catch (e) {}
        
        // Also store the productId for ALL product-related columns to ensure calculation works
        copy[rowIndex].values['productCode_id'] = productId;
        copy[rowIndex].values['productName_id'] = productId;
        copy[rowIndex].values['barcode_id'] = productId;
      } else {
        copy[rowIndex].values[colKey] = productId || '';
      }
      
      // if selecting in last row and a productId was chosen, append blank row
      if (productId && rowIndex === copy.length - 1) {
        copy.push({ id: Date.now() + Math.random(), values: { warehouse: getDefaultWarehouseName() } });
      }
      return copy;
    });
  };

  const handleHeaderRowChange = React.useCallback((rowIndex, colKey, value) => {
    setHeaderRows(prev => {
      const copy = [...prev];
      const targetRow = { ...copy[rowIndex], values: { ...copy[rowIndex].values } };
      targetRow.values[colKey] = value;
      copy[rowIndex] = targetRow;
      
      // Auto-calculate when price/quantity related fields change
      const needsRecalc = ['quantity', 'unitPrice', 'transportCost'].includes(colKey);
      const needsWeightRecalc = ['quantity', 'unit'].includes(colKey); // Add 'unit' to trigger recalc
      
      if (needsRecalc) {
        const row = targetRow.values;
        const quantity = parseFloat(row.quantity) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const transportCost = parseFloat(row.transportCost) || 0;
        
        // Calculate totals only when needed
        targetRow.values.total = (quantity * unitPrice).toString();
        targetRow.values.totalTransport = (quantity * transportCost).toString();
      }
      
      // Auto-calculate weight and volume: số kg/khối = weight/volume_theo_đơn_vị × số_lượng
      if (needsWeightRecalc) {
        try {
          const row = targetRow.values;
          const selectedUnit = colKey === 'unit' ? value : (row.unit || '');
          
          // Try to get product info to calculate weight and volume
          const prodId = row.productName_id || row.productCode_id || row.barcode_id || null;
          let prod = null;
          if (prodId && products && products.length > 0) {
            prod = products.find(p => String(p.id) === String(prodId));
          }
          // fallback: try to match by productCode/barcode/productName text
          if (!prod && products && products.length > 0) {
            const code = row.productCode || row.barcode || row.productName || '';
            if (code) {
              prod = products.find(p => p.code === code || p.barcode === code || p.name === code);
            }
          }
          
          if (prod) {
            // Get product data based on selected unit (ĐVT gốc, ĐVT 1, ĐVT 2...)
            const productData = getProductDataByUnit(prod, selectedUnit);
            
            // Calculate weight and volume with quantity: số kg = weight_theo_đơn_vị × số_lượng
            let quantity = parseFloat(colKey === 'quantity' ? value : targetRow.values.quantity) || 0;
            
            // When changing unit, if quantity is 0, set default quantity to 1
            if (colKey === 'unit' && quantity === 0) {
              quantity = 1;
              targetRow.values.quantity = '1';
            }
            
            if (productData.weight !== undefined) {
              const calculatedWeight = productData.weight * quantity;
              targetRow.values.weight = calculatedWeight.toString();
            }
            if (productData.volume !== undefined) {
              const calculatedVolume = productData.volume * quantity;
              targetRow.values.volume = calculatedVolume.toString();
            }
            
            // Auto-update conversion when unit changes
            if (colKey === 'unit' && productData.conversion !== undefined) {
              const currentConversion = parseFloat(targetRow.values.conversion) || 1;
              const newConversion = productData.conversion;
              
              targetRow.values.conversion = newConversion.toString();
              
              // Đơn giản: Phiếu đã lưu = có số phiếu hợp lệ (BKT-...)
              const currentImportNumber = formData?.importNumber || '';
              const isSavedImport = currentImportNumber.startsWith('BKT-') && !currentImportNumber.includes('temp_');
              
              const currentPrice = parseFloat(targetRow.values.unitPrice) || 0;
              const currentTransport = parseFloat(targetRow.values.transportCost) || 0;
              
              if (isSavedImport) {
                // Phiếu đã lưu: áp dụng công thức quy đổi
                if (currentConversion > 0 && newConversion > 0) {
                  const newPrice = (currentPrice / currentConversion) * newConversion;
                  const newTransport = (currentTransport / currentConversion) * newConversion;
                  
                  targetRow.values.unitPrice = newPrice.toString();
                  targetRow.values.transportCost = newTransport.toString();
                  targetRow.values.total = (quantity * newPrice).toString();
                  targetRow.values.totalTransport = (quantity * newTransport).toString();
                }
              } else {
                // Phiếu chưa lưu: reset về 0
                targetRow.values.unitPrice = '0';
                targetRow.values.transportCost = '0';
                targetRow.values.total = '0';
                targetRow.values.totalTransport = '0';
              }
            }
          }
        } catch (e) {
          // Ignore calculation errors
        }
      }
      
      return copy;
    });
  }, [products]); // Thêm products vào dependencies để đảm bảo logic tính toán được cập nhật

  // Handle warehouse selection
  const handleWarehouseSelect = (colKey, warehouseId) => {
    setSelectedProducts(prev => ({ ...prev, [colKey]: warehouseId }));
    
    if (warehouseId && selectedImport) {
      const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
      if (selectedWarehouse) {
        // Update the last item or create new item with warehouse
        const newItem = {
          id: Date.now() + Math.random(),
          barcode: '',
          productCode: '',
          productName: '',
          description: '',
          conversion: 1,
          quantity: 1,
          unitPrice: 0,
          transportCost: 0,
          noteDate: null,
          total: 0,
          totalTransport: 0,
          weight: 0,
          volume: 0,
          warehouse: String(selectedWarehouse.id),
        };
        
        setItems(prevItems => [...prevItems, newItem]);
        
        // Clear warehouse dropdown after selection
        setTimeout(() => {
          setSelectedProducts(prev => ({ ...prev, [colKey]: null }));
        }, 500);
      }
    }
  };

  // Reset header inputs (clear dropdowns/filters in header)
  const resetHeaderInputs = () => {
    setSelectedProducts({});
    setSelectedDates({});
    setRightFilters({});
    setRightFilterPopup({ column: null, term: '' });

    setHeaderFilter(null);
  };

  // Render date picker for date fields
  const renderDatePickerTH = (colKey, label) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <DatePicker 
            value={selectedDates[colKey] ? dayjs(selectedDates[colKey]) : null}
            onChange={(date) => handleDateSelect(colKey, date)}
            style={{ width: '100%', fontSize: '12px' }}
            format="DD/MM/YYYY"
            placeholder="DD/MM/YYYY"
            allowClear={false}
            showToday={false}
            size="small"
            className="custom-date-picker"
            classNames={{ popup: { root: 'custom-date-picker-dropdown' } }}
            renderExtraFooter={() => (
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 12px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <span 
                  onClick={() => {
                    setSelectedDates(prev => ({ ...prev, [colKey]: null }));
                  }} 
                  style={{
                    color: '#1677ff', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                >
                  Clear
                </span>
                <span 
                  onClick={() => {
                    const today = dayjs();
                    setSelectedDates(prev => ({ ...prev, [colKey]: today.format('YYYY-MM-DD') }));
                    handleDateSelect(colKey, today);
                  }} 
                  style={{
                    color: '#1677ff', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                >
                  Today
                </span>
              </div>
            )}
          />
        </div>
      </th>
    );
  };

  // Handle date selection
  const handleDateSelect = (colKey, date) => {
    setSelectedDates(prev => ({ 
      ...prev, 
      [colKey]: date ? date.format('YYYY-MM-DD') : null 
    }));
    
    if (date && selectedImport) {
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: '',
        conversion: 1,
        quantity: 1,
        unitPrice: 0,
        transportCost: 0,
        noteDate: date.format('YYYY-MM-DD'),
        total: 0,
        totalTransport: 0,
        weight: 0,
        volume: 0,
        warehouse: getDefaultWarehouseName(),
      };
      
      // Add new item to the current import
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Render numeric input for editable fields
  const renderNumericInputTH = (colKey, label, placeholder) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Input
            placeholder={placeholder}
            size="small"
            style={{ width: '100%' }}
            type={['quantity', 'weight', 'volume', 'conversion'].includes(colKey) ? 'number' : 'text'}
            onPressEnter={(e) => handleDirectInput(colKey, e.target.value)}
          />
        </div>
      </th>
    );
  };

  // Render text input for text fields  
  const renderTextInputTH = (colKey, label, placeholder) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Input
            placeholder={placeholder}
            size="small"
            style={{ width: '100%' }}
            onPressEnter={(e) => handleTextInput(colKey, e.target.value)}
          />
        </div>
      </th>
    );
  };

  // Handle direct input for numeric fields
  const handleDirectInput = (colKey, value) => {
    if (value && selectedImport) {
      const numValue = parseFloat(value) || 0;
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: '',
        conversion: colKey === 'conversion' ? numValue : 1,
        quantity: colKey === 'quantity' ? numValue : 1,
        unitPrice: colKey === 'unitPrice' ? numValue : 0,
        transportCost: colKey === 'transportCost' ? numValue : 0,
        noteDate: null,
        total: colKey === 'total' ? numValue : 0,
        totalTransport: colKey === 'totalTransport' ? numValue : 0,
        weight: colKey === 'weight' ? numValue : 0,
        volume: colKey === 'volume' ? numValue : 0,
        warehouse: getDefaultWarehouseName(),
      };
      
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Handle text input for text fields
  const handleTextInput = (colKey, value) => {
    if (value && selectedImport) {
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: colKey === 'description' ? value : '',
        conversion: 1,
        quantity: 1,
        unitPrice: 0,
        transportCost: 0,
        noteDate: null,
        total: 0,
        totalTransport: 0,
        weight: 0,
        volume: 0,
        warehouse: getDefaultWarehouseName(),
      };
      
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Load imports, products and warehouses from backend on mount
  React.useEffect(() => {
    loadImports();
    loadProducts();
    loadWarehouses();
    loadTransactionContents();
    loadEmployees();
  }, []);

  React.useEffect(() => {
    if (imports.length > 0 && !selectedImport) {
      if (suppressAutoSelectRef.current) {
        // skip this one-time auto-select, reset the flag for future updates
        suppressAutoSelectRef.current = false;
      } else {
        setSelectedImport(imports[0]);
      }
    }
  }, [imports, selectedImport]);

  // Cập nhật số phiếu sau khi imports được load (chỉ khi đang tạo mới)
  React.useEffect(() => {
    if (imports && imports.length > 0 && !selectedImport && formData.importNumber.includes('BKT-')) {
      const newImportNumber = generateImportNumber();
      setFormData(prev => ({
        ...prev,
        importNumber: newImportNumber
      }));
    }
  }, [imports]);

  // reset right table paging when selected import changes
  React.useEffect(() => {
    setRightCurrentPage(1);
  }, [selectedImport]);

  // Right-side columns & filters (for items table header filters)
  const RIGHT_COLS_KEY = 'import_goods_right_cols_v1';
  const defaultRightCols = ['barcode','productCode','productName','unit','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','description','conversion','actions'];
  const [rightVisibleCols, setRightVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      const storedVisible = Array.isArray(saved) ? saved : (saved && Array.isArray(saved.visibleCols) ? saved.visibleCols : null);
      if (storedVisible) {
        const merged = [];
        defaultRightCols.forEach(dc => { if (storedVisible.includes(dc)) merged.push(dc); else merged.push(dc); });
        storedVisible.forEach(s => { if (!merged.includes(s)) merged.push(s); });
        return merged;
      }
    } catch {}
    return defaultRightCols;
  });
  const [rightColOrder, setRightColOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      if (saved && Array.isArray(saved.order)) {
        const order = [...saved.order];
        defaultRightCols.forEach(dc => { if (!order.includes(dc)) order.push(dc); });
        return order;
      }
      if (Array.isArray(saved)) {
        const order = [...saved];
        defaultRightCols.forEach(dc => { if (!order.includes(dc)) order.push(dc); });
        return order;
      }
    } catch {}
    return defaultRightCols;
  });

  const [rightFilters, setRightFilters] = useState({});
  const [rightFilterPopup, setRightFilterPopup] = useState({ column: null, term: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [rightCurrentPage, setRightCurrentPage] = useState(1);
  const [rightItemsPerPage, setRightItemsPerPage] = useState(10);

  // Column resize state for right table
  const [rightColWidths, setRightColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('import_right_col_widths');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    const w = {};
    defaultRightCols.forEach(c => {
      if (c === 'description') w[c] = 300;
      else if (c === 'productName') w[c] = 200;
      else if (c === 'barcode' || c === 'productCode') w[c] = 180;
      else if (c === 'unit') w[c] = 120;
      else if (c === 'actions') w[c] = 80;
      else w[c] = 100;
    });
    return w;
  });
  const resizingRef = useRef({ col: null, startX: 0, startWidth: 0 });

  // Save column widths to localStorage when they change (debounced)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('import_right_col_widths', JSON.stringify(rightColWidths));
      } catch (e) {}
    }, 300); // Save after 300ms of no changes
    return () => clearTimeout(timeoutId);
  }, [rightColWidths]);

  // Use event delegation for resize - re-attach whenever items/selectedImport change
  React.useEffect(() => {
    // Attach event delegation to the last .items-table (right panel)
    const allTables = document.querySelectorAll('table');
    const itemsTables = document.querySelectorAll('table.items-table');

    const handleTableMouseDown = (e) => {
      const th = e.target.closest('th[data-resizable]');
      if (th) {
        const colKey = th.getAttribute('data-col-key');
        if (colKey) {
          handleThMouseDown(e, colKey);
        }
      }
    };

    // IMPORTANT: Attach to the LAST items-table (the right panel table)
    const targetTable = itemsTables[itemsTables.length - 1];
    if (targetTable) {
      targetTable.addEventListener('mousedown', handleTableMouseDown, true);

      return () => {
        targetTable.removeEventListener('mousedown', handleTableMouseDown, true);
      };
    }
  }, [items, selectedImport]); // Re-run when items or selectedImport change

  // Product selection modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalSearch, setProductModalSearch] = useState('');
  const [selectedModalProducts, setSelectedModalProducts] = useState([]);
  const [productModalColumn, setProductModalColumn] = useState(null);
  const [productModalRowIndex, setProductModalRowIndex] = useState(null);
  const [productModalScope, setProductModalScope] = useState('all'); // 'all' or 'currentImport'
  const [highlightRowId, setHighlightRowId] = useState(null);

  // Pagination state for product modal
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  // Memoized product filtering for product modal to avoid repeated expensive filters
  const memoizedFilteredProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!productModalSearch) return products;
    const terms = removeVietnameseTones(productModalSearch.toLowerCase()).split(/\s+/).filter(t => t);
    return products.filter(p => {
      const searchableText = [
        removeVietnameseTones((p.name || '').toLowerCase()),
        removeVietnameseTones((p.code || '').toLowerCase()),
        removeVietnameseTones((p.barcode || '').toLowerCase()),
        (p.importPrice || p.price || p.priceRetail || 0).toString(),
        (p.defaultUnit || p.DefaultUnit || p.unit || p.baseUnit || '').toLowerCase()
      ].join(' ');
      return terms.every(term => searchableText.includes(term));
    });
  }, [products, productModalSearch]);

  // Memoized header calculations to avoid repeated expensive filtering during renders
  const memoizedHeaderTotals = React.useMemo(() => {
    const validRows = headerRows.filter(row => row && row.values && (row.values.productName || row.values.productCode || row.values.barcode));
    const totalAmount = validRows.reduce((sum, row) => sum + (parseFloat(row.values.total) || 0), 0);
    const totalWeight = validRows.reduce((sum, row) => sum + (parseFloat(row.values.weight) || 0), 0);
    const totalVolume = validRows.reduce((sum, row) => sum + (parseFloat(row.values.volume) || 0), 0);
    
    return { 
      validRows, 
      totalAmount, 
      totalWeight: totalWeight, 
      totalVolume: totalVolume
    };
  }, [headerRows]);

  React.useEffect(() => {
    try { localStorage.setItem(RIGHT_COLS_KEY, JSON.stringify({ visibleCols: rightVisibleCols, order: rightColOrder })); } catch {}
  }, [rightVisibleCols, rightColOrder]);

  // Optimized debounced sync: update totals with minimal re-renders
  React.useEffect(() => {
    if (!selectedImport) return;
    let active = true;
    const t = setTimeout(() => {
      if (!active) return;

      let total = 0;
      if (isEditMode && headerRows.length > 0) {
        // Use memoized total from memoizedHeaderTotals
        total = memoizedHeaderTotals.totalAmount;
      } else {
        total = Number(selectedImport.totalAmount || 0) || 
                (selectedImport.items || []).reduce((s, it) => s + (Number(it.total) || 0), 0);
      }

      // Only update when changed to avoid extra renders
      setSelectedImport(prev => {
        if (!prev) return prev;
        const existing = Number(prev.totalAmount) || 0;
        if (existing === total) return prev;
        return { ...prev, totalAmount: total };
      });

      setImports(prev => {
        if (!prev || prev.length === 0) return prev;
        let changed = false;
        const next = prev.map(it => {
          if (!it) return it;
          if (it.id === selectedImport.id) {
            const existing = Number(it.totalAmount) || 0;
            if (existing === total) return it;
            changed = true;
            return { ...it, totalAmount: total };
          }
          return it;
        });
        return changed ? next : prev;
      });
    }, 100); // Reduced timeout for better responsiveness

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [selectedImport?.id, memoizedHeaderTotals.totalAmount, isEditMode]); // More specific dependencies

  const rightPageSizeOptions = [10,20,50,100,200,500,1000,5000];
  // Prefer local `items` state when present (we update it when adding rows), otherwise use selectedImport items
  const itemsData = (items && items.length > 0) ? items : (selectedImport?.items || []);

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

  // Calculate total based on edit mode to avoid double-counting
  const headerRowCount = headerRows.filter(row => row && row.values && (row.values.productName || row.values.productCode || row.values.barcode)).length;
  const rightTotal = isEditMode ? headerRowCount : filteredRightItems.length;
  const rightTotalPages = Math.max(1, Math.ceil(rightTotal / Math.max(1, rightItemsPerPage)));
  const rightStart = rightTotal === 0 ? 0 : (rightCurrentPage - 1) * rightItemsPerPage + 1;
  const rightEnd = Math.min(rightTotal, rightCurrentPage * rightItemsPerPage);
  const paginatedItems = filteredRightItems.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage);
  
  // Apply headerFilter (when user searched within current import) and paginate header rows for edit mode
  const headerRowsForDisplay = (() => {
    if (!isEditMode) return headerRows;
    if (!headerFilter) return headerRows;
    try {
      // headerFilter may contain strings or arrays for productCode/barcode/productName
      const arr = [];
      ['productCode','barcode','productName'].forEach(k => {
        const v = headerFilter[k];
        if (!v) return;
        if (Array.isArray(v)) arr.push(...v.map(x => String(x)));
        else arr.push(String(v));
      });
      const keys = new Set(arr.map(x => x.trim()).filter(Boolean));
      if (keys.size === 0) return headerRows;
      return headerRows.filter(r => {
        if (!r || !r.values) return false;
        const v = r.values;
        const fields = [String(v.productCode||''), String(v.barcode||''), String(v.productName||'')];
        for (const f of fields) {
          if (keys.has(String(f))) return true;
        }
        return false;
      });
    } catch (e) {
      return headerRows;
    }
  })();

  const paginatedHeaderRows = isEditMode 
    ? headerRowsForDisplay.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage)
    : headerRows;

  React.useEffect(() => {
    setRightCurrentPage(p => Math.min(p, rightTotalPages));
  }, [rightItemsPerPage, selectedImport, rightTotalPages]);

  // Recalculate weight/volume for items when products change (to fix any rounding issues)
  React.useEffect(() => {
    if (!products || products.length === 0) return;
    if (!items || items.length === 0) return;
    
    const updatedItems = items.map((item, idx) => {
      try {
        const quantity = parseFloat(item.quantity) || 0;
        if (quantity <= 0) return item;
        
        // Find product by multiple possible identifiers
        let prod = products.find(p => p.code === item.productCode || p.barcode === item.barcode || p.name === item.productName);
        
        if (prod) {
          const updatedItem = { ...item };
          const selectedUnit = item.unit || '';
          
          // Get product data based on unit (support multiple units: ĐVT gốc, ĐVT 1, ĐVT 2...)
          const productData = getProductDataByUnit(prod, selectedUnit);
          
          // Recalculate weight: số kg = số kg sản phẩm × số lượng (no rounding)
          if (productData.weight !== undefined) {
            const calculatedWeight = productData.weight * quantity;
            updatedItem.weight = calculatedWeight;
          }
          
          // Recalculate volume: số khối = số khối sản phẩm × số lượng (no rounding)  
          if (productData.volume !== undefined) {
            const calculatedVolume = productData.volume * quantity;
            updatedItem.volume = calculatedVolume;
          }
          
          // Update conversion based on unit
          if (productData.conversion !== undefined) {
            updatedItem.conversion = productData.conversion;
          }
          
          return updatedItem;
        }
      } catch (e) {
        // ignore calculation errors
      }
      return item;
    });
    
    // Only update if there are actual changes
    const hasChanges = updatedItems.some((item, idx) => 
      item.weight !== items[idx].weight || item.volume !== items[idx].volume
    );
    
    if (hasChanges) {
      setItems(updatedItems);
      if (selectedImport) {
        setSelectedImport(prev => ({ ...prev, items: updatedItems }));
      }
    }
  }, [products, items?.length]); // Only depend on products and items length, not items content to avoid infinite loop

  const handleSelectImport = async (importItem) => {
    if (!importItem) return;

    // If this is a temporary client-side import (created via "Tạo mới"),
    // select it locally and open editor without server call.
    if (importItem.isTemp) {
      setSelectedImport(importItem);
      if (importItem.items && importItem.items.length > 0) {
        const productRows = importItem.items.map((item, index) => ({
          id: Date.now() + index,
          values: { ...item, warehouse: item.warehouse ? String(item.warehouse) : '' }
        }));
        productRows.push({ id: Date.now() + importItem.items.length, values: { warehouse: getDefaultWarehouseName() } });
        setHeaderRows(productRows);
      } else {
        setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
      }
      setShowRightContent(true);
      setIsEditMode(true);
      setIsEditing(true);
      return;
    }

    // For regular imports, open the full editor flow (same as clicking "Sửa")
    try {
      await editImport(importItem);
    } catch (err) {
      // fallback to minimal selection if edit flow fails
      setSelectedImport(importItem);
      setShowRightContent(true);
      setIsEditMode(false);
      setIsEditing(false);
      setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
    }
  };

  const handleDelete = async (id, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bảng kê tổng này?')) return;
    try {
      // If temp import, just remove locally
      if (String(id).startsWith('temp_')) {
        setImports(prev => prev.filter(i => i.id !== id));
        if (selectedImport && selectedImport.id === id) { setSelectedImport(null); setShowRightContent(false); }
        return;
      }
      await api.delete(API_ENDPOINTS.bangKeTongs, id);
      setImports(prev => prev.filter(i => i.id !== id));
      if (selectedImport && selectedImport.id === id) { setSelectedImport(null); setShowRightContent(false); }
    } catch (err) {
      alert('Xóa bảng kê tổng thất bại');
    }
  };

  // Load imports list from backend
  const loadImports = async (autoSelectFirst = true) => {
    try {
      const data = await api.get(API_ENDPOINTS.bangKeTongs);
      const mapped = (data || []).map(b => ({
        id: b.id,
        importNumber: b.importNumber,
        createdDate: b.createdDate ? dayjs(b.createdDate).format('DD/MM/YYYY') : '',
        date: b.createdDate,
        employee: b.employee,
        importType: b.importType,
        dsHoaDon: b.dsHoaDon,
        note: b.note,
        totalAmount: (b.hoaDons || []).reduce((s, h) => s + (Number(h.tongTienSauGiam ?? h.tongTien ?? 0) || 0), 0),
        bangKeTongItems: (b.items || []).map(i => ({
          maPhieu: i.maPhieu,
          maVach: i.maVach,
          maHang: i.maHang,
          tenHang: i.tenHang,
          donViTinh1: i.donViTinh1,
          soLuongDVT1: i.soLuongDVT1,
          donViGoc: i.donViGoc,
          soLuongDVTGoc: i.soLuongDVTGoc,
          moTa: i.moTa,
          slBanTheoDVTGoc: i.slBanTheoDVTGoc,
          quyDoi: i.quyDoi,
          loaiHang: i.loaiHang,
        })),
        dsHoaDonItems: (b.hoaDons || []).map(h => ({
          orderId: h.orderId || null,
          maPhieu: h.maPhieu,
          tenKhachHang: h.tenKhachHang,
          tongTien: h.tongTien,
          tongTienSauGiam: h.tongTienSauGiam,
          nvSale: h.nvSale,
          loaiHang: h.loaiHang,
          customerGroup: h.customerGroup || h.customerGroupId || h.customerGroupCode || '',
          customerGroupName: h.customerGroupName || h.customerGroupTitle || h.customerGroup || ''
        })),
      }));
      setImports(mapped);
      if (autoSelectFirst && mapped.length > 0 && !suppressAutoSelectRef.current) {
        handleSelectImport(mapped[0]);
      }
    } catch (e) {
      console.warn('loadImports error', e);
      setImports([]);
    }
  };

  // Load products list from backend
  const loadProducts = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.products);
      setProducts(data || []);
    } catch (e) { console.warn('loadProducts error', e); setProducts([]); }
  };

  // Load warehouses list from backend
  const loadWarehouses = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.warehouses);
      setWarehouses(data || []);
    } catch (e) { console.warn('loadWarehouses error', e); setWarehouses([]); }
  };

  // Load transaction contents list from backend
  const loadTransactionContents = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.transactionContents);
      setTransactionContents(data || []);
    } catch (e) { console.warn('loadTransactionContents error', e); setTransactionContents([]); }
  };

  // Load employees/users list from backend
  const loadEmployees = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.users);
      setEmployeesList((data || []).map(u => ({ id: u.id, name: u.username || u.name || u.email || '' })));
    } catch (e) { console.warn('loadEmployees error', e); setEmployeesList([]); }
  };

  // Export Excel template for imports
  const exportImportTemplate = async () => {
    alert('Xuất mẫu/template từ server đã bị vô hiệu hóa cho trang In bảng kê tổng.');
  };

  // Export selected imports (or filtered visible ones) as CSV
  const exportSelectedImportsList = async () => {
    alert('Xuất danh sách tới server đã bị vô hiệu hóa cho trang In bảng kê tổng.');
  };

  // Handle uploaded CSV/Excel template and import
  const handleTemplateUpload = async (e, forceOverwrite = false) => {
    // File import via backend is disabled for this page.
    if (e && e.target) e.target.value = null;
    alert('Tính năng import file đã bị vô hiệu hóa trên trang In bảng kê tổng.');
  };

  const loadImportDetails = async (id) => {
    try {
      const data = await api.get(`${API_ENDPOINTS.bangKeTongs}/${id}`);
      if (data) {
        const mapped = {
          id: data.id,
          importNumber: data.importNumber,
          createdDate: data.createdDate ? dayjs(data.createdDate).format('DD/MM/YYYY') : '',
          date: data.createdDate,
          employee: data.employee,
          importType: data.importType,
          dsHoaDon: data.dsHoaDon,
          note: data.note,
          totalAmount: data.totalAmount,
          bangKeTongItems: (data.items || []).map(i => ({
            maPhieu: i.maPhieu,
            maVach: i.maVach,
            maHang: i.maHang,
            tenHang: i.tenHang,
            donViTinh1: i.donViTinh1,
            soLuongDVT1: i.soLuongDVT1,
            donViGoc: i.donViGoc,
            soLuongDVTGoc: i.soLuongDVTGoc,
            moTa: i.moTa,
            slBanTheoDVTGoc: i.slBanTheoDVTGoc,
            quyDoi: i.quyDoi,
            loaiHang: i.loaiHang,
          })),
          dsHoaDonItems: (data.hoaDons || []).map(h => ({
            orderId: h.orderId || null,
            maPhieu: h.maPhieu,
            tenKhachHang: h.tenKhachHang,
            tongTien: h.tongTien,
            tongTienSauGiam: h.tongTienSauGiam,
            nvSale: h.nvSale,
            loaiHang: h.loaiHang,
            customerGroup: h.customerGroup || h.customerGroupId || h.customerGroupCode || '',
            customerGroupName: h.customerGroupName || h.customerGroupTitle || h.customerGroup || ''
          })),
        };
        setSelectedImport(mapped);
        setFormData({
          createdDate: data.createdDate ? dayjs(data.createdDate).format('YYYY-MM-DD') : '',
          employee: data.employee || '',
          importType: data.importType || '',
          importNumber: data.importNumber || '',
          dsHoaDon: data.dsHoaDon || '',
          note: data.note || '',
        });
        setShowRightContent(true);
        setIsEditMode(false);
        setIsEditing(false);
      }
    } catch (e) { console.warn('loadImportDetails error', e); }
  };

  // Wrapper to trigger edit (explicitly load details and show right content)
  const editImport = async (importItem) => {
    if (!importItem) return;
    try {
      if (importItem.id && !String(importItem.id).startsWith('temp_')) {
        await loadImportDetails(importItem.id);
      } else {
        setSelectedImport(importItem);
        setShowRightContent(true);
      }
      setIsEditMode(true);
      setIsEditing(true);
    } catch (e) {
      console.warn('editImport error', e);
      setSelectedImport(importItem);
      setShowRightContent(true);
      setIsEditMode(false);
      setIsEditing(false);
    }
  };

  const createNewImport = async () => {
    try {
      resetFormForNewImport();
    } catch (e) { console.warn('createNewImport error', e); }
  };

  const saveImport = async () => {
    try {
      // Build items from "Bảng kê tổng" tab (headerRows or selectedImport.bangKeTongItems)
      const bktItems = (selectedImport?.bangKeTongItems || [])
        .filter(r => r.maPhieu || r.maHang || r.tenHang)
        .map(r => ({
          maPhieu: r.maPhieu || '',
          maVach: r.maVach || '',
          maHang: r.maHang || '',
          tenHang: r.tenHang || '',
          donViTinh1: r.donViTinh1 || '',
          soLuongDVT1: parseFloat(r.soLuongDVT1) || 0,
          donViGoc: r.donViGoc || '',
          soLuongDVTGoc: parseFloat(r.soLuongDVTGoc) || 0,
          moTa: r.moTa || '',
          slBanTheoDVTGoc: parseFloat(r.slBanTheoDVTGoc) || 0,
          quyDoi: parseFloat(r.quyDoi) || 1,
          loaiHang: r.loaiHang || '',
        }));

      // Build hoa dons from "DS hóa đơn" tab (dsHoaDons state or selectedImport)
      const hoaDonItems = (selectedImport?.dsHoaDonItems || []).map(h => ({
        orderId: h.orderId || null,
        maPhieu: h.maPhieu || '',
        tenKhachHang: h.tenKhachHang || '',
        tongTien: parseFloat(h.tongTien) || 0,
        tongTienSauGiam: parseFloat(h.tongTienSauGiam) || 0,
        nvSale: h.nvSale || '',
        loaiHang: h.loaiHang || '',
      }));

      const payload = {
        importNumber: formData.importNumber || generateImportNumber(),
        createdDate: formData.createdDate ? dayjs(formData.createdDate).toISOString() : new Date().toISOString(),
        employee: formData.employee || '',
        importType: formData.importType || '',
        dsHoaDon: formData.dsHoaDon || '',
        note: formData.note || '',
        totalAmount: hoaDonItems.reduce((s, h) => s + (Number(h.tongTienSauGiam || h.tongTien || 0) || 0), 0),
        items: bktItems,
        hoaDons: hoaDonItems,
      };

      const isNew = !selectedImport || !selectedImport.id || String(selectedImport.id).startsWith('temp_');

      if (isNew) {
        const created = await api.post(API_ENDPOINTS.bangKeTongs, payload);
        alert('Lưu bảng kê tổng thành công!');
        suppressAutoSelectRef.current = true;
        await loadImports(false);
        // Select the newly created record
        const found = imports.find(i => i.importNumber === payload.importNumber) || created;
        if (found) handleSelectImport(found);
        suppressAutoSelectRef.current = false;
      } else {
        payload.id = selectedImport.id;
        await api.put(API_ENDPOINTS.bangKeTongs, selectedImport.id, payload);
        alert('Cập nhật bảng kê tổng thành công!');
        await loadImports(false);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('saveImport error', err);
      alert('Lưu bảng kê tổng thất bại: ' + (err.message || err));
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

  const deleteItem = (idx) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hàng hóa này?')) return;
    const updatedItems = items.filter((_, index) => index !== idx);
    setItems(updatedItems);
    if (selectedImport) setSelectedImport(prev => ({ ...prev, items: updatedItems }));
    setIsEditing(true);
  };

  const filteredImports = imports.filter(importItem => {
    const normalizedSearch = removeVietnameseTones((searchTerm || '').toLowerCase());
    const normalizedNumber = removeVietnameseTones((importItem.importNumber || importItem.receiptNumber || '').toLowerCase());
    const normalizedEmployee = removeVietnameseTones(((importItem.employee || importItem.Employee) || '').toLowerCase());
    const normalizedNote = removeVietnameseTones(((importItem.note || importItem.notePN || '')).toLowerCase());

    // matches search text against number, employee or note
    const matchesSearch = normalizedNumber.includes(normalizedSearch)
      || normalizedEmployee.includes(normalizedSearch)
      || normalizedNote.includes(normalizedSearch);

    // filter by exact selection of import type / employee (from dropdowns)
    const matchesType = !importType || (importItem.importType || '') === importType;
    const matchesEmployee = !employee || (importItem.employee || '') === employee;

    // support searchCode (same as before) against number
    const normalizedCode = removeVietnameseTones((searchCode || '').toLowerCase());
    const matchesCode = !searchCode || normalizedNumber.includes(normalizedCode);

    // Lọc theo khoảng ngày nhập (so sánh yyyy-mm-dd)
    let matchesDate = true;
    if (dateFrom && dateTo) {
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

  // apply column filters for left table
  const filteredLeft = filteredImports.filter(record => {
    if (Object.keys(leftColumnFilters).length === 0) return true;
    return Object.entries(leftColumnFilters).every(([colId, query]) => {
      const val = String(renderLeftCell(record, colId) || '').toLowerCase();
      return val.includes(query.toLowerCase());
    });
  });

  // Left table pagination
  const paginatedLeft = (() => {
    const start = (leftPage - 1) * leftPageSize;
    return filteredLeft.slice(start, start + leftPageSize);
  })();
  const leftTotalPages = Math.ceil(filteredLeft.length / leftPageSize);

  // Sum of 'total' for all filtered left imports (uses same logic as renderLeftCell total)
  const leftTotalSum = (filteredLeft || []).reduce((acc, record) => {
    const totalFromHoaDons = (record.dsHoaDonItems || []).reduce((s, h) => s + (Number(h.tongTienSauGiam ?? h.tongTien ?? 0) || 0), 0);
    const total = (totalFromHoaDons && totalFromHoaDons > 0)
      ? totalFromHoaDons
      : ((record.totalAmount !== undefined && record.totalAmount !== null)
          ? Number(record.totalAmount)
          : (record.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0));
    return acc + (Number(total) || 0);
  }, 0);

  React.useEffect(() => {
    localStorage.setItem('import_left_page_size', String(leftPageSize));
    setLeftPage(1);
  }, [leftPageSize]);

  const handleExport = async () => {
    if (!selectedImport) {
      alert('Vui lòng chọn một bảng kê tổng để xuất');
      return;
    }
    try {
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: xuất hàng tổng hợp (from bangKeTongItems)
      const sheet1 = workbook.addWorksheet('xuất hàng tổng hợp');
      sheet1.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true };

      sheet1.columns = [
        { header: 'Mã phiếu', key: 'maPhieu', width: 20 },
        { header: 'Mã vạch', key: 'maVach', width: 18 },
        { header: 'Mã hàng', key: 'maHang', width: 18 },
        { header: 'Tên hàng', key: 'tenHang', width: 52 },
        { header: 'Đơn vị tính 1', key: 'donViTinh1', width: 16 },
        { header: 'Số lượng ĐVT 1', key: 'soLuongDVT1', width: 18 },
        { header: 'Đơn vị gốc', key: 'donViGoc', width: 14 },
        { header: 'Số lượng ĐVT gốc', key: 'soLuongDVTGoc', width: 20 },
        { header: 'Mô tả', key: 'moTa', width: 36 },
        { header: 'SL bán theo ĐVT Gốc', key: 'slBanTheoDVTGoc', width: 22 },
        { header: 'Quy đổi', key: 'quyDoi', width: 12 },
        { header: 'Loại hàng', key: 'loaiHang', width: 22 }
      ];

      // Sheet 2: thông tin (from dsHoaDonItems)
      const sheet2 = workbook.addWorksheet('thông tin');
      sheet2.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true };
      sheet2.columns = [
        { header: 'Số TT', key: 'stt', width: 8 },
        { header: 'Mã phiếu', key: 'maPhieu', width: 22 },
        { header: 'Tên khách hàng', key: 'tenKhachHang', width: 40 },
        { header: 'Tổng tiền', key: 'tongTien', width: 18 },
        { header: 'Tổng tiền sau giảm', key: 'tongTienSauGiam', width: 22 },
        { header: 'NV Sale', key: 'nvSale', width: 18 },
        { header: 'Loại hàng', key: 'loaiHang', width: 36 }
      ];

      // Fetch company info
      let compName = 'CÔNG TY';
      let compAddr = '';
      let compPhone = '';
      try {
        const compData = await api.get(API_ENDPOINTS.companyInfos);
        if (compData && compData.length > 0) {
          compName = compData[0].companyName || compData[0].name || 'CÔNG TY';
          compAddr = compData[0].address || '';
          compPhone = compData[0].phone || '';
        }
      } catch (e) {}

      const printedAt = formData.createdDate || selectedImport.createdDate || dayjs().format('DD/MM/YYYY');
      const importNumber = formData.importNumber || selectedImport.importNumber || '';

      // Insert top info rows for sheet1 (xuất hàng tổng hợp)
      try {
        sheet1.insertRow(1, [compName]);
        sheet1.mergeCells(1, 1, 1, sheet1.columns.length);
        sheet1.getRow(1).font = { bold: true, size: 14 };
        sheet1.getRow(1).getCell(1).alignment = { horizontal: 'left' };

        sheet1.insertRow(2, [`Địa chỉ: ${compAddr}    Điện thoại: ${compPhone}`]);
        sheet1.mergeCells(2, 1, 2, sheet1.columns.length);
        sheet1.getRow(2).font = { italic: true, size: 10 };
        sheet1.getRow(2).getCell(1).alignment = { horizontal: 'left' };

        sheet1.insertRow(3, ['PHIẾU XUẤT HÀNG TỔNG HỢP']);
        sheet1.mergeCells(3, 1, 3, sheet1.columns.length);
        sheet1.getRow(3).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
        sheet1.getRow(3).getCell(1).alignment = { horizontal: 'center' };

        sheet1.insertRow(4, [`Số bảng kê: ${importNumber}`]);
        sheet1.mergeCells(4, 1, 4, sheet1.columns.length);
        sheet1.getRow(4).font = { size: 10 };
        sheet1.getRow(4).getCell(1).alignment = { horizontal: 'center' };

        sheet1.insertRow(5, [`Ngày lập: ${printedAt}`]);
        sheet1.mergeCells(5, 1, 5, sheet1.columns.length);
        sheet1.getRow(5).font = { size: 10 };
        sheet1.getRow(5).getCell(1).alignment = { horizontal: 'center' };
      } catch (e) {}

      // Insert top info rows for sheet2 (thông tin)
      try {
        sheet2.insertRow(1, [compName]);
        sheet2.mergeCells(1, 1, 1, sheet2.columns.length);
        sheet2.getRow(1).font = { bold: true, size: 14 };
        sheet2.getCell('A1').alignment = { horizontal: 'left' };

        sheet2.insertRow(2, [`Địa chỉ: ${compAddr}    Điện thoại: ${compPhone}`]);
        sheet2.mergeCells(2, 1, 2, sheet2.columns.length);
        sheet2.getRow(2).font = { italic: true, size: 10 };
        sheet2.getCell('A2').alignment = { horizontal: 'left' };

        sheet2.insertRow(3, ['PHIẾU XUẤT HÀNG TỔNG HỢP - THÔNG TIN']);
        sheet2.mergeCells(3, 1, 3, sheet2.columns.length);
        sheet2.getRow(3).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
        sheet2.getRow(3).getCell(1).alignment = { horizontal: 'center' };

        sheet2.insertRow(4, [`Số bảng kê: ${importNumber}`]);
        sheet2.mergeCells(4, 1, 4, sheet2.columns.length);
        sheet2.getRow(4).font = { size: 10 };
        sheet2.getRow(4).getCell(1).alignment = { horizontal: 'center' };

        sheet2.insertRow(5, [`Ngày lập: ${printedAt}`]);
        sheet2.mergeCells(5, 1, 5, sheet2.columns.length);
        sheet2.getRow(5).font = { size: 10 };
        sheet2.getRow(5).getCell(1).alignment = { horizontal: 'center' };
      } catch (e) {}

      // Helper to format quantity: integer without decimal, decimal with decimal point
      const formatQtyExcel = (v) => {
        const n = Number(v) || 0;
        if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n);
        return Math.round(n * 1000) / 1000;
      };

      // Build rows for sheet1 from bangKeTongItems
      const bktItems = selectedImport.bangKeTongItems || [];
      bktItems.forEach((item) => {
        sheet1.addRow({
          maPhieu: item.maPhieu || '',
          maVach: item.maVach || '',
          maHang: item.maHang || '',
          tenHang: item.tenHang || '',
          donViTinh1: item.donViTinh1 || '',
          soLuongDVT1: formatQtyExcel(item.soLuongDVT1),
          donViGoc: item.donViGoc || '',
          soLuongDVTGoc: formatQtyExcel(item.soLuongDVTGoc),
          moTa: item.moTa || '',
          slBanTheoDVTGoc: formatQtyExcel(item.slBanTheoDVTGoc),
          quyDoi: formatQtyExcel(item.quyDoi),
          loaiHang: item.loaiHang || ''
        });
      });

      // Build rows for sheet2 from dsHoaDonItems
      const hoaDonItems = selectedImport.dsHoaDonItems || [];
      // Ensure customerGroupsMap is populated (try to fetch if empty)
      if (!customerGroupsMap || Object.keys(customerGroupsMap).length === 0) {
        try {
          const groupsResp = await api.get(API_ENDPOINTS.customerGroups);
          const map = {};
          if (groupsResp && Array.isArray(groupsResp)) {
            groupsResp.forEach(g => {
              if (g.id) map[g.id] = g.name || g.title || g.code || '';
              if (g.code) map[g.code] = g.name || g.title || g.code || '';
            });
          }
          setCustomerGroupsMap(prev => ({ ...(prev || {}), ...map }));
          Object.assign(customerGroupsMap, map);
        } catch (e) {
          // ignore fetch error and proceed
        }
      }

      // Enrich hoaDonItems by looking up customer → customerGroup from Customers API
      try {
        // Use already-loaded map, or fetch fresh if empty
        let custNameToGroup = customerNameToGroupMap;
        if (!custNameToGroup || Object.keys(custNameToGroup).length === 0) {
          const customersResp = await api.get(API_ENDPOINTS.customers);
          if (customersResp && Array.isArray(customersResp)) {
            custNameToGroup = {};
            customersResp.forEach(c => {
              const n = (c.name || '').toString().trim().toLowerCase();
              if (n && c.customerGroup) custNameToGroup[n] = c.customerGroup;
            });
          }
        }
        hoaDonItems.forEach(item => {
          if (!item.customerGroup || String(item.customerGroup).trim() === '') {
            const custName = (item.tenKhachHang || '').toString().trim().toLowerCase();
            if (custName && custNameToGroup[custName]) {
              item.customerGroup = custNameToGroup[custName];
            }
          }
        });
      } catch (e) {
        // ignore enrichment errors
      }

      // Group dsHoaDonItems by customer group and render with group header rows
      const groups = {};
      const groupOrder = [];
      hoaDonItems.forEach(item => {
        const groupCode = item.customerGroup || '';
        // Resolve friendly name: try customerGroupsMap (by id or code), then use raw value
        const name = customerGroupsMap[groupCode] || item.customerGroupName || groupCode || 'Khác';
        const key = groupCode || 'null';
        if (!groups[key]) { groups[key] = { name, items: [] }; groupOrder.push(key); }
        groups[key].items.push(item);
      });

      // Starting from row after top info (row 6 is header row produced by columns), write grouped rows
      groupOrder.forEach(gk => {
        const g = groups[gk];
        const lastCol = sheet2.columns.length;
        const headerRow = sheet2.addRow([`Nhóm khách hàng: ${g.name}`]);
        const rIndex = headerRow.number;
        sheet2.mergeCells(rIndex, 1, rIndex, lastCol);
        sheet2.getRow(rIndex).font = { italic: true, bold: true };
        g.items.forEach((item, idx) => {
          sheet2.addRow({
            stt: idx + 1,
            maPhieu: item.maPhieu || '',
            tenKhachHang: item.tenKhachHang || '',
            tongTien: item.tongTien || 0,
            tongTienSauGiam: item.tongTienSauGiam || 0,
            nvSale: item.nvSale || '',
            loaiHang: item.loaiHang || '',
            
          });
        });
      });

      // Insert a summary row of customer groups into sheet1 (if any)
      try {
        const lastCol1 = sheet1.columns.length;
        const groupNames = Array.from(new Set(groupOrder.map(gk => groups[gk] && groups[gk].name).filter(Boolean)));
        if (groupNames.length > 0) {
          const label = `Nhóm khách hàng: ${groupNames.join(', ')}`;
          const inserted = sheet1.insertRow(6, [label]);
          sheet1.mergeCells(inserted.number, 1, inserted.number, lastCol1);
          sheet1.getRow(inserted.number).font = { italic: true };
          sheet1.getRow(inserted.number).getCell(1).alignment = { horizontal: 'left' };
        }
      } catch (e) { /* ignore */ }

      // Style headers for both sheets separately (sheet1 header may shift if we inserted group row)
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      const headerFontColor = { argb: 'FFFFFFFF' };
      const borderThin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
      const allBorder = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

      // sheet1: header row is 6 unless we inserted a group row (then header moved to 7)
      const sheet1HeaderRow = sheet1.getRow(6).values && String(sheet1.getRow(6).values[1] || '').toString().startsWith('Số TT') ? 6 : 7;
      try {
        const hdr1 = sheet1.getRow(sheet1HeaderRow);
        hdr1.height = 20;
        hdr1.font = { bold: true, color: headerFontColor };
        hdr1.alignment = { vertical: 'middle', horizontal: 'center' };
        hdr1.eachCell((cell) => { cell.fill = headerFill; cell.border = allBorder; });
        sheet1.views = [{ state: 'frozen', ySplit: sheet1HeaderRow }];
        sheet1.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= sheet1HeaderRow) return;
          row.eachCell((cell, colNumber) => {
            cell.border = allBorder;
            const key = sheet1.getColumn(colNumber).key;
            if (['soLuongDVT1', 'soLuongDVTGoc', 'slBanTheoDVTGoc'].includes(key)) cell.alignment = { horizontal: 'right', vertical: 'top' };
            else if (key === 'tenHang' || key === 'moTa') cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            else cell.alignment = { vertical: 'top', horizontal: 'left' };
          });
        });
        try { sheet1.autoFilter = { from: { row: sheet1HeaderRow, column: 1 }, to: { row: sheet1HeaderRow, column: sheet1.columns.length } }; } catch (e) {}
      } catch (e) {}

      // sheet2: header row is 6
      try {
        const hdr2 = sheet2.getRow(6);
        hdr2.height = 20;
        hdr2.font = { bold: true, color: headerFontColor };
        hdr2.alignment = { vertical: 'middle', horizontal: 'center' };
        hdr2.eachCell((cell) => { cell.fill = headerFill; cell.border = allBorder; });
        sheet2.views = [{ state: 'frozen', ySplit: 6 }];
        sheet2.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= 6) return;
          row.eachCell((cell, colNumber) => {
            cell.border = allBorder;
            const key = sheet2.getColumn(colNumber).key;
            if (['tongTien', 'tongTienSauGiam'].includes(key)) cell.alignment = { horizontal: 'right', vertical: 'top' };
            else if (key === 'tenKhachHang' || key === 'customerGroup' || key === 'loaiHang') cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            else cell.alignment = { vertical: 'top', horizontal: 'left' };
          });
        });
        try { sheet2.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: sheet2.columns.length } }; } catch (e) {}
      } catch (e) {}

      // Numeric formatting
      try { sheet1.getColumn('soLuongDVT1').numFmt = '#,##0'; } catch {}
      try { sheet1.getColumn('soLuongDVTGoc').numFmt = 'General'; } catch {}
      try { sheet1.getColumn('slBanTheoDVTGoc').numFmt = 'General'; } catch {}
      try { sheet2.getColumn('tongTien').numFmt = '#,##0'; } catch {}
      try { sheet2.getColumn('tongTienSauGiam').numFmt = '#,##0'; } catch {}

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Phieu_Xuat_Hang_Tong_Hop_${importNumber || dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error('Error exporting Excel:', e);
      alert('Xuất Excel thất bại');
    }
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  const handlePrint = async () => {
    if (!selectedImport) {
      alert('Vui lòng chọn một bảng kê tổng để in');
      return;
    }

    try {
      // Fetch company info
      let compName = 'CÔNG TY';
      let compAddr = '';
      let compPhone = '';
      try {
        const compData = await api.get(API_ENDPOINTS.companyInfos);
        if (compData && compData.length > 0) {
          compName = compData[0].companyName || compData[0].name || 'CÔNG TY';
          compAddr = compData[0].address || '';
          compPhone = compData[0].phone || '';
        }
      } catch (e) {}

      const printedAt = formData.createdDate || selectedImport.createdDate || dayjs().format('DD/MM/YYYY');
      const importNumber = formData.importNumber || selectedImport.importNumber || '';

      // Get bangKeTongItems for product list (already aggregated)
      const bktItems = selectedImport.bangKeTongItems || [];

      // Format quantities: show integer without decimals, otherwise show up to 3 decimals trimmed
      const formatQty = (v) => {
        const n = Number(v) || 0;
        if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
        let s = n.toFixed(3);
        s = s.replace(/\.?(0+)$/,'');
        s = s.replace(/\.$/, '');
        return s;
      };

      // Build print HTML
      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Phiếu Xuất Hàng Tổng Hợp</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 15px; }
            .header { margin-bottom: 15px; }
            .company-name { font-weight: bold; font-size: 14px; }
            .company-info { font-size: 11px; }
            .title { text-align: center; font-size: 16px; font-weight: bold; color: #0066cc; margin: 15px 0 10px; }
            .subtitle { text-align: center; margin-bottom: 15px; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 5px 8px; }
            th { background-color: #d9e1f2; font-weight: bold; text-align: center; }
            td { vertical-align: top; }
            td.text-center { text-align: center; }
            td.text-right { text-align: right; }
            .product-name { white-space: normal; word-wrap: break-word; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${compName}</div>
            <div class="company-info">Địa chỉ: ${compAddr}</div>
            <div class="company-info">Điện thoại: ${compPhone}</div>
          </div>
          
          <div class="title">PHIẾU XUẤT HÀNG TỔNG HỢP</div>
          <div class="subtitle">Số bảng kê: ${importNumber} - Ngày lập: ${printedAt}</div>
          
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 40px;">STT</th>
                <th rowspan="2" style="width: 85px;">Mã hàng</th>
                <th rowspan="2" style="width: 85px;">Mã vạch</th>
                <th rowspan="2" style="width: 440px;">Tên hàng</th>
                <th colspan="2" style="text-align: center;">Đơn vị 1</th>
                <th colspan="2" style="text-align: center;">Đơn vị gốc</th>
                <th rowspan="2" style="width: 90px;">Ghi chú</th>
              </tr>
              <tr>
                <th style="width: 60px;">Đơn vị 1</th>
                <th style="width: 45px;">SL 1</th>
                <th style="width: 60px;">Đơn vị gốc</th>
                <th style="width: 45px;">SL gốc</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Add rows from bangKeTongItems
      bktItems.forEach((item, index) => {
        printContent += `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.maHang || ''}</td>
            <td>${item.maVach || ''}</td>
            <td class="product-name">${item.tenHang || ''}</td>
            <td class="text-center">${item.donViTinh1 || ''}</td>
            <td class="text-right">${formatQty(item.soLuongDVT1)}</td>
            <td class="text-center">${item.donViGoc || ''}</td>
            <td class="text-right">${formatQty(item.soLuongDVTGoc)}</td>
            <td>${item.moTa || ''}</td>
          </tr>
        `;
      });

      printContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        alert('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
      }

    } catch (error) {
      console.error('Error printing summary:', error);
      alert('Có lỗi xảy ra khi in phiếu tổng hợp');
    }
  };

  const handleAddItem = (event) => {
    if (!ensureImportTypeSelected()) return;
    // Check if Ctrl key is pressed
    if (event && (event.ctrlKey || event.metaKey)) {
      // Open in new tab
      window.open('/setup/products?openModal=true', '_blank');
    } else {
      // Navigate in current tab
      window.location.href = '/setup/products?openModal=true';
    }
  };

  // (history view removed) 

  // Load orders for selection modal
  const loadOrdersForSelect = async (startDate, endDate) => {
    setLoadingOrders(true);
    try {
      const start = dayjs(startDate).format('YYYY-MM-DD');
      const end = dayjs(endDate).format('YYYY-MM-DD');
      const response = await api.get(`${API_ENDPOINTS.orders}/by-date-range?startDate=${start}&endDate=${end}`);
      // Filter only "đã duyệt" status
      const approvedOrders = (response || []).filter(o => 
        o.status && o.status.toLowerCase().includes('đã duyệt')
      );

      // Enrich each order by fetching its detailed info so modal can show full columns
      const enriched = await Promise.all(approvedOrders.map(async (order) => {
        try {
          const detail = await api.get(`${API_ENDPOINTS.orders}/${order.id}`);
          const detailOrder = (detail && detail.order) ? detail.order : order;
          const items = detail && detail.items ? detail.items : [];
          const promotionItems = detail && detail.promotionItems ? detail.promotionItems : [];
          const allItems = [...items, ...promotionItems];

          const totalKg = allItems.reduce((s, it) => s + (Number(it.kg) || Number(it.weight) || 0), 0);
          const totalM3 = allItems.reduce((s, it) => s + (Number(it.m3) || Number(it.cbm) || 0), 0);

          let productType = detailOrder.productType || detailOrder.ProductType || '';
          if (!productType && allItems.length > 0) {
            const set = new Set(allItems.map(i => i.productType || i.category || '').filter(Boolean));
            productType = Array.from(set).join(', ');
          }

          let salesStaff = detailOrder.salesStaff || detailOrder.SalesStaff || detailOrder.createdBy || '';
          if (!salesStaff && allItems.length > 0) {
            const sset = new Set(allItems.map(i => i.nvSales || i.salesStaff || '').filter(Boolean));
            salesStaff = Array.from(sset).join(', ');
          }

          const taxRates = detailOrder.taxRates || detailOrder.TaxRates || '';

          return {
            ...order,
            ...detailOrder,
            items: allItems,
            promotionItems,
            totalKg,
            totalM3,
            productType,
            salesStaff,
            taxRates
          };
        } catch (e) {
          return order;
        }
      }));

      setOrdersForSelect(enriched);
    } catch (e) {
      console.error('Error loading orders:', e);
      setOrdersForSelect([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Show order selection modal when clicking "Tạo mới"
  const handleShowOrderSelectModal = () => {
    setSelectedOrderIds(new Set());
    setOrderSelectDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    setShowOrderSelectModal(true);
    // Load orders for the default date range
    loadOrdersForSelect(dayjs().startOf('month'), dayjs().endOf('month'));
  };

  // Toggle order selection
  const toggleOrderSelect = (orderId) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Select/deselect all orders
  const toggleSelectAllOrders = (checked) => {
    if (checked) {
      setSelectedOrderIds(new Set(ordersForSelect.map(o => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  // Open order detail (reuse PrintOrder behavior)
  const handleViewOrderDetail = (orderId) => {
    try {
      window.open(`/business/sales/create-order-form?id=${orderId}`, '_blank');
    } catch (e) {
      console.error('Failed to open order detail', e);
    }
  };

  // Confirm selection and create bảng kê tổng from selected orders
  const handleConfirmOrderSelection = async () => {
    if (selectedOrderIds.size === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }

    try {
      const selectedOrders = ordersForSelect.filter(o => selectedOrderIds.has(o.id));
      
      // Fetch order details with items for each selected order
      const ordersWithItems = await Promise.all(
        selectedOrders.map(async (order) => {
          try {
            const response = await api.get(`${API_ENDPOINTS.orders}/${order.id}`);
            return { order: response.order || order, items: response.items || [], promotionItems: response.promotionItems || [] };
          } catch (e) {
            console.error(`Error fetching order ${order.id}:`, e);
            return { order, items: [], promotionItems: [] };
          }
        })
      );
      
      // Generate new import number
      const newImportNumber = generateImportNumber();
      
      // Build bangKeTongItems from order items – aggregate by product (inherited from PrintOrder "xuất hàng tổng hợp")
      // Helper: last 3 chars of order number
      const getShortOrderNumber = (orderNum) => String(orderNum || '').slice(-3);

      // Aggregate items by product key (barcode > productCode > productName)
      const productMap = new Map();
      ordersWithItems.forEach(({ order, items, promotionItems }) => {
        const allItems = [...(items || []), ...(promotionItems || [])];
        allItems.forEach((item) => {
          const product = products.find(p => p.barcode === item.barcode || p.code === item.productCode || p.name === item.productName) || {};
          const key = item.barcode || item.productCode || item.productName;
          if (!key) return;
          const conversionToBase = parseFloat(item.conversion) || parseFloat(product.conversion1) || 1;
          const convUnit1 = parseFloat(product.conversion1) || parseFloat(item.conversion) || 1;
          const baseQty = (parseFloat(item.quantity) || 0) * conversionToBase;
          const shortOrderNum = getShortOrderNumber(order.orderNumber);

          if (productMap.has(key)) {
            const existing = productMap.get(key);
            if (!existing.orderNumbers.includes(shortOrderNum)) {
              existing.orderNumbers.push(shortOrderNum);
            }
            existing.totalBaseQty += baseQty;
          } else {
            productMap.set(key, {
              orderNumbers: [shortOrderNum],
              barcode: item.barcode || '',
              productCode: item.productCode || '',
              productName: item.productName || '',
              unit1: product.unit1 || product.defaultUnit || item.unit || '',
              baseUnit: product.baseUnit || item.baseUnit || item.unit || '',
              description: item.description || '',
              convUnit1: convUnit1,
              totalBaseQty: baseQty,
              productCategory: product.category || item.productType || order.productType || '',
            });
          }
        });
      });

      // Convert aggregated map to bangKeTongItems array
      const bangKeTongItems = [];
      let bktIdx = 0;
      productMap.forEach((data) => {
        const sl1 = Math.floor(data.totalBaseQty / data.convUnit1);
        const baseRemaining = data.totalBaseQty - (sl1 * data.convUnit1);
        bangKeTongItems.push({
          id: `bkt_${bktIdx}_${Date.now()}`,
          maPhieu: data.orderNumbers.join(', '),
          maVach: data.barcode,
          maHang: data.productCode,
          tenHang: data.productName,
          donViTinh1: data.unit1,
          soLuongDVT1: sl1,
          donViGoc: data.baseUnit,
          soLuongDVTGoc: Math.round(baseRemaining * 1000) / 1000,
          moTa: data.description,
          slBanTheoDVTGoc: Math.round(data.totalBaseQty * 1000) / 1000,
          quyDoi: Math.round(data.convUnit1 * 1000) / 1000,
          loaiHang: data.productCategory,
        });
        bktIdx++;
      });

      // Resolve customerGroup by customer name (use preloaded map or fetch)
      let custNameToGroupMap = customerNameToGroupMap;
      if (!custNameToGroupMap || Object.keys(custNameToGroupMap).length === 0) {
        try {
          const customersResp = await api.get(API_ENDPOINTS.customers);
          if (customersResp && Array.isArray(customersResp)) {
            custNameToGroupMap = {};
            customersResp.forEach(c => {
              const n = (c.name || '').toString().trim().toLowerCase();
              if (n && c.customerGroup) custNameToGroupMap[n] = c.customerGroup;
            });
          }
        } catch (e) { /* ignore */ }
      }

      // Build dsHoaDonItems from selected orders (include promotion items for nvSale/loaiHang like PrintOrder)
      const dsHoaDonItems = ordersWithItems.map(({ order, items, promotionItems }) => {
        const allItems = [...(items || []), ...(promotionItems || [])];
        // Get salesStaff from items' nvSales if order doesn't have it
        let nvSaleValue = order.salesStaff || order.salesEmployee || order.employee || '';
        if (!nvSaleValue && allItems.length > 0) {
          const nvSet = new Set(allItems.map(i => i.nvSales || i.salesStaff).filter(Boolean));
          nvSaleValue = Array.from(nvSet).join(', ');
        }
        // Get productType from items' product categories
        const catSet = new Set();
        allItems.forEach(item => {
          const product = products.find(p => p.barcode === item.barcode || p.code === item.productCode || p.name === item.productName);
          if (product && product.category) catSet.add(product.category);
        });
        const loaiHangValue = catSet.size > 0 ? Array.from(catSet).join(', ') : (order.productType || '');
        // Resolve customerGroup via customer name lookup
        const custName = (order.customerName || order.customer || '').toString().trim().toLowerCase();
        const custGroupCode = order.customerGroup || order.customerGroupId || order.customerGroupCode || custNameToGroupMap[custName] || '';
        const custGroupName = customerGroupsMap[custGroupCode] || order.customerGroupName || custGroupCode || '';
        return {
          id: `dshd_${order.id}_${Date.now()}`,
          orderId: order.id,
          maPhieu: order.orderNumber || '',
          tenKhachHang: order.customerName || order.customer || '',
          tongTien: order.totalAmount || 0,
          tongTienSauGiam: order.totalAfterDiscount || order.totalAmount || 0,
          nvSale: nvSaleValue,
          loaiHang: loaiHangValue,
          customerGroup: custGroupCode,
          customerGroupName: custGroupName
        };
      });

      // Calculate total as sum of tongTienSauGiam from dsHoaDonItems
      const totalAmount = dsHoaDonItems.reduce((s, h) => s + (Number(h.tongTienSauGiam || h.tongTien || 0) || 0), 0);

      // Create new temp import
      const newTempImport = {
        id: `temp_${Date.now()}`,
        receiptNumber: newImportNumber,
        importNumber: newImportNumber,
        importDate: dayjs().format('YYYY-MM-DD'),
        createdDate: dayjs().format('DD/MM/YYYY'),
        date: dayjs().format('YYYY-MM-DD'),
        totalAmount: totalAmount,
        supplierName: '',
        employee: (user && (user.username || user.name)) || '',
        importType: '',
        note: '',
        isTemp: true,
        items: [],
        bangKeTongItems: bangKeTongItems,
        dsHoaDonItems: dsHoaDonItems,
      };

      const newFormData = {
        createdDate: dayjs().format('YYYY-MM-DD'),
        employee: (user && (user.username || user.name)) || '',
        importType: '',
        importNumber: newImportNumber,
        supplier: '',
        invoice: '',
        invoiceDate: new Date().toISOString(),
        totalWeight: 0,
        totalVolume: 0,
        note: ''
      };

      // Add to imports list at the top
      setImports(prev => [newTempImport, ...prev]);
      
      // Set selected import and form data
      setSelectedImport(newTempImport);
      setFormData(newFormData);
      setItems([]);
      // Set header rows from bangKeTongItems
      setHeaderRows(bangKeTongItems.map((item, idx) => ({
        id: `row_${idx}_${Date.now()}`,
        values: {
          maPhieu: item.maPhieu,
          maVach: item.maVach,
          maHang: item.maHang,
          tenHang: item.tenHang,
          donViTinh1: item.donViTinh1,
          soLuongDVT1: item.soLuongDVT1,
          donViGoc: item.donViGoc,
          soLuongDVTGoc: item.soLuongDVTGoc,
          moTa: item.moTa,
          slBanTheoDVTGoc: item.slBanTheoDVTGoc,
          quyDoi: item.quyDoi,
          loaiHang: item.loaiHang,
        }
      })));
      setIsEditing(true);
      setShowRightContent(true);
      setIsEditMode(true);
      
      // Reset filters
      setSearchTerm('');
      setSearchCode('');
      setImportType('');
      setEmployee('');
      
      // Close modal
      setShowOrderSelectModal(false);
      setSelectedOrderIds(new Set());
    } catch (e) {
      console.error('Error creating bảng kê tổng:', e);
      alert('Có lỗi xảy ra khi tạo bảng kê tổng');
    }
  };

  const resetFormForNewImport = () => {
    // Show order selection modal instead of creating empty form
    // prefill formData.employee with current user when opening create flow
    setFormData(fd => ({ ...fd, employee: (user && (user.username || user.name)) || fd.employee }));
    handleShowOrderSelectModal();
  };

  // Function này không còn sử dụng vì đã thay đổi cơ chế
  // const handleCreateNewImport = async () => { ... }

  const generateImportNumber = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    
    // Sử dụng timestamp + random để đảm bảo unique
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = timestamp + random.slice(-1); // 4 digits unique
    
    return `BKT-${day}${month}${year}-${uniqueId}`;
  };

  // Modal tìm kiếm số phiếu
  const searchInputRef = useRef();

  return (
    <div className="in-bang-ke-tong-page">
      {/* Left Panel - Table Search */}
  <div className="search-panel">
        <div className="panel-header">
          <h2>TÌM KIẾM</h2>
        </div>
        <div className="search-panel-controls">
          <div className="search-controls-grid">
            <div className="search-left">
              <div className="search-panel-date-row" style={{ display: 'flex', gap: 8 }}>
                <DatePicker.RangePicker
                  value={[dateFrom ? dayjs(dateFrom) : null, dateTo ? dayjs(dateTo) : null]}
                  onChange={(dates) => {
                    if (!dates) {
                      setDateFrom(''); setDateTo('');
                    } else {
                      setDateFrom(dates[0].format('YYYY-MM-DD')); setDateTo(dates[1].format('YYYY-MM-DD'));
                    }
                  }}
                  format="DD/MM/YYYY"
                  placeholder={["Start date", "End date"]}
                  allowClear
                  separator=" — "
                  classNames={{ popup: { root: 'custom-date-picker-dropdown' } }}
                  style={{ width: '100%' }}
                />
              </div>
              {/* Removed quick filters: 'Số bảng kê tổng' and 'Người lập' per request */}
              {/* removed manual Total / Note filters - not required */}
            </div>
            {/* search button removed (redundant) */}
          </div>
        </div>
        <div className="search-panel-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Tổng {filteredLeft.length} phiếu</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Button className="xuatsd-btn" size="small" onClick={exportSelectedImportsList} title="Xuất DS BK">Xuất DS BK</Button>
            <input 
              id="template-file-input"
              type="file" 
              accept=".csv,.xlsx" 
              style={{display:'none'}} 
              onChange={handleTemplateUpload} 
            />
            <button style={{background:'transparent',border:'none',cursor:'pointer',fontSize:16}} title="Cài đặt cột" onClick={()=>setShowLeftColSettings(true)}>⚙️</button>
          </div>
        </div>
        <div className="table-scroll-x" style={{ position: 'relative', overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <table className="bkt-dynamic-table left-panel-table" style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 5 }}>
                <th style={{ border: '1px solid #e8e8e8', padding: '6px 4px', width: 36, textAlign: 'center' }}>
                  <input type="checkbox" checked={leftSelectedRows.size === paginatedLeft.length && paginatedLeft.length > 0} onChange={(e) => handleLeftSelectAll(e.target.checked, paginatedLeft)} style={{ accentColor: '#667eea' }} />
                </th>
                {leftColumns.filter(c => c.visible).map(col => (
                  <th
                    key={col.id}
                    style={{
                      border: '1px solid #e8e8e8', padding: '6px 6px', textAlign: col.align || 'left',
                      fontWeight: 600, fontSize: 12, width: col.width + 'px', minWidth: col.width + 'px', position: 'relative',
                      cursor: leftDragColumn === col.id ? 'grabbing' : 'grab', userSelect: 'none', whiteSpace: 'nowrap',
                    }}
                    draggable
                    onDragStart={(e) => leftH.colDragStart(e, col.id)}
                    onDragOver={leftH.colDragOver}
                    onDrop={(e) => leftH.colDrop(e, col.id, leftDragColumn)}
                    onDragEnd={leftH.colDragEnd}
                    className={leftDragColumn === col.id ? 'dragging' : ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.label}</span>
                      <button
                        className="col-search-btn"
                        onClick={(e) => { e.stopPropagation(); openLeftSearch(col.id, col.label); }}
                        title={`Tìm kiếm theo ${col.label}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: 0.5, padding: '1px 2px', lineHeight: 1 }}
                      >🔍</button>
                      {leftColumnFilters[col.id] && (
                        <button
                          className="col-clear-btn"
                          onClick={(e) => { e.stopPropagation(); clearLeftFilter(col.id); }}
                          title="Xóa bộ lọc"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#c9302c', padding: '1px 2px', lineHeight: 1 }}
                        >✖</button>
                      )}
                    </div>
                    <div
                      className="resize-handle"
                      onMouseDown={(e) => { e.stopPropagation(); leftH.resizeStart(e, col.id, leftColumns); }}
                      style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '5px', cursor: 'col-resize', zIndex: 2 }}
                    />
                  </th>
                ))}
                <th style={{ border: '1px solid #e8e8e8', padding: '6px 4px', width: 70, textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeft.length > 0 ? (
                paginatedLeft.map((record, idx) => (
                  <tr
                    key={record.id}
                    style={{ background: selectedImport?.id === record.id ? '#e6f7ff' : (idx % 2 === 0 ? '#fff' : '#fafafa'), cursor: 'pointer' }}
                    onClick={() => handleSelectImport(record)}
                    onContextMenu={(e) => handleTableContextMenu(e, record)}
                  >
                    <td style={{ border: '1px solid #e8e8e8', padding: '4px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={leftSelectedRows.has(record.id)} onChange={() => handleLeftSelectRow(record.id)} style={{ accentColor: '#667eea' }} />
                    </td>
                    {leftColumns.filter(c => c.visible).map(col => (
                      <td key={col.id} style={{ border: '1px solid #e8e8e8', padding: '4px 6px', textAlign: col.align || 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: col.width }}>
                        {col.id === 'importNumber' ? (
                          <span style={{ fontWeight: selectedImport?.id === record.id ? 600 : 400, color: record.isTemp ? '#1677ff' : 'inherit', fontStyle: record.isTemp ? 'italic' : 'normal' }}>
                            {record.importNumber}{record.isTemp && <span style={{fontSize:10,marginLeft:3}}>(Mới)</span>}
                          </span>
                        ) : (
                          renderLeftCell(record, col.id)
                        )}
                      </td>
                    ))}
                    <td style={{ border: '1px solid #e8e8e8', padding: '4px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <Space size={2}>
                        <Button icon={<EditOutlined />} size="small" onClick={() => editImport(record)} title="Sửa" style={{fontSize:11}} />
                        {!record.isTemp && (
                          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
                            <Button icon={<DeleteOutlined />} danger size="small" title="Xóa" style={{fontSize:11}} />
                          </Popconfirm>
                        )}
                      </Space>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={leftColumns.filter(c => c.visible).length + 2} style={{ border: '1px solid #e8e8e8', padding: 20, textAlign: 'center', color: '#999' }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {contextMenu.visible && (
            <Menu
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              onClick={(info) => {
                if (info.key === 'view') {
                  if (contextMenu.record) editImport(contextMenu.record);
                } else if (info.key === 'delete') {
                  if (contextMenu.record && !contextMenu.record.isTemp) {
                    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) handleDelete(contextMenu.record.id);
                  }
                }
                setContextMenu(c => ({ ...c, visible: false }));
              }}
            >
              <Menu.Item key="view" icon={<EditOutlined />}>Xem chi tiết</Menu.Item>
              {contextMenu.record && !contextMenu.record.isTemp && (
                <Menu.Item key="delete" icon={<DeleteOutlined />} style={{ color: '#ff4d4f' }}>Xóa</Menu.Item>
              )}
            </Menu>
          )}
        </div>
        {/* Left pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderTop: '1px solid #eee', fontSize: 12 }}>
          <span style={{ color: '#888' }}>Trang {leftPage}/{leftTotalPages || 1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setLeftPage(p => Math.max(1, p - 1))} disabled={leftPage <= 1} style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 3, cursor: leftPage <= 1 ? 'default' : 'pointer', background: '#fff', fontSize: 11 }}>‹</button>
            <button onClick={() => setLeftPage(p => Math.min(leftTotalPages, p + 1))} disabled={leftPage >= leftTotalPages} style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 3, cursor: leftPage >= leftTotalPages ? 'default' : 'pointer', background: '#fff', fontSize: 11 }}>›</button>
            <select
              value={(filteredLeft && filteredLeft.length > 0 && leftPageSize >= filteredLeft.length) ? 'all' : leftPageSize}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'all') {
                  const total = (filteredLeft && filteredLeft.length) || (imports && imports.length) || 0;
                  setLeftPageSize(total || 1);
                  setLeftPage(1);
                } else {
                  setLeftPageSize(parseInt(v, 10));
                  setLeftPage(1);
                }
              }}
              style={{ padding: '2px 4px', border: '1px solid #ddd', borderRadius: 3, fontSize: 11 }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
              <option value={10000}>10000</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
        </div>
        <div style={{padding: '8px 12px', borderTop: '1px dashed #eee', marginTop: 8, color: '#333', fontSize: 13}}>
          <strong>Tổng tiền: {formatCurrency(leftTotalSum)} VNĐ ({numberToVietnameseText(Math.round(leftTotalSum))})</strong>
        </div>
      </div>

      {/* Right Panel - Import Details */}
  <div className="import-detail-panel">
        <div className="detail-header">
          <h2>THÔNG TIN BẢNG KÊ TỔNG</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={resetFormForNewImport}>
              + Tạo mới
            </button>
            {/* Thêm hàng hóa button removed per request */}
            {/* Removed redundant "Xem lịch sử nhập hàng" button */}
          </div>
        </div>
        {selectedImport && showRightContent ? (
          <React.Fragment>

            <div className="detail-content">
              <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:2}}>
                {/* Top row: Ngày lập, Nhân viên, Bảng kê tổng, DS hóa đơn */}
                <div className="bkt-form-top-row" style={{display:'flex',gap:8}}>
                  <div style={{flex:'0 0 120px', minWidth:'120px'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                      <input
                        type="date"
                        value={formData.createdDate || (selectedImport?.createdDate ? dayjs(selectedImport.createdDate).format('YYYY-MM-DD') : '')}
                        onChange={(e) => {
                          if (!isEditMode) return;
                          const v = e.target.value;
                          setFormData(fd => ({ ...fd, createdDate: v }));
                          setSelectedImport(si => si ? ({ ...si, createdDate: v }) : si);
                          setIsEditing(true);
                        }}
                        style={{width:'100%'}}
                        readOnly={!isEditMode}
                      />
                  </div>
                  <div style={{flex:'0 0 120px', minWidth:'120px'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                    <select style={{width:'100%'}} value={formData.employee || selectedImport.employee || ''} onChange={(e)=>{
                      if (!isEditMode) return;
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, employee: v }));
                      setSelectedImport(si => si ? ({ ...si, employee: v }) : si);
                      setIsEditing(true);
                    }} disabled={!isEditMode || !isAdminUser}>
                      <option value="">-- Chọn nhân viên --</option>
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'0 0 156px', minWidth:'156px'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số bảng kê tổng</label>
                    <div className="input-with-status">
                      <input
                        type="text"
                        value={formData.importNumber || selectedImport?.importNumber || generateImportNumber()}
                        onChange={(e) => {
                          if (!isEditMode) return;
                          const v = e.target.value;
                          setFormData(fd => ({ ...fd, importNumber: v }));
                          setSelectedImport(si => si ? ({ ...si, importNumber: v }) : si);
                          setIsEditing(true);
                        }}
                        style={{width:'100%'}}
                        placeholder="Tự động tạo"
                        readOnly={!isEditMode}
                      />
                    </div>
                  </div>
                  <div style={{flex:'1 1 0', minWidth:0}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú bảng kê</label>
                    <input
                      type="text"
                      value={formData.note || selectedImport?.note || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, note: v }));
                        setSelectedImport(si => si ? ({ ...si, note: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      placeholder="nhập ghi chú bảng kê"
                      readOnly={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs: Bảng kê tổng / DS hóa đơn */}
              <div className="order-tabs">
                <button
                  className={`tab-btn ${activeTab === 'bangKeTong' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bangKeTong')}
                >
                  📋 Bảng kê tổng
                </button>
                <button
                  className={`tab-btn ${activeTab === 'dsHoaDon' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dsHoaDon')}
                >
                  📄 DS hóa đơn
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'bangKeTong' && renderTabTable('bkt', selectedImport?.bangKeTongItems)}
              {activeTab === 'dsHoaDon' && renderTabTable('dshd', selectedImport?.dsHoaDonItems)}

              {/* Right-side column settings modal */}
              <Modal
                open={showRightSettings}
                onCancel={()=>setShowRightSettings(false)}
                title="Cài đặt cột bảng hàng hóa"
                footer={null}
              >
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(() => {
                    const fixedRight = defaultRightCols.filter(c => c === 'actions');
                    const normalCols = defaultRightCols.filter(c => c !== 'actions');
                    return (
                      <React.Fragment>
                        <div style={{fontSize:13,color:'#888',marginBottom:6}}>Chưa cố định</div>
                        <div>
                          {rightColOrder.filter(key => !fixedRight.includes(key)).map((key, idx) => {
                            const label = key==='barcode'?'Mã vạch':key==='productCode'?'Mã hàng':key==='productName'?'Hàng hóa':key==='description'?'Mô tả':key==='conversion'?'Quy đổi':key==='quantity'?'Số lượng':key==='unitPrice'?'Đơn giá':key==='transportCost'?'Tiền vận chuyển':key==='noteDate'?'Ghi chú date PN':key==='total'?'Thành tiền':key==='totalTransport'?'Thành tiền vận chuyển':key==='weight'?'Số kg':key==='volume'?'Số khối':key==='warehouse'?'Kho hàng':key;
                            const draggableEnabled = rightColOrder.filter(k => !fixedRight.includes(k)).length > 1;
                            return (
                              <div
                                key={key}
                                className={`setting-row${rightVisibleCols.includes(key) ? '' : ' hidden'}${draggedIndex === idx ? ' dragging' : ''}${dragOverIndex === idx ? ' dragover' : ''}`}
                                draggable={draggableEnabled}
                                onDragStart={() => setDraggedIndex(idx)}
                                onDragOver={e => { e.preventDefault(); if (draggedIndex !== null && idx !== draggedIndex) setDragOverIndex(idx); }}
                                onDrop={() => {
                                  if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
                                  const nonFixedKeys = normalCols;
                                  const currentOrder = rightColOrder.filter(k => nonFixedKeys.includes(k));
                                  const newOrder = [...currentOrder];
                                  const [removed] = newOrder.splice(draggedIndex, 1);
                                  newOrder.splice(dragOverIndex, 0, removed);
                                  const newColOrder = [...newOrder, ...rightColOrder.filter(k => !nonFixedKeys.includes(k))];
                                  setRightColOrder(newColOrder);
                                  setDraggedIndex(null); setDragOverIndex(null);
                                }}
                                style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',cursor: draggableEnabled ? 'grab' : 'default'}}
                              >
                                <span className="drag-icon">⋮⋮</span>
                                <input
                                  type="checkbox"
                                  checked={rightVisibleCols.includes(key)}
                                  onChange={() => {
                                    setRightVisibleCols(
                                      rightVisibleCols.includes(key) ? rightVisibleCols.filter(k => k !== key) : [...rightVisibleCols, key]
                                    );
                                  }}
                                />
                                <span>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{fontSize:13,color:'#888',margin:'8px 0 2px 0'}}>Cố định phải</div>
                        <div>
                          {defaultRightCols.filter(c => c === 'actions').map(col => (
                            <div key={col} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
                              <span className="drag-icon" style={{color:'#eee'}}>⋮⋮</span>
                              <input
                                type="checkbox"
                                checked={rightVisibleCols.includes(col)}
                                onChange={() => {
                                  setRightVisibleCols(
                                    rightVisibleCols.includes(col) ? rightVisibleCols.filter(k => k !== col) : [...rightVisibleCols, col]
                                  );
                                }}
                              />
                              <span>{col === 'actions' ? 'Thao tác' : col}</span>
                            </div>
                          ))}
                        </div>
                      </React.Fragment>
                    );
                  })()}
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                    <button className="btn btn-secondary" onClick={()=>{ setRightVisibleCols(defaultRightCols); setRightColOrder(defaultRightCols); }} title="reset mặc định">reset mặc định</button>
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
                {isEditMode && (
                  <button className="btn btn-info" onClick={saveImport} disabled={!isEditing}>
                    📁 Lưu lại
                  </button>
                )}
                <button className="btn btn-success" onClick={exportImportTemplate} style={{marginLeft:8}}>
                  📄 Xuất chi tiết
                </button>
                <button className="btn btn-success" onClick={() => document.getElementById('template-file-input').click()} style={{marginLeft:4}}>
                  📁 Nhập chi tiết
                </button>
                <button className="btn btn-purple" onClick={handlePrint}>
                  🖨 In A4
                </button>
                <button className="btn btn-success" onClick={handleExport}>
                  📤 Xuất Excel
                </button>
              </div>
            </div>
                      </React.Fragment>
        ) : selectedImport && !showRightContent ? (
          <div style={{padding:20, color:'#777'}}>Chọn phiếu bên trái rồi bấm <strong>Sửa</strong> để xem hoặc chỉnh sửa chi tiết ở bên phải.</div>
        ) : (
          // Default view for new import - show form and table
          <div className="detail-content">
            <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:2}}>
              {/* Top row: Ngày lập, Nhân viên, Bảng kê tổng, DS hóa đơn */}
                <div className="bkt-form-top-row" style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <div style={{flex:'0 0 120px', minWidth:'120px'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                    <input
                      type="date"
                      value={formData.createdDate || dayjs().format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, createdDate: v }));
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                    />
                </div>
                <div style={{flex:'0 0 120px', minWidth:'120px'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                  <select 
                    value={formData.employee || ((user && (user.username || user.name)) || '')}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, employee: v }));
                      setIsEditing(true);
                    }}
                    style={{width:'100%'}}
                    disabled={!isAdminUser}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {user && (user.username || user.name) ? (
                      <option value={(user.username || user.name)}>{(user.name || user.username)}</option>
                    ) : null}
                    <option value="user 01">user 01</option>
                  </select>
                </div>
                <div style={{flex:'0 0 156px', minWidth:'156px'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số bảng kê tổng</label>
                  <div className="input-with-status">
                    <input
                      type="text"
                      value={formData.importNumber || generateImportNumber()}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, importNumber: v }));
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      placeholder="Tự động tạo"
                      readOnly={!isEditMode}
                    />
                  </div>
                </div>
                <div style={{flex:'1 1 0', minWidth:0}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú bảng kê</label>
                  <input
                    type="text"
                    value={formData.note || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, note: v }));
                      setIsEditing(true);
                    }}
                    style={{width:'100%'}}
                    placeholder="nhập ghi chú bảng kê"
                    readOnly={!isEditMode}
                    />
                </div>
              </div>
            </div>

            {/* Tabs: Bảng kê tổng / DS hóa đơn (default view) */}
            <div className="order-tabs">
              <button
                className={`tab-btn ${activeTab === 'bangKeTong' ? 'active' : ''}`}
                onClick={() => setActiveTab('bangKeTong')}
              >
                📋 Bảng kê tổng
              </button>
              <button
                className={`tab-btn ${activeTab === 'dsHoaDon' ? 'active' : ''}`}
                onClick={() => setActiveTab('dsHoaDon')}
              >
                📄 DS hóa đơn
              </button>
            </div>

            {activeTab === 'bangKeTong' && renderTabTable('bkt', [])}
            {activeTab === 'dsHoaDon' && renderTabTable('dshd', [])}

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
              <div style={{marginBottom: 16}}>
                <strong>Thông tin phiếu nhập:</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Số bảng kê tổng
                    </label>
                    <input
                      type="text"
                      value={formData.importNumber || generateImportNumber()}
                      onChange={(e) => setFormData(prev => ({...prev, importNumber: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Ngày lập
                    </label>
                    <input
                      type="date"
                      value={formData.createdDate}
                      onChange={(e) => setFormData(prev => ({...prev, createdDate: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Nhân viên lập
                    </label>
                    <select
                      value={formData.employee || ((user && (user.username || user.name)) || '')}
                      onChange={(e) => setFormData(prev => ({...prev, employee: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                      disabled={!isAdminUser}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {user && (user.username || user.name) ? (
                        <option value={(user.username || user.name)}>{(user.name || user.username)}</option>
                      ) : null}
                      <option value="user 01">user 01</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Loại nhập
                    </label>
                    <select
                      value={formData.importType}
                      onChange={(e) => setFormData(prev => ({...prev, importType: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    >
                      <option value="">-- Chọn loại nhập --</option>
                      {transactionContents.map(tc => (
                        <option key={tc.id} value={tc.name}>{tc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{gridColumn: '1 / 3'}}>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>Ghi chú</label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))}
                      placeholder="nhập ghi chú bảng kê"
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{marginBottom: 16}}>
                <strong>Sản phẩm đã chọn:</strong>
                <div style={{maxHeight: 200, overflowY: 'auto'}}>
                  {memoizedHeaderTotals.validRows.map((row, idx) => {
                    const total = parseFloat(row.values.total) || 0;
                    return (
                      <div key={idx} style={{padding: '8px 0', borderBottom: '1px solid #eee'}}>
                        <div>{row.values.productName || row.values.productCode || row.values.barcode}</div>
                        <div style={{fontSize: 12, color: '#666'}}>
                          Số lượng: {row.values.quantity || 1} | 
                          Đơn giá: {formatCurrency(row.values.unitPrice || 0)} | 
                          Thành tiền: {formatCurrency(total)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div style={{marginBottom: 16}}>
                <strong>Tổng tiền: {formatCurrency(memoizedHeaderTotals.totalAmount)} VNĐ ({numberToVietnameseText(memoizedHeaderTotals.totalAmount)})</strong>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Hủy
              </button>
              <button onClick={handleCreateNewImport} className="btn btn-primary">
                Tạo phiếu nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      <Modal
        open={showProductModal}
        onCancel={() => { setShowProductModal(false); setProductModalScope('all'); }}
        title="Chọn hàng hóa"
        width={800}
        footer={[
          <button key="clear" onClick={() => {
            setSelectedModalProducts([]);
            setProductModalSearch('');
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Bỏ chọn tất cả</button>,
          <button key="all" onClick={() => {
            const filteredProducts = (() => {
              if (productModalScope === 'currentImport') {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              }
              return memoizedFilteredProducts;
            })();

            // Only select products on current page instead of all filtered products
            const startIndex = (modalCurrentPage - 1) * modalPageSize;
            const currentPageProducts = filteredProducts.slice(startIndex, startIndex + modalPageSize);
            const currentPageIds = currentPageProducts.map(p => p.id.toString());
            
            setSelectedModalProducts(prev => {
              const merged = new Set([...(prev || []), ...currentPageIds]);
              return Array.from(merged);
            });
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Chọn tất cả</button>,
          <button key="ok" onClick={() => {
            if (selectedModalProducts.length > 0 && productModalScope === 'currentImport') {
              // Compute filtered products in current scope
              const filteredProducts = (() => {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              })();

              // If user selected all filtered products -> clear filters and show entire import for editing
              if (selectedModalProducts.length === filteredProducts.length) {
                setRightFilters({});
                setHeaderFilter(null);
                setIsEditMode(true);
                setIsEditing(true);
                setShowProductModal(false);
                setProductModalScope('all');
                return;
              }

              // If multiple selected (but not all), build multi-value headerFilter so headerRows show only selected products
              if (selectedModalProducts.length > 1) {
                const codes = [];
                const barcodes = [];
                const names = [];
                for (const pid of selectedModalProducts) {
                  const p = products.find(pp => pp.id.toString() === pid);
                  if (!p) continue;
                  if (p.code) codes.push(String(p.code));
                  if (p.barcode) barcodes.push(String(p.barcode));
                  if (p.name) names.push(String(p.name));
                }
                const headerFilterObj = { productCode: codes, barcode: barcodes, productName: names };
                setRightFilters({});
                setHeaderFilter(headerFilterObj);
                setIsEditMode(true);
                setIsEditing(true);

                // navigate to first matching header row page if any
                const keys = new Set([...codes, ...barcodes, ...names].map(x => String(x)));
                let foundIndex = -1;
                for (let i = 0; i < headerRows.length; i++) {
                  const r = headerRows[i];
                  if (!r || !r.values) continue;
                  const v = r.values;
                  if (keys.has(String(v.productCode)) || keys.has(String(v.barcode)) || keys.has(String(v.productName))) { foundIndex = i; break; }
                }
                if (foundIndex !== -1) {
                  const page = Math.floor(foundIndex / Math.max(1, rightItemsPerPage)) + 1;
                  setRightCurrentPage(page);
                }
                setShowProductModal(false);
                setProductModalScope('all');
                return;
              }

              // Single selection -> behave as before (filter to that single product)
              const firstProductId = selectedModalProducts[0];
              const firstProduct = products.find(p => p.id.toString() === firstProductId);
              if (firstProduct) {
                const newFilters = {
                  productCode: firstProduct.code || '',
                  barcode: firstProduct.barcode || '',
                  productName: firstProduct.name || ''
                };
                setRightFilters(newFilters);
                setHeaderFilter(newFilters);
                setIsEditMode(true);
                setIsEditing(true);

                const keys = new Set([String(firstProduct.code || ''), String(firstProduct.barcode || ''), String(firstProduct.name || '')]);
                let foundIndex = -1;
                for (let i = 0; i < headerRows.length; i++) {
                  const r = headerRows[i];
                  if (!r || !r.values) continue;
                  const v = r.values;
                  if (keys.has(String(v.productCode)) || keys.has(String(v.barcode)) || keys.has(String(v.productName))) { foundIndex = i; break; }
                }
                if (foundIndex !== -1) {
                  const page = Math.floor(foundIndex / Math.max(1, rightItemsPerPage)) + 1;
                  setRightCurrentPage(page);
                } else {
                  const itemsList = (itemsData || []);
                  let foundInItems = -1;
                  for (let i = 0; i < itemsList.length; i++) {
                    const it = itemsList[i];
                    if (!it) continue;
                    if (keys.has(String(it.productCode)) || keys.has(String(it.barcode)) || keys.has(String(it.productName))) { foundInItems = i; break; }
                  }
                  if (foundInItems !== -1) {
                    const page = Math.floor(foundInItems / Math.max(1, rightItemsPerPage)) + 1;
                    setRightCurrentPage(page);
                  } else {
                    setRightCurrentPage(1);
                  }
                }
              }
              setShowProductModal(false);
              setProductModalScope('all');
              return;
            }

            if (selectedModalProducts.length > 0) {
              if (!ensureImportTypeSelected()) return;
              // Handle multiple product selection
              if (productModalRowIndex !== null && productModalRowIndex >= 0) {
                // For header input rows - update with multiple products
                setHeaderRows(prev => {
                  const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
                  
                  // Update the current row with first selected product
                  const firstProductId = selectedModalProducts[0];
                  const firstProduct = products.find(p => p.id.toString() === firstProductId);
                  
                  if (copy[productModalRowIndex] && firstProduct) {
                    // Try to find most recent import item for this product to reuse last prices/units
                    let lastMatch = null;
                    try {
                      if (imports && imports.length > 0) {
                        // Filter out current import and temp imports to find actual last prices
                        const currentImportId = selectedImport?.id;
                        const filteredImports = imports.filter(imp => {
                          // Exclude current import being edited
                          if (currentImportId && imp.id === currentImportId) return false;
                          // Exclude temp imports (not yet saved)
                          if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                          return true;
                        });
                        
                        const withDates = filteredImports.map(imp => {
                          let parsedDate = new Date(0);
                          
                          if (imp.date) {
                            try {
                              const d = new Date(imp.date);
                              if (!isNaN(d.getTime())) parsedDate = d;
                            } catch (e) {}
                          }
                          
                          if (parsedDate.getTime() === 0 && imp.createdDate) {
                            try {
                              if (imp.createdDate.includes('/')) {
                                const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                                if (djs.isValid()) parsedDate = djs.toDate();
                              } else {
                                const d = new Date(imp.createdDate);
                                if (!isNaN(d.getTime())) parsedDate = d;
                              }
                            } catch (e) {}
                          }
                          
                          const fallbackSort = parseInt(imp.id) || 0;
                          
                          return {
                            imp,
                            _date: parsedDate,
                            _fallbackSort: fallbackSort
                          };
                        });
                        
                        // Sort by ID desc (most reliable - auto increment means higher ID = newer)
                        withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
                        for (const w of withDates) {
                          const itemsList = w.imp.items || w.imp.Items || [];
                          const match = itemsList.find(it => (it.productCode && it.productCode === firstProduct.code) || (it.barcode && it.barcode === firstProduct.barcode) || (it.productName && it.productName === firstProduct.name));
                          if (match) { lastMatch = match; break; }
                        }
                      }
                    } catch (e) {
                      // ignore
                    }

                    const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                                       (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));

                    copy[productModalRowIndex].values[productModalColumn] = firstProduct?.name || '';
                    copy[productModalRowIndex].values['productCode'] = firstProduct.code || '';
                    copy[productModalRowIndex].values['productName'] = firstProduct.name || '';
                    copy[productModalRowIndex].values['barcode'] = firstProduct.barcode || '';
                    copy[productModalRowIndex].values['description'] = firstProduct.description || '';
                    
                    // Always prioritize base unit first, then fallback to last match
                    const baseUnit = firstProduct.baseUnit || firstProduct.defaultUnit || firstProduct.unit || '';
                    const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
                    copy[productModalRowIndex].values['unit'] = defaultUnit;
                    
                    // Get product data for correct conversion based on unit
                    const productData = getProductDataByUnit(firstProduct, defaultUnit);
                    copy[productModalRowIndex].values['conversion'] = productData.conversion.toString();
                    
                    // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
                    let convertedUnitPrice = 0;
                    let convertedTransportCost = 0;
                    
                    // Kiểm tra loại nhập có phải "Nhập mua" không
                    const importType = formData.importType || selectedImport?.importType || '';
                    const isNhapMua = importType.toLowerCase().includes('Nhập mua') || importType.toLowerCase() === 'nhập mua';
                    
                    if (lastMatch) {
                      const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
                      const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
                      const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
                      
                      // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
                      if (isNhapMua && !isKMImport) {
                        convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
                      }
                      // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
                      convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
                    }
                    
                    copy[productModalRowIndex].values['unitPrice'] = convertedUnitPrice;
                    copy[productModalRowIndex].values['transportCost'] = convertedTransportCost;
                    copy[productModalRowIndex].values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null;
                    // weight and volume will be calculated after we determine quantity below
                    copy[productModalRowIndex].values['warehouse'] = copy[productModalRowIndex].values['warehouse'] || getDefaultWarehouseName();
                    
                    // Auto-calculate initial totals
                    const quantity = parseFloat(copy[productModalRowIndex].values.quantity) || 1;
                    
                    copy[productModalRowIndex].values.total = (quantity * convertedUnitPrice).toString();
                    copy[productModalRowIndex].values.totalTransport = (quantity * convertedTransportCost).toString();
                    // calculate derived fields based on the product
                    try {
                      if (firstProduct) {
                        copy[productModalRowIndex].values['weight'] = ((firstProduct.weight || 0) * quantity).toString();
                        copy[productModalRowIndex].values['volume'] = ((firstProduct.volume || 0) * quantity).toString();
                      }
                    } catch (e) {}
                  }
                  
                  // Add new rows for remaining selected products
                  selectedModalProducts.slice(1).forEach(productId => {
                    const product = products.find(p => p.id.toString() === productId);
                    if (product) {
                      // Try to find most recent import item for this product
                      let lastMatch = null;
                      try {
                        if (imports && imports.length > 0) {
                          // Filter out current import and temp imports to find actual last prices
                          const currentImportId = selectedImport?.id;
                          const filteredImports = imports.filter(imp => {
                            // Exclude current import being edited
                            if (currentImportId && imp.id === currentImportId) return false;
                            // Exclude temp imports (not yet saved)
                            if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                            return true;
                          });
                          
                          const withDates = filteredImports.map(imp => {
                            let parsedDate = new Date(0);
                            
                            if (imp.date) {
                              try {
                                const d = new Date(imp.date);
                                if (!isNaN(d.getTime())) parsedDate = d;
                              } catch (e) {}
                            }
                            
                            if (parsedDate.getTime() === 0 && imp.createdDate) {
                              try {
                                if (imp.createdDate.includes('/')) {
                                  const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                                  if (djs.isValid()) parsedDate = djs.toDate();
                                } else {
                                  const d = new Date(imp.createdDate);
                                  if (!isNaN(d.getTime())) parsedDate = d;
                                }
                              } catch (e) {}
                            }
                            
                            const fallbackSort = parseInt(imp.id) || 0;
                            
                            return {
                              imp,
                              _date: parsedDate,
                              _fallbackSort: fallbackSort
                            };
                          });
                          
                          // Sort by ID desc (most reliable - auto increment means higher ID = newer)
                          withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
                          for (const w of withDates) {
                            const itemsList = w.imp.items || w.imp.Items || [];
                            const match = itemsList.find(it => (it.productCode && it.productCode === product.code) || (it.barcode && it.barcode === product.barcode) || (it.productName && it.productName === product.name));
                            if (match) { lastMatch = match; break; }
                          }
                        }
                      } catch (e) {
                        // ignore
                      }

                      const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                                         (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));

                      // Always prioritize base unit first
                      const baseUnit = product.baseUnit || product.defaultUnit || product.unit || '';
                      const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
                      
                      // Get product data for correct conversion based on unit
                      const productData = getProductDataByUnit(product, defaultUnit);
                      
                      // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
                      let convertedUnitPrice = 0;
                      let convertedTransportCost = 0;
                      
                      // Kiểm tra loại nhập có phải "Nhập mua" không
                      const importType = formData.importType || selectedImport?.importType || '';
                      const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
                      
                      if (lastMatch) {
                        const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
                        const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
                        const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
                        
                        // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
                        if (isNhapMua && !isKMImport) {
                          convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
                        }
                        // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
                        convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
                      }

                      const newRow = { id: Date.now() + Math.random(), values: {} };
                      newRow.values[productModalColumn] = product.name || '';
                      newRow.values['productCode'] = product.code || '';
                      newRow.values['productName'] = product.name || '';
                      newRow.values['barcode'] = product.barcode || '';
                      newRow.values['description'] = product.description || '';
                      newRow.values['unit'] = defaultUnit;
                      newRow.values['conversion'] = productData.conversion;
                      newRow.values['unitPrice'] = convertedUnitPrice;
                      newRow.values['transportCost'] = convertedTransportCost;
                      newRow.values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null;
                      newRow.values['weight'] = productData.weight * 1;
                      newRow.values['volume'] = productData.volume * 1;
                      newRow.values['warehouse'] = getDefaultWarehouseName();
                      newRow.values['quantity'] = 1;
                      
                      // Auto-calculate initial totals
                      newRow.values.total = convertedUnitPrice.toString();
                      newRow.values.totalTransport = convertedTransportCost.toString();
                      
                      copy.push(newRow);
                    }
                  });
                  
                  // Always add one more blank row at the end
                  copy.push({ id: Date.now() + Math.random(), values: { warehouse: getDefaultWarehouseName() } });
                  
                  return copy;
                });
              } else {
                // For main header dropdown - trigger the full product selection logic for first product only
                const firstProductId = selectedModalProducts[0];
                handleProductSelect(productModalColumn, firstProductId);
              }
            }
            setShowProductModal(false);
            setProductModalScope('all');
          }} style={{padding: '6px 16px', border: 'none', borderRadius: '4px', background: '#1677ff', color: '#fff'}}>{productModalScope === 'currentImport' ? 'Tìm' : 'Thêm vào PN'}</button>
        ]}
      >
        
        <div style={{marginBottom: 16}}>
          <Input
            placeholder="Tìm tên hàng hóa"
            value={productModalSearch}
            onChange={(e) => {
              setProductModalSearch(e.target.value);
              setModalCurrentPage(1); // Reset to page 1 when searching
            }}
            style={{width: '100%'}}
          />
        </div>
        
        {/* Pagination controls */}
        <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 13}}>Hiển thị:</span>
            <Select
              value={modalPageSize}
              onChange={(value) => {
                setModalPageSize(value);
                setModalCurrentPage(1);
              }}
              size="small"
              style={{width: 80}}
            >
              {[10, 20, 50, 100, 200, 500, 1000, 2000, 5000].map(size => (
                <Select.Option key={size} value={size}>{size}</Select.Option>
              ))}
            </Select>
          </div>
          
          
          
          <div style={{display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#f0f8ff', borderRadius: '4px', border: '1px solid #d1ecf1'}}>
            <span style={{fontSize: 13, color: '#0c5460', fontWeight: 500}}>
              Bạn đã chọn: <strong>{selectedModalProducts.length}</strong> sản phẩm
            </span>
          </div>
        </div>
        
        <div style={{maxHeight: 400, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px'}}>
          {(() => {
            const filteredProducts = (() => {
              if (productModalScope === 'currentImport') {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              }
              return memoizedFilteredProducts;
            })();
            const startIndex = (modalCurrentPage - 1) * modalPageSize;
            const currentPageProducts = filteredProducts.slice(startIndex, startIndex + modalPageSize);
            
            return currentPageProducts.map(product => (
              <div key={product.id} style={{padding: '8px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8}}>
                <input
                  type="checkbox"
                  checked={selectedModalProducts.includes(product.id.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedModalProducts(prev => [...prev, product.id.toString()]); // Allow multiple selection
                    } else {
                      setSelectedModalProducts(prev => prev.filter(id => id !== product.id.toString()));
                    }
                  }}
                />
                <span style={{fontSize: 13}}>{getProductOptionLabel(product)}</span>
              </div>
            ))
          })()
          }
        </div>
        
        {/* Pagination navigation */}
        {(() => {
          const filteredProducts = (() => {
            if (productModalScope === 'currentImport') {
              const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
              return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
            }
            return memoizedFilteredProducts;
          })();
          const totalPages = Math.ceil(filteredProducts.length / modalPageSize);

          if (totalPages <= 1) return null;

          return (
            <div style={{marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8}}>
              <button
                onClick={() => {
                  setModalCurrentPage(prev => Math.max(1, prev - 1));
                }}
                disabled={modalCurrentPage === 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: modalCurrentPage === 1 ? '#f5f5f5' : '#fff',
                  cursor: modalCurrentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Trước
              </button>
              
              <span style={{fontSize: 13}}>Trang {modalCurrentPage} / {totalPages}</span>
              
              <button
                onClick={() => {
                  setModalCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                disabled={modalCurrentPage === totalPages}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: modalCurrentPage === totalPages ? '#f5f5f5' : '#fff',
                  cursor: modalCurrentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau
              </button>
              
              <span style={{fontSize: 12, color: '#666', marginLeft: 8}}>({filteredProducts.length} sản phẩm)</span>
            </div>
          );
        })()
        }
      </Modal>

      {/* Column settings & search modals for BKT and DSHD tabs */}
      {renderColumnSettingsModal('bkt')}
      {renderColumnSettingsModal('dshd')}
      {renderModalColumnSettingsModal()}
      {renderColumnSearchModal('bkt')}
      {renderColumnSearchModal('dshd')}

      {/* Left panel column settings modal */}
      {showLeftColSettings && (
        <div className="search-modal-overlay" onClick={() => setShowLeftColSettings(false)}>
          <div className="column-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>⚙️ Cài đặt cột - Bảng trái</h3>
              <button onClick={() => setShowLeftColSettings(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <button onClick={() => leftH.resetCols(defaultLeftColumns)} style={{ padding: '4px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ddd', background: '#fff' }}>
                  🔄 Reset về mặc định
                </button>
                <span style={{ fontSize: 12, color: '#888' }}>Hiển thị {leftColumns.filter(c => c.visible).length}/{leftColumns.length} cột</span>
              </div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>💡 Kéo thả để sắp xếp, tick/untick để ẩn/hiện cột</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {leftColumns.map((column, index) => (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={(e) => leftH.settingsDragStart(e, index)}
                    onDragOver={leftH.settingsDragOver}
                    onDrop={(e) => leftH.settingsDrop(e, index, leftSettingsDrag)}
                    onDragEnd={leftH.settingsDragEnd}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'grab', background: leftSettingsDrag === index ? '#e3f2fd' : 'transparent' }}
                    className={`column-settings-item ${leftSettingsDrag === index ? 'dragging' : ''}`}
                  >
                    <span style={{ cursor: 'grab', color: '#aaa', fontSize: 14, userSelect: 'none' }}>⋮⋮</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, cursor: 'pointer' }}>
                      <input type="checkbox" checked={column.visible} onChange={() => leftH.toggleVisibility(column.id)} style={{ accentColor: '#667eea' }} />
                      <span style={{ fontSize: 13 }}>{column.label}</span>
                    </label>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{column.width}px</span>
                    {!column.visible && <span style={{ fontSize: 10, color: '#f5222d', background: '#fff1f0', padding: '1px 6px', borderRadius: 8 }}>Ẩn</span>}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button onClick={() => setShowLeftColSettings(false)} style={{ padding: '6px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                  ✓ Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left panel column search modal */}
      {showLeftSearchModal && leftSearchColumn && (() => {
        const uniqueValues = getLeftUniqueValues(leftSearchColumn.id).filter(v => {
          if (!leftSearchQuery.trim()) return true;
          return v.toLowerCase().includes(leftSearchQuery.toLowerCase());
        }).slice(0, 50);
        return (
          <div className="search-modal-overlay" onClick={closeLeftSearch}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 380, maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>🔍 Tìm kiếm theo "{leftSearchColumn.label}"</h3>
                <button onClick={closeLeftSearch} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>×</button>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={leftSearchQuery}
                  onChange={(e) => setLeftSearchQuery(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde2e8', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ maxHeight: 250, overflowY: 'auto', padding: '0 16px' }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Các giá trị có trong cột (click để chọn):</div>
                {uniqueValues.length === 0 ? (
                  <div style={{ padding: 10, color: '#999', textAlign: 'center' }}>Không có dữ liệu</div>
                ) : (
                  uniqueValues.map((value, i) => (
                    <div
                      key={i}
                      onClick={() => setLeftSearchQuery(value)}
                      style={{ padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: leftSearchQuery === value ? '#e3f2fd' : 'transparent', fontSize: 13 }}
                      onMouseEnter={(e) => { e.target.style.background = '#f5f5f5'; }}
                      onMouseLeave={(e) => { e.target.style.background = leftSearchQuery === value ? '#e3f2fd' : 'transparent'; }}
                    >
                      {value}
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setLeftSearchQuery(''); setLeftColumnFilters({}); closeLeftSearch(); }} style={{ padding: '6px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Xóa bộ lọc
                </button>
                <button onClick={applyLeftSearch} style={{ padding: '6px 14px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Áp dụng
                </button>
                <button onClick={closeLeftSearch} style={{ padding: '6px 14px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Order Selection Modal */}
      {showOrderSelectModal && (
        <div className="order-select-overlay" onClick={() => setShowOrderSelectModal(false)} style={{ zIndex: 9998 }}>
          <div className="order-select-modal order-select-modal-fullscreen" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 0, width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', boxShadow: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>📋 Chọn đơn hàng để tạo bảng kê tổng</h3>
              <button onClick={() => setShowOrderSelectModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            
            {/* Date range picker */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10 }}>
              <span style={{ fontSize: 13 }}>Chọn khoảng thời gian:</span>
              <DatePicker.RangePicker
                value={orderSelectDateRange}
                onChange={(dates) => {
                  setOrderSelectDateRange(dates);
                  if (dates && dates[0] && dates[1]) {
                    loadOrdersForSelect(dates[0], dates[1]);
                  }
                }}
                format="DD/MM/YYYY"
                placeholder={["Start date", "End date"]}
                allowClear
                separator=" — "
                classNames={{ popup: { root: 'custom-date-picker-dropdown' } }}
                style={{ width: 280 }}
                getPopupContainer={(trigger) => trigger && trigger.parentElement ? trigger.parentElement : document.body}
              />
              <span style={{ fontSize: 12, color: '#888' }}>
                (Chỉ hiển thị đơn hàng đã duyệt)
              </span>
            </div>
            
            {/* Orders table (with header search + pagination + column settings) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column' }}>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải danh sách đơn hàng...</div>
              ) : ordersForSelect.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có đơn hàng đã duyệt trong khoảng thời gian này</div>
              ) : (
                (() => {
                  const filtered = filterOrdersForSelect(ordersForSelect);
                  const total = filtered.length;
                  const pageSize = orderSelectPageSize;
                  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(total / pageSize));
                  const currentPage = Math.min(orderSelectCurrentPage, totalPages);
                  const start = (currentPage - 1) * pageSize;
                  const pageItems = pageSize === 'All' ? filtered : filtered.slice(start, start + pageSize);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button title="Cài đặt cột" onClick={() => setShowModalDshdSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>⚙️</button>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f0f5ff' }}>
                              <th style={{ border: '1px solid #d9d9d9', padding: '8px', width: 40 }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedOrderIds.size === ordersForSelect.length && ordersForSelect.length > 0}
                                  onChange={(e) => toggleSelectAllOrders(e.target.checked)}
                                />
                              </th>
                              {modalDshdColumns.filter(c => c.visible).map(col => (
                                <th
                                  key={col.id}
                                  draggable
                                  onDragStart={(e) => modalH.colDragStart(e, col.id)}
                                  onDragOver={modalH.colDragOver}
                                  onDrop={(e) => modalH.colDrop(e, col.id, modalDshdDragColumn)}
                                  onDragEnd={modalH.colDragEnd}
                                  style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: col.align || 'left', position: 'relative', width: col.width + 'px', minWidth: col.width + 'px' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ flex: 1 }}>{col.label}</span>
                                    {col.id !== 'actions' && (
                                      <>
                                        <button onClick={(e) => { e.stopPropagation(); openDshdSearchFromOrderSelect(col.id, col.label, filtered); }} title={`Tìm kiếm theo ${col.label}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.6 }}>🔍</button>
                                        {dshdColumnFilters[col.id] && (
                                          <button onClick={(e) => { e.stopPropagation(); clearDshdFilter(col.id); }} title="Xóa bộ lọc" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#c9302c' }}>✖</button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {col.id !== 'actions' && (
                                    <div
                                      className="resize-handle"
                                      onMouseDown={(e) => { e.stopPropagation(); modalH.resizeStart(e, col.id, modalDshdColumns); }}
                                      style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 2 }}
                                    />
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageItems.map((order) => (
                              <tr 
                                key={order.id} 
                                style={{ background: selectedOrderIds.has(order.id) ? '#e3f2fd' : 'transparent', cursor: 'pointer' }}
                                onClick={() => toggleOrderSelect(order.id)}
                              >
                                <td style={{ border: '1px solid #d9d9d9', padding: '6px', textAlign: 'center' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedOrderIds.has(order.id)}
                                    onChange={() => toggleOrderSelect(order.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                {modalDshdColumns.filter(c => c.visible).map((col) => (
                                  <td key={col.id} style={{ border: '1px solid #d9d9d9', padding: '6px', textAlign: col.align || 'center' }}>
                                    {(() => {
                                      switch (col.id) {
                                        case 'orderDate': return order.orderDate ? dayjs(order.orderDate).format('DD/MM/YYYY') : '';
                                        case 'maPhieu': return order.orderNumber || '';
                                        case 'tenKhachHang': return order.customerName || order.customer || '';
                                        case 'tongTienSauGiam': return (order.totalAfterDiscount || order.totalAmount || 0).toLocaleString('vi-VN');
                                        case 'status': return (<span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: order.status?.toLowerCase().includes('đã duyệt') ? '#d4edda' : '#f8d7da', color: order.status?.toLowerCase().includes('đã duyệt') ? '#155724' : '#721c24' }}>{order.status || ''}</span>);
                                        case 'createdBy': return order.createdBy || '';
                                        case 'taxRates': return order.taxRates || order.TaxRates || '';
                                        case 'loaiHang': return order.productType || '';
                                        case 'nvSale': return order.salesStaff || order.salesEmployee || '';
                                        case 'customerGroup': {
                                          const key = order.customerGroup || order.customerGroupId || order.customerGroupCode || (order.customerGroup || '').toString();
                                          return customerGroupsMap[key] || order.customerGroupName || order.customerGroup || '';
                                        }
                                        case 'salesSchedule': return order.salesSchedule || '';
                                        case 'tongTien': return (order.totalAmount || 0).toLocaleString('vi-VN');
                                        case 'totalKg': return Number(order.totalKg || 0).toLocaleString('vi-VN');
                                        case 'totalM3': return Number(order.totalM3 || 0).toLocaleString('vi-VN');
                                        case 'printOrder': return order.printOrder || '';
                                        case 'vehicle': return order.vehicle || '';
                                        case 'deliveryVehicle': return order.deliveryVehicle || '';
                                        case 'printStatus': return (<span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: (order.printCount || 0) > 0 ? '#d4edda' : '#f8d7da', color: (order.printCount || 0) > 0 ? '#155724' : '#721c24' }}>{(order.printCount || 0) > 0 ? 'Đã in' : 'Chưa in'}</span>);
                                        case 'printCount': return order.printCount || 0;
                                        case 'printDate': return order.printDate ? dayjs(order.printDate).format('DD/MM/YYYY') : '';
                                        case 'actions': return (<button onClick={(e) => { e.stopPropagation(); handleViewOrderDetail && handleViewOrderDetail(order.id); }} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Chi tiết</button>);
                                        default: return order[col.id] || '';
                                      }
                                    })()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13 }}>Hiển thị:</span>
                          <select value={orderSelectPageSize} onChange={(e) => { const v = e.target.value === 'all' ? 'All' : parseInt(e.target.value, 10); setOrderSelectPageSize(v); setOrderSelectCurrentPage(1); }} style={{ padding: '4px', fontSize: 13 }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value="all">Tất cả</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setOrderSelectCurrentPage(p => Math.max(1, p - 1))} disabled={orderSelectCurrentPage <= 1} style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4 }}>Trước</button>
                          <span>Trang {currentPage} / {totalPages}</span>
                          <button onClick={() => setOrderSelectCurrentPage(p => Math.min(totalPages, p + 1))} disabled={orderSelectCurrentPage >= totalPages} style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4 }}>Sau</button>
                          <span style={{ fontSize: 12, color: '#666' }}> ({total} đơn)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
            
            {/* Footer with selected count and buttons */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Đã chọn: <strong>{selectedOrderIds.size}</strong> / {ordersForSelect.length} đơn hàng
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => setShowOrderSelectModal(false)} 
                  style={{ padding: '10px 20px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmOrderSelection} 
                  disabled={selectedOrderIds.size === 0}
                  style={{ 
                    padding: '10px 20px', 
                    background: selectedOrderIds.size === 0 ? '#ccc' : '#667eea', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    cursor: selectedOrderIds.size === 0 ? 'default' : 'pointer', 
                    fontSize: 14 
                  }}
                >
                  ✓ Xác nhận ({selectedOrderIds.size} đơn)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InBangKeTong;
