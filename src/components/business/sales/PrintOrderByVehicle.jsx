import React, { useState } from 'react';
import './PrintOrderByVehicle.css';
import '../BusinessPage.css';

const PrintOrderByVehicle = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sample data - sẽ được thay thế bằng dữ liệu thực
  const orders = [
    { id: 'DH24280001-01', date: '02/08/2025', vehicle: 'Xe 01' },
    { id: 'DH24280001-02', date: '02/08/2025', vehicle: 'Xe 02' },
    { id: 'DH24280001-03', date: '02/08/2025', vehicle: 'Xe 03' },
    { id: 'DH24280001-04', date: '02/08/2025', vehicle: 'Xe 04' },
    { id: 'DH24280001-05', date: '11/07/2025', vehicle: 'Xe 05' },
  ];

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
  };

  const handleSave = () => {
    console.log('Lưu lại');
  };

  const handlePrint = () => {
    console.log('In A4');
  };

  const handleExportExcel = () => {
    console.log('Xuất Excel');
  };

  return (
    <div className="business-page">
      <div className="page-header">
        <h1>In đơn hàng theo xe</h1>
        <p>In đơn hàng được phân nhóm theo phương tiện vận chuyển</p>
      </div>
      
      <div className="print-order-vehicle-container">
        {/* Left Panel - Danh sách in đơn hàng */}
        <div className="order-list-panel">
          <div className="order-list-header">
            <h2>DANH SÁCH IN ĐƠN HÀNG</h2>
          </div>
          
          <div className="order-list-stats">
            Tổng 1700
          </div>
          
          <div className="order-list-filters">
            <div className="filter-row">
              <label>Từ ngày</label>
              <input type="date" className="filter-input" defaultValue="2025-08-02" />
            </div>
            <div className="filter-row">
              <label>Đến ngày</label>
              <input type="date" className="filter-input" defaultValue="2025-08-02" />
            </div>
            <div className="filter-row">
              <label>Số phiếu</label>
              <input type="text" className="filter-input" placeholder="Nhập số phiếu..." />
            </div>
            <div className="filter-row">
              <label>Thao tác</label>
              <button className="action-btn btn-add">
                <i className="fas fa-search"></i>
                Tìm kiếm
              </button>
            </div>
          </div>
          
          <div className="order-list-content">
            {orders.map((order, index) => (
              <div 
                key={order.id}
                className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-date">{order.date}</div>
                <div className="order-number">{order.id}</div>
                <div className="order-actions">
                  <button className="action-icon edit-action" title="Sửa">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="action-icon delete-action" title="Xóa">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="list-pagination">
            <span>Đang 1-10 hiển thị 1700 dòng</span>
            <div className="pagination-controls">
              <button className="pagination-btn">1</button>
              <button className="pagination-btn">2</button>
              <span>110</span>
              <button className="pagination-btn">▶</button>
              <span>10 / trang</span>
            </div>
          </div>
        </div>

        {/* Right Top Panel - Phiếu giao hàng */}
        <div className="delivery-slip-panel">
          <div className="delivery-slip-header">
            <h2>PHIẾU GIAO HÀNG</h2>
            <div className="header-actions">
              <button className="action-btn btn-add">
                <i className="fas fa-plus"></i>
                Tạo mới
              </button>
            </div>
          </div>
          
          <div className="delivery-slip-content">
            {selectedOrder ? (
              <>
                <div className="slip-form">
                  <div className="form-group">
                    <label>Số phiếu</label>
                    <input type="text" value={selectedOrder.id} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Ngày lập</label>
                    <input type="date" defaultValue="2025-08-02" />
                  </div>
                  <div className="form-group">
                    <label>Nhân viên giao hàng 1</label>
                    <input type="text" placeholder="Chọn nhân viên giao hàng" />
                  </div>
                  <div className="form-group">
                    <label>Nhân viên giao hàng 2</label>
                    <input type="text" placeholder="Chọn nhân viên giao hàng" />
                  </div>
                </div>
                
                <div className="slip-table-container">
                  <table className="slip-table">
                    <thead>
                      <tr>
                        <th>Số chứng từ</th>
                        <th>Tên khách hàng</th>
                        <th>Số tiền</th>
                        <th>Nhân viên giao</th>
                        <th>STT in</th>
                        <th>Giá giao</th>
                        <th>Số lô</th>
                        <th>Số khối</th>
                        <th>Chi chú (khác)</th>
                        <th>Lên xe</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="11" className="empty-content">
                          <div className="empty-icon">📋</div>
                          <div>Chưa có dữ liệu phiếu giao hàng</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-content">
                <div className="empty-icon">📋</div>
                <div>Vui lòng chọn đơn hàng từ danh sách bên trái</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Bottom Panel - Phiếu đem theo thu nợ */}
        <div className="debt-collection-panel">
          <div className="debt-collection-header">
            <h2>PHIẾU ĐEM THEO THU NỢ</h2>
            <div className="header-actions">
              <button className="action-btn btn-add">
                <i className="fas fa-plus"></i>
                Tạo mới
              </button>
              <button className="action-btn btn-add">
                <i className="fas fa-eye"></i>
                Xem
              </button>
              <button className="action-btn btn-add">
                <i className="fas fa-trash"></i>
                Xóa
              </button>
            </div>
          </div>
          
          <div className="debt-collection-content">
            {selectedOrder ? (
              <div className="debt-table-container">
                <table className="debt-table">
                  <thead>
                    <tr>
                      <th>Số chứng từ</th>
                      <th>Tên khách hàng</th>
                      <th>Số tiền</th>
                      <th>Ngày hóa đơn</th>
                      <th>Chi chú</th>
                      <th>Lên xe</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="7" className="empty-content">
                        <div className="empty-icon">💰</div>
                        <div>Chưa có dữ liệu phiếu thu nợ</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-content">
                <div className="empty-icon">💰</div>
                <div>Vui lòng chọn đơn hàng từ danh sách bên trái</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="btn btn-save" onClick={handleSave}>
          <i className="fas fa-save"></i>
          Lưu lại
        </button>
        <button className="btn btn-print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
          In A4
        </button>
        <button className="btn btn-excel" onClick={handleExportExcel}>
          <i className="fas fa-file-excel"></i>
          Xuất Excel
        </button>
      </div>
    </div>
  );
};

export default PrintOrderByVehicle;
