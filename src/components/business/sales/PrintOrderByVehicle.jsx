import React, { useState } from 'react';
import '../BusinessPage.css';
import './PrintOrderByVehicle.css';

const PrintOrderByVehicle = () => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'fromDate' hoặc 'toDate'
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false);
  const [modalSearchData, setModalSearchData] = useState({
    fromDate: '04/08/2025',
    toDate: '',
    viewAll: false
  });
  const [createReceiptData, setCreateReceiptData] = useState({
    fromDate: '02/08/2025',
    toDate: '',
    customer: '',
    paymentType: '',
    exchangeRate: '',
    totalAmount: ''
  });
  const [columnVisibility, setColumnVisibility] = useState({
    fromDate: true,
    toDate: true,
    orderNumber: true,
    vehicle: true,
    totalInvoice: true,
    totalAmount: true,
    totalWeight: true,
    totalVolume: true,
    actions: true
  });
  const [searchCriteria, setSearchCriteria] = useState({
    fromDate: '',
    toDate: '',
    deliveryStaff1: '',
    deliveryStaff2: ''
  });

  // Hàm mở modal tạo phiếu thu
  const openCreateReceiptModal = () => {
    setShowCreateReceiptModal(true);
  };

  // Hàm đóng modal tạo phiếu thu
  const closeCreateReceiptModal = () => {
    setShowCreateReceiptModal(false);
  };

  // Hàm xử lý thay đổi dữ liệu form tạo phiếu thu
  const handleCreateReceiptDataChange = (field, value) => {
    setCreateReceiptData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm xử lý tạo phiếu thu
  const handleCreateReceipt = () => {
    console.log('Tạo phiếu thu với dữ liệu:', createReceiptData);
    // Logic tạo phiếu thu
    closeCreateReceiptModal();
  };

  // Hàm mở modal tìm kiếm ngày
  const openDateModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  // Hàm đóng modal
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
  };

  // Hàm xử lý tìm kiếm trong modal
  const handleModalSearch = () => {
    console.log('Tìm kiếm với dữ liệu:', modalSearchData);
    closeModal();
  };

  // Hàm toggle column settings
  const toggleColumnSettings = () => {
    setShowColumnSettings(!showColumnSettings);
  };

  // Hàm đóng column settings khi click outside
  const handleClickOutside = (e) => {
    if (showColumnSettings && !e.target.closest('.column-settings-dropdown') && !e.target.closest('.settings-btn')) {
      setShowColumnSettings(false);
    }
  };

  // Add event listener for click outside
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  // Hàm toggle column visibility
  const toggleColumnVisibility = (columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Hàm reset column settings
  const resetColumnSettings = () => {
    setColumnVisibility({
      fromDate: true,
      toDate: true,
      orderNumber: true,
      vehicle: true,
      totalInvoice: true,
      totalAmount: true,
      totalWeight: true,
      totalVolume: true,
      actions: true
    });
  };

  // Hàm xử lý sửa đơn hàng
  const handleEditOrder = (orderId) => {
    console.log('Sửa đơn hàng:', orderId);
    // Logic sửa đơn hàng
  };

  // Hàm xử lý xóa đơn hàng
  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này khỏi danh sách in?')) {
      console.log('Xóa đơn hàng:', orderId);
      // Logic xóa đơn hàng
    }
  };

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
              <button 
                className="header-btn add-btn" 
                title="Thêm"
                onClick={openCreateReceiptModal}
              >+</button>
              <button 
                className="header-btn settings-btn" 
                title="Cài đặt cột hiển thị"
                onClick={toggleColumnSettings}
              >⚙️</button>
              <button className="header-btn close-btn" title="Đóng">×</button>
            </div>
          </div>
        </div>

        {/* Column Settings Dropdown cho header */}
        {showColumnSettings && (
          <div className="column-settings-dropdown header-dropdown">
            <div className="settings-header">
              <span>Cột hiển thị</span>
              <button className="reset-btn" onClick={resetColumnSettings}>
                Làm lại
              </button>
            </div>

            <div className="settings-sections">
              <div className="settings-section">
                <div className="section-title">Chưa có định</div>
                <div className="section-content">
                  {/* Không có items */}
                </div>
              </div>

              <div className="settings-section">
                <div className="section-title">Có định phải</div>
                <div className="section-content">
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.fromDate}
                      onChange={() => toggleColumnVisibility('fromDate')}
                    />
                    Từ ngày
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.toDate}
                      onChange={() => toggleColumnVisibility('toDate')}
                    />
                    Đến ngày
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.orderNumber}
                      onChange={() => toggleColumnVisibility('orderNumber')}
                    />
                    Số phiếu
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.vehicle}
                      onChange={() => toggleColumnVisibility('vehicle')}
                    />
                    Xe
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.totalInvoice}
                      onChange={() => toggleColumnVisibility('totalInvoice')}
                    />
                    Tổng hóa đơn
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.totalAmount}
                      onChange={() => toggleColumnVisibility('totalAmount')}
                    />
                    Tổng tiền
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.totalWeight}
                      onChange={() => toggleColumnVisibility('totalWeight')}
                    />
                    Tổng số kg
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.totalVolume}
                      onChange={() => toggleColumnVisibility('totalVolume')}
                    />
                    Tổng số khối
                  </label>
                  <label className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.actions}
                      onChange={() => toggleColumnVisibility('actions')}
                    />
                    Thao tác
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="orders-list">
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  {columnVisibility.fromDate && <th>Từ ngày</th>}
                  {columnVisibility.toDate && <th>Đến ngày</th>}
                  {columnVisibility.orderNumber && <th>Số phiếu</th>}
                  {columnVisibility.vehicle && <th>Xe</th>}
                  {columnVisibility.totalInvoice && <th>Tổng hóa đơn</th>}
                  {columnVisibility.totalAmount && <th>Tổng tiền</th>}
                  {columnVisibility.totalWeight && <th>Tổng số kg</th>}
                  {columnVisibility.totalVolume && <th>Tổng số khối</th>}
                  {columnVisibility.actions && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {ordersList.map((order) => {
                  console.log('Rendering order:', order.id, 'Actions visible:', columnVisibility.actions);
                  return (
                  <tr key={order.id} className="order-row">
                    {columnVisibility.fromDate && (
                      <td>
                        <div className="date-cell-with-modal">
                          <span>{order.fromDate}</span>
                          <button 
                            className="cell-modal-btn" 
                            title="Tìm kiếm"
                            onClick={() => openDateModal('fromDate')}
                          >🔍</button>
                        </div>
                      </td>
                    )}
                    {columnVisibility.toDate && (
                      <td>
                        <div className="date-cell-with-modal">
                          <span>{order.toDate}</span>
                          <button 
                            className="cell-modal-btn" 
                            title="Tìm kiếm"
                            onClick={() => openDateModal('toDate')}
                          >🔍</button>
                        </div>
                      </td>
                    )}
                    {columnVisibility.orderNumber && <td className="order-number">{order.orderNumber}</td>}
                    {columnVisibility.vehicle && <td>Xe 01</td>}
                    {columnVisibility.totalInvoice && <td>25</td>}
                    {columnVisibility.totalAmount && <td>1,500,000</td>}
                    {columnVisibility.totalWeight && <td>75</td>}
                    {columnVisibility.totalVolume && <td>12.5</td>}
                    {columnVisibility.actions && (
                      <td>
                        <div className="order-actions">
                          <button 
                            className="action-btn edit-btn" 
                            title="Sửa"
                            onClick={() => handleEditOrder(order.id)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            title="Xóa"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="horizontal-scroll-indicator">
            <div className="scroll-track">
              <div className="scroll-thumb"></div>
            </div>
          </div>
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
            <button className="create-new-btn">+ Tạo mới</button>
          </div>
          
          <div className="search-form">
            <div className="search-row">
              <div className="search-field required-field">
                <label>Số phiếu <span className="required">*</span></label>
                <input type="text" placeholder="DTX250802-000743" />
              </div>
              <div className="search-field">
                <label>Tuyến</label>
                <input type="text" />
              </div>
              <div className="search-field required-field">
                <label>Xe <span className="required">*</span></label>
                <select>
                  <option value="">Chọn xe</option>
                  <option value="xe1">Xe 1</option>
                  <option value="xe2">Xe 2</option>
                </select>
              </div>
            </div>
            
            <div className="search-row">
              <div className="search-field required-field">
                <label>Ngày lập <span className="required">*</span></label>
                <input type="date" defaultValue="2025-08-02" />
              </div>
              <div className="search-field">
                <input type="date" defaultValue="2025-08-02" />
              </div>
              <div className="search-field">
                <label>Nhân viên giao hàng 1</label>
                <select>
                  <option value="">Chọn nhân viên giao hàng</option>
                  <option value="nv1">Nhân viên 1</option>
                  <option value="nv2">Nhân viên 2</option>
                </select>
              </div>
              <div className="search-field">
                <label>Nhân viên giao hàng 2</label>
                <select>
                  <option value="">Chọn nhân viên giao hàng</option>
                  <option value="nv1">Nhân viên 1</option>
                  <option value="nv2">Nhân viên 2</option>
                </select>
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
                  <th>Giờ giao</th>
                  <th>Số KG</th>
                  <th>Số khối</th>
                  <th>Ghi chú (khác)</th>
                  <th>Lên xe</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="11" className="no-data">
                    <div className="empty-icon">📋</div>
                    <div>Trống</div>
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

      {/* Modal tìm kiếm ngày */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="date-search-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>DANH SÁCH IN ĐƠN HÀNG</h2>
                <span className="total-count">Tổng 1700</span>
              </div>
              <div className="modal-actions">
                <button className="modal-action-btn btn-c">C</button>
                <button className="modal-action-btn btn-i">I</button>
                <button 
                  className="modal-action-btn btn-settings"
                  onClick={toggleColumnSettings}
                >⚙️</button>
                <button className="modal-close-btn" onClick={closeModal}>×</button>
              </div>
            </div>

            {/* Column Settings Dropdown */}
            {showColumnSettings && (
              <div className="column-settings-dropdown">
                <div className="settings-header">
                  <span>Cột hiển thị</span>
                  <button className="reset-btn" onClick={resetColumnSettings}>
                    Làm lại
                  </button>
                </div>

                <div className="settings-sections">
                  <div className="settings-section">
                    <div className="section-title">Chưa có định</div>
                    <div className="section-content">
                      {/* Không có items */}
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="section-title">Có định phải</div>
                    <div className="section-content">
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.fromDate}
                          onChange={() => toggleColumnVisibility('fromDate')}
                        />
                        Từ ngày
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.toDate}
                          onChange={() => toggleColumnVisibility('toDate')}
                        />
                        Đến ngày
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.orderNumber}
                          onChange={() => toggleColumnVisibility('orderNumber')}
                        />
                        Số phiếu
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.vehicle}
                          onChange={() => toggleColumnVisibility('vehicle')}
                        />
                        Xe
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.totalInvoice}
                          onChange={() => toggleColumnVisibility('totalInvoice')}
                        />
                        Tổng hóa đơn
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.totalAmount}
                          onChange={() => toggleColumnVisibility('totalAmount')}
                        />
                        Tổng tiền
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.totalWeight}
                          onChange={() => toggleColumnVisibility('totalWeight')}
                        />
                        Tổng số kg
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.totalVolume}
                          onChange={() => toggleColumnVisibility('totalVolume')}
                        />
                        Tổng số khối
                      </label>
                      <label className="column-checkbox">
                        <input 
                          type="checkbox" 
                          checked={columnVisibility.actions}
                          onChange={() => toggleColumnVisibility('actions')}
                        />
                        Thao tác
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Form */}
            <div className="modal-search-form">
              <div className="search-row">
                <label>Từ ngày</label>
                <input 
                  type="text" 
                  value={modalSearchData.fromDate}
                  onChange={(e) => setModalSearchData({...modalSearchData, fromDate: e.target.value})}
                  className="date-input"
                />
              </div>

              <div className="search-row">
                <label>Đến ngày</label>
                <div className="date-input-with-calendar">
                  <input 
                    type="date" 
                    value={modalSearchData.toDate}
                    onChange={(e) => setModalSearchData({...modalSearchData, toDate: e.target.value})}
                    className="date-input"
                  />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>

              <div className="search-row">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={modalSearchData.viewAll}
                    onChange={(e) => setModalSearchData({...modalSearchData, viewAll: e.target.checked})}
                  />
                  Xem tất cả
                </label>
              </div>

              <div className="search-row">
                <button className="modal-search-btn" onClick={handleModalSearch}>
                  🔍 Tìm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo phiếu thu từ phiếu bán hàng */}
      {showCreateReceiptModal && (
        <div className="modal-overlay">
          <div className="create-receipt-modal">
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>TẠO PHIẾU THU TỪ PHIẾU BÁN HÀNG</h2>
                <div className="create-receipt-header-actions">
                  <button className="modal-action-btn btn-chon-don-hang">Chọn đơn hàng</button>
                </div>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={closeCreateReceiptModal}
              >
                ×
              </button>
            </div>

            {/* Form nhập liệu */}
            <div className="create-receipt-form">
              {/* Dòng 1: Từ ngày, Đến ngày, Khách hàng */}
              <div className="form-row">
                <div className="form-field">
                  <label>Từ ngày</label>
                  <div className="date-input-with-modal">
                    <input 
                      type="text" 
                      value={createReceiptData.fromDate}
                      onChange={(e) => handleCreateReceiptDataChange('fromDate', e.target.value)}
                    />
                    <button className="modal-search-btn">📅</button>
                  </div>
                </div>
                <div className="form-field">
                  <label>Đến ngày</label>
                  <div className="date-input-with-modal">
                    <input 
                      type="text" 
                      value={createReceiptData.toDate}
                      onChange={(e) => handleCreateReceiptDataChange('toDate', e.target.value)}
                    />
                    <button className="modal-search-btn">📅</button>
                  </div>
                </div>
                <div className="form-field">
                  <label>Khách hàng</label>
                  <div className="select-input-with-modal">
                    <select 
                      value={createReceiptData.customer}
                      onChange={(e) => handleCreateReceiptDataChange('customer', e.target.value)}
                    >
                      <option value="">[Tất cả]</option>
                      <option value="kh001">Khách hàng 1</option>
                      <option value="kh002">Khách hàng 2</option>
                    </select>
                    <button className="modal-search-btn">🔍</button>
                  </div>
                </div>
              </div>

              {/* Dòng 2: Loại TT, Tỷ giá, Tổng tiền */}
              <div className="form-row">
                <div className="form-field">
                  <label>Loại TT</label>
                  <select 
                    value={createReceiptData.paymentType}
                    onChange={(e) => handleCreateReceiptDataChange('paymentType', e.target.value)}
                  >
                    <option value="">[Tất cả]</option>
                    <option value="tm">Tiền mặt</option>
                    <option value="ck">Chuyển khoản</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Tỷ giá</label>
                  <input 
                    type="text" 
                    value={createReceiptData.exchangeRate}
                    onChange={(e) => handleCreateReceiptDataChange('exchangeRate', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Tổng tiền</label>
                  <input 
                    type="text" 
                    value={createReceiptData.totalAmount}
                    onChange={(e) => handleCreateReceiptDataChange('totalAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="create-receipt-table-container">
              <table className="create-receipt-table">
                <thead>
                  <tr>
                    <th>Số hóa đơn</th>
                    <th>Ngày hóa đơn</th>
                    <th>Nhân viên sale</th>
                    <th>Tên khách hàng</th>
                    <th>Chỉ chụ hd</th>
                    <th>Trạng thái</th>
                    <th>Phải thu</th>
                    <th>Tiền thu</th>
                    <th>Còn lại</th>
                    <th>Ngày thu</th>
                    <th>Người nộp</th>
                    <th>Mã NV</th>
                    <th>Người nhận tiền</th>
                    <th>Quỷ</th>
                    <th>Số tài khoản</th>
                    <th>Tên chủ TK</th>
                    <th>Tên ngân hàng</th>
                    <th>Chỉ chụ thu</th>
                    <th>Loại nghiệp vụ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="19" className="no-data">No data</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Nút hành động */}
            <div className="create-receipt-actions">
              <button className="action-button blue-btn">Xem lưu</button>
              <button 
                className="action-button pink-btn"
                onClick={handleCreateReceipt}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintOrderByVehicle;
