import React, { useState, useEffect } from 'react';
import '../BusinessPage.css';
import './OrderManagement.css';

const OrderManagement = () => {
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
    createdBy: '',
    salesStaff: '',
    status: ''
  });

  const [orders, setOrders] = useState([
    {
      id: 1,
      createdDate: '02/08/2025',
      paymentDate: '03/08/2025',
      invoiceNumber: 'PV230802-056792',
      orderNumber: 'PV230802-056792',
      mergeFromOrder: 'PV230802-056704',
      mergeToOrder: '',
      customerGroup: 'Zần Thôi - Suối Lén',
      salesSchedule: 'Thứ 2, Thứ 5',
      customer: 'An Quyên - CS',
      vehicle: 'Xe 2(PhuT 18 THACO OLLIN)',
      deliveryVehicle: 'Xe 2(PhuT 18 THACO TOWNER BAO KBC 097)',
      printOrder: 29234,
      createdBy: 'Nhân Vân Linh',
      salesStaff: 'Nhân Vân Linh Nguyễn Hương',
      productType: 'Nhăm Nguyền chắc',
      totalAmount: 2500000,
      totalAfterDiscount: 2375000,
      totalWeight: 125,
      totalVolume: 2.8,
      status: 'Đã duyệt',
      note: 'Giao hàng nhanh',
      deliveryNote: 'Hàng dễ vỡ, cẩn thận'
    },
    {
      id: 2,
      createdDate: '02/08/2025',
      paymentDate: '',
      invoiceNumber: '',
      orderNumber: 'PV230802-057096',
      mergeFromOrder: '',
      mergeToOrder: '',
      customerGroup: 'Zần Thôi - Suối Lén',
      salesSchedule: 'Thứ 7',
      customer: 'Hiệp Kim - Cành Cao',
      vehicle: 'Xe 2(PhuT 18 THACO TOWNER BAO KBC 097)',
      deliveryVehicle: 'Xe 2(PhuT 18 THACO TOWNER BAO KBC 097)',
      printOrder: 50022,
      createdBy: 'Nguyễn Phi Long',
      salesStaff: 'Nguyễn Phi Long',
      productType: 'Sữa XUN',
      totalAmount: 1800000,
      totalAfterDiscount: 1710000,
      totalWeight: 90,
      totalVolume: 1.9,
      status: 'Chưa duyệt',
      note: 'Khách VIP',
      deliveryNote: 'Giao tận nhà'
    },
    {
      id: 3,
      createdDate: '02/08/2025',
      paymentDate: '02/08/2025',
      invoiceNumber: 'PV230802-056791',
      orderNumber: 'PV230802-056791',
      mergeFromOrder: '',
      mergeToOrder: 'PV230802-056792',
      customerGroup: 'Zần Thôi - Suối Lén',
      salesSchedule: 'Thứ 2, Thứ 5',
      customer: 'Vỹ Vy Mart gặp bái trưởng',
      vehicle: 'Xe 2(PhuT 18 THACO TOWNER BAO KBC 097)',
      deliveryVehicle: 'Xe 2(PhuT 18 THACO TOWNER BAO KBC 097)',
      printOrder: 163,
      createdBy: 'Dàng Thanh Tâm',
      salesStaff: 'Dàng Thanh Tâm',
      productType: 'Vega',
      totalAmount: 950000,
      totalAfterDiscount: 912500,
      totalWeight: 48,
      totalVolume: 1.0,
      status: 'Đơn đã gộp',
      note: 'Đơn gộp',
      deliveryNote: 'Kiểm tra kỹ'
    },
    // Thêm nhiều đơn hàng khác để test pagination
    ...Array.from({length: 15}, (_, index) => ({
      id: index + 4,
      createdDate: `0${Math.floor(Math.random() * 2) + 1}/08/2025`,
      paymentDate: Math.random() > 0.5 ? `0${Math.floor(Math.random() * 2) + 2}/08/2025` : '',
      invoiceNumber: Math.random() > 0.5 ? `PV230802-05${6700 + index}` : '',
      orderNumber: `PV230802-05${6700 + index}`,
      mergeFromOrder: Math.random() > 0.7 ? `PV230802-05${6700 + index - 1}` : '',
      mergeToOrder: Math.random() > 0.8 ? `PV230802-05${6700 + index + 1}` : '',
      customerGroup: ['Zần Thôi - Suối Lén', 'Khách VIP', 'Khách lẻ'][Math.floor(Math.random() * 3)],
      salesSchedule: ['Thứ 2, Thứ 5', 'Thứ 7', 'Hàng ngày'][Math.floor(Math.random() * 3)],
      customer: ['An Quyên - CS', 'Hiệp Kim', 'Vỹ Vy Mart', 'Khách hàng ' + (index + 4)][Math.floor(Math.random() * 4)],
      vehicle: 'Xe 2(PhuT 18 THACO)',
      deliveryVehicle: 'Xe 2(PhuT 18 THACO)',
      printOrder: 20000 + index,
      createdBy: ['Nhân Vân Linh', 'Nguyễn Phi Long', 'Dàng Thanh Tâm'][Math.floor(Math.random() * 3)],
      salesStaff: ['Nhân Vân Linh', 'Nguyễn Phi Long', 'Dàng Thanh Tâm'][Math.floor(Math.random() * 3)],
      productType: ['Nhăm Nguyền', 'Sữa XUN', 'Vega', 'Coca'][Math.floor(Math.random() * 4)],
      totalAmount: Math.floor(Math.random() * 3000000) + 500000,
      totalAfterDiscount: Math.floor(Math.random() * 2850000) + 475000,
      totalWeight: Math.floor(Math.random() * 150) + 30,
      totalVolume: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
      status: ['Đã duyệt', 'Chưa duyệt', 'Hủy', 'Đơn gộp', 'Đơn đã gộp'][Math.floor(Math.random() * 5)],
      note: ['Giao hàng nhanh', 'Khách VIP', 'Đơn gộp', 'Ưu tiên'][Math.floor(Math.random() * 4)],
      deliveryNote: ['Hàng dễ vỡ', 'Giao tận nhà', 'Kiểm tra kỹ', 'Cẩn thận'][Math.floor(Math.random() * 4)]
    }))
  ]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = getCurrentPageOrders().map(order => order.id);
      setSelectedOrders([...new Set([...selectedOrders, ...currentPageIds])]);
    } else {
      const currentPageIds = getCurrentPageOrders().map(order => order.id);
      setSelectedOrders(selectedOrders.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleSearch = () => {
    console.log('Tìm kiếm với dữ liệu:', searchData);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchData({
      orderNumber: '',
      fromDate: '',
      toDate: '',
      customerGroup: '',
      salesSchedule: '',
      customer: '',
      createdBy: '',
      salesStaff: '',
      status: ''
    });
  };

  const handleBulkAction = (action) => {
    if (selectedOrders.length === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }
    
    switch(action) {
      case 'approve':
        console.log('Duyệt đơn hàng:', selectedOrders);
        break;
      case 'merge':
        console.log('Gộp đơn hàng:', selectedOrders);
        break;
      case 'cancel':
        console.log('Hủy đơn hàng:', selectedOrders);
        break;
      case 'copy':
        console.log('Copy đơn hàng:', selectedOrders);
        break;
      case 'export':
        console.log('Export đơn hàng:', selectedOrders);
        break;
      default:
        break;
    }
  };

  const handleEditOrder = (order) => {
    console.log('Sửa đơn hàng:', order);
  };

  const handleDeleteOrder = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      setOrders(orders.filter(order => order.id !== id));
      setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Đã duyệt': 'status-approved',
      'Chưa duyệt': 'status-pending',
      'Hủy': 'status-cancelled',
      'Đơn gộp': 'status-merged',
      'Đơn đã gộp': 'status-merged-completed'
    };
    return `status-badge ${statusClasses[status] || 'status-default'}`;
  };

  const filteredOrders = orders.filter(order => {
    return (
      (!searchData.orderNumber || order.orderNumber.toLowerCase().includes(searchData.orderNumber.toLowerCase())) &&
      (!searchData.customerGroup || order.customerGroup.includes(searchData.customerGroup)) &&
      (!searchData.salesSchedule || order.salesSchedule.includes(searchData.salesSchedule)) &&
      (!searchData.customer || order.customer.toLowerCase().includes(searchData.customer.toLowerCase())) &&
      (!searchData.createdBy || order.createdBy.toLowerCase().includes(searchData.createdBy.toLowerCase())) &&
      (!searchData.salesStaff || order.salesStaff.toLowerCase().includes(searchData.salesStaff.toLowerCase())) &&
      (!searchData.status || order.status === searchData.status)
    );
  });

  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const isAllCurrentPageSelected = () => {
    const currentPageIds = getCurrentPageOrders().map(order => order.id);
    return currentPageIds.length > 0 && currentPageIds.every(id => selectedOrders.includes(id));
  };

  return (
    <div className="order-management-page">
      {/* Search Section */}
      <div className="search-header">
        <h1>TÌM KIẾM - QUẢN LÝ ĐƠN HÀNG</h1>
        
        <div className="search-form">
          <div className="search-row">
            <div className="search-group">
              <input
                type="text"
                placeholder="Số phiếu"
                value={searchData.orderNumber}
                onChange={(e) => setSearchData({...searchData, orderNumber: e.target.value})}
                className="search-input"
              />
            </div>
            
            <div className="search-group date-range">
              <input
                type="date"
                value={searchData.fromDate}
                onChange={(e) => setSearchData({...searchData, fromDate: e.target.value})}
                className="search-input"
              />
              <span className="date-separator">—</span>
              <input
                type="date"
                value={searchData.toDate}
                onChange={(e) => setSearchData({...searchData, toDate: e.target.value})}
                className="search-input"
              />
            </div>
            
            <div className="search-group">
              <select
                value={searchData.customerGroup}
                onChange={(e) => setSearchData({...searchData, customerGroup: e.target.value})}
                className="search-select"
              >
                <option value="">Nhóm khách hàng</option>
                <option value="Zần Thôi - Suối Lén">Zần Thôi - Suối Lén</option>
                <option value="Khách VIP">Khách VIP</option>
                <option value="Khách lẻ">Khách lẻ</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.salesSchedule}
                onChange={(e) => setSearchData({...searchData, salesSchedule: e.target.value})}
                className="search-select"
              >
                <option value="">Lịch bán hàng</option>
                <option value="Thứ 2, Thứ 5">Thứ 2, Thứ 5</option>
                <option value="Thứ 7">Thứ 7</option>
                <option value="Hàng ngày">Hàng ngày</option>
              </select>
            </div>
          </div>
          
          <div className="search-row">
            <div className="search-group">
              <select
                value={searchData.customer}
                onChange={(e) => setSearchData({...searchData, customer: e.target.value})}
                className="search-select"
              >
                <option value="">Khách hàng</option>
                <option value="An Quyên - CS">An Quyên - CS</option>
                <option value="Hiệp Kim">Hiệp Kim</option>
                <option value="Vỹ Vy Mart">Vỹ Vy Mart</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.createdBy}
                onChange={(e) => setSearchData({...searchData, createdBy: e.target.value})}
                className="search-select"
              >
                <option value="">Nhân viên lập</option>
                <option value="Nhân Vân Linh">Nhân Vân Linh</option>
                <option value="Nguyễn Phi Long">Nguyễn Phi Long</option>
                <option value="Dàng Thanh Tâm">Dàng Thanh Tâm</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.salesStaff}
                onChange={(e) => setSearchData({...searchData, salesStaff: e.target.value})}
                className="search-select"
              >
                <option value="">Nhân viên sale</option>
                <option value="Nhân Vân Linh">Nhân Vân Linh</option>
                <option value="Nguyễn Phi Long">Nguyễn Phi Long</option>
                <option value="Dàng Thanh Tâm">Dàng Thanh Tâm</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.status}
                onChange={(e) => setSearchData({...searchData, status: e.target.value})}
                className="search-select"
              >
                <option value="">Trạng thái</option>
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đơn gộp">Đơn gộp</option>
                <option value="Đơn đã gộp">Đơn đã gộp</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bulk-actions">
        <span className="total-count">Tổng {filteredOrders.length}</span>
        
        <div className="action-button-group">
          <button 
            className="bulk-btn btn-cancel"
            onClick={() => handleBulkAction('cancel')}
            disabled={selectedOrders.length === 0}
          >
            <i className="fas fa-times"></i> Hủy
          </button>
          <button 
            className="bulk-btn btn-approve"
            onClick={() => handleBulkAction('approve')}
            disabled={selectedOrders.length === 0}
          >
            <i className="fas fa-check"></i> Duyệt
          </button>
          <button 
            className="bulk-btn btn-merge"
            onClick={() => handleBulkAction('merge')}
            disabled={selectedOrders.length === 0}
          >
            <i className="fas fa-layer-group"></i> Gộp đơn
          </button>
          <button 
            className="bulk-btn btn-copy"
            onClick={() => handleBulkAction('copy')}
            disabled={selectedOrders.length === 0}
          >
            <i className="fas fa-copy"></i> Sao chép tự động
          </button>
          <button 
            className="bulk-btn btn-search"
            onClick={handleSearch}
          >
            <i className="fas fa-search"></i> Tìm kiếm
          </button>
        </div>
        
        <div className="table-actions">
          <button className="action-btn create-btn" title="Thêm">
            <i className="fas fa-plus"></i>
          </button>
          <button className="action-btn import-btn" title="Import">
            <i className="fas fa-file-import"></i>
          </button>
          <button className="action-btn export-btn" title="Export">
            <i className="fas fa-file-export"></i>
          </button>
          <button className="action-btn settings-btn" title="Cài đặt">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="orders-table full-width">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected()}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Ngày lập <i className="fas fa-search"></i></th>
              <th>Ngày thanh toán <i className="fas fa-search"></i></th>
              <th>Số hóa đơn <i className="fas fa-search"></i></th>
              <th>Gộp từ đơn <i className="fas fa-search"></i></th>
              <th>Gộp vào đơn <i className="fas fa-search"></i></th>
              <th>Nhóm khách hàng <i className="fas fa-search"></i></th>
              <th>Lịch bán hàng <i className="fas fa-search"></i></th>
              <th>Khách hàng <i className="fas fa-search"></i></th>
              <th>Xe <i className="fas fa-search"></i></th>
              <th>Xe giao hàng <i className="fas fa-search"></i></th>
              <th>STT in <i className="fas fa-search"></i></th>
              <th>Nhân viên lập <i className="fas fa-search"></i></th>
              <th>Nhân viên sales <i className="fas fa-search"></i></th>
              <th>Loại hàng <i className="fas fa-search"></i></th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageOrders().map(order => (
              <tr key={order.id} className={selectedOrders.includes(order.id) ? 'selected' : ''}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                  />
                </td>
                <td>{order.createdDate}</td>
                <td>{order.paymentDate || '-'}</td>
                <td>{order.invoiceNumber || '-'}</td>
                <td>{order.mergeFromOrder || '-'}</td>
                <td>{order.mergeToOrder || '-'}</td>
                <td>{order.customerGroup}</td>
                <td>{order.salesSchedule}</td>
                <td>{order.customer}</td>
                <td>{order.vehicle}</td>
                <td>{order.deliveryVehicle}</td>
                <td>{order.printOrder}</td>
                <td>{order.createdBy}</td>
                <td>{order.salesStaff}</td>
                <td>{order.productType}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => handleEditOrder(order)}
                      title="Sửa"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Xóa"
                    >
                      <i className="fas fa-trash"></i>
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
          <span>
            Đơng 1-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} trên tổng {filteredOrders.length} đơn
          </span>
        </div>
        
        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          
          <div className="page-numbers">
            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
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
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          
          <span className="items-per-page">10 / trang</span>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
