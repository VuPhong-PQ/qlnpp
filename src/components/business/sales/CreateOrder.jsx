import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';
import '../BusinessPage.css';

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

  const pageOptions = [10, 20, 50, 100, 200, 500, 1000, 5000, 'All'];
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, filteredOrders.length]);

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = pageSize === 'All'
    ? filteredOrders
    : filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  // Load initial data
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchCustomerGroups();
    fetchUsers();
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
    
    // Filter by created by
    if (searchData.createdBy && searchData.createdBy.trim()) {
      filtered = filtered.filter(order => 
        order.createdBy && order.createdBy.toLowerCase().includes(searchData.createdBy.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
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
                <option value="Nước giải khát">Nước giải khát</option>
                <option value="Bánh kẹo">Bánh kẹo</option>
                <option value="Thực phẩm">Thực phẩm</option>
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
          <button className="action-btn purple-btn import-btn" title="Import">
            <i className="icon">📥</i>
          </button>
          <button className="action-btn pink-btn" title="Export">
            <i className="icon">📊</i>
          </button>
          <button className="action-btn gray-btn" title="Cài đặt">
            <i className="icon">⚙️</i>
          </button>
      </div>

      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Ngày lập <i className="sort-icon">🔍</i></th>
              <th>Số phiếu <i className="sort-icon">🔍</i></th>
              <th>Khách hàng <i className="sort-icon">🔍</i></th>
              <th>Tổng tiền sau giảm <i className="sort-icon">🔍</i></th>
              <th>Trạng thái <i className="sort-icon">🔍</i></th>
              <th>Ghi chú đơn hàng <i className="sort-icon">🔍</i></th>
              <th>Nhân viên lập <i className="sort-icon">🔍</i></th>
              <th>Loại hàng <i className="sort-icon">🔍</i></th>
              <th>Thuế suất <i className="sort-icon">🔍</i></th>
              <th>Nhân viên sale <i className="sort-icon">🔍</i></th>
              <th>Gộp từ đơn <i className="sort-icon">🔍</i></th>
              <th>Gộp vào đơn <i className="sort-icon">🔍</i></th>
              <th>Nhóm khách hàng <i className="sort-icon">🔍</i></th>
              <th>Lịch bán hàng <i className="sort-icon">🔍</i></th>
              <th>Tổng tiền <i className="sort-icon">🔍</i></th>
              <th>Tổng số kg <i className="sort-icon">🔍</i></th>
              <th>Tổng số khối <i className="sort-icon">🔍</i></th>
              <th>Số thứ tự in <i className="sort-icon">🔍</i></th>
              <th>Địa chỉ <i className="sort-icon">🔍</i></th>
              <th>Đã thanh toán <i className="sort-icon">🔍</i></th>
              <th>Nhân viên giao <i className="sort-icon">🔍</i></th>
              <th>Tài xế <i className="sort-icon">🔍</i></th>
              <th>Xe <i className="sort-icon">🔍</i></th>
              <th>Giao thành công <i className="sort-icon">🔍</i></th>
              <th>Xuất VAT <i className="sort-icon">🔍</i></th>
              <th>Vị trí <i className="sort-icon">🔍</i></th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="27" className="no-data">
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <div className="empty-text">Đang tải dữ liệu...</div>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="27" className="no-data">
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
                  <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>{order.orderNumber || '-'}</td>
                  <td>{order.customerName || '-'}</td>
                  <td>{order.payment ? order.payment.toLocaleString() + ' ₫' : '-'}</td>
                  <td>{order.status || 'Chưa duyệt'}</td>
                  <td>{order.notes || '-'}</td>
                  <td>{order.createdBy || '-'}</td>
                  <td>{order.productType || '-'}</td>
                  <td>{order.taxRate != null ? order.taxRate + '%' : '-'}</td>
                  <td>{order.salesStaff || '-'}</td>
                  <td>{order.mergeFrom || '-'}</td>
                  <td>{order.mergeTo || '-'}</td>
                  <td>{getCustomerGroupName(order.customerGroup)}</td>
                  <td>{order.salesSchedule || '-'}</td>
                  <td>{order.payment ? order.payment.toLocaleString() + ' ₫' : '-'}</td>
                  <td>{order.totalKg != null ? order.totalKg.toLocaleString() : '-'}</td>
                  <td>{order.totalM3 != null ? order.totalM3.toLocaleString() : '-'}</td>
                  <td>{order.printOrder || '-'}</td>
                  <td>{order.address || '-'}</td>
                  <td>{order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
                  <td>{order.deliveryStaff || '-'}</td>
                  <td>{order.driver || '-'}</td>
                  <td>{order.vehicle || '-'}</td>
                  <td>{order.deliverySuccessful ? 'Có' : 'Chưa'}</td>
                  <td>{order.vatExport ? 'Có' : 'Chưa'}</td>
                  <td>{order.vehicle || '-'}</td>
                  <td>
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
                  </td>
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
    </div>
  );
};

export default CreateOrder;
