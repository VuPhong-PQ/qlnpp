import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';
import '../BusinessPage.css';

// Constants for localStorage
const COLUMN_SETTINGS_KEY = 'createOrderColumnSettings';

// Helper functions for localStorage
const saveColumnSettings = (columns) => {
  try {
    localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(columns));
  } catch (error) {
    console.error('Error saving column settings:', error);
  }
};

const loadColumnSettings = () => {
  try {
    const savedSettings = localStorage.getItem(COLUMN_SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading column settings:', error);
  }
  return null;
};

const CreateOrder = () => {
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    orderNumber: '',
    dateRange: '01/01/2026 - 02/01/2026',
    customerGroup: '',
    productType: '',
    customer: '',
    createdBy: '',
    salesStaff: '',
    status: 'Chưa duyệt'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date(2026, 0, 1));
  const [selectedEndDate, setSelectedEndDate] = useState(new Date(2026, 0, 2));
  const datePickerRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  // Default column configuration
  const defaultColumns = [
    { id: 'orderDate', label: 'Ngày lập', width: 120, visible: true },
    { id: 'orderNumber', label: 'Số phiếu', width: 130, visible: true },
    { id: 'customerName', label: 'Khách hàng', width: 150, visible: true },
    { id: 'productType', label: 'Loại hàng', width: 120, visible: true },
    { id: 'payment', label: 'Tổng tiền sau giảm', width: 140, visible: true },
    { id: 'status', label: 'Trạng thái', width: 100, visible: true },
    { id: 'notes', label: 'Ghi chú đơn hàng', width: 150, visible: true },
    { id: 'createdBy', label: 'Nhân viên lập', width: 120, visible: true },
    { id: 'taxRate', label: 'Thuế suất', width: 90, visible: true },
    { id: 'salesStaff', label: 'Nhân viên sale', width: 120, visible: true },
    { id: 'mergeFrom', label: 'Gộp từ đơn', width: 110, visible: true },
    { id: 'mergeTo', label: 'Gộp vào đơn', width: 110, visible: true },
    { id: 'customerGroup', label: 'Nhóm khách hàng', width: 150, visible: true },
    { id: 'salesSchedule', label: 'Lịch bán hàng', width: 130, visible: true },
    { id: 'totalAmount', label: 'Tổng tiền', width: 120, visible: true },
    { id: 'totalKg', label: 'Tổng số kg', width: 100, visible: true },
    { id: 'totalM3', label: 'Tổng số khối', width: 110, visible: true },
    { id: 'printOrder', label: 'Số thứ tự in', width: 100, visible: true },
    { id: 'address', label: 'Địa chỉ', width: 150, visible: true },
    { id: 'paid', label: 'Đã thanh toán', width: 110, visible: true },
    { id: 'deliveryStaff', label: 'Nhân viên giao', width: 120, visible: true },
    { id: 'driver', label: 'Tài xế', width: 80, visible: true },
    { id: 'vehicle', label: 'Xe', width: 80, visible: true },
    { id: 'deliverySuccessful', label: 'Giao thành công', width: 120, visible: true },
    { id: 'vatExport', label: 'Xuất VAT', width: 90, visible: true },
    { id: 'position', label: 'Vị trí', width: 150, visible: true },
    { id: 'actions', label: 'Thao tác', width: 100, visible: true }
  ];

  // Column management state with localStorage integration
  const [columns, setColumns] = useState(() => {
    const savedColumns = loadColumnSettings();
    return savedColumns && savedColumns.length > 0 ? savedColumns : defaultColumns;
  });
  const [dragColumn, setDragColumn] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [settingsDragItem, setSettingsDragItem] = useState(null);

  const pageOptions = [10, 20, 50, 100, 200, 500, 1000, 5000, 'All'];
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState(new Set()); // For delete functionality

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, filteredOrders.length]);

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = pageSize === 'All'
    ? filteredOrders
    : filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Current page orders for checkbox logic
  const currentPageOrders = paginatedOrders;

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll on mobile when date picker is open
      if (window.innerWidth <= 768) {
        document.body.classList.add('date-picker-open');
      }
    } else {
      // Remove body scroll prevention
      document.body.classList.remove('date-picker-open');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('date-picker-open');
    };
  }, [showDatePicker]);

  // Fetch orders from database
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Orders`);
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } else {
        console.error('Failed to fetch orders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Customers`);
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch customer groups for dropdown
  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/CustomerGroups`);
      if (response.ok) {
        const groupsData = await response.json();
        setCustomerGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Users`);
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch product categories for dropdown
  const fetchProductCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ProductCategories`);
      if (response.ok) {
        const categoriesData = await response.json();
        setProductCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching product categories:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchCustomerGroups();
    fetchUsers();
    fetchProductCategories();
  }, []);

  // Save column settings to localStorage whenever columns change
  useEffect(() => {
    saveColumnSettings(columns);
  }, [columns]);

  // Cleanup resize event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  const handleSearch = () => {
    console.log('Tìm kiếm với dữ liệu:', searchData);
    
    let filtered = [...orders];
    
    // Filter by order number
    if (searchData.orderNumber.trim()) {
      filtered = filtered.filter(order => 
        order.orderNumber && order.orderNumber.toLowerCase().includes(searchData.orderNumber.toLowerCase())
      );
    }
    
    // Filter by date range
    if (searchData.dateRange && searchData.dateRange.includes(' - ')) {
      const [startStr, endStr] = searchData.dateRange.split(' - ');
      const startDate = parseDate(startStr.trim());
      const endDate = parseDate(endStr.trim());
      
      if (startDate && endDate) {
        endDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(order => {
          if (!order.orderDate) return false;
          const orderDate = new Date(order.orderDate);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
    }
    
    // Filter by customer group
    if (searchData.customerGroup && searchData.customerGroup !== 'Nhóm khách hàng') {
      filtered = filtered.filter(order => 
        order.customerGroup && order.customerGroup === searchData.customerGroup
      );
    }
    
    // Filter by customer
    if (searchData.customer && searchData.customer !== 'Khách hàng') {
      filtered = filtered.filter(order => 
        order.customer && order.customer === searchData.customer
      );
    }
    
    // Filter by product type
    if (searchData.productType && searchData.productType !== 'Loại hàng') {
      filtered = filtered.filter(order => 
        order.productType && order.productType === searchData.productType
      );
    }
    
    // Filter by created by
    if (searchData.createdBy && searchData.createdBy.trim()) {
      filtered = filtered.filter(order => 
        order.createdBy && order.createdBy.toLowerCase().includes(searchData.createdBy.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  };

  // Handle delete selected orders
  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) {
      alert('Vui lòng chọn đơn hàng cần xóa!');
      return;
    }

    const confirmed = confirm(`Bạn có chắc muốn xóa ${selectedOrders.size} đơn hàng đã chọn?`);
    if (!confirmed) return;

    try {
      // Delete each selected order
      for (const orderId of selectedOrders) {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          console.error(`Failed to delete order ${orderId}:`, response.statusText);
        }
      }

      // Refresh orders list and clear selection
      await fetchOrders();
      setSelectedOrders(new Set());
      alert('Đã xóa thành công các đơn hàng đã chọn!');
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert('Có lỗi khi xóa đơn hàng!');
    }
  };

  // Handle individual order selection
  const handleOrderSelect = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle location click - open maps with coordinates
  const handleLocationClick = (lat, lng, title) => {
    // Open Google Maps with coordinates and directions
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  // Handle address click - search address on maps
  const handleAddressClick = (address, title) => {
    // Open Google Maps with address search
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Handle edit order - navigate to edit form
  const handleEditOrder = (orderId) => {
    navigate(`/business/sales/create-order-form?id=${orderId}`);
  };

  // Helper function to parse date string
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Helper function to get customer group name from code
  const getCustomerGroupName = (code) => {
    if (!code) return '-';
    const group = customerGroups.find(g => g.code === code);
    return group ? group.name : code; // fallback to code if not found
  };

  // Column drag & drop handlers
  const handleColumnDragStart = (e, columnId) => {
    setDragColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    if (!dragColumn || dragColumn === targetColumnId) return;

    const dragIndex = columns.findIndex(col => col.id === dragColumn);
    const targetIndex = columns.findIndex(col => col.id === targetColumnId);

    if (dragIndex === -1 || targetIndex === -1) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(dragIndex, 1);
    newColumns.splice(targetIndex, 0, movedColumn);

    setColumns(newColumns);
    setDragColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDragColumn(null);
  };

  // Column resize handlers
  const handleResizeStart = useCallback((e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const currentColumn = columns.find(col => col.id === columnId);
    const startWidth = currentColumn ? currentColumn.width : 100;
    
    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      
      setColumns(prev => prev.map(col => 
        col.id === columnId ? { ...col, width: newWidth } : col
      ));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(null);
    };
    
    setResizing({ columnId, startX, startWidth });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columns]);

  const handleResizeMove = (e) => {
    // This function is now handled inline above
  };

  const handleResizeEnd = () => {
    // This function is now handled inline above
  };

  // Get cell value for a column
  const getCellValue = (order, columnId) => {
    switch (columnId) {
      case 'orderDate': return order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '-';
      case 'orderNumber': 
        return (
          <span 
            style={{ 
              color: '#0066cc', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              fontWeight: '500'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditOrder(order.id);
            }}
            title="Click để sửa đơn hàng"
          >
            {order.orderNumber || '-'}
          </span>
        );
      case 'customerName': return order.customerName || '-';
      case 'payment': 
        // "Tổng tiền sau giảm" - calculate from totalAmount - discountAmount
        const totalAfterDiscount = (order.totalAmount || 0) - (order.discountAmount || 0);
        return totalAfterDiscount > 0 ? totalAfterDiscount.toLocaleString() + ' ₫' : '-';
      case 'status': return order.status || 'Chưa duyệt';
      case 'notes': return order.notes || '-';
      case 'createdBy': return order.createdBy || '-';
      case 'productType': return order.productType || '-';
      case 'taxRate': 
        return order.discountPercent != null ? order.discountPercent + '%' : 
               order.vatExport ? '10%' : '-';
      case 'salesStaff': return order.salesStaff || '-';
      case 'mergeFrom': return order.mergeFromOrder || '-';
      case 'mergeTo': return order.mergeToOrder || '-';
      case 'customerGroup': return getCustomerGroupName(order.customerGroup);
      case 'salesSchedule': return order.salesSchedule || '-';
      case 'totalAmount': return order.totalAmount ? order.totalAmount.toLocaleString() + ' ₫' : '-';
      case 'totalAfterDiscount': 
        return order.totalAfterDiscount ? order.totalAfterDiscount.toLocaleString() + ' ₫' : '-';
      case 'totalKg': return order.totalKg != null ? order.totalKg.toLocaleString() : '-';
      case 'totalM3': return order.totalM3 != null ? order.totalM3.toLocaleString() : '-';
      case 'printOrder': return order.printOrder || '-';
      case 'address': return order.address || '-';
      case 'paid': return order.paid ? 'Đã thanh toán' : 'Chưa thanh toán';
      case 'deliveryStaff': return order.deliveryStaff || '-';
      case 'driver': return order.driver || '-';
      case 'vehicle': return order.vehicle || '-';
      case 'deliverySuccessful': return order.deliverySuccessful ? 'Có' : 'Chưa';
      case 'vatExport': return order.vatExport ? 'Có' : 'Chưa';
      case 'position': 
        // Handle coordinates display and click to open maps
        const location = order.location || order.address;
        if (!location) return '-';
        
        // Try to detect if it's coordinates (lat,lng format)
        const coordsPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
        const isCoords = coordsPattern.test(location.trim());
        
        if (isCoords) {
          const [lat, lng] = location.split(',').map(x => parseFloat(x.trim()));
          return (
            <span 
              className="location-link"
              style={{ 
                color: '#0066cc', 
                cursor: 'pointer', 
                textDecoration: 'underline',
                fontSize: '12px'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLocationClick(lat, lng, order.customerName || 'Vị trí đơn hàng');
              }}
              title="Click để xem bản đồ và chỉ đường"
            >
              📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          );
        } else {
          // Display as address with click to search
          return (
            <span 
              className="location-link"
              style={{ 
                color: '#0066cc', 
                cursor: 'pointer', 
                textDecoration: 'underline',
                fontSize: '12px'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddressClick(location, order.customerName || 'Địa chỉ đơn hàng');
              }}
              title="Click để xem bản đồ"
            >
              📍 {location.length > 20 ? location.substring(0, 20) + '...' : location}
            </span>
          );
        }
      case 'actions': return (
        <div className="action-cell">
          <button 
            className="edit-btn" 
            title="Sửa"
            onClick={() => navigate(`/business/sales/create-order-form?id=${order.id}`)}
          >
            ✏️
          </button>
          <button className="delete-btn" title="Xóa">🗑️</button>
        </div>
      );
      default: return '-';
    }
  };

  // Column settings handlers
  const toggleColumnVisibility = (columnId) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const resetColumns = () => {
    setColumns([...defaultColumns]);
    // Clear saved settings from localStorage
    try {
      localStorage.removeItem(COLUMN_SETTINGS_KEY);
    } catch (error) {
      console.error('Error clearing column settings:', error);
    }
  };

  // Settings modal drag & drop
  const handleSettingsDragStart = (e, index) => {
    setSettingsDragItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSettingsDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSettingsDrop = (e, targetIndex) => {
    e.preventDefault();
    if (settingsDragItem === null || settingsDragItem === targetIndex) return;

    const newColumns = [...columns];
    const [movedItem] = newColumns.splice(settingsDragItem, 1);
    newColumns.splice(targetIndex, 0, movedItem);

    setColumns(newColumns);
    setSettingsDragItem(null);
  };

  const handleSettingsDragEnd = () => {
    setSettingsDragItem(null);
  };

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateSelect = (date, type) => {
    const newDate = new Date(date);
    
    if (type === 'start') {
      setSelectedStartDate(newDate);
      if (selectedEndDate && newDate > selectedEndDate) {
        setSelectedEndDate(null);
      }
    } else if (type === 'end') {
      setSelectedEndDate(newDate);
    }
    
    // Update date range string when both dates are selected
    const startDate = type === 'start' ? newDate : selectedStartDate;
    const endDate = type === 'end' ? newDate : selectedEndDate;
    
    if (startDate && endDate) {
      const formatDate = (d) => {
        if (!d) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      setSearchData(prev => ({
        ...prev,
        dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`
      }));
    }
  };

  const renderCalendar = (date, monthOffset = 0) => {
    const currentDate = new Date(date);
    currentDate.setMonth(currentDate.getMonth() + monthOffset);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const monthNames = [
      'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
      'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(current);
      const isCurrentMonth = dayDate.getMonth() === month;
      
      // Safe date comparison
      const dayTime = dayDate.getTime();
      const startTime = selectedStartDate ? selectedStartDate.getTime() : null;
      const endTime = selectedEndDate ? selectedEndDate.getTime() : null;
      
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
            if (isCurrentMonth) {
              if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
                // Start new selection
                setSelectedStartDate(dayDate);
                setSelectedEndDate(null);
              } else {
                // Set end date
                if (dayDate >= selectedStartDate) {
                  handleDateSelect(dayDate, 'end');
                } else {
                  // If clicked date is before start, make it new start
                  setSelectedStartDate(dayDate);
                  setSelectedEndDate(selectedStartDate);
                }
              }
            }
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
          <h4>{monthNames[month]} {year}</h4>
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

  return (
    <div className="create-order-page">
      {/* Header */}
      <div className="page-header">
        <h1>TÌM KIẾM - ĐƠN HÀNG SALE</h1>
      </div>

      {/* Search Form */}
      <div className="search-section">
        <div className="search-form-grid">
          {/* First Row */}
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                placeholder="Số phiếu"
                value={searchData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group date-range-container" ref={datePickerRef}>
              <input
                type="text"
                value={searchData.dateRange}
                className="form-input date-range-input"
                placeholder="01/01/2026 - 02/01/2026"
                onClick={handleDateRangeClick}
                readOnly
              />
              <i className="date-range-icon" onClick={handleDateRangeClick}>📅</i>
              
              {showDatePicker && (
                <div className="date-picker-popup">
                  <div className="date-picker-header">
                    <input
                      type="text"
                      value={searchData.dateRange}
                      className="date-range-display"
                      readOnly
                    />
                  </div>
                  <div className="calendar-container">
                    {renderCalendar(selectedStartDate, 0)}
                    {renderCalendar(selectedStartDate, 1)}
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
            
            <div className="form-group">
              <select
                value={searchData.customerGroup}
                onChange={(e) => handleInputChange('customerGroup', e.target.value)}
                className="form-select"
              >
                <option value="">Nhóm khách hàng</option>
                {customerGroups.map(group => (
                  <option key={group.id} value={group.code}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <select
                value={searchData.productType}
                onChange={(e) => handleInputChange('productType', e.target.value)}
                className="form-select"
              >
                <option value="">Loại hàng</option>
                {productCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* search button moved to right column for vertical centering */}
          </div>

          {/* Second Row */}
          <div className="form-row">
            <div className="form-group">
              <select
                value={searchData.customer}
                onChange={(e) => handleInputChange('customer', e.target.value)}
                className="form-select"
              >
                <option value="">Khách hàng</option>
                {customers.map(customer => (
                  <option key={customer.id || customer.code} value={customer.code || customer.id}>
                    {customer.name}{customer.phone ? ` (${customer.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Nhân viên lập"
                value={searchData.createdBy}
                onChange={(e) => handleInputChange('createdBy', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <select
                value={searchData.salesStaff}
                onChange={(e) => handleInputChange('salesStaff', e.target.value)}
                className="form-select"
              >
                <option value="">Nhân viên sale</option>
                <option value="NV Sales 01">NV Sales 01</option>
                <option value="NV Sales 02">NV Sales 02</option>
              </select>
            </div>
            
            <div className="form-group">
              <select
                value={searchData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-select status-select"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Hủy">Hủy</option>
                <option value="Đơn gộp">Đơn gộp</option>
                <option value="Đơn đã gộp">Đơn đã gộp</option>
              </select>
            </div>
            
            <div className="form-group empty-space">
              {/* Empty space for alignment */}
            </div>
          </div>
        </div>

        {/* Right column: (search button moved to action toolbar) */}
        
      </div>

      {/* Toolbar row: total count on left, action buttons on right */}
      <div className="toolbar-row">
        <div className="left-info">
          <span className="total-count">Tổng {filteredOrders.length}</span>
        </div>

{/* Action Buttons directly in toolbar-row */}
        <div className="action-buttons">
          <button className="search-btn action-btn" onClick={handleSearch} title="Tìm kiếm">
            <span className="search-label">TÌM KIẾM</span>
          </button>

          <button className="action-btn blue-btn" title="Thêm mới" onClick={() => navigate('/business/sales/create-order-form')}>
            <i className="icon">📄</i>
          </button>
          <button className="action-btn red-btn" title="Xóa đơn hàng" onClick={handleDeleteSelected}>
            <span style={{fontSize: '12px'}}>Xóa ĐH</span>
          </button>
          <button className="action-btn purple-btn import-btn" title="Import">
            <i className="icon">📥</i>
          </button>
          <button className="action-btn pink-btn" title="Export">
            <i className="icon">📊</i>
          </button>
          <button className="action-btn gray-btn" title="Cài đặt" onClick={() => setShowColumnSettings(true)}>
            <i className="icon">⚙️</i>
          </button>
      </div>

      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th style={{ width: '40px', minWidth: '40px' }}>
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = new Set(currentPageOrders.map(order => order.id));
                      setSelectedOrders(allIds);
                    } else {
                      setSelectedOrders(new Set());
                    }
                  }}
                  checked={currentPageOrders.length > 0 && currentPageOrders.every(order => selectedOrders.has(order.id))}
                />
              </th>
              {columns.filter(col => col.visible).map((column) => (
                <th 
                  key={column.id}
                  style={{ 
                    width: column.width + 'px',
                    minWidth: column.width + 'px',
                    position: 'relative',
                    cursor: dragColumn === column.id ? 'grabbing' : 'grab'
                  }}
                  draggable={column.id !== 'actions'}
                  onDragStart={(e) => handleColumnDragStart(e, column.id)}
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, column.id)}
                  onDragEnd={handleColumnDragEnd}
                  className={dragColumn === column.id ? 'dragging' : ''}
                >
                  {column.label} <i className="sort-icon">🔍</i>
                  {/* Resize handle */}
                  {column.id !== 'actions' && (
                    <div 
                      className="resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                      style={{
                        position: 'absolute',
                        right: '-2px',
                        top: '0',
                        bottom: '0',
                        width: '4px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 10,
                        borderRight: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderRight = '2px solid #007bff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderRight = '2px solid transparent';
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.filter(col => col.visible).length + 1} className="no-data">
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <div className="empty-text">Đang tải dữ liệu...</div>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={columns.filter(col => col.visible).length + 1} className="no-data">
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <div className="empty-text">
                      {orders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng phù hợp'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order, index) => (
                <tr key={order.id || index}>
                  <td style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleOrderSelect(order.id)}
                    />
                  </td>
                  {columns.filter(col => col.visible).map((column) => (
                    <td key={column.id} style={{ width: column.width + 'px' }}>
                      {getCellValue(order, column.id)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-left">
          <label>Hiển thị:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
          >
            {pageOptions.map((opt) => (
              <option key={String(opt)} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="pagination-center">
          <span>Trang {currentPage} / {totalPages}</span>
        </div>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >‹</button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >›</button>
        </div>
      </div>

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
    </div>
  );
};

export default CreateOrder;
