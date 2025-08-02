import React, { useState, useEffect } from 'react';
import '../BusinessPage.css';

const CreateOrder = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
      orderNumber: 'DH250802-000001',
      mergeFromOrder: '',
      mergeToOrder: '',
      customerGroup: 'Khách lẻ',
      salesSchedule: 'Lịch hàng ngày',
      customer: 'Nguyễn Văn A',
      vehicle: 'Xe tải 001',
      deliveryVehicle: 'Xe giao 001',
      printOrder: 1,
      createdBy: 'admin 66',
      salesStaff: 'NV Sales 01',
      productType: 'Nước giải khát',
      totalAmount: 2400000,
      totalAfterDiscount: 2280000,
      totalWeight: 120,
      totalVolume: 2.5,
      note: 'Giao hàng trước 8h sáng',
      status: 'Đã duyệt',
      isActive: true
    },
    {
      id: 2,
      createdDate: '01/08/2025',
      orderNumber: 'DH250801-000002',
      mergeFromOrder: '',
      mergeToOrder: '',
      customerGroup: 'Khách sỉ',
      salesSchedule: 'Lịch hàng tuần',
      customer: 'Công ty ABC',
      vehicle: 'Xe tải 002',
      deliveryVehicle: 'Xe giao 002',
      printOrder: 2,
      createdBy: 'admin 66',
      salesStaff: 'NV Sales 02',
      productType: 'Bánh kẹo',
      totalAmount: 1800000,
      totalAfterDiscount: 1710000,
      totalWeight: 85,
      totalVolume: 1.8,
      note: 'Khách VIP, ưu tiên giao hàng',
      status: 'Chưa duyệt',
      isActive: true
    },
    {
      id: 3,
      createdDate: '31/07/2025',
      orderNumber: 'DH250731-000003',
      mergeFromOrder: '',
      mergeToOrder: 'DH250802-000001',
      customerGroup: 'Khách lẻ',
      salesSchedule: 'Lịch hàng ngày',
      customer: 'Trần Thị B',
      vehicle: 'Xe tải 003',
      deliveryVehicle: 'Xe giao 003',
      printOrder: 3,
      createdBy: 'admin 66',
      salesStaff: 'NV Sales 01',
      productType: 'Thực phẩm',
      totalAmount: 950000,
      totalAfterDiscount: 912500,
      totalWeight: 45,
      totalVolume: 0.9,
      note: 'Đơn hàng gộp',
      status: 'Đơn đã gộp',
      isActive: true
    }
  ]);

  const handleSearch = () => {
    console.log('Tìm kiếm với dữ liệu:', searchData);
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

  const handleCreateOrder = () => {
    setShowModal(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleDeleteOrder = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  const handleImportExcel = () => {
    console.log('Import từ Excel');
  };

  const handleExportExcel = () => {
    console.log('Export ra Excel');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
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
      (!searchData.customerGroup || order.customerGroup === searchData.customerGroup) &&
      (!searchData.salesSchedule || order.salesSchedule === searchData.salesSchedule) &&
      (!searchData.customer || order.customer.toLowerCase().includes(searchData.customer.toLowerCase())) &&
      (!searchData.createdBy || order.createdBy.toLowerCase().includes(searchData.createdBy.toLowerCase())) &&
      (!searchData.salesStaff || order.salesStaff.toLowerCase().includes(searchData.salesStaff.toLowerCase())) &&
      (!searchData.status || order.status === searchData.status)
    );
  });

  return (
    <div className="create-order-page">
      {/* Search Section */}
      <div className="search-header">
        <h1>TÌM KIẾM - ĐƠN HÀNG SALE</h1>
        
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
                <option value="Khách lẻ">Khách lẻ</option>
                <option value="Khách sỉ">Khách sỉ</option>
                <option value="Khách VIP">Khách VIP</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.salesSchedule}
                onChange={(e) => setSearchData({...searchData, salesSchedule: e.target.value})}
                className="search-select"
              >
                <option value="">Lịch bán hàng</option>
                <option value="Lịch hàng ngày">Lịch hàng ngày</option>
                <option value="Lịch hàng tuần">Lịch hàng tuần</option>
                <option value="Lịch hàng tháng">Lịch hàng tháng</option>
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
                <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                <option value="Công ty ABC">Công ty ABC</option>
                <option value="Trần Thị B">Trần Thị B</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.createdBy}
                onChange={(e) => setSearchData({...searchData, createdBy: e.target.value})}
                className="search-select"
              >
                <option value="">Nhân viên lập</option>
                <option value="admin 66">admin 66</option>
                <option value="NV001">NV001</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.salesStaff}
                onChange={(e) => setSearchData({...searchData, salesStaff: e.target.value})}
                className="search-select"
              >
                <option value="">Nhân viên sale</option>
                <option value="NV Sales 01">NV Sales 01</option>
                <option value="NV Sales 02">NV Sales 02</option>
              </select>
            </div>
            
            <div className="search-group">
              <select
                value={searchData.status}
                onChange={(e) => setSearchData({...searchData, status: e.target.value})}
                className="search-select"
              >
                <option value="">Trạng thái</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Hủy">Hủy</option>
                <option value="Đơn gộp">Đơn gộp</option>
                <option value="Đơn đã gộp">Đơn đã gộp</option>
              </select>
            </div>
            
            <div className="search-actions">
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="fas fa-search"></i> TÌM KIẾM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Actions */}
      <div className="content-header">
        <div className="stats-info">
          <span>Tổng {filteredOrders.length}</span>
        </div>
        
        <div className="action-buttons">
          <button className="action-btn create-btn" onClick={handleCreateOrder}>
            <i className="fas fa-plus"></i>
          </button>
          <button className="action-btn export-btn" onClick={handleExportExcel}>
            <i className="fas fa-file-excel"></i>
          </button>
          <button className="action-btn import-btn" onClick={handleImportExcel}>
            <i className="fas fa-file-import"></i>
          </button>
          <button className="action-btn settings-btn">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Ngày lập <i className="fas fa-search"></i></th>
              <th>Số phiếu <i className="fas fa-search"></i></th>
              <th>Gộp từ đơn <i className="fas fa-search"></i></th>
              <th>Gộp vào đơn <i className="fas fa-search"></i></th>
              <th>Nhóm khách hàng <i className="fas fa-search"></i></th>
              <th>Lịch bán hàng <i className="fas fa-search"></i></th>
              <th>Khách hàng <i className="fas fa-search"></i></th>
              <th>Xe <i className="fas fa-search"></i></th>
              <th>Xe giao hàng <i className="fas fa-search"></i></th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.createdDate}</td>
                  <td>{order.orderNumber}</td>
                  <td>{order.mergeFromOrder || '-'}</td>
                  <td>{order.mergeToOrder || '-'}</td>
                  <td>{order.customerGroup}</td>
                  <td>{order.salesSchedule}</td>
                  <td>{order.customer}</td>
                  <td>{order.vehicle}</td>
                  <td>{order.deliveryVehicle}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data">
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

      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-info">
          <span>{filteredOrders.length}</span>
        </div>
        <div className="pagination-controls">
          <button className="pagination-btn">‹</button>
          <div className="pagination-slider">
            <div className="slider-track"></div>
          </div>
          <button className="pagination-btn">›</button>
        </div>
      </div>

      {/* Modal for Create/Edit Order */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedOrder ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <h4>Thông tin đơn hàng</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ngày lập <span className="required">*</span></label>
                    <input 
                      type="date" 
                      defaultValue={selectedOrder?.createdDate.split('/').reverse().join('-') || new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Số phiếu <span className="required">*</span></label>
                    <input 
                      type="text" 
                      defaultValue={selectedOrder?.orderNumber || ''} 
                      placeholder="Tự động tạo"
                    />
                  </div>
                  <div className="form-group">
                    <label>Gộp từ đơn</label>
                    <input 
                      type="text" 
                      defaultValue={selectedOrder?.mergeFromOrder || ''} 
                      placeholder="Nhập số đơn"
                    />
                  </div>
                  <div className="form-group">
                    <label>Gộp vào đơn</label>
                    <input 
                      type="text" 
                      defaultValue={selectedOrder?.mergeToOrder || ''} 
                      placeholder="Nhập số đơn"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nhóm khách hàng <span className="required">*</span></label>
                    <select defaultValue={selectedOrder?.customerGroup || ''}>
                      <option value="">Chọn nhóm khách hàng</option>
                      <option value="Khách lẻ">Khách lẻ</option>
                      <option value="Khách sỉ">Khách sỉ</option>
                      <option value="Khách VIP">Khách VIP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lịch khách hàng</label>
                    <select defaultValue={selectedOrder?.salesSchedule || ''}>
                      <option value="">Chọn lịch bán hàng</option>
                      <option value="Lịch hàng ngày">Lịch hàng ngày</option>
                      <option value="Lịch hàng tuần">Lịch hàng tuần</option>
                      <option value="Lịch hàng tháng">Lịch hàng tháng</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Khách hàng <span className="required">*</span></label>
                    <select defaultValue={selectedOrder?.customer || ''}>
                      <option value="">Chọn khách hàng</option>
                      <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                      <option value="Công ty ABC">Công ty ABC</option>
                      <option value="Trần Thị B">Trần Thị B</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Xe</label>
                    <select defaultValue={selectedOrder?.vehicle || ''}>
                      <option value="">Chọn xe</option>
                      <option value="Xe tải 001">Xe tải 001</option>
                      <option value="Xe tải 002">Xe tải 002</option>
                      <option value="Xe tải 003">Xe tải 003</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Xe giao hàng</label>
                    <select defaultValue={selectedOrder?.deliveryVehicle || ''}>
                      <option value="">Chọn xe giao hàng</option>
                      <option value="Xe giao 001">Xe giao 001</option>
                      <option value="Xe giao 002">Xe giao 002</option>
                      <option value="Xe giao 003">Xe giao 003</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>STT In</label>
                    <input 
                      type="number" 
                      defaultValue={selectedOrder?.printOrder || 1} 
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nhân viên lập</label>
                    <select defaultValue={selectedOrder?.createdBy || ''}>
                      <option value="">Chọn nhân viên</option>
                      <option value="admin 66">admin 66</option>
                      <option value="NV001">NV001</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhân viên sales</label>
                    <select defaultValue={selectedOrder?.salesStaff || ''}>
                      <option value="">Chọn nhân viên sales</option>
                      <option value="NV Sales 01">NV Sales 01</option>
                      <option value="NV Sales 02">NV Sales 02</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Loại hàng</label>
                    <select defaultValue={selectedOrder?.productType || ''}>
                      <option value="">Chọn loại hàng</option>
                      <option value="Nước giải khát">Nước giải khát</option>
                      <option value="Bánh kẹo">Bánh kẹo</option>
                      <option value="Thực phẩm">Thực phẩm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tổng tiền</label>
                    <input 
                      type="number" 
                      defaultValue={selectedOrder?.totalAmount || 0} 
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Tổng tiền sau giảm</label>
                    <input 
                      type="number" 
                      defaultValue={selectedOrder?.totalAfterDiscount || 0} 
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Tổng số kg</label>
                    <input 
                      type="number" 
                      defaultValue={selectedOrder?.totalWeight || 0} 
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Tổng số khối</label>
                    <input 
                      type="number" 
                      step="0.1"
                      defaultValue={selectedOrder?.totalVolume || 0} 
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select defaultValue={selectedOrder?.status || 'Chưa duyệt'}>
                      <option value="Chưa duyệt">Chưa duyệt</option>
                      <option value="Đã duyệt">Đã duyệt</option>
                      <option value="Hủy">Hủy</option>
                      <option value="Đơn gộp">Đơn gộp</option>
                      <option value="Đơn đã gộp">Đơn đã gộp</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú đơn hàng</label>
                    <textarea 
                      rows="3" 
                      defaultValue={selectedOrder?.note || ''} 
                      placeholder="Nhập ghi chú..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Hủy</button>
              <button className="btn btn-primary">
                {selectedOrder ? 'Cập nhật' : 'Tạo đơn hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
