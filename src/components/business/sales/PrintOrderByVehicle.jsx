import React, { useState } from 'react';
import '../BusinessPage.css';
import './PrintOrderByVehicle.css';

const PrintOrderByVehicle = () => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    fromDate: '',
    toDate: '',
    deliveryStaff1: '',
    deliveryStaff2: ''
  });

  // Mock data cho danh sách đơn hàng
  const ordersList = [
    {
      id: 1,
      fromDate: '02/08/2025',
      toDate: '02/08/2025',
      orderNumber: 'DH24080001-01',
      selected: false
    },
    {
      id: 2,
      fromDate: '02/08/2025',
      toDate: '02/08/2025',
      orderNumber: 'DH24080001-02',
      selected: false
    },
    {
      id: 3,
      fromDate: '02/08/2025',
      toDate: '02/08/2025',
      orderNumber: 'DH24080001-03',
      selected: false
    },
    {
      id: 4,
      fromDate: '02/08/2025',
      toDate: '02/08/2025',
      orderNumber: 'DH24080001-04',
      selected: false
    },
    {
      id: 5,
      fromDate: '11/07/2025',
      toDate: '02/08/2025',
      orderNumber: 'DH24080001-05',
      selected: false
    }
  ];

  return (
    <div className="print-order-vehicle-page">
      {/* Left Panel - Danh sách in đơn hàng */}
      <div className="orders-list-panel">
        <div className="panel-header">
          <h2>DANH SÁCH IN ĐƠN HÀNG</h2>
          <div className="header-info">
            <span>Tổng: 1700</span>
            <div className="header-actions">
              <button className="header-btn search-btn" title="Tìm kiếm">🔍</button>
              <button className="header-btn add-btn" title="Thêm">+</button>
              <button className="header-btn close-btn" title="Đóng">×</button>
            </div>
          </div>
        </div>

        <div className="date-filter">
          <div className="filter-row">
            <label>Từ ngày</label>
            <input type="date" defaultValue="2025-08-02" />
          </div>
          <div className="filter-row">
            <label>Đến ngày</label>
            <input type="date" defaultValue="2025-08-02" />
          </div>
          <div className="filter-row">
            <label>Số phiếu</label>
            <input type="text" placeholder="Nhập số phiếu" />
          </div>
          <div className="filter-row">
            <label>Thao tác</label>
            <div className="filter-actions">
              <button className="action-btn">🔍</button>
              <button className="action-btn">📋</button>
            </div>
          </div>
        </div>

        <div className="orders-list">
          {ordersList.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-dates">
                <span>{order.fromDate}</span>
                <span>{order.toDate}</span>
              </div>
              <div className="order-number">{order.orderNumber}</div>
              <div className="order-actions">
                <button className="edit-btn" title="Sửa">✏️</button>
                <button className="delete-btn" title="Xóa">🗑️</button>
                <button className="expand-btn" title="Mở rộng">▲</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          <span>Dòng 1-10 trên tổng 1700 dòng</span>
          <div className="pagination-controls">
            <button>◀</button>
            <span>2</span>
            <span>3</span>
            <span>170</span>
            <button>▶</button>
            <span>10 / trang</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Phiếu giao hàng */}
      <div className="delivery-panel">
        {/* Phiếu giao hàng - Tìm kiếm */}
        <div className="delivery-search-section">
          <div className="section-header">
            <h2>PHIẾU GIAO HÀNG</h2>
            <button className="search-toggle-btn">Tìm kiếm</button>
          </div>
          
          <div className="search-form">
            <div className="search-row">
              <div className="search-field">
                <label>Số phiếu</label>
                <input type="text" placeholder="DHV24080002-000743" />
              </div>
              <div className="search-field">
                <label>Tuyến</label>
                <input type="text" />
              </div>
              <div className="search-field">
                <label>Xe</label>
                <input type="text" />
              </div>
            </div>
            
            <div className="search-row">
              <div className="search-field">
                <label>Ngày lập</label>
                <input type="date" defaultValue="2025-08-02" />
              </div>
              <div className="search-field">
                <input type="date" defaultValue="2025-08-02" />
              </div>
              <div className="search-field">
                <label>Nhân viên giao hàng 1</label>
                <input type="text" placeholder="Chọn nhân viên giao hàng" />
              </div>
              <div className="search-field">
                <label>Nhân viên giao hàng 2</label>
                <input type="text" placeholder="Chọn nhân viên giao hàng" />
              </div>
            </div>
          </div>
        </div>

        {/* Phiếu giao hàng - Nội dung */}
        <div className="delivery-content-section">
          <div className="section-header">
            <h3>PHIẾU GIAO HÀNG</h3>
            <span className="total-info">Tổng: 0</span>
            <div className="content-actions">
              <button className="action-btn blue-btn" title="Xem">👁️</button>
              <button className="action-btn pink-btn" title="Sửa">✏️</button>
              <button className="action-btn red-btn" title="Xóa">🗑️</button>
              <button className="action-btn gray-btn" title="Khác">⚙️</button>
              <button className="expand-btn">▲</button>
            </div>
          </div>

          <div className="delivery-table">
            <table>
              <thead>
                <tr>
                  <th>Số chứng từ</th>
                  <th>Tên khách hàng</th>
                  <th>Số tiền</th>
                  <th>Nhân viên giao</th>
                  <th>STT in</th>
                  <th>Gía giao</th>
                  <th>Số xe</th>
                  <th>Số khối</th>
                  <th>Ghi chú (khác)</th>
                  <th>Lên xe</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="11" className="no-data">
                    <div className="empty-icon">�</div>
                    <div>Không có dữ liệu</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="horizontal-scroll-indicator">
            <div className="scroll-track">
              <div className="scroll-thumb"></div>
            </div>
          </div>
        </div>

        {/* Phiếu đem theo thu nợ */}
        <div className="debt-collection-section">
          <div className="section-header">
            <h3>PHIẾU ĐEM THEO THU NỢ</h3>
            <span className="total-info">Tổng: 0</span>
            <div className="content-actions">
              <button className="action-btn blue-btn" title="Xem">👁️</button>
              <button className="action-btn pink-btn" title="Sửa">✏️</button>
              <button className="action-btn red-btn" title="Xóa">🗑️</button>
              <button className="action-btn gray-btn" title="Khác">⚙️</button>
              <button className="expand-btn">▲</button>
            </div>
          </div>

          <div className="debt-table">
            <table>
              <thead>
                <tr>
                  <th>Số chứng từ</th>
                  <th>Tên khách hàng</th>
                  <th>Số tiền</th>
                  <th>Ngày hóa đơn</th>
                  <th>Ghi chú</th>
                  <th>Lên xe</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="empty-icon">📋</div>
                    <div>Không có dữ liệu</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="horizontal-scroll-indicator">
            <div className="scroll-track">
              <div className="scroll-thumb"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bottom-actions">
          <button className="action-button save-btn">📄 Lưu lại</button>
          <button className="action-button print-btn">🖨️ In A4</button>
          <button className="action-button export-btn">📊 Xuất Excel</button>
        </div>
      </div>
    </div>
  );
};

export default PrintOrderByVehicle;
