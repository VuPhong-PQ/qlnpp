import React, { useState, useEffect } from 'react';
import '../BusinessPage.css';
import './PrintOrder.css';

const PrintOrder = () => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchData, setSearchData] = useState({
    orderNumber: '',
    fromDate: '',
    toDate: '',
    customerGroup: '',
    salesSchedule: '',
    customer: '',
    createBy: '',
    salesStaff: '',
    status: ''
  });

  // Sample data for print orders
  const [orders] = useState([
    {
      id: 1,
      createDate: '01/08/2025 06:51',
      orderNumber: 'PX250801-056717',
      customerGroup: '6-Nội Bộ',
      salesSchedule: '-',
      customer: 'NV. Trung Sale',
      vehicle: '',
      deliveryVehicle: '',
      serialNumber: 1,
      createBy: 'Trung Sale',
      salesStaff: 'Trung Sale',
      productType: 'Nội bộ',
      totalAmount: 2500000,
      totalAfterDiscount: 2400000,
      totalWeight: 1250,
      totalVolume: 45.5,
      status: 'Đã duyệt',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    },
    {
      id: 2,
      createDate: '02/08/2025 00:00',
      orderNumber: 'PX250802-057064',
      customerGroup: '6-Nội Bộ',
      salesSchedule: '-',
      customer: 'NV. Trung Sale',
      vehicle: '',
      deliveryVehicle: '',
      serialNumber: 2,
      createBy: 'Trung Sale',
      salesStaff: 'Trung Sale',
      productType: 'Nội bộ',
      totalAmount: 1800000,
      totalAfterDiscount: 1750000,
      totalWeight: 950,
      totalVolume: 32.8,
      status: 'Đã duyệt',
      printStatus: 'Đã in',
      printCount: 2,
      printDate: '02/08/2025 14:30'
    },
    {
      id: 3,
      createDate: '01/08/2025 16:12',
      orderNumber: 'PX250801-057006',
      customerGroup: '6-Nội Bộ',
      salesSchedule: 'nội bộ',
      customer: 'NV. Nhật Hà (sale kun)',
      vehicle: '',
      deliveryVehicle: '',
      serialNumber: 3,
      createBy: 'Nhật Hà',
      salesStaff: 'Nhật Hà',
      productType: 'nội bộ',
      totalAmount: 3200000,
      totalAfterDiscount: 3100000,
      totalWeight: 1580,
      totalVolume: 58.2,
      status: 'Chưa duyệt',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    },
    {
      id: 4,
      createDate: '01/08/2025 08:17',
      orderNumber: 'PX250801-056738',
      customerGroup: '6-Nội Bộ',
      salesSchedule: '-',
      customer: 'NV. Long P&G',
      vehicle: '',
      deliveryVehicle: '',
      serialNumber: 4,
      createBy: 'Long P&G',
      salesStaff: 'Long P&G',
      productType: 'Nội bộ',
      totalAmount: 4100000,
      totalAfterDiscount: 4000000,
      totalWeight: 2150,
      totalVolume: 72.3,
      status: 'Đã duyệt',
      printStatus: 'Đã in',
      printCount: 1,
      printDate: '01/08/2025 15:45'
    },
    {
      id: 5,
      createDate: '01/08/2025 12:57',
      orderNumber: 'PX250801-056887',
      customerGroup: '6-Nội Bộ',
      salesSchedule: 'nội bộ',
      customer: 'NV. Hùng P&G',
      vehicle: '',
      deliveryVehicle: '',
      serialNumber: 5,
      createBy: 'Hùng P&G',
      salesStaff: 'Hùng P&G',
      productType: 'nội bộ',
      totalAmount: 2850000,
      totalAfterDiscount: 2800000,
      totalWeight: 1420,
      totalVolume: 51.7,
      status: 'Đã duyệt',
      printStatus: 'Đã in',
      printCount: 3,
      printDate: '01/08/2025 16:22'
    },
    {
      id: 6,
      createDate: '30/07/2025 14:35',
      orderNumber: 'PX250730-055921',
      customerGroup: '3-Khách VIP',
      salesSchedule: 'Morning',
      customer: 'Công ty TNHH ABC',
      vehicle: '29A-12345',
      deliveryVehicle: '29B-67890',
      serialNumber: 6,
      createBy: 'Mai Anh',
      salesStaff: 'Thành Đạt',
      productType: 'Hàng thường',
      totalAmount: 5500000,
      totalAfterDiscount: 5300000,
      totalWeight: 2800,
      totalVolume: 95.4,
      status: 'Đơn gộp',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    },
    {
      id: 7,
      createDate: '30/07/2025 09:18',
      orderNumber: 'PX250730-055832',
      customerGroup: '2-Khách Thường',
      salesSchedule: 'Evening',
      customer: 'Cửa hàng Minh Phát',
      vehicle: '30C-54321',
      deliveryVehicle: '30D-98765',
      serialNumber: 7,
      createBy: 'Văn Hùng',
      salesStaff: 'Minh Tuấn',
      productType: 'Hàng khuyến mãi',
      totalAmount: 1950000,
      totalAfterDiscount: 1850000,
      totalWeight: 980,
      totalVolume: 35.6,
      status: 'Hủy',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    },
    {
      id: 8,
      createDate: '29/07/2025 16:42',
      orderNumber: 'PX250729-055743',
      customerGroup: '1-Khách Sỉ',
      salesSchedule: 'All day',
      customer: 'Siêu thị Coopmart',
      vehicle: '51F-11111',
      deliveryVehicle: '51G-22222',
      serialNumber: 8,
      createBy: 'Thị Lan',
      salesStaff: 'Quốc Anh',
      productType: 'Hàng cao cấp',
      totalAmount: 8750000,
      totalAfterDiscount: 8500000,
      totalWeight: 4200,
      totalVolume: 145.8,
      status: 'Đơn đã gộp',
      printStatus: 'Đã in',
      printCount: 4,
      printDate: '29/07/2025 18:15'
    },
    {
      id: 9,
      createDate: '29/07/2025 11:28',
      orderNumber: 'PX250729-055654',
      customerGroup: '4-Đại lý',
      salesSchedule: 'Morning',
      customer: 'Đại lý Phương Nam',
      vehicle: '59H-33333',
      deliveryVehicle: '59I-44444',
      serialNumber: 9,
      createBy: 'Hoàng Nam',
      salesStaff: 'Bảo Trung',
      productType: 'Hàng đại lý',
      totalAmount: 6200000,
      totalAfterDiscount: 6000000,
      totalWeight: 3100,
      totalVolume: 108.3,
      status: 'Đã duyệt',
      printStatus: 'Đã in',
      printCount: 1,
      printDate: '29/07/2025 13:40'
    },
    {
      id: 10,
      createDate: '28/07/2025 08:15',
      orderNumber: 'PX250728-055565',
      customerGroup: '5-Khách lẻ',
      salesSchedule: 'Evening',
      customer: 'Chị Ngọc - Quận 1',
      vehicle: '',
      deliveryVehicle: '92K-55555',
      serialNumber: 10,
      createBy: 'Thu Hằng',
      salesStaff: 'Minh Hạnh',
      productType: 'Hàng lẻ',
      totalAmount: 1250000,
      totalAfterDiscount: 1200000,
      totalWeight: 625,
      totalVolume: 22.4,
      status: 'Chưa duyệt',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    },
    {
      id: 11,
      createDate: '28/07/2025 15:33',
      orderNumber: 'PX250728-055476',
      customerGroup: '3-Khách VIP',
      salesSchedule: 'All day',
      customer: 'Tập đoàn XYZ',
      vehicle: '43L-66666',
      deliveryVehicle: '43M-77777',
      serialNumber: 11,
      createBy: 'Đức Mạnh',
      salesStaff: 'Quang Huy',
      productType: 'Hàng VIP',
      totalAmount: 12500000,
      totalAfterDiscount: 12000000,
      totalWeight: 6250,
      totalVolume: 218.7,
      status: 'Đã duyệt',
      printStatus: 'Đã in',
      printCount: 2,
      printDate: '28/07/2025 17:20'
    },
    {
      id: 12,
      createDate: '27/07/2025 10:45',
      orderNumber: 'PX250727-055387',
      customerGroup: '2-Khách Thường',
      salesSchedule: 'Morning',
      customer: 'Cửa hàng Tấn Phát',
      vehicle: '61N-88888',
      deliveryVehicle: '61O-99999',
      serialNumber: 12,
      createBy: 'Thanh Tùng',
      salesStaff: 'Văn Đức',
      productType: 'Hàng thường',
      totalAmount: 3400000,
      totalAfterDiscount: 3300000,
      totalWeight: 1700,
      totalVolume: 59.5,
      status: 'Đơn gộp',
      printStatus: 'Chưa in',
      printCount: 0,
      printDate: null
    }
  ]);

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  // Handle checkbox selection
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map(order => order.id));
    }
  };

  // Handle search
  const handleSearch = () => {
    console.log('Searching with:', searchData);
  };

  // Handle print order
  const handlePrintOrder = (orderId) => {
    console.log('Printing order:', orderId);
    // Logic to print order details
  };

  // Handle view order details
  const handleViewDetails = (orderId) => {
    console.log('Viewing order details:', orderId);
    // Logic to show order details modal
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
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

  const getPrintStatusClass = (status) => {
    return status === 'Đã in' ? 'status-printed' : 'status-not-printed';
  };

  return (
    <div className="print-order-page">
      {/* Search Header */}
      <div className="search-panel">
        <div className="search-header">
          <h1>TÌM KIẾM - IN ĐƠN HÀNG</h1>
        </div>
        
        <div className="search-form">
          <div className="search-row">
            <div className="search-group">
              <input
                type="text"
                placeholder="Số phiếu"
                className="search-input"
                value={searchData.orderNumber}
                onChange={(e) => setSearchData({...searchData, orderNumber: e.target.value})}
              />
            </div>
            
            <div className="date-range">
              <input
                type="date"
                className="search-input"
                value={searchData.fromDate}
                onChange={(e) => setSearchData({...searchData, fromDate: e.target.value})}
              />
              <span>—</span>
              <input
                type="date"
                className="search-input"
                value={searchData.toDate}
                onChange={(e) => setSearchData({...searchData, toDate: e.target.value})}
              />
            </div>
            
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.customerGroup}
                onChange={(e) => setSearchData({...searchData, customerGroup: e.target.value})}
              >
                <option value="">Nhóm khách hàng</option>
                <option value="1-Khách Sỉ">1-Khách Sỉ</option>
                <option value="2-Khách Thường">2-Khách Thường</option>
                <option value="3-Khách VIP">3-Khách VIP</option>
                <option value="4-Đại lý">4-Đại lý</option>
                <option value="5-Khách lẻ">5-Khách lẻ</option>
                <option value="6-Nội Bộ">6-Nội Bộ</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.salesSchedule}
                onChange={(e) => setSearchData({...searchData, salesSchedule: e.target.value})}
              >
                <option value="">Lịch bán hàng</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="All day">All day</option>
                <option value="nội bộ">nội bộ</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.customer}
                onChange={(e) => setSearchData({...searchData, customer: e.target.value})}
              >
                <option value="">Khách hàng</option>
                <option value="NV. Trung Sale">NV. Trung Sale</option>
                <option value="NV. Nhật Hà">NV. Nhật Hà</option>
                <option value="NV. Long P&G">NV. Long P&G</option>
                <option value="NV. Hùng P&G">NV. Hùng P&G</option>
                <option value="Công ty TNHH ABC">Công ty TNHH ABC</option>
                <option value="Cửa hàng Minh Phát">Cửa hàng Minh Phát</option>
                <option value="Siêu thị Coopmart">Siêu thị Coopmart</option>
              </select>
            </div>
          </div>
          
          <div className="search-row">
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.createBy}
                onChange={(e) => setSearchData({...searchData, createBy: e.target.value})}
              >
                <option value="">Nhân viên lập</option>
                <option value="Trung Sale">Trung Sale</option>
                <option value="Nhật Hà">Nhật Hà</option>
                <option value="Long P&G">Long P&G</option>
                <option value="Hùng P&G">Hùng P&G</option>
                <option value="Mai Anh">Mai Anh</option>
                <option value="Văn Hùng">Văn Hùng</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.salesStaff}
                onChange={(e) => setSearchData({...searchData, salesStaff: e.target.value})}
              >
                <option value="">Nhân viên sales</option>
                <option value="Trung Sale">Trung Sale</option>
                <option value="Nhật Hà">Nhật Hà</option>
                <option value="Thành Đạt">Thành Đạt</option>
                <option value="Minh Tuấn">Minh Tuấn</option>
                <option value="Quốc Anh">Quốc Anh</option>
                <option value="Bảo Trung">Bảo Trung</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                className="search-select"
                value={searchData.status}
                onChange={(e) => setSearchData({...searchData, status: e.target.value})}
              >
                <option value="">Trạng thái</option>
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đơn gộp">Đơn gộp</option>
                <option value="Đơn đã gộp">Đơn đã gộp</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
            
            <div className="search-actions">
              <button className="btn btn-search" onClick={handleSearch}>
                🔍 Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-header">
        <div className="total-info">
          Tổng {orders.length}
        </div>
        <div className="action-buttons">
          <button className="action-btn btn-export">📊</button>
          <button className="action-btn btn-print">🖨️</button>
          <button className="action-btn btn-settings">⚙️</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table print-orders-table full-width">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Ngày lập</th>
              <th>Số phiếu</th>
              <th>Nhóm khách hàng</th>
              <th>Lịch bán hàng</th>
              <th>Khách hàng</th>
              <th>Xe</th>
              <th>Xe giao hàng</th>
              <th>STT in</th>
              <th>Nhân viên lập</th>
              <th>Nhân viên sales</th>
              <th>Loại hàng</th>
              <th>Tổng tiền</th>
              <th>Tổng tiền sau giảm</th>
              <th>Tổng số kg</th>
              <th>Tổng số khối</th>
              <th>Trạng thái</th>
              <th>Trạng thái in</th>
              <th>Số lần in</th>
              <th>Ngày in</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr 
                key={order.id}
                className={selectedOrders.includes(order.id) ? 'selected' : ''}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                  />
                </td>
                <td>{order.createDate}</td>
                <td>
                  <a href="#" className="order-link" onClick={() => handleViewDetails(order.id)}>
                    {order.orderNumber}
                  </a>
                </td>
                <td>{order.customerGroup}</td>
                <td>{order.salesSchedule}</td>
                <td>{order.customer}</td>
                <td>{order.vehicle}</td>
                <td>{order.deliveryVehicle}</td>
                <td>{order.serialNumber}</td>
                <td>{order.createBy}</td>
                <td>{order.salesStaff}</td>
                <td>{order.productType}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>{formatCurrency(order.totalAfterDiscount)}</td>
                <td>{formatNumber(order.totalWeight)} kg</td>
                <td>{formatNumber(order.totalVolume)} m³</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getPrintStatusClass(order.printStatus)}`}>
                    {order.printStatus}
                  </span>
                </td>
                <td>{order.printCount}</td>
                <td>{order.printDate || '-'}</td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="action-btn btn-view"
                      onClick={() => handleViewDetails(order.id)}
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị {startIndex + 1}-{Math.min(endIndex, orders.length)} của {orders.length} kết quả
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
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
        
        <div className="items-per-page">
          Hiển thị {itemsPerPage} dòng mặc định
        </div>
      </div>
    </div>
  );
};

export default PrintOrder;
