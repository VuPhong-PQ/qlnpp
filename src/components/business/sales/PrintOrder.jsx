import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../config/api';
import SearchableSelect from '../../common/SearchableSelect';
import QRCode from 'qrcode';
import '../BusinessPage.css';
import './PrintOrder.css';

// Hàm xóa dấu tiếng Việt để tìm kiếm
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

// Format tax rates string
const formatTaxRates = (order) => {
  if (!order) return '';
  const raw = order.TaxRates || order.taxRates || '';
  if (!raw) return '';
  const parts = String(raw).split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
  const mapped = parts.map(p => {
    if (p.includes('%')) return p.replace(/\s*%/g, '%');
    const num = p.replace(/[^0-9.\-]/g, '');
    return num ? (num + '%') : p;
  });
  return mapped.join(', ');
};

const PrintOrder = () => {
  // Search state
  const [searchData, setSearchData] = useState({
    orderNumber: '',
    fromDate: '2026-01-01',
    toDate: '2026-02-28',
    customerGroup: '',
    salesSchedule: '',
    productType: '',
    customer: '',
    createdBy: '',
    salesStaff: '',
    taxRates: '',
    printCount: '',
    printFromDate: '',
    printToDate: '',
    printStatus: ''
  });

  // Data states
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [units, setUnits] = useState([]);

  // Pagination
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedOrders, setSelectedOrders] = useState(new Set());

  // Column search modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchColumn, setSearchColumn] = useState(null);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({});

  // Column settings (visibility/order) with localStorage
  const COLUMN_SETTINGS_KEY = 'printOrderColumnSettings';

  const defaultColumns = [
    { id: 'orderDate', label: 'Ngày lập', width: 120, visible: true },
    { id: 'orderNumber', label: 'Số phiếu', width: 150, visible: true },
    { id: 'customerGroup', label: 'Nhóm khách hàng', width: 140, visible: true },
    { id: 'salesSchedule', label: 'Lịch bán hàng', width: 140, visible: true },
    { id: 'customerName', label: 'Khách hàng', width: 200, visible: true },
    { id: 'vehicle', label: 'Xe', width: 100, visible: true },
    { id: 'deliveryVehicle', label: 'Xe giao hàng', width: 120, visible: true },
    { id: 'printOrder', label: 'STT in', width: 80, visible: true },
    { id: 'createdBy', label: 'Nhân viên lập', width: 140, visible: true },
    { id: 'salesStaff', label: 'Nhân viên sale', width: 140, visible: true },
    { id: 'productType', label: 'Loại hàng', width: 140, visible: true },
    { id: 'totalAmount', label: 'Tổng tiền', width: 120, visible: true },
    { id: 'totalAfterDiscount', label: 'Tổng tiền sau giảm', width: 140, visible: true },
    { id: 'totalKg', label: 'Tổng số kg', width: 100, visible: true },
    { id: 'totalM3', label: 'Tổng số khối', width: 100, visible: true },
    { id: 'taxRates', label: 'Thuế suất', width: 100, visible: true },
    { id: 'status', label: 'Trạng thái', width: 120, visible: true },
    { id: 'printStatus', label: 'Trạng thái in', width: 120, visible: true },
    { id: 'printCount', label: 'Số lần in', width: 80, visible: true },
    { id: 'printDate', label: 'Ngày in', width: 140, visible: true },
    { id: 'actions', label: 'Thao tác', width: 100, visible: true }
  ];

  const loadColumnSettings = () => {
    try {
      const s = localStorage.getItem(COLUMN_SETTINGS_KEY);
      if (!s) return null;
      return JSON.parse(s);
    } catch (error) {
      return null;
    }
  };

  const saveColumnSettings = (cols) => {
    try {
      localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(cols));
    } catch (error) {
      console.error('Error saving column settings:', error);
    }
  };

  const [columns, setColumns] = useState(() => {
    const saved = loadColumnSettings();
    return saved || defaultColumns;
  });

  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [settingsDragItem, setSettingsDragItem] = useState(null);

  // Column header drag / resize
  const [dragColumn, setDragColumn] = useState(null);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  useEffect(() => {
    saveColumnSettings(columns);
  }, [columns]);

  const toggleColumnVisibility = (id) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const resetColumns = () => {
    setColumns(defaultColumns);
  };

  const handleSettingsDragStart = (e, index) => {
    setSettingsDragItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSettingsDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSettingsDrop = (e, index) => {
    e.preventDefault();
    setColumns(prev => {
      const arr = [...prev];
      const item = arr.splice(settingsDragItem, 1)[0];
      arr.splice(index, 0, item);
      return arr;
    });
    setSettingsDragItem(null);
  };

  const handleSettingsDragEnd = () => {
    setSettingsDragItem(null);
  };

  // Column reorder handlers
  const handleColumnDragStart = (e, id) => {
    setDragColumn(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, id) => {
    e.preventDefault();
    if (!dragColumn || dragColumn === id) return;
    setColumns(prev => {
      const arr = [...prev];
      const from = arr.findIndex(c => c.id === dragColumn);
      const to = arr.findIndex(c => c.id === id);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setDragColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDragColumn(null);
  };

  // Column resize handlers
  const handleResizeStart = (e, id) => {
    e.preventDefault();
    setResizingColumn(id);
    setStartX(e.clientX);
    const col = columns.find(c => c.id === id);
    setStartWidth(col ? col.width : 120);

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX;
      setColumns(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(60, startWidth + dx) } : c));
    };

    const onMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Render cell content by key
  const renderCell = (order, key) => {
    switch (key) {
      case 'orderDate': return formatDate(order.orderDate);
      case 'orderNumber':
        return (
          <a href="#" className="order-link" onClick={(e) => { e.preventDefault(); handleViewDetails(order.id); }}>
            {order.orderNumber}
          </a>
        );
      case 'customerGroup': return getCustomerGroupName(order.customerGroup) || '-';
      case 'salesSchedule': return order.salesSchedule || '-';
      case 'customerName': return getCurrentCustomerName(order);
      case 'vehicle': return order.vehicle || '-';
      case 'deliveryVehicle': return order.deliveryVehicle || '-';
      case 'printOrder': return getCurrentCustomerPrintIn(order);
      case 'createdBy': return order.createdBy || '-';
      case 'salesStaff': return order.salesStaff || order.SalesStaff || '-';
      case 'productType': return order.productType || order.ProductType || '-';
      case 'totalAmount': return formatCurrency(order.totalAmount);
      case 'totalAfterDiscount': return formatCurrency(order.totalAfterDiscount);
      case 'totalKg': return formatNumber(order.totalKg);
      case 'totalM3': return formatNumber(order.totalM3);
      case 'taxRates': return formatTaxRates(order) || '-';
      case 'status': return (
        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
          {order.status || '-'}
        </span>
      );
      case 'printStatus': return (
        <span className={`status-badge ${getPrintStatusClass(order.printCount || 0)}`}>
          {(order.printCount || 0) > 0 ? 'Đã in' : 'Chưa in'}
        </span>
      );
      case 'printCount': return order.printCount || 0;
      case 'printDate': return order.printDate ? formatDate(order.printDate) : '-';
      case 'actions':
        return (
          <div className="table-actions">
            <button 
              className="action-btn btn-view"
              onClick={() => handleViewDetails(order.id)}
              title="Xem chi tiết"
            >
              📝
            </button>
          </div>
        );
      default: return order[key] ?? '-';
    }
  };

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date(2026, 0, 1)); // Jan 1, 2026
  const [selectedEndDate, setSelectedEndDate] = useState(new Date(2026, 1, 28)); // Feb 28, 2026
  const datePickerRef = useRef(null);

  // Print date picker states
  const [showPrintDatePicker, setShowPrintDatePicker] = useState(false);
  const [selectedPrintStartDate, setSelectedPrintStartDate] = useState(null);
  const [selectedPrintEndDate, setSelectedPrintEndDate] = useState(null);
  const printDatePickerRef = useRef(null);

  // Calendar navigation state
  const [calendarBaseDate, setCalendarBaseDate] = useState(new Date(2026, 0, 1)); // Jan 2026
  const [printCalendarBaseDate, setPrintCalendarBaseDate] = useState(new Date());
  
  // Date range input text state
  const [dateRangeInput, setDateRangeInput] = useState('01/01/2026 - 28/02/2026');
  const [printDateRangeInput, setPrintDateRangeInput] = useState('');

  // Pagination calculations
  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = pageSize === 'All'
    ? filteredOrders
    : filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, filteredOrders.length]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (printDatePickerRef.current && !printDatePickerRef.current.contains(event.target)) {
        setShowPrintDatePicker(false);
      }
    };

    if (showDatePicker || showPrintDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showPrintDatePicker]);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let currentUser = null;
      let isAdmin = false;
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          currentUser = JSON.parse(userStr);
        }
      } catch (e) {
        // parsing user from localStorage failed
      }
      
      try {
        const permStr = localStorage.getItem('permissions');
        if (permStr) {
          const permissions = JSON.parse(permStr);
          isAdmin = permissions.some(p => 
            p.startsWith('quan_tri_he_thong:') || 
            p === 'quan_tri_he_thong'
          );
        }
      } catch (e) {
        // parsing permissions from localStorage failed
      }
      
      if (!isAdmin && currentUser) {
        const username = currentUser.username || currentUser.name || currentUser.displayName || '';
        if (username.toLowerCase().includes('admin')) {
          isAdmin = true;
        }
      }
      
      const params = new URLSearchParams();
      if (isAdmin) {
        params.append('isAdmin', 'true');
      } else if (currentUser) {
        const username = currentUser.tenNhanVien || currentUser.name || currentUser.username || currentUser.displayName || '';
        if (username) {
          params.append('username', username);
        }
      }
      
      const url = `${API_BASE_URL}/Orders${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const ordersData = await response.json();
        // Only show approved orders (đã duyệt) on print-order page
        const approvedOrders = ordersData.filter(order => 
          order.status && order.status.toLowerCase() === 'đã duyệt'
        );
        setOrders(approvedOrders);
        // Apply initial date filter
        applyFilters(approvedOrders, searchData);
      } else {
        // failed to fetch orders: response not ok
      }
    } catch (error) {
      // error fetching orders
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      // error fetching customers
    }
  };

  // Fetch customer groups
  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/CustomerGroups`);
      if (response.ok) {
        const data = await response.json();
        setCustomerGroups(data);
      }
    } catch (error) {
      // error fetching customer groups
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      // error fetching users
    }
  };

  // Fetch company info
  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/CompanyInfos`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setCompanyInfo(data[0]);
        }
      }
    } catch (error) {
      // error fetching company info
    }
  };

  // Fetch units
  const fetchUnits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      // error fetching units
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchCustomerGroups();
    fetchUsers();
    fetchCompanyInfo();
    fetchUnits();
  }, []);

  // Listen for cross-component updates when customers change elsewhere
  useEffect(() => {
    const onCustomersUpdated = () => {
      fetchCustomers();
    };
    window.addEventListener('customersUpdated', onCustomersUpdated);
    return () => window.removeEventListener('customersUpdated', onCustomersUpdated);
  }, []);

  // When customers list updates, re-apply filters to trigger re-render with updated printIn values
  useEffect(() => {
    if (!customers || customers.length === 0) return;
    if (!orders || orders.length === 0) return;
    // Re-apply filters to refresh filteredOrders and trigger re-render
    applyFilters(orders, searchData);
  }, [customers]);

  // Parse date string
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  };

  // Format date input (yyyy-mm-dd) to display dd/mm/yyyy
  const formatInputToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    if (!num && num !== 0) return '-';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Get customer group name (component-level helper)
  const getCustomerGroupName = (code) => {
    const g = (customerGroups || []).find(cg => String(cg.code) === String(code));
    return g ? g.name : (code || '-');
  };

  // Get current customer name from customers list (to reflect updated names)
  const getCurrentCustomerName = (order) => {
    if (!order) return '-';
    const phone = order.phone || order.Phone || '';
    const oldName = order.customerName || order.customer || '';
    
    // Try to find customer by phone (most reliable)
    if (phone) {
      const byPhone = (customers || []).find(c => c.phone === phone);
      if (byPhone) return byPhone.name || oldName;
    }
    
    // Try to find by code matching old name
    const byCode = (customers || []).find(c => c.code === oldName || c.name === oldName);
    if (byCode) return byCode.name || oldName;
    
    // Fallback to stored name
    return oldName || '-';
  };

  // Get current customer address from customers list (to reflect updated address)
  const getCurrentCustomerAddress = (order) => {
    if (!order) return '';
    const phone = order.phone || order.Phone || '';
    const oldName = order.customerName || order.customer || '';
    const oldAddress = order.address || order.Address || '';
    
    // Try to find customer by phone (most reliable)
    if (phone) {
      const byPhone = (customers || []).find(c => c.phone === phone);
      if (byPhone) return byPhone.address || oldAddress;
    }
    
    // Try to find by code matching old name
    const byCode = (customers || []).find(c => c.code === oldName || c.name === oldName);
    if (byCode) return byCode.address || oldAddress;
    
    // Fallback to stored address
    return oldAddress || '';
  };

  // Get current customer printIn (STT in) from customers list (to reflect updated values)
  const getCurrentCustomerPrintIn = (order) => {
    if (!order) return 0;
    const phone = order.phone || order.Phone || '';
    const oldName = order.customerName || order.customer || '';
    
    // Try to find customer by phone (most reliable)
    if (phone) {
      const byPhone = (customers || []).find(c => c.phone === phone);
      if (byPhone) {
        const val = byPhone.printIn;
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
    
    // Try to find by code matching old name
    const byCode = (customers || []).find(c => c.code === oldName || c.name === oldName);
    if (byCode) {
      const val = byCode.printIn;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    
    // Fallback to stored printOrder on order
    return order.printOrder || 0;
  };

  // Apply filters
  const applyFilters = (ordersToFilter, filters) => {
    let filtered = [...ordersToFilter];

    // Filter by order number
    if (filters.orderNumber?.trim()) {
      const searchTerm = removeVietnameseTones(filters.orderNumber.trim());
      filtered = filtered.filter(order => 
        order.orderNumber && removeVietnameseTones(order.orderNumber).includes(searchTerm)
      );
    }

    // Filter by date range
    if (filters.fromDate && filters.toDate) {
      const startDate = new Date(filters.fromDate);
      const endDate = new Date(filters.toDate);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Filter by customer group
    if (filters.customerGroup) {
      filtered = filtered.filter(order => 
        order.customerGroup === filters.customerGroup
      );
    }

    // Filter by sales schedule
    if (filters.salesSchedule) {
      const searchTerm = removeVietnameseTones(filters.salesSchedule);
      filtered = filtered.filter(order => 
        order.salesSchedule && removeVietnameseTones(order.salesSchedule).includes(searchTerm)
      );
    }

    // Filter by customer
    if (filters.customer) {
      const searchTerm = removeVietnameseTones(filters.customer);
      filtered = filtered.filter(order => {
        const currentName = getCurrentCustomerName(order);
        return (currentName && removeVietnameseTones(currentName).includes(searchTerm)) ||
          (order.customer && removeVietnameseTones(order.customer).includes(searchTerm));
      });
    }

    // Filter by created by
    if (filters.createdBy) {
      const searchTerm = removeVietnameseTones(filters.createdBy);
      filtered = filtered.filter(order => 
        order.createdBy && removeVietnameseTones(order.createdBy).includes(searchTerm)
      );
    }

    // Filter by sales staff
    if (filters.salesStaff) {
      const searchTerm = removeVietnameseTones(filters.salesStaff);
      filtered = filtered.filter(order => 
        (order.salesStaff && removeVietnameseTones(order.salesStaff).includes(searchTerm)) ||
        (order.SalesStaff && removeVietnameseTones(order.SalesStaff).includes(searchTerm))
      );
    }

    // Filter by product type
    if (filters.productType) {
      const searchTerm = removeVietnameseTones(filters.productType);
      filtered = filtered.filter(order =>
        (order.productType && removeVietnameseTones(order.productType).includes(searchTerm)) ||
        (order.ProductType && removeVietnameseTones(order.ProductType).includes(searchTerm))
      );
    }

    // Filter by tax rates (thuế suất)
    if (filters.taxRates) {
      const searchTerm = removeVietnameseTones(filters.taxRates);
      filtered = filtered.filter(order => {
        const raw = order.TaxRates || order.taxRates || '';
        if (raw) {
          const parts = String(raw).split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
          if (parts.some(p => removeVietnameseTones(p).includes(searchTerm))) return true;
        }
        // fallback to formatted taxRates string
        const formatted = formatTaxRates(order) || '';
        return formatted && removeVietnameseTones(formatted).includes(searchTerm);
      });
    }

    // Filter by print status
    if (filters.printStatus) {
      filtered = filtered.filter(order => {
        const printCount = order.printCount || 0;
        if (filters.printStatus === 'Đã in') {
          return printCount > 0;
        } else if (filters.printStatus === 'Chưa in') {
          return printCount === 0;
        }
        return true;
      });
    }

    // Apply column filters
    Object.keys(columnFilters).forEach(colId => {
      const filterValue = columnFilters[colId];
      if (filterValue) {
        const searchTerm = removeVietnameseTones(filterValue);
        filtered = filtered.filter(order => {
          let value = '';
          switch (colId) {
            case 'orderNumber': value = order.orderNumber; break;
            case 'customerGroup': value = order.customerGroup; break;
            case 'salesSchedule': value = order.salesSchedule; break;
            case 'customerName': value = getCurrentCustomerName(order); break;
            case 'vehicle': value = order.vehicle; break;
            case 'deliveryVehicle': value = order.deliveryVehicle; break;
            case 'createdBy': value = order.createdBy; break;
            case 'salesStaff': value = order.salesStaff || order.SalesStaff; break;
            default: value = '';
          }
          return value && removeVietnameseTones(value).includes(searchTerm);
        });
      }
    });

    setFilteredOrders(filtered);
  };

  // Handle search button click
  const handleSearch = () => {
    applyFilters(orders, searchData);
    setCurrentPage(1);
  };

  // Handle checkbox selection
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(order => order.id)));
    }
  };

  // Handle view order details
  const handleViewDetails = (orderId) => {
    window.open(`/business/sales/create-order-form?id=${orderId}`, '_blank');
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Đã duyệt': return 'status-approved';
      case 'Chưa duyệt': return 'status-pending';
      case 'Hủy': return 'status-cancelled';
      case 'Đơn gộp': return 'status-merged';
      case 'Đơn đã gộp': return 'status-completed';
      default: return 'status-draft';
    }
  };

  const getPrintStatusClass = (printCount) => {
    return printCount > 0 ? 'status-printed' : 'status-not-printed';
  };

  // Column search modal
  const openColumnSearch = (columnId, columnLabel) => {
    setSearchColumn({ id: columnId, label: columnLabel });
    setColumnSearchQuery(columnFilters[columnId] || '');
    setShowSearchModal(true);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchColumn(null);
    setColumnSearchQuery('');
  };

  const handleColumnSearch = (value) => {
    setColumnSearchQuery(value);
  };

  const getUniqueColumnValues = (col) => {
    if (!col) return [];
    const key = col.id;
    const values = new Set();
    (filteredOrders || orders || []).forEach(order => {
      let v = '';
      switch (key) {
        case 'orderNumber': v = order.orderNumber; break;
        case 'customerGroup': v = getCustomerGroupName(order.customerGroup); break;
        case 'salesSchedule': v = order.salesSchedule; break;
        case 'customerName': v = getCurrentCustomerName(order); break;
        case 'vehicle': v = order.vehicle; break;
        case 'deliveryVehicle': v = order.deliveryVehicle; break;
        case 'createdBy': v = order.createdBy; break;
        case 'salesStaff': v = order.salesStaff || order.SalesStaff; break;
        default: v = order[key]; break;
      }
      if (v !== undefined && v !== null) {
        const s = String(v).trim();
        if (s) values.add(s);
      }
    });
    return Array.from(values).sort((a,b) => a.localeCompare(b, 'vi'));
  };

  const applyColumnSearch = () => {
    const newFilters = { ...columnFilters };
    if (columnSearchQuery.trim()) {
      newFilters[searchColumn.id] = columnSearchQuery.trim();
    } else {
      delete newFilters[searchColumn.id];
    }
    setColumnFilters(newFilters);
    applyFilters(orders, searchData);
    setShowSearchModal(false);
  };

  const clearColumnSearch = (colId) => {
    const newFilters = { ...columnFilters };
    delete newFilters[colId];
    setColumnFilters(newFilters);
    applyFilters(orders, searchData);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('In_Don_Hang');

      // Page setup: A4 Portrait modern layout
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        horizontalCentered: true,
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
      };

      // Define columns to include all main order fields
      const cols = [
        { header: 'Id', key: 'id', width: 8 },
        { header: 'Ngày lập', key: 'orderDate', width: 18 },
        { header: 'Số phiếu', key: 'orderNumber', width: 18 },
        { header: 'Nhóm khách hàng', key: 'customerGroup', width: 24 },
        { header: 'Lịch bán hàng', key: 'salesSchedule', width: 16 },
        { header: 'Khách hàng (code)', key: 'customer', width: 18 },
        { header: 'Tên khách hàng', key: 'customerName', width: 36 },
        { header: 'Địa chỉ', key: 'address', width: 36 },
        { header: 'Điện thoại', key: 'phone', width: 16 },
        { header: 'Xe', key: 'vehicle', width: 14 },
        { header: 'Xe giao hàng', key: 'deliveryVehicle', width: 18 },
        { header: 'STT in', key: 'printOrder', width: 10 },
        { header: 'Số lần in', key: 'printCount', width: 10 },
        { header: 'Ngày in', key: 'printDate', width: 18 },
        { header: 'Nhân viên lập', key: 'createdBy', width: 18 },
        { header: 'Nhân viên sale', key: 'salesStaff', width: 18 },
        { header: 'Loại hàng', key: 'productType', width: 18 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 16 },
        { header: 'Tổng tiền sau giảm', key: 'totalAfterDiscount', width: 18 },
        { header: 'Tổng số kg', key: 'totalKg', width: 12 },
        { header: 'Tổng số khối', key: 'totalM3', width: 12 },
        { header: 'Tổng cân (weight)', key: 'totalWeight', width: 12 },
        { header: 'Tổng thể tích (volume)', key: 'totalVolume', width: 14 },
        { header: 'Thuế suất', key: 'taxRates', width: 14 },
        { header: 'Trạng thái', key: 'status', width: 14 },
        { header: 'Mô tả', key: 'notes', width: 36 },
        { header: 'Ghi chú', key: 'remarks', width: 18 },
        { header: 'Mô tả giao hàng', key: 'deliveryNote', width: 28 },
        { header: 'Số hóa đơn', key: 'invoiceNumber', width: 18 },
        { header: 'Thanh toán', key: 'payment', width: 14 },
        { header: 'Quỹ thu', key: 'accountFund', width: 14 },
        { header: 'MergeFrom', key: 'mergeFromOrder', width: 12 },
        { header: 'MergeTo', key: 'mergeToOrder', width: 12 },
        { header: 'VatExport', key: 'vatExport', width: 12 },
        { header: 'Location', key: 'location', width: 18 }
      ];

      worksheet.columns = cols;

      // Insert top info rows: company info, title, filters
      const compName = companyInfo?.companyName || companyInfo?.name || 'CÔNG TY';
      const compAddr = companyInfo?.address || '';
      const compPhone = companyInfo?.phone || '';

      // Build filters summary
      const activeFilters = [];
      if (searchData) {
        if (searchData.orderNumber) activeFilters.push(`Số phiếu: ${searchData.orderNumber}`);
        if (searchData.fromDate || searchData.toDate) activeFilters.push(`Ngày: ${formatInputToDDMMYYYY(searchData.fromDate)} - ${formatInputToDDMMYYYY(searchData.toDate)}`);
        if (searchData.customerGroup) activeFilters.push(`Nhóm KH: ${getCustomerGroupName(searchData.customerGroup)}`);
        if (searchData.customer) activeFilters.push(`Khách hàng: ${searchData.customer}`);
        if (searchData.createdBy) activeFilters.push(`Người lập: ${searchData.createdBy}`);
        if (searchData.salesStaff) activeFilters.push(`Nhân viên sale: ${searchData.salesStaff}`);
      }
      // columnFilters
      const colFilterEntries = Object.entries(columnFilters || {}).map(([k,v]) => `${k}: ${v}`);
      const filtersText = [...activeFilters, ...colFilterEntries].join(' | ');

      // Insert rows at top (will push header row down)
      worksheet.insertRow(1, [compName]);
      worksheet.mergeCells(1, 1, 1, cols.length);
      worksheet.getRow(1).font = { bold: true, size: 14 };

      worksheet.insertRow(2, [`Địa chỉ: ${compAddr}    Điện thoại: ${compPhone}`]);
      worksheet.mergeCells(2, 1, 2, cols.length);
      worksheet.getRow(2).font = { italic: true, size: 10 };

      worksheet.insertRow(3, ['DANH SÁCH ĐƠN HÀNG']);
      worksheet.mergeCells(3, 1, 3, cols.length);
      worksheet.getRow(3).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };

      worksheet.insertRow(4, [filtersText || '']);
      worksheet.mergeCells(4, 1, 4, cols.length);
      worksheet.getRow(4).font = { size: 9 };

      worksheet.insertRow(5, []);

      // After inserting, header is shifted down. Find header row index
      const headerRowIndex = 6; // headers from worksheet.columns are at row after inserted rows

      // Style header row
      const headerRow = worksheet.getRow(headerRowIndex);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      headerRow.height = 20;

      // Freeze panes to keep header visible
      worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

      // Auto filter across header
      worksheet.autoFilter = { from: { row: headerRowIndex, column: 1 }, to: { row: headerRowIndex, column: cols.length } };

      // Ensure wrap text for long columns
      try { worksheet.getColumn('customerName').alignment = { wrapText: true, vertical: 'top' }; } catch {}
      try { worksheet.getColumn('address').alignment = { wrapText: true, vertical: 'top' }; } catch {}
      try { worksheet.getColumn('notes').alignment = { wrapText: true, vertical: 'top' }; } catch {}

      // Data rows (use filteredOrders which respects current search & filters)
      filteredOrders.forEach(order => {
        worksheet.addRow({
          id: order.id,
          orderDate: formatDate(order.orderDate),
          orderNumber: order.orderNumber,
          customerGroup: getCustomerGroupName(order.customerGroup),
          salesSchedule: order.salesSchedule || '-',
          customer: order.customer || order.Customer || '-',
          customerName: getCurrentCustomerName(order),
          address: getCurrentCustomerAddress(order) || order.address || order.Address || '-',
          phone: order.phone || order.Phone || '-',
          vehicle: order.vehicle || '-',
          deliveryVehicle: order.deliveryVehicle || '-',
          printOrder: getCurrentCustomerPrintIn(order),
          printCount: order.printCount || 0,
          printDate: order.printDate ? formatDate(order.printDate) : '-',
          createdBy: order.createdBy || '-',
          salesStaff: order.salesStaff || order.SalesStaff || '-',
          productType: order.productType || order.ProductType || '-',
          totalAmount: order.totalAmount || 0,
          totalAfterDiscount: order.totalAfterDiscount || 0,
          totalKg: order.totalKg || 0,
          totalM3: order.totalM3 || 0,
          totalWeight: order.totalWeight || order.TotalWeight || '-',
          totalVolume: order.totalVolume || order.TotalVolume || '-',
          taxRates: formatTaxRates(order),
          status: order.status || '-',
          notes: order.notes || order.Notes || order.note || order.Note || '',
          deliveryNote: order.deliveryNote || order.DeliveryNote || '',
          invoiceNumber: order.invoiceNumber || order.InvoiceNumber || '',
          payment: order.payment || order.Payment || 0,
          accountFund: order.accountFund || order.AccountFund || '',
          mergeFromOrder: order.mergeFromOrder || order.MergeFromOrder || '',
          mergeToOrder: order.mergeToOrder || order.MergeToOrder || '',
          vatExport: order.vatExport || order.VatExport || false,
          location: order.location || order.Location || ''
        });
      });

      // --- Add detailed items sheet (summary by customer group) ---
      try {
        const prodResp = await fetch(`${API_BASE_URL}/Products`);
        const products = prodResp && prodResp.ok ? await prodResp.json() : [];

        const orderDetailsPromises = filteredOrders.map(async (o) => {
          try {
            const r = await fetch(`${API_BASE_URL}/Orders/${o.id}`);
            if (r.ok) return await r.json();
          } catch (e) {}
          return null;
        });
        const orderDetails = await Promise.all(orderDetailsPromises);
        const validOrderDetails = orderDetails.filter(x => x);

        const grouped = {};
        validOrderDetails.forEach(od => {
          const order = od.order;
          const items = [...(od.items || []), ...(od.promotionItems || [])];
          const groupKey = order.customerGroup || 'null';
          if (!grouped[groupKey]) grouped[groupKey] = {};

          items.forEach(it => {
            const key = it.barcode || it.productCode || it.productName || Math.random().toString(36).slice(2);
            if (!grouped[groupKey][key]) {
              const product = products.find(p => p.barcode === it.barcode || p.code === it.productCode || p.name === it.productName);
              grouped[groupKey][key] = {
                barcode: it.barcode || '',
                productCode: it.productCode || '',
                productName: it.productName || '',
                unit1: product?.unit1 || product?.defaultUnit || it.unit || '',
                baseUnit: product?.baseUnit || '',
                conversionToBase: parseFloat(it.conversion) || parseFloat(product?.conversion1) || 1,
                convUnit1: parseFloat(product?.conversion1) || parseFloat(it.conversion) || 1,
                baseQuantity: 0,
                note: it.description || ''
              };
            }
            const entry = grouped[groupKey][key];
            const qty = parseFloat(it.quantity) || 0;
            entry.baseQuantity += qty * (parseFloat(entry.conversionToBase) || 1);
          });
        });

        const itemsSheet = workbook.addWorksheet('ChiTiet_TongHop');
        itemsSheet.columns = [
          { header: 'Nhóm khách hàng', key: 'customerGroup', width: 28 },
          { header: 'Mã vạch', key: 'barcode', width: 18 },
          { header: 'Tên hàng', key: 'productName', width: 48 },
          { header: 'ĐVT1', key: 'unit1', width: 12 },
          { header: 'SL 1', key: 'sl1', width: 12 },
          { header: 'ĐVT gốc', key: 'baseUnit', width: 12 },
          { header: 'SL gốc', key: 'baseQty', width: 14 },
          { header: 'Ghi chú', key: 'note', width: 24 }
        ];

        Object.keys(grouped).forEach(groupKey => {
          const map = grouped[groupKey];
          const groupName = groupKey === 'null' || !groupKey ? 'null' : getCustomerGroupName(groupKey);
          Object.values(map).forEach(it => {
            const baseQty = parseFloat(it.baseQuantity) || 0;
            const convUnit1 = parseFloat(it.convUnit1) || 1;
            const sl1 = Math.floor(baseQty / convUnit1);
            const baseRemaining = baseQty - (sl1 * convUnit1);
            itemsSheet.addRow({ customerGroup: groupName, barcode: it.barcode, productName: it.productName, unit1: it.unit1, sl1: sl1, baseUnit: it.baseUnit, baseQty: baseRemaining, note: it.note });
          });
        });

        // header style
        const hdr = itemsSheet.getRow(1);
        hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        itemsSheet.views = [{ state: 'frozen', ySplit: 1 }];
      } catch (e) {
        // ignore errors creating items sheet
      }

      // Format numeric columns
      ['totalAmount','totalAfterDiscount','totalKg','totalM3','payment'].forEach(key => {
        const col = worksheet.getColumn(key);
        if (col) col.numFmt = '#,##0.00';
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DanhSach_DonHang_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Có lỗi khi xuất Excel');
    }
  };

  // Export Summary (Phiếu xuất hàng tổng hợp)
  const handleExportSummary = async () => {
    if (selectedOrders.size === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng để xuất phiếu tổng hợp');
      return;
    }

    setLoading(true);
    try {
      // Get selected order IDs
      const orderIds = Array.from(selectedOrders);
      const selectedOrderObjects = (orders || []).filter(o => orderIds.includes(o.id));

      if (selectedOrderObjects.length === 0) {
        alert('Không tìm thấy đơn hàng đã chọn');
        setLoading(false);
        return;
      }

      // Fetch full order details for each selected order
      const orderDetailsPromises = selectedOrderObjects.map(async (orderObj) => {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderObj.id}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      });
      
      const orderDetails = await Promise.all(orderDetailsPromises);
      const validOrders = orderDetails.filter(o => o !== null);

      if (validOrders.length === 0) {
        alert('Không thể tải chi tiết đơn hàng');
        setLoading(false);
        return;
      }

      // Fetch products for unit info
      let products = [];
      try {
        const prodResponse = await fetch(`${API_BASE_URL}/Products`);
        if (prodResponse.ok) {
          products = await prodResponse.json();
        }
      } catch (e) {
        // continue without product data
      }

      // Group orders by customer group
      const groupedByCustomerGroup = {};
      validOrders.forEach((od) => {
        const order = od.order;
        const groupKey = order.customerGroup || 'null';
        if (!groupedByCustomerGroup[groupKey]) {
          groupedByCustomerGroup[groupKey] = [];
        }
        groupedByCustomerGroup[groupKey].push(od);
      });

      // Get customer group names
      const customerGroupNames = Object.keys(groupedByCustomerGroup).map(key => {
        if (key === 'null' || !key) return 'null';
        return getCustomerGroupName(key);
      });

      // Aggregate items by product within each customer group
      const aggregatedData = {};
      Object.keys(groupedByCustomerGroup).forEach(groupKey => {
        const ordersInGroup = groupedByCustomerGroup[groupKey];
        const itemsMap = {};

        ordersInGroup.forEach(od => {
          const items = [...(od.items || []), ...(od.promotionItems || [])];
          items.forEach(item => {
            const productKey = item.barcode || item.productCode || item.productName;
            if (!itemsMap[productKey]) {
              // Find product for unit info
              const product = products.find(p => 
                p.barcode === item.barcode || 
                p.code === item.productCode ||
                p.name === item.productName
              );

              itemsMap[productKey] = {
                barcode: item.barcode || '',
                productCode: item.productCode || '',
                productName: item.productName || '',
                // Use product's "ĐVT 1" (Unit1) when available, otherwise fall back to defaults
                unit1: product?.unit1 || product?.defaultUnit || item.unit || '',
                quantity1: 0,
                baseUnit: product?.baseUnit || '',
                baseQuantity: 0,
                // conversionToBase: number of base units per the item's unit (used to compute baseQuantity)
                conversionToBase: parseFloat(item.conversion) || parseFloat(product?.conversion1) || 1,
                // convUnit1: number of base units per "ĐVT 1" (Quy đổi 1) - prefer product setting
                convUnit1: parseFloat(product?.conversion1) || parseFloat(item.conversion) || 1,
                note: item.description || ''
              };
            }

            // Add quantity
            const qty = parseFloat(item.quantity) || 0;
            itemsMap[productKey].quantity1 += qty;
            // Calculate base quantity using conversionToBase
            const conversionToBase = parseFloat(itemsMap[productKey].conversionToBase) || 1;
            itemsMap[productKey].baseQuantity += qty * conversionToBase;
          });
        });

        // After aggregating raw quantities, compute final SL1 as integer part of (baseQuantity / convUnit1)
        const values = Object.values(itemsMap).map(it => {
          const convUnit1 = parseFloat(it.convUnit1) || 1; // base units per ĐVT1
          const baseQty = parseFloat(it.baseQuantity) || 0;
          // SL1 = floor(baseQuantity / convUnit1)
          const sl1 = Math.floor(baseQty / convUnit1);
          const baseRemaining = baseQty - (sl1 * convUnit1);
          return { ...it, quantity1: sl1, baseRemaining };
        });

        aggregatedData[groupKey] = values;
      });

      // Get date range from selected orders
      const orderDates = validOrders.map(od => new Date(od.order.orderDate)).filter(d => !isNaN(d));
      const minDate = orderDates.length > 0 ? new Date(Math.min(...orderDates)) : new Date();
      const maxDate = orderDates.length > 0 ? new Date(Math.max(...orderDates)) : new Date();

      const formatDate = (d) => {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      // Format quantities: show integer without decimals, otherwise show up to 3 decimals trimmed
      const formatQty = (v) => {
        const n = Number(v) || 0;
        if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
        let s = n.toFixed(3);
        s = s.replace(/\.?(0+)$/,'');
        // remove trailing dot if any
        s = s.replace(/\.$/, '');
        return s;
      };

      // Company info
      const compName = companyInfo?.companyName || companyInfo?.name || 'CÔNG TY TNHH MTV PHÂN PHỐI TPQ';
      const compAddr = companyInfo?.address || '';
      const compPhone = companyInfo?.phone || '';

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
            .group-header { background-color: #f0f0f0; font-weight: bold; font-style: italic; }
            .product-name { white-space: normal; word-wrap: break-word; text-align: center; }
            .nested-header { background-color: #e8e8e8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${compName}</div>
            <div class="company-info">Địa chỉ: ${compAddr}</div>
            <div class="company-info">Điện thoại: ${compPhone}</div>
          </div>
          
          <div class="title">PHIẾU XUẤT HÀNG TỔNG HỢP THEO KHU VỰC ${customerGroupNames.join(', ')}</div>
          <div class="subtitle">Từ ngày: ${formatDate(minDate)} đến ngày: ${formatDate(maxDate)}</div>
          
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 40px;">STT</th>
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

      // Add rows for each customer group
      Object.keys(aggregatedData).forEach(groupKey => {
        const groupName = groupKey === 'null' || !groupKey ? 'null' : getCustomerGroupName(groupKey);
        const items = aggregatedData[groupKey];

        // Group header row
        printContent += `
          <tr class="group-header">
            <td colspan="8"><strong>Nhóm khách hàng: ${groupName}</strong></td>
          </tr>
        `;

        // Item rows
        items.forEach((item, index) => {
          printContent += `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.barcode}</td>
              <td class="product-name">${item.productName}</td>
              <td class="text-center">${getUnitLabel(item.unit1)}</td>
              <td class="text-right">${formatQty(item.quantity1)}</td>
              <td class="text-center">${getUnitLabel(item.baseUnit)}</td>
              <td class="text-right">${formatQty(item.baseRemaining)}</td>
              <td></td>
            </tr>
          `;
        });
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
      }

    } catch (error) {
      console.error('Error exporting summary:', error);
      alert('Có lỗi xảy ra khi xuất phiếu tổng hợp');
    } finally {
      setLoading(false);
    }
  };

  // Helper: three digits to Vietnamese words
  const threeDigitsToWords = (n) => {
    const ones = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    const parts = [];
    if (hundred > 0) parts.push(ones[hundred] + ' trăm');
    if (ten > 1) {
      parts.push(ones[ten] + ' mươi');
      if (unit === 1) parts.push('mốt');
      else if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(ones[unit]);
    } else if (ten === 1) {
      parts.push('mười');
      if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(ones[unit]);
    } else if (unit > 0) {
      if (hundred > 0) parts.push('lẻ');
      if (unit > 0) parts.push(ones[unit]);
    }
    return parts.join(' ');
  };

  // Helper: number to Vietnamese text
  const numberToVietnamese = (n) => {
    const raw = Number(n) || 0;
    const abs = Math.abs(raw);
    const intPart = Math.floor(abs);
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];
    const parts = [];
    let num = intPart;
    let scaleIdx = 0;
    if (num === 0) parts.push('không');
    while (num > 0) {
      const segment = num % 1000;
      if (segment > 0) {
        const words = threeDigitsToWords(segment);
        parts.unshift((words ? words + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') : '').trim());
      }
      num = Math.floor(num / 1000);
      scaleIdx += 1;
    }
    const intWords = parts.join(' ').replace(/\s+/g, ' ').trim();
    let result = (intWords ? intWords.charAt(0).toUpperCase() + intWords.slice(1) : 'Không');
    return result + ' đồng';
  };

  // Get unit label from code
  const getUnitLabel = (unitCode) => {
    if (!unitCode) return '';
    const u = (units || []).find(x => String(x.code) === String(unitCode) || String(x.name) === String(unitCode));
    return u ? (u.name || String(unitCode)) : String(unitCode);
  };

  // Print selected orders
  const handlePrintSelected = async () => {
    if (selectedOrders.size === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng để in');
      return;
    }
    
    setLoading(true);
    try {
      // Determine selected orders
      const orderIds = Array.from(selectedOrders);
      const selectedOrderObjects = (orders || []).filter(o => orderIds.includes(o.id));

      // Group by printOrder value (using live customer printIn), sort groups descending,
      // and randomize order within groups that have equal printOrder.
      const groups = {};
      selectedOrderObjects.forEach(o => {
        const key = getCurrentCustomerPrintIn(o);
        if (!groups[key]) groups[key] = [];
        groups[key].push(o);
      });

      const keys = Object.keys(groups).map(k => parseInt(k, 10)).sort((a, b) => b - a);

      // Fisher-Yates shuffle
      const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };

      const orderedSelected = [];
      for (const k of keys) {
        const group = groups[k];
        if (group.length > 1) shuffle(group);
        orderedSelected.push(...group);
      }

      const selectedOrderObjectsSorted = orderedSelected;

      // Fetch full order details for each selected order in the sorted order
      const orderDetailsPromises = selectedOrderObjectsSorted.map(async (orderObj) => {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderObj.id}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      });
      
      const orderDetails = await Promise.all(orderDetailsPromises);
      const validOrders = orderDetails.filter(o => o !== null);
      
      if (validOrders.length === 0) {
        alert('Không thể tải chi tiết đơn hàng');
        return;
      }

      // Generate QR codes for each order
      const qrCodes = await Promise.all(validOrders.map(async (od) => {
        try {
          const qr = await QRCode.toDataURL(od.order.orderNumber || '', { width: 150, margin: 1 });
          return qr;
        } catch {
          return '';
        }
      }));

      // Format date for display
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      // Format number
      const formatNum = (num) => {
        if (!num && num !== 0) return '0';
        return new Intl.NumberFormat('vi-VN').format(num);
      };

      // (use component-level getCustomerGroupName)

      // Company info
      const compName = companyInfo?.name || 'NPP THỊNH PHÚ QUỐC';
      const compAddr = companyInfo?.address || '';
      const compPhone = companyInfo?.phone || '';

      // Build print HTML
      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>In Đơn Hàng</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .page-break { page-break-after: always; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; width: 100%; }
            /* Column "Tên hàng" with wrap text */
            td.product-name { white-space: normal; word-wrap: break-word; }
            .invoice-page { width: 100%; padding: 8px; }
            .header-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
            .header-main { flex: 1; }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .header-left { flex: 1; }
            .header-right { text-align: right; padding-right: 10px; }
            .company-name { font-weight: bold; font-size: 13px; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin: 8px 0 4px; }
            .subtitle { text-align: center; margin-bottom: 8px; }
            /* Customer info + QR/Confirm in same row */
            .customer-qr-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .customer-info { flex: 1; max-width: 58%; word-wrap: break-word; overflow-wrap: break-word; }
            .customer-info strong { font-size: 12px; }
            /* QR + Confirm box wrapper - horizontal, aligned to right */
            .qr-confirm-wrapper { display: flex; flex-direction: row; align-items: flex-start; gap: 12px; flex-shrink: 0; }
            .qr-section { text-align: center; }
            .qr-section img { width: 80px; height: 80px; }
            .qr-label { font-size: 9px; margin-top: 2px; font-weight: bold; }
            .confirm-box { border: 1px solid #000; padding: 6px; width: 120px; min-height: 60px; text-align: center; background: #fff; }
            .confirm-box .confirm-label { font-size: 10px; margin-bottom: 4px; }
            .confirm-box .confirm-body { min-height: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th, td { border: 1px solid #000; padding: 4px 6px; }
            th { background-color: #d9e1f2; font-weight: bold; text-align: center; }
            td.text-center { text-align: center; }
            td.text-right { text-align: right; }
            .section-header { background-color: #fff2cc; font-weight: bold; font-style: italic; }
            .promo-header { background-color: #e2efda; }
            .totals-section { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .totals-left { flex: 1; }
            .totals-right { text-align: right; }
            .totals-right table { width: auto; margin-left: auto; }
            .totals-right td { border: none; padding: 2px 8px; }
            .total-final { color: red; font-weight: bold; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 16px; }
            .signature-box { text-align: center; width: 30%; }
            .signature-label { font-style: italic; font-size: 10px; }
            .footer-warning { text-align: center; color: red; font-weight: bold; margin-top: 12px; font-size: 10px; }
            .note-section { margin-top: 8px; }
            .total-words { font-style: italic; font-weight: bold; margin-bottom: 8px; }
            .weight-info { font-weight: bold; margin-bottom: 8px; }
            /* Layout tweaks: align table cells to top, improve line-height and spacing for customer block */
            table th, table td { vertical-align: top; line-height: 1.25; }
            .customer-info { text-align: left; }
            .customer-info > div { margin-bottom: 4px; }
            .invoice-page { line-height: 1.25; }
          </style>
        </head>
        <body>
      `;

      validOrders.forEach((od, idx) => {
        const order = od.order;
        const items = od.items || [];
        const promoItems = od.promotionItems || [];
        const qrCode = qrCodes[idx];
        
        // Get current customer name from customers list
        const currentCustomerName = getCurrentCustomerName(order);
        const currentCustomerAddress = getCurrentCustomerAddress(order);

        // Calculate totals
        let totalAmount = 0;
        items.forEach(item => {
          totalAmount += parseFloat(item.totalAfterCK) || 0;
        });
        const discountPercent = parseFloat(order.discountPercent) || 0;
        const discountAmount = parseFloat(order.discountAmount) || 0;
        const finalTotal = totalAmount - discountAmount;
        const totalKg = (parseFloat(order.totalKg) || 0) + (parseFloat(order.promoTotalKg) || 0);
        const totalM3 = (parseFloat(order.totalM3) || 0) + (parseFloat(order.promoTotalM3) || 0);

        // In 2 liên cho mỗi đơn hàng
        for (let lien = 1; lien <= 2; lien++) {
        const isFirstPage = idx === 0 && lien === 1;
        printContent += `
          <div class="invoice-page" ${!isFirstPage ? 'style="page-break-before: always;"' : ''}>
            <div class="header-wrapper">
              <div class="header-main">
                <div class="header-row">
                  <div class="header-left">
                    <div class="company-name">${compName}</div>
                    <div>Địa chỉ: ${compAddr}</div>
                    <div>Điện thoại: ${compPhone}</div>
                  </div>
                  <div class="header-right">
                    <div>Số: <strong>${order.orderNumber || ''}</strong></div>
                    <div>Tọa độ: </div>
                    <div>Nhóm: ${getCustomerGroupName(order.customerGroup)}</div>
                    <div>STT In: ${getCurrentCustomerPrintIn(order)}</div>
                  </div>
                </div>
              </div>
            </div>
              
              <div class="title">PHIẾU GIAO HÀNG KIỂM XÁC NHẬN CÔNG NỢ</div>
              <div class="subtitle">Liên: ${lien}</div>
              
              <div class="customer-qr-row">
                <div class="customer-info">
                  <div>Khách hàng: <strong>${currentCustomerName}</strong></div>
                  <div>Địa chỉ: ${currentCustomerAddress}</div>
                  <div>ĐT: ${order.phone || ''}</div>
                </div>
                <div class="qr-confirm-wrapper">
                  <div class="qr-section">
                    ${qrCode ? `<img src="${qrCode}" alt="QR"/><div class="qr-label">${order.orderNumber || ''}</div>` : ''}
                  </div>
                  <div class="confirm-box">
                    <div class="confirm-label">Xác nhận đã thanh toán</div>
                    <div class="confirm-body"></div>
                  </div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width:5%">STT</th>
                    <th style="width:10%">NVBH</th>
                    <th style="width:13%">MV</th>
                    <th style="width:30%">Tên hàng</th>
                    <th style="width:6%">ĐVT</th>
                    <th style="width:6%">SL</th>
                    <th style="width:9%">Đơn giá</th>
                    <th style="width:5%">%CK</th>
                    <th style="width:8%">Giá sau CK</th>
                    <th style="width:8%">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="section-header">
                    <td colspan="10">Hàng bán</td>
                  </tr>
        `;

        let stt = 1;
        items.forEach(item => {
          printContent += `
            <tr>
              <td class="text-center">${stt++}</td>
              <td>${item.nvSales || ''}</td>
              <td>${item.barcode || ''}</td>
              <td class="product-name">${item.productName || ''}</td>
              <td class="text-center">${getUnitLabel(item.unit)}</td>
              <td class="text-right">${formatNum(item.quantity)}</td>
              <td class="text-right">${formatNum(item.unitPrice)}</td>
              <td class="text-right">${item.discountPercent || 0}</td>
              <td class="text-right">${formatNum(item.priceAfterCK)}</td>
              <td class="text-right">${formatNum(item.totalAfterCK)}</td>
            </tr>
          `;
        });

        if (promoItems.length > 0) {
          printContent += `<tr class="section-header promo-header"><td colspan="10">Hàng khuyến mãi</td></tr>`;
          promoItems.forEach(item => {
            printContent += `
              <tr>
                <td class="text-center">${stt++}</td>
                <td>${item.nvSales || ''}</td>
                <td>${item.barcode || ''}</td>
                <td class="product-name">${item.productName || ''}</td>
                <td class="text-center">${getUnitLabel(item.unit)}</td>
                <td class="text-right">${formatNum(item.quantity)}</td>
                <td class="text-right">0</td>
                <td class="text-right">0</td>
                <td class="text-right">0</td>
                <td class="text-right">0</td>
              </tr>
            `;
          });
        }

        printContent += `
                </tbody>
              </table>
              
              <div class="totals-section">
                <div class="totals-left">
                  <div>Số tài khoản: -</div>
                  <div style="font-style:italic;font-size:9px;">Lưu ý chuyển khoản: Quý khách vui lòng ghi tên cửa hàng theo hóa đơn khi CK</div>
                </div>
                <div class="totals-right">
                  <table>
                    <tr><td>Tổng cộng:</td><td class="text-right"><strong>${formatNum(totalAmount)}</strong></td></tr>
                    <tr><td>Chiết khấu: ${discountPercent}%</td><td class="text-right">${formatNum(discountAmount)}</td></tr>
                    <tr><td><strong>Thành tiền:</strong></td><td class="text-right total-final">${formatNum(finalTotal)}</td></tr>
                  </table>
                </div>
              </div>
              
              <div class="weight-info">
                Tổng số kg: ${totalKg.toFixed(2)} &nbsp;&nbsp;&nbsp;&nbsp; Số m³: ${totalM3.toFixed(3)}
              </div>
              
              <div class="total-words">
                Tổng tiền bằng chữ: ${numberToVietnamese(finalTotal)}
              </div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <div>Ký nhận hàng, chưa thanh toán</div>
                  <div class="signature-label">(Ký, ghi rõ họ tên)</div>
                </div>
                <div class="signature-box">
                  <div>Người giao</div>
                </div>
                <div class="signature-box">
                  <div>Ngày: ${formatDate(order.orderDate)}</div>
                  <div>Người in phiếu</div>
                  <br/><br/>
                  <div><strong>${order.createdBy || ''}</strong></div>
                </div>
              </div>
              
              <div class="note-section">
                Mô tả: ${order.notes || ''}
              </div>
              
              <div class="footer-warning">
                ĐỀ NGHỊ QUÝ KHÁCH KIỂM ĐẾM KỸ HÀNG & TIỀN NV NPP SẼ KHÔNG CHỊU TRÁCH NHIỆM SAU KHI ĐI KHỎI CỬA HÀNG
              </div>
          </div>
        `;
        } // end for lien
      });

      printContent += '</body></html>';

      // Open print window
      const printWindow = window.open('', '_blank', 'width=1100,height=800');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      } else {
        alert('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
      }

      // Update print count for selected orders
      try {
        await fetch(`${API_BASE_URL}/Orders/print`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderIds)
        });
      } catch (e) {
        // error updating print count
      }
      
      // Refresh orders to show updated print count
      fetchOrders();
      
    } catch (error) {
      // error printing orders
      alert('Lỗi khi in đơn hàng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Context menu state for right-click export
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const handleContextMenu = (e, orderId = null) => {
    // only show custom menu when user has selected orders
    if ((selectedOrders || new Set()).size === 0) return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, orderId: orderId });
  };

  const hideContextMenu = () => {
    if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, orderId: null });
  };

  useEffect(() => {
    const onAnyClick = (e) => {
      if (contextMenu.visible) hideContextMenu();
    };
    document.addEventListener('click', onAnyClick);
    document.addEventListener('scroll', hideContextMenu);
    return () => {
      document.removeEventListener('click', onAnyClick);
      document.removeEventListener('scroll', hideContextMenu);
    };
  }, [contextMenu.visible]);

  // Export selected orders into two-sheet Excel: "xuất hàng tổng hợp" and "thông tin"
  const handleExportGHTongHopExcel = async () => {
    if ((selectedOrders || new Set()).size === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng để xuất');
      return;
    }
    setLoading(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: xuất hàng tổng hợp
      const sheet1 = workbook.addWorksheet('xuất hàng tổng hợp');
      sheet1.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true };

      sheet1.columns = [
        { header: 'Mã phiếu', key: 'orderNumber', width: 20 },
        { header: 'Mã vạch', key: 'barcode', width: 18 },
        { header: 'Mã hàng', key: 'productCode', width: 18 },
        { header: 'Tên hàng', key: 'productName', width: 52 },
        { header: 'Đơn vị tính 1', key: 'unit1', width: 16 },
        { header: 'Số lượng ĐVT 1', key: 'sl1', width: 18 },
        { header: 'Đơn vị gốc', key: 'baseUnit', width: 14 },
        { header: 'Số lượng ĐVT gốc', key: 'slgoc', width: 20 },
        { header: 'Mô tả', key: 'description', width: 36 },
        { header: 'SL bán theo ĐVT Gốc', key: 'sl_sell_base', width: 22 }
      ];

      // Sheet 2: thông tin
      const sheet2 = workbook.addWorksheet('thông tin');
      sheet2.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true };
      sheet2.columns = [
        { header: 'Số TT', key: 'idx', width: 8 },
        { header: 'Mã phiếu', key: 'orderNumber', width: 22 },
        { header: 'Tên khách hàng', key: 'customerName', width: 40 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 18 },
        { header: 'Tổng tiền sau giảm', key: 'totalAfterDiscount', width: 22 },
        { header: 'NV Sale', key: 'salesStaff', width: 18 }
      ];

      // Fetch product list for unit/conversion lookup
      let products = [];
      try {
        const resp = await fetch(`${API_BASE_URL}/Products`);
        if (resp.ok) products = await resp.json();
      } catch (e) {}

      // Fetch full details for selected orders
      const orderIds = Array.from(selectedOrders);
      const orderDetailsPromises = orderIds.map(async id => {
        try {
          const r = await fetch(`${API_BASE_URL}/Orders/${id}`);
          if (r.ok) return await r.json();
        } catch (e) {}
        return null;
      });
      const orderDetails = (await Promise.all(orderDetailsPromises)).filter(x => x);

      // Prepare company and range info to insert as top merged header rows
      const compName = companyInfo?.companyName || companyInfo?.name || 'CÔNG TY';
      const compAddr = companyInfo?.address || '';
      const compPhone = companyInfo?.phone || '';

      const orderDates = orderDetails.map(od => new Date(od.order.orderDate)).filter(d => !isNaN(d));
      const minDate = orderDates.length > 0 ? new Date(Math.min(...orderDates)) : null;
      const maxDate = orderDates.length > 0 ? new Date(Math.max(...orderDates)) : null;
      const formatD = (d) => {
        if (!d) return '';
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      };

      const customerGroupKeys = Array.from(new Set(orderDetails.map(od => od.order.customerGroup || 'null')));
      const customerGroupNames = customerGroupKeys.map(k => (k === 'null' || !k) ? 'null' : getCustomerGroupName(k)).join(', ');

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

        sheet1.insertRow(4, [`Nhóm: ${customerGroupNames}`]);
        sheet1.mergeCells(4, 1, 4, sheet1.columns.length);
        sheet1.getRow(4).font = { size: 10 };
        sheet1.getRow(4).getCell(1).alignment = { horizontal: 'center' };

        sheet1.insertRow(5, [`Từ ngày: ${formatD(minDate)}    Đến ngày: ${formatD(maxDate)}`]);
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

        sheet2.insertRow(4, [`Nhóm: ${customerGroupNames}`]);
        sheet2.mergeCells(4, 1, 4, sheet2.columns.length);
        sheet2.getRow(4).font = { size: 10 };
        sheet2.getRow(4).getCell(1).alignment = { horizontal: 'center' };

        sheet2.insertRow(5, [`Từ ngày: ${formatD(minDate)}    Đến ngày: ${formatD(maxDate)}`]);
        sheet2.mergeCells(5, 1, 5, sheet2.columns.length);
        sheet2.getRow(5).font = { size: 10 };
        sheet2.getRow(5).getCell(1).alignment = { horizontal: 'center' };
      } catch (e) {}

      // Build rows for sheet1: one row per aggregated product per order
      // Helper to format quantity: integer without decimal, decimal with decimal point
      const formatQtyExcel = (v) => {
        const n = Number(v) || 0;
        if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n);
        return Math.round(n * 1000) / 1000; // up to 3 decimal places
      };

      // Following sample: list by order then items
      orderDetails.forEach(od => {
        const order = od.order;
        const items = [...(od.items || []), ...(od.promotionItems || [])];
        items.forEach(item => {
          const product = products.find(p => p.barcode === item.barcode || p.code === item.productCode || p.name === item.productName) || {};
          const conversionToBase = parseFloat(item.conversion) || parseFloat(product.conversion1) || 1;
          const convUnit1 = parseFloat(product.conversion1) || parseFloat(item.conversion) || 1;
          const baseQty = (parseFloat(item.quantity) || 0) * conversionToBase;
          const sl1 = Math.floor(baseQty / convUnit1);
          const baseRemaining = baseQty - (sl1 * convUnit1);

          sheet1.addRow({
            orderNumber: order.orderNumber || '',
            barcode: item.barcode || '',
            productCode: item.productCode || '',
            productName: item.productName || '' ,
            unit1: product.unit1 || product.defaultUnit || item.unit || '',
            sl1: sl1,
            baseUnit: product.baseUnit || '',
            slgoc: formatQtyExcel(baseRemaining),
            description: item.description || '',
            sl_sell_base: formatQtyExcel(baseQty)
          });
        });
      });

      // Build rows for sheet2: summary lines per order
      orderDetails.forEach((od, idx) => {
        const order = od.order;
        const items = [...(od.items || []), ...(od.promotionItems || [])];
        // Compute salesStaff from items' nvSales if order doesn't have it
        let salesStaffValue = order.salesStaff || order.SalesStaff || '';
        if (!salesStaffValue && items.length > 0) {
          const nvSalesSet = new Set(items.map(i => i.nvSales || i.NvSales).filter(Boolean));
          salesStaffValue = Array.from(nvSalesSet).join(', ');
        }
        sheet2.addRow({
          idx: idx + 1,
          orderNumber: order.orderNumber || '',
          customerName: getCurrentCustomerName(order),
          totalAmount: order.totalAmount || 0,
          totalAfterDiscount: order.totalAfterDiscount || 0,
          salesStaff: salesStaffValue
        });
      });

      // Style headers for both sheets
      // Styling: header fill, font, borders, autofilter, freeze panes, alignments
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      const headerFontColor = { argb: 'FFFFFFFF' };
      const borderThin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
      const allBorder = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

      [sheet1, sheet2].forEach(s => {
        // header row index: we inserted 5 top info rows, so headers are at row 6
        const headerRowIndex = 6;
        const hdr = s.getRow(headerRowIndex);
        hdr.height = 20;
        hdr.font = { bold: true, color: headerFontColor };
        hdr.alignment = { vertical: 'middle', horizontal: 'center' };
        hdr.eachCell((cell) => {
          cell.fill = headerFill;
          cell.border = allBorder;
        });

        // freeze top including header rows
        s.views = [{ state: 'frozen', ySplit: headerRowIndex }];

        // apply border & alignment for data rows (skip header and top info rows 1-6)
        s.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= headerRowIndex) return;
          row.eachCell((cell, colNumber) => {
            cell.border = allBorder;
            // align numeric columns to right, text columns left
            const key = s.getColumn(colNumber).key;
            if (['sl1','slgoc','sl_sell_base','totalAmount','totalAfterDiscount'].includes(key)) {
              cell.alignment = { horizontal: 'right', vertical: 'top' };
            } else if (key === 'productName' || key === 'description' || key === 'customerName') {
              cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            } else {
              cell.alignment = { vertical: 'top', horizontal: 'left' };
            }
          });
        });

        // auto filter for header
        try {
          const lastCol = s.columns.length;
          s.autoFilter = { from: { row: headerRowIndex, column: 1 }, to: { row: headerRowIndex, column: lastCol } };
        } catch (e) {}
      });

      // Numeric formatting for numeric columns
      try { sheet1.getColumn('sl1').numFmt = '#,##0'; } catch {}
      try { sheet1.getColumn('slgoc').numFmt = 'General'; } catch {}
      try { sheet1.getColumn('sl_sell_base').numFmt = 'General'; } catch {}
      try { sheet2.getColumn('totalAmount').numFmt = '#,##0.00'; } catch {}
      try { sheet2.getColumn('totalAfterDiscount').numFmt = '#,##0.00'; } catch {}

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Phieu_Giao_Hang_Tong_Hop_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting GH TongHop Excel:', error);
      alert('Có lỗi khi xuất Excel phiếu giao hàng tổng hợp');
    } finally {
      setLoading(false);
      hideContextMenu();
    }
  };

  // Date picker functions
  const handleDateRangeClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handlePrintDateRangeClick = () => {
    setShowPrintDatePicker(!showPrintDatePicker);
  };

  const handleDateRangeInputChange = (e, isPrintPicker = false) => {
    const value = e.target.value;
    
    if (isPrintPicker) {
      setPrintDateRangeInput(value);
    } else {
      setDateRangeInput(value);
    }
    
    // Parse date range: dd/mm/yyyy - dd/mm/yyyy
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const startDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      const endDate = new Date(parseInt(match[6]), parseInt(match[5]) - 1, parseInt(match[4]));
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (isPrintPicker) {
          setSelectedPrintStartDate(startDate);
          setSelectedPrintEndDate(endDate);
          setPrintCalendarBaseDate(startDate);
        } else {
          setSelectedStartDate(startDate);
          setSelectedEndDate(endDate);
          setCalendarBaseDate(startDate);
        }
      }
    }
  };

  const formatDateForState = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateSelect = (date, isPrintPicker = false) => {
    const newDate = new Date(date);
    
    if (isPrintPicker) {
      if (!selectedPrintStartDate || (selectedPrintStartDate && selectedPrintEndDate)) {
        setSelectedPrintStartDate(newDate);
        setSelectedPrintEndDate(null);
        setPrintDateRangeInput(formatDateDisplay(newDate));
      } else {
        if (newDate >= selectedPrintStartDate) {
          setSelectedPrintEndDate(newDate);
          setPrintDateRangeInput(`${formatDateDisplay(selectedPrintStartDate)} - ${formatDateDisplay(newDate)}`);
          setSearchData(prev => ({
            ...prev,
            printFromDate: formatDateForState(selectedPrintStartDate),
            printToDate: formatDateForState(newDate)
          }));
        } else {
          setSelectedPrintEndDate(selectedPrintStartDate);
          setSelectedPrintStartDate(newDate);
          setPrintDateRangeInput(`${formatDateDisplay(newDate)} - ${formatDateDisplay(selectedPrintStartDate)}`);
          setSearchData(prev => ({
            ...prev,
            printFromDate: formatDateForState(newDate),
            printToDate: formatDateForState(selectedPrintStartDate)
          }));
        }
      }
    } else {
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setSelectedStartDate(newDate);
        setSelectedEndDate(null);
        setDateRangeInput(formatDateDisplay(newDate));
      } else {
        if (newDate >= selectedStartDate) {
          setSelectedEndDate(newDate);
          setDateRangeInput(`${formatDateDisplay(selectedStartDate)} - ${formatDateDisplay(newDate)}`);
          setSearchData(prev => ({
            ...prev,
            fromDate: formatDateForState(selectedStartDate),
            toDate: formatDateForState(newDate)
          }));
        } else {
          setSelectedEndDate(selectedStartDate);
          setSelectedStartDate(newDate);
          setDateRangeInput(`${formatDateDisplay(newDate)} - ${formatDateDisplay(selectedStartDate)}`);
          setSearchData(prev => ({
            ...prev,
            fromDate: formatDateForState(newDate),
            toDate: formatDateForState(selectedStartDate)
          }));
        }
      }
    }
  };

  const renderCalendar = (baseDate, monthOffset = 0, isPrintPicker = false) => {
    const currentDate = new Date(baseDate || new Date());
    currentDate.setMonth(currentDate.getMonth() + monthOffset);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const monthNames = [
      'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
      'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const days = [];
    const current = new Date(startDate);
    
    const startSel = isPrintPicker ? selectedPrintStartDate : selectedStartDate;
    const endSel = isPrintPicker ? selectedPrintEndDate : selectedEndDate;
    
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(current);
      const isCurrentMonth = dayDate.getMonth() === month;
      
      const dayTime = dayDate.getTime();
      const startTime = startSel ? startSel.getTime() : null;
      const endTime = endSel ? endSel.getTime() : null;
      
      const isSelected = (
        (startTime && dayTime === startTime) ||
        (endTime && dayTime === endTime) ||
        (startTime && endTime && dayTime > startTime && dayTime < endTime)
      );
      
      const isStart = startTime && dayTime === startTime;
      const isEnd = endTime && dayTime === endTime;
      
      days.push(
        <div
          key={i}
          className={`calendar-day ${
            !isCurrentMonth ? 'other-month' : ''
          } ${isSelected ? 'selected' : ''} ${
            isStart ? 'range-start' : ''
          } ${isEnd ? 'range-end' : ''}`}
          onClick={() => {
            // Cho phép chọn bất kỳ ngày nào
            handleDateSelect(dayDate, isPrintPicker);
          }}
        >
          {dayDate.getDate()}
        </div>
      );
      
      current.setDate(current.getDate() + 1);
    }
    
    return (
      <div className="calendar-month">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (isPrintPicker) {
                const newDate = new Date(printCalendarBaseDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setPrintCalendarBaseDate(newDate);
              } else {
                const newDate = new Date(calendarBaseDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCalendarBaseDate(newDate);
              }
            }}
          >
            ◀
          </button>
          <h4>{monthNames[month]} {year}</h4>
          <button 
            className="calendar-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (isPrintPicker) {
                const newDate = new Date(printCalendarBaseDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setPrintCalendarBaseDate(newDate);
              } else {
                const newDate = new Date(calendarBaseDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCalendarBaseDate(newDate);
              }
            }}
          >
            ▶
          </button>
        </div>
        <div className="calendar-weekdays">
          <div>CN</div>
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
        </div>
        <div className="calendar-days">
          {days}
        </div>
      </div>
    );
  };

  const getDateRangeDisplayText = (isPrintPicker = false) => {
    const start = isPrintPicker ? selectedPrintStartDate : selectedStartDate;
    const end = isPrintPicker ? selectedPrintEndDate : selectedEndDate;
    
    const formatD = (d) => {
      if (!d) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    if (start && end) {
      return `${formatD(start)} - ${formatD(end)}`;
    } else if (start) {
      return formatD(start);
    }
    return '';
  };

  const productTypeOptions = (() => {
    const s = new Set();
    (orders || []).forEach(o => {
      if (o?.productType) s.add(o.productType);
      if (o?.ProductType) s.add(o.ProductType);
    });
    return Array.from(s).filter(Boolean).map(v => ({ value: v, label: v }));
  })();

  const taxRatesOptions = (() => {
    const s = new Set();
    (orders || []).forEach(o => {
      const raw = o?.TaxRates || o?.taxRates || '';
      if (!raw) return;
      String(raw).split(/[,;\s]+/).map(p => p.trim()).filter(Boolean).forEach(p => {
        // normalize percent display
        const norm = p.includes('%') ? p.replace(/\s*%/g, '%') : p;
        s.add(norm);
      });
    });
    return Array.from(s).filter(Boolean).map(v => ({ value: v, label: v }));
  })();

  return (
    <div className="print-order-page">
      {/* Search Panel */}
      <div className="search-panel">
        <div className="search-header">
          <h1>TÌM KIẾM - IN ĐƠN HÀNG</h1>
        </div>
        
        <div className="search-form">
          { /* build productType options for searchable select */ }
          {
            /* derive options from orders and products */
          }
          {/* Row 1 */}
          <div className="search-row">
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.orderNumber}
                onChange={(e) => setSearchData({...searchData, orderNumber: e.target.value})}
                options={[...new Set(orders.map(o => o.orderNumber).filter(Boolean))].map(num => ({
                  value: num,
                  label: num
                }))}
                placeholder="Số phiếu"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group date-range-picker" ref={datePickerRef}>
              <div className="date-range-wrapper">
                <input
                  type="text"
                  readOnly
                  className="search-input date-range-visible"
                  value={getDateRangeDisplayText(false)}
                  onClick={handleDateRangeClick}
                  placeholder="Chọn ngày"
                />
                <i className="date-range-icon" onClick={handleDateRangeClick}>📅</i>
                
                {showDatePicker && (
                  <div className="date-picker-popup">
                    <div className="date-picker-header">
                      <input
                        type="text"
                        value={dateRangeInput}
                        onChange={(e) => handleDateRangeInputChange(e, false)}
                        className="date-range-display"
                        placeholder="dd/mm/yyyy - dd/mm/yyyy"
                      />
                    </div>
                    <div className="calendar-container">
                      {renderCalendar(calendarBaseDate, 0, false)}
                      {renderCalendar(calendarBaseDate, 1, false)}
                    </div>
                    <div className="date-picker-actions">
                      <button 
                        className="btn-cancel"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Hủy
                      </button>
                      <button 
                        className="btn-apply"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.customerGroup}
                onChange={(e) => setSearchData({...searchData, customerGroup: e.target.value})}
                options={customerGroups.map(group => ({
                  value: group.name,
                  label: group.name
                }))}
                placeholder="Nhóm khách hàng"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group flex-1">
              <input
                type="text"
                placeholder="Lịch bán hàng"
                className="search-input"
                value={searchData.salesSchedule}
                onChange={(e) => setSearchData({...searchData, salesSchedule: e.target.value})}
              />
            </div>
            
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.customer}
                onChange={(e) => setSearchData({...searchData, customer: e.target.value})}
                options={customers.map(c => ({
                  value: c.name,
                  label: c.name + (c.phone ? ` (${c.phone})` : '')
                }))}
                placeholder="Khách hàng"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.createdBy}
                onChange={(e) => setSearchData({...searchData, createdBy: e.target.value})}
                options={users.map(u => ({
                  value: u.tenNhanVien || u.name || u.username,
                  label: u.tenNhanVien || u.name || u.username
                }))}
                placeholder="Nhân viên lập"
                className="search-select-searchable"
              />
            </div>
          </div>
          
          {/* Row 2 */}
          <div className="search-row">
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.salesStaff}
                onChange={(e) => setSearchData({...searchData, salesStaff: e.target.value})}
                options={users.map(u => ({
                  value: u.tenNhanVien || u.name || u.username,
                  label: u.tenNhanVien || u.name || u.username
                }))}
                placeholder="Nhân viên Sale"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.taxRates}
                onChange={(e) => setSearchData({...searchData, taxRates: e.target.value})}
                options={taxRatesOptions}
                placeholder="Thuế suất"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group flex-1">
              <input
                type="text"
                placeholder="Lần in"
                className="search-input"
                value={searchData.printCount}
                onChange={(e) => setSearchData({...searchData, printCount: e.target.value})}
              />
            </div>
            
            <div className="search-group flex-1">
              <SearchableSelect
                value={searchData.productType}
                onChange={(e) => setSearchData({...searchData, productType: e.target.value})}
                options={productTypeOptions}
                placeholder="Loại hàng"
                className="search-select-searchable"
              />
            </div>
            
            <div className="search-group flex-1">
              <select
                className="search-select"
                value={searchData.printStatus}
                onChange={(e) => setSearchData({...searchData, printStatus: e.target.value})}
              >
                <option value="">Trạng thái in</option>
                <option value="Đã in">Đã in</option>
                <option value="Chưa in">Chưa in</option>
              </select>
            </div>
            
            <div className="search-actions">
              <button className="btn btn-search" onClick={handleSearch}>
                <span className="search-icon">🔍</span> Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="action-header">
        <div className="total-info">
          Tổng {filteredOrders.length}
        </div>
        <div className="action-buttons">
          <button className="action-btn btn-export" onClick={handleExportExcel} title="Xuất Excel">
            📊
          </button>
          <button className="action-btn btn-export-summary" onClick={handleExportSummary} title="Xuất phiếu tổng hợp">
            📋
          </button>
          <button className="action-btn btn-print" onClick={handlePrintSelected} title="In đơn hàng">
            🖨️
          </button>
          <button className="action-btn btn-settings" title="Cài đặt" onClick={() => setShowColumnSettings(true)}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container" onContextMenu={handleContextMenu}>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <table className="data-table print-orders-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {columns.filter(c => c.visible).map(col => (
                  <th 
                    key={col.id}
                    style={{ width: col.width + 'px', minWidth: col.width + 'px', position: 'relative', cursor: dragColumn === col.id ? 'grabbing' : (col.id !== 'actions' ? 'grab' : 'default') }}
                    draggable={col.id !== 'actions'}
                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => handleColumnDrop(e, col.id)}
                    onDragEnd={handleColumnDragEnd}
                    className={dragColumn === col.id ? 'dragging' : ''}
                  >
                    <div className="th-content">
                      <span>{col.label}</span>
                      {col.id !== 'actions' && (
                        <>
                          <button className="col-search-btn" onClick={() => openColumnSearch(col.id, col.label)} title={`Tìm kiếm theo ${col.label}`}>
                            🔍
                          </button>
                          {columnFilters[col.id] && (
                            <button className="col-clear-btn" onClick={() => clearColumnSearch(col.id)} title="Xóa bộ lọc">✖</button>
                          )}
                        </>
                      )}
                    </div>
                    {col.id !== 'actions' && (
                      <div 
                        className="resize-handle" 
                        onMouseDown={(e) => handleResizeStart(e, col.id)}
                        style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '6px', cursor: 'col-resize', zIndex: 2 }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length + 1} className="no-data">Không có dữ liệu</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr 
                    key={order.id}
                    className={selectedOrders.has(order.id) ? 'selected' : ''}
                    onContextMenu={(e) => handleContextMenu(e, order.id)}
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </td>
                    {columns.filter(c => c.visible).map(col => (
                      <td key={col.id} className={['totalAmount','totalAfterDiscount','totalKg','totalM3'].includes(col.id) ? 'text-right' : (col.id==='printCount' ? 'text-center' : '')}>
                        {renderCell(order, col.id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {/* Custom context menu for selected orders */}
        {contextMenu.visible && (
          <div
            className="custom-context-menu"
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 99999 }}
          >
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); hideContextMenu(); handlePrintSelected(); }}>🖨️ In danh sách đã chọn (2 liên)</div>
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); hideContextMenu(); handleExportSummary(); }}>📋 In phiếu xuất hàng tổng hợp theo nhóm khách hàng</div>
            <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); hideContextMenu(); handleExportExcel(); }}>📥 Xuất Excel bảng kê giao hàng</div>
            <div className="context-menu-item" onClick={async (e) => { e.stopPropagation(); hideContextMenu(); await handleExportGHTongHopExcel(); }}>📊 Xuất Excel phiếu xuất hàng tổng hợp</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Hiển thị {((currentPage - 1) * (pageSize === 'All' ? filteredOrders.length : pageSize)) + 1}-
            {Math.min(currentPage * (pageSize === 'All' ? filteredOrders.length : pageSize), filteredOrders.length)} của {filteredOrders.length} kết quả
          </div>
          
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
          
          <div className="page-size-selector">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
              <option value={200}>200 dòng</option>
              <option value="All">Tất cả</option>
            </select>
          </div>
        </div>
      )}

      {/* Column Search Modal */}
      {/* Column Settings Modal */}
      {showColumnSettings && (
        <div className="search-modal-overlay" onClick={() => setShowColumnSettings(false)}>
          <div className="column-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3 className="search-modal-title">⚙️ Cài đặt hiển thị cột</h3>
              <button className="search-modal-close" onClick={() => setShowColumnSettings(false)}>×</button>
            </div>

            <div className="column-settings-body">
              <div className="column-settings-actions">
                <button 
                  className="reset-columns-btn"
                  onClick={resetColumns}
                  title="Khôi phục cài đặt mặc định"
                >
                  🔄 Reset về mặc định
                </button>
                <div className="column-count">
                  Hiển thị {columns.filter(col => col.visible).length}/{columns.length} cột
                </div>
              </div>
              
              <div className="column-settings-list">
                <div className="column-settings-help">
                  💡 Kéo thả để sắp xếp, tick/untick để ẩn/hiện cột
                </div>
                
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className={`column-settings-item ${settingsDragItem === index ? 'dragging' : ''}`}
                    draggable={true}
                    onDragStart={(e) => handleSettingsDragStart(e, index)}
                    onDragOver={handleSettingsDragOver}
                    onDrop={(e) => handleSettingsDrop(e, index)}
                    onDragEnd={handleSettingsDragEnd}
                  >
                    <div className="column-drag-handle" title="Kéo để sắp xếp">
                      ⋮⋮
                    </div>
                    
                    <label className="column-checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumnVisibility(column.id)}
                        className="column-checkbox"
                      />
                      <span className="column-name">{column.label}</span>
                    </label>
                    
                    <div className="column-info">
                      <span className="column-width" title="Độ rộng hiện tại">
                        {column.width}px
                      </span>
                      {!column.visible && (
                        <span className="column-hidden-badge">Ẩn</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="column-settings-footer">
                <button 
                  className="apply-settings-btn"
                  onClick={() => setShowColumnSettings(false)}
                >
                  ✓ Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSearchModal && (
        <div className="search-modal-overlay" onClick={closeSearchModal}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="search-modal-title">🔍 Tìm kiếm theo "{searchColumn?.label}"</h3>
              <button className="search-modal-close" onClick={closeSearchModal}>×</button>
            </div>

            <div className="search-modal-search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder={`Nhập từ khóa tìm kiếm (có thể gõ không dấu)...`}
                  value={columnSearchQuery}
                  onChange={(e) => handleColumnSearch(e.target.value)}
                  autoFocus
                />
                <span className="search-input-icon">🔍</span>
              </div>
            </div>

            <div className="search-modal-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6c757d' }}>
                Các giá trị có trong cột (click để chọn):
              </div>
              <div className="search-suggestions-list">
                {getUniqueColumnValues(searchColumn).length === 0 ? (
                  <div style={{ padding: '10px', color: '#999', textAlign: 'center' }}>
                    Không có dữ liệu
                  </div>
                ) : (
                  getUniqueColumnValues(searchColumn)
                    .filter(value => {
                      if (!columnSearchQuery.trim()) return true;
                      const valueNormalized = removeVietnameseTones(String(value).toLowerCase());
                      const queryNormalized = removeVietnameseTones(columnSearchQuery.toLowerCase());
                      return valueNormalized.includes(queryNormalized);
                    })
                    .slice(0, 50)
                    .map((value, index) => (
                      <div
                        key={index}
                        className="search-suggestion-item"
                        onClick={() => { setColumnSearchQuery(value); applyColumnSearch(); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: columnSearchQuery === value ? '#e3f2fd' : 'transparent' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = columnSearchQuery === value ? '#e3f2fd' : 'transparent'}
                      >
                        {value}
                      </div>
                    ))
                )}
              </div>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setColumnSearchQuery('');
                  setColumnFilters({});
                  applyFilters(orders, searchData);
                  closeSearchModal();
                }}
                style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={closeSearchModal}
                style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintOrder;
