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
    customer: '',
    createdBy: '',
    salesStaff: '',
    approved: true, // Mặc định lọc đơn hàng đã duyệt
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
        setOrders(ordersData);
        // Apply initial date filter
        applyFilters(ordersData, searchData);
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
      filtered = filtered.filter(order => 
        (order.customerName && removeVietnameseTones(order.customerName).includes(searchTerm)) ||
        (order.customer && removeVietnameseTones(order.customer).includes(searchTerm))
      );
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

    // Filter by approved status
    if (filters.approved) {
      filtered = filtered.filter(order => 
        order.status && order.status.toLowerCase() === 'đã duyệt'
      );
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
            case 'customerName': value = order.customerName || order.customer; break;
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
      const worksheet = workbook.addWorksheet('In Đơn Hàng');

      // Headers
      worksheet.columns = [
        { header: 'Ngày lập', key: 'orderDate', width: 18 },
        { header: 'Số phiếu', key: 'orderNumber', width: 18 },
        { header: 'Nhóm khách hàng', key: 'customerGroup', width: 20 },
        { header: 'Lịch bán hàng', key: 'salesSchedule', width: 15 },
        { header: 'Khách hàng', key: 'customerName', width: 25 },
        { header: 'Xe', key: 'vehicle', width: 15 },
        { header: 'Xe giao hàng', key: 'deliveryVehicle', width: 20 },
        { header: 'STT in', key: 'printOrder', width: 10 },
        { header: 'Nhân viên lập', key: 'createdBy', width: 18 },
        { header: 'Nhân viên sale', key: 'salesStaff', width: 18 },
        { header: 'Loại hàng', key: 'productType', width: 15 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
        { header: 'Tổng tiền sau giảm', key: 'totalAfterDiscount', width: 18 },
        { header: 'Tổng số kg', key: 'totalKg', width: 12 },
        { header: 'Tổng số khối', key: 'totalM3', width: 12 },
        { header: 'Thuế suất', key: 'taxRates', width: 12 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Trạng thái in', key: 'printStatus', width: 12 },
        { header: 'Số lần in', key: 'printCount', width: 10 },
        { header: 'Ngày in', key: 'printDate', width: 18 }
      ];

      // Data
      filteredOrders.forEach(order => {
        worksheet.addRow({
          orderDate: formatDate(order.orderDate),
          orderNumber: order.orderNumber,
          customerGroup: getCustomerGroupName(order.customerGroup),
          salesSchedule: order.salesSchedule || '-',
          customerName: order.customerName || order.customer,
          vehicle: order.vehicle || '-',
          deliveryVehicle: order.deliveryVehicle || '-',
          printOrder: order.printOrder || 0,
          createdBy: order.createdBy,
          salesStaff: order.salesStaff || order.SalesStaff || '-',
          productType: order.productType || order.ProductType || '-',
          totalAmount: order.totalAmount,
          totalAfterDiscount: order.totalAfterDiscount,
          totalKg: order.totalKg,
          totalM3: order.totalM3,
          taxRates: formatTaxRates(order),
          status: order.status,
          printStatus: (order.printCount || 0) > 0 ? 'Đã in' : 'Chưa in',
          printCount: order.printCount || 0,
          printDate: order.printDate ? formatDate(order.printDate) : '-'
        });
      });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `InDonHang_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // error exporting Excel
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
      // Fetch full order details for each selected order
      const orderIds = Array.from(selectedOrders);
      const orderDetailsPromises = orderIds.map(async (orderId) => {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}`);
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
            @page { size: A4 landscape; margin: 10mm; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .page-break { page-break-after: always; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; }
            .invoice-page { width: 100%; padding: 10px; }
            .header-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
            .header-main { flex: 1; }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .header-left { flex: 1; }
            .header-right { text-align: right; padding-right: 10px; }
            .company-name { font-weight: bold; font-size: 13px; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin: 8px 0 4px; }
            .subtitle { text-align: center; margin-bottom: 8px; }
            .customer-section { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: flex-start; }
            .customer-info { flex: 1; }
            .customer-info strong { font-size: 12px; }
            .confirm-box { border: 1px solid #000; padding: 10px 8px 8px; width: 150px; min-height: 80px; position: relative; background: #fff; overflow: visible; }
            .confirm-box .confirm-label { position: absolute; top: 2px; right: 6px; left: auto; transform: none; background: #fff; padding: 0 4px; font-size: 10px; line-height: 1; }
            .confirm-box .confirm-body { margin-top: 4px; }
            .qr-section { text-align: center; flex-shrink: 0; margin-left: 8px; }
            .qr-section img { width: 100px; height: 100px; }
            .qr-label { font-size: 10px; margin-top: 2px; }
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
          </style>
        </head>
        <body>
      `;

      validOrders.forEach((od, idx) => {
        const order = od.order;
        const items = od.items || [];
        const promoItems = od.promotionItems || [];
        const qrCode = qrCodes[idx];

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
                    <div>STT In: ${order.printOrder || 0}</div>
                  </div>
                </div>
              </div>
            </div>
              
              <div class="title">PHIẾU GIAO HÀNG KIỂM XÁC NHẬN CÔNG NỢ</div>
              <div class="subtitle">Liên: ${lien}</div>
              
              <div class="customer-section">
                <div class="customer-info">
                  <div>Khách hàng: <strong>${order.customerName || ''}</strong></div>
                  <div>Địa chỉ: ${order.address || ''}</div>
                  <div>ĐT: ${order.phone || ''}</div>
                </div>
                <div class="qr-section">
                  ${qrCode ? `<img src="${qrCode}" alt="QR"/><div class="qr-label">${order.orderNumber || ''}</div>` : ''}
                </div>
                <div class="confirm-box">
                  <div class="confirm-label">Xác nhận đã thanh toán</div>
                  <div class="confirm-body"></div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width:5%">STT</th>
                    <th style="width:10%">NVBH</th>
                    <th style="width:13%">MV</th>
                    <th style="width:32%">Tên hàng</th>
                    <th style="width:6%">ĐVT</th>
                    <th style="width:6%">SL</th>
                    <th style="width:9%">Đơn giá</th>
                    <th style="width:5%">%CK</th>
                    <th style="width:9%">Giá sau CK</th>
                    <th style="width:10%">Thành tiền</th>
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
              <td>${item.productName || ''}</td>
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
                <td>${item.productName || ''}</td>
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
                Ghi chú: ${order.notes || ''}
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

  return (
    <div className="print-order-page">
      {/* Search Panel */}
      <div className="search-panel">
        <div className="search-header">
          <h1>TÌM KIẾM - IN ĐƠN HÀNG</h1>
        </div>
        
        <div className="search-form">
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
            
            <div className="search-group checkbox-group">
              <div className="checkbox-wrapper">
                <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input
                    type="checkbox"
                    checked={!!searchData.approved}
                    onChange={(e) => setSearchData({...searchData, approved: e.target.checked})}
                  />
                  <span className="checkbox-text">Đã duyệt</span>
                </label>
              </div>
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
            
            <div className="search-group date-range-picker-print" ref={printDatePickerRef}>
              <div className="date-range-wrapper">
                <input
                  type="text"
                  readOnly
                  className="search-input date-range-visible"
                  value={getDateRangeDisplayText(true)}
                  onClick={handlePrintDateRangeClick}
                  placeholder="Ngày bắt đầu → Ngày kết thúc"
                />
                <i className="date-range-icon" onClick={handlePrintDateRangeClick}>📅</i>
                
                {showPrintDatePicker && (
                  <div className="date-picker-popup">
                    <div className="date-picker-header">
                      <input
                        type="text"
                        value={printDateRangeInput}
                        onChange={(e) => handleDateRangeInputChange(e, true)}
                        className="date-range-display"
                        placeholder="dd/mm/yyyy - dd/mm/yyyy"
                      />
                    </div>
                    <div className="calendar-container">
                      {renderCalendar(printCalendarBaseDate, 0, true)}
                      {renderCalendar(printCalendarBaseDate, 1, true)}
                    </div>
                    <div className="date-picker-actions">
                      <button 
                        className="btn-cancel"
                        onClick={() => setShowPrintDatePicker(false)}
                      >
                        Hủy
                      </button>
                      <button 
                        className="btn-apply"
                        onClick={() => setShowPrintDatePicker(false)}
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
          <button className="action-btn btn-refresh" onClick={fetchOrders} title="Làm mới">
            🔄
          </button>
          <button className="action-btn btn-print" onClick={handlePrintSelected} title="In đơn hàng">
            🖨️
          </button>
          <button className="action-btn btn-settings" title="Cài đặt">
            ⚙️
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
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
                <th>Ngày lập</th>
                <th>
                  <div className="th-content">
                    <span>Số phiếu</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('orderNumber', 'Số phiếu')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Nhóm khách hàng</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('customerGroup', 'Nhóm khách hàng')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Lịch bán hàng</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('salesSchedule', 'Lịch bán hàng')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Khách hàng</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('customerName', 'Khách hàng')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Xe</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('vehicle', 'Xe')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Xe giao hàng</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('deliveryVehicle', 'Xe giao hàng')}>🔍</button>
                  </div>
                </th>
                <th>STT in</th>
                <th>
                  <div className="th-content">
                    <span>Nhân viên lập</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('createdBy', 'Nhân viên lập')}>🔍</button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>Nhân viên sale</span>
                    <button className="col-search-btn" onClick={() => openColumnSearch('salesStaff', 'Nhân viên sale')}>🔍</button>
                  </div>
                </th>
                <th>Loại hàng</th>
                <th>Tổng tiền</th>
                <th>Tổng tiền sau giảm</th>
                <th>Tổng số kg</th>
                <th>Tổng số khối</th>
                <th>Thuế suất</th>
                <th>Trạng thái</th>
                <th>Trạng thái in</th>
                <th>Số lần in</th>
                <th>Ngày in</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="22" className="no-data">Không có dữ liệu</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr 
                    key={order.id}
                    className={selectedOrders.has(order.id) ? 'selected' : ''}
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <a href="#" className="order-link" onClick={(e) => { e.preventDefault(); handleViewDetails(order.id); }}>
                        {order.orderNumber}
                      </a>
                    </td>
                    <td>{getCustomerGroupName(order.customerGroup) || '-'}</td>
                    <td>{order.salesSchedule || '-'}</td>
                    <td>{order.customerName || order.customer || '-'}</td>
                    <td>{order.vehicle || '-'}</td>
                    <td>{order.deliveryVehicle || '-'}</td>
                    <td>{order.printOrder || 0}</td>
                    <td>{order.createdBy || '-'}</td>
                    <td>{order.salesStaff || order.SalesStaff || '-'}</td>
                    <td>{order.productType || order.ProductType || '-'}</td>
                    <td className="text-right">{formatCurrency(order.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(order.totalAfterDiscount)}</td>
                    <td className="text-right">{formatNumber(order.totalKg)}</td>
                    <td className="text-right">{formatNumber(order.totalM3)}</td>
                    <td>{formatTaxRates(order) || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getPrintStatusClass(order.printCount || 0)}`}>
                        {(order.printCount || 0) > 0 ? 'Đã in' : 'Chưa in'}
                      </span>
                    </td>
                    <td className="text-center">{order.printCount || 0}</td>
                    <td>{order.printDate ? formatDate(order.printDate) : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn btn-view"
                          onClick={() => handleViewDetails(order.id)}
                          title="Xem chi tiết"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tìm kiếm {searchColumn?.label}</h3>
              <button className="close-btn" onClick={() => setShowSearchModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-search-input"
                placeholder={`Nhập ${searchColumn?.label}...`}
                value={columnSearchQuery}
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyColumnSearch()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowSearchModal(false)}>Hủy</button>
              <button className="btn btn-apply" onClick={applyColumnSearch}>Áp dụng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintOrder;
