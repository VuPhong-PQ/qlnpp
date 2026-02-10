import React, { useState } from 'react';
import '../BusinessPage.css';
import './ReceiptVoucher.css';

const ReceiptVoucher = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false);
  const [showInvoiceListModal, setShowInvoiceListModal] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    fromDate: '01/08/2025',
    toDate: '02/08/2025',
    fund: '',
    receiver: ''
  });
  const [invoiceSearchCriteria, setInvoiceSearchCriteria] = useState({
    fromDate: '01/08/2025',
    toDate: '02/08/2025',
    customer: ''
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
    stt: true,
    receiptNumber: true,
    receiptDate: true,
    customerName: true,
    amount: true,
    invoiceNumber: true,
    invoiceDate: true,
    payer: true,
    receiver: true,
    fund: true,
    accountNumber: true,
    accountHolder: true,
    invoiceNote: true,
    receiptNote: true,
    businessType: true,
    actions: true
  });

  // Hàm mở modal danh sách hóa đơn
  const openInvoiceListModal = () => {
    setShowInvoiceListModal(true);
  };

  // Hàm đóng modal danh sách hóa đơn
  const closeInvoiceListModal = () => {
    setShowInvoiceListModal(false);
  };

  // Hàm xử lý thay đổi tiêu chí tìm kiếm hóa đơn
  const handleInvoiceSearchChange = (field, value) => {
    setInvoiceSearchCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm xử lý tìm kiếm hóa đơn
  const handleInvoiceSearch = () => {
    // perform invoice search (debug logs removed)
    // Logic tìm kiếm hóa đơn
  };

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
    // create receipt (debug logs removed)
    // Logic tạo phiếu thu
    closeCreateReceiptModal();
  };

  // Hàm mở modal tìm kiếm
  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  // Hàm đóng modal
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
  };

  // Hàm toggle column settings
  const toggleColumnSettings = () => {
    setShowColumnSettings(!showColumnSettings);
  };

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
      stt: true,
      receiptNumber: true,
      receiptDate: true,
      customerName: true,
      amount: true,
      invoiceNumber: true,
      invoiceDate: true,
      payer: true,
      receiver: true,
      fund: true,
      accountNumber: true,
      accountHolder: true,
      invoiceNote: true,
      receiptNote: true,
      businessType: true,
      actions: true
    });
  };

  // Hàm xử lý click outside
  const handleClickOutside = (e) => {
    if (showColumnSettings && !e.target.closest('.column-settings-dropdown') && !e.target.closest('.settings-btn')) {
      setShowColumnSettings(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  // Mock data cho danh sách hóa đơn
  const invoicesList = [
    {
      id: 1,
      invoiceNumber: 'PX250801-056135',
      invoiceDate: '01/08/2025',
      salesStaff: 'Vo Van Dung,Phan Tan Diet',
      customerName: 'Thắng Nguyễn 2 - BV',
      invoiceNote: '-',
      deliveryNote: '-',
      status: 'Đã duyệt',
      amountDue: '1,164,000'
    },
    {
      id: 2,
      invoiceNumber: 'PX250802-056147',
      invoiceDate: '02/08/2025',
      salesStaff: 'Nguyen Hung Nhao,Nguyen Chi Thanh',
      customerName: 'Siêu Thị Việt Ý Marriott - AT (V)',
      invoiceNote: '-',
      deliveryNote: '-',
      status: 'Đã duyệt',
      amountDue: '4,169,808'
    },
    {
      id: 3,
      invoiceNumber: 'PX250801-056150',
      invoiceDate: '01/08/2025',
      salesStaff: 'Phan Tan Diet',
      customerName: 'Le Thi Thuy Van (Zalo: Le Nguyen)',
      invoiceNote: 'Giao nha',
      deliveryNote: 'NHAT - DIET BL',
      status: 'Đã duyệt',
      amountDue: '1,150,000'
    },
    {
      id: 4,
      invoiceNumber: 'PX250801-056173',
      invoiceDate: '01/08/2025',
      salesStaff: 'Nguyen Chi Thanh,Vo Van Dung,Phan Tan Diet,Nguyen Nhat Ha,Tran Le Duan',
      customerName: 'Siêu Thị Hà Anh - SM',
      invoiceNote: '...',
      deliveryNote: '-',
      status: 'Đã duyệt',
      amountDue: '916,474'
    }
  ];

  // Mock data cho danh sách phiếu thu
  const receiptsList = [
    {
      id: 1,
      receiptNumber: 'PT230802-001',
      receiptDate: '02/08/2025',
      customerName: 'Công ty TNHH ABC',
      amount: '2,500,000',
      invoiceNumber: 'HĐ001',
      invoiceDate: '01/08/2025',
      payer: 'Nguyễn Văn A',
      receiver: 'Thu ngân 1',
      fund: 'Quỹ tiền mặt',
      accountNumber: '123456789',
      accountHolder: 'Công ty TNHH ABC',
      invoiceNote: 'Thanh toán hàng hóa',
      receiptNote: 'Thu tiền bán hàng',
      businessType: 'Bán hàng'
    },
    {
      id: 2,
      receiptNumber: 'PT230802-002',
      receiptDate: '02/08/2025',
      customerName: 'Công ty XYZ',
      amount: '1,800,000',
      invoiceNumber: 'HĐ002',
      invoiceDate: '02/08/2025',
      payer: 'Trần Thị B',
      receiver: 'Thu ngân 2',
      fund: 'Ngân hàng VCB',
      accountNumber: '987654321',
      accountHolder: 'Công ty XYZ',
      invoiceNote: 'Dịch vụ tư vấn',
      receiptNote: 'Thu tiền dịch vụ',
      businessType: 'Dịch vụ'
    }
  ];

  // Hàm lấy nhãn cột
  const getColumnLabel = (key) => {
    const labels = {
      stt: 'STT',
      receiptNumber: 'Số phiếu thu',
      receiptDate: 'Ngày thu',
      customerName: 'Tên khách hàng',
      amount: 'Số tiền',
      invoiceNumber: 'Số hóa đơn',
      invoiceDate: 'Ngày lập hóa đơn',
      payer: 'Người nộp',
      receiver: 'Người nhận tiền',
      fund: 'Quỹ',
      accountNumber: 'Số tài khoản',
      accountHolder: 'Tên chủ tài khoản',
      invoiceNote: 'Ghi chú hóa đơn',
      receiptNote: 'Ghi chú thu',
      businessType: 'Loại nghiệp vụ',
      actions: 'Thao tác'
    };
    return labels[key] || key;
  };

  // Hàm lấy tiêu đề modal
  const getModalTitle = (type) => {
    const titles = {
      receiptNumber: 'Tìm kiếm số phiếu thu',
      customerName: 'Tìm kiếm khách hàng',
      amount: 'Tìm kiếm theo số tiền',
      invoiceNumber: 'Tìm kiếm số hóa đơn',
      invoiceDate: 'Tìm kiếm ngày hóa đơn',
      payer: 'Tìm kiếm người nộp',
      receiver: 'Tìm kiếm người nhận tiền',
      fund: 'Tìm kiếm quỹ',
      accountNumber: 'Tìm kiếm số tài khoản',
      accountHolder: 'Tìm kiếm chủ tài khoản',
      invoiceNote: 'Tìm kiếm ghi chú hóa đơn',
      receiptNote: 'Tìm kiếm ghi chú thu',
      businessType: 'Tìm kiếm loại nghiệp vụ'
    };
    return titles[type] || 'Tìm kiếm';
  };

  return (
    <div className="receipt-voucher-page">
      {/* Header */}
      <div className="page-header">
        <h1>DANH SÁCH PHIẾU THU</h1>
      </div>

      {/* Search Filter */}
      <div className="search-filter">
        <div className="filter-row">
          <div className="filter-group">
            <label>Từ ngày</label>
            <input 
              type="date" 
              value="2025-08-01"
              onChange={(e) => setSearchCriteria({...searchCriteria, fromDate: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày</label>
            <input 
              type="date" 
              value="2025-08-02"
              onChange={(e) => setSearchCriteria({...searchCriteria, toDate: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>Quỹ tài khoản</label>
            <select 
              value={searchCriteria.fund}
              onChange={(e) => setSearchCriteria({...searchCriteria, fund: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="cash">Quỹ tiền mặt</option>
              <option value="bank">Ngân hàng</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Người nhận tiền</label>
            <select 
              value={searchCriteria.receiver}
              onChange={(e) => setSearchCriteria({...searchCriteria, receiver: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="cashier1">Thu ngân 1</option>
              <option value="cashier2">Thu ngân 2</option>
            </select>
          </div>
          <button className="search-btn">🔍 Tìm kiếm</button>
        </div>
        
        <div className="filter-bottom">
          <div className="total-info">
            <span>Tổng: {receiptsList.length} phiếu</span>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn add-btn"
              onClick={openCreateReceiptModal}
            >+ Thêm phiếu thu</button>
            <button className="action-btn other-btn">Thu khác</button>
            <button className="action-btn export-btn">📊 Export Excel</button>
            <button className="action-btn refresh-btn">🔄 Làm mới</button>
            <button 
              className="action-btn settings-btn"
              onClick={toggleColumnSettings}
            >⚙️ Cài đặt</button>
          </div>
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
              <div className="section-title">Các cột hiển thị</div>
              <div className="section-content">
                {Object.keys(columnVisibility).map(key => (
                  <label key={key} className="column-checkbox">
                    <input 
                      type="checkbox" 
                      checked={columnVisibility[key]}
                      onChange={() => toggleColumnVisibility(key)}
                    />
                    {getColumnLabel(key)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columnVisibility.stt && <th>STT</th>}
              {columnVisibility.receiptNumber && (
                <th>
                  <div className="header-with-modal">
                    <span>Số phiếu thu</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('receiptNumber')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.receiptDate && <th>Ngày thu</th>}
              {columnVisibility.customerName && (
                <th>
                  <div className="header-with-modal">
                    <span>Tên khách hàng</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('customerName')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.amount && (
                <th>
                  <div className="header-with-modal">
                    <span>Số tiền</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('amount')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.invoiceNumber && (
                <th>
                  <div className="header-with-modal">
                    <span>Số hóa đơn</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('invoiceNumber')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.invoiceDate && (
                <th>
                  <div className="header-with-modal">
                    <span>Ngày lập hóa đơn</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('invoiceDate')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.payer && (
                <th>
                  <div className="header-with-modal">
                    <span>Người nộp</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('payer')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.receiver && (
                <th>
                  <div className="header-with-modal">
                    <span>Người nhận tiền</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('receiver')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.fund && (
                <th>
                  <div className="header-with-modal">
                    <span>Quỹ</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('fund')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.accountNumber && (
                <th>
                  <div className="header-with-modal">
                    <span>Số tài khoản</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('accountNumber')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.accountHolder && (
                <th>
                  <div className="header-with-modal">
                    <span>Tên chủ tài khoản</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('accountHolder')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.invoiceNote && (
                <th>
                  <div className="header-with-modal">
                    <span>Ghi chú hóa đơn</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('invoiceNote')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.receiptNote && (
                <th>
                  <div className="header-with-modal">
                    <span>Ghi chú thu</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('receiptNote')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.businessType && (
                <th>
                  <div className="header-with-modal">
                    <span>Loại nghiệp vụ</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('businessType')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.actions && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {receiptsList.map((receipt, index) => (
              <tr key={receipt.id}>
                {columnVisibility.stt && <td>{index + 1}</td>}
                {columnVisibility.receiptNumber && <td>{receipt.receiptNumber}</td>}
                {columnVisibility.receiptDate && <td>{receipt.receiptDate}</td>}
                {columnVisibility.customerName && <td>{receipt.customerName}</td>}
                {columnVisibility.amount && <td>{receipt.amount}</td>}
                {columnVisibility.invoiceNumber && <td>{receipt.invoiceNumber}</td>}
                {columnVisibility.invoiceDate && <td>{receipt.invoiceDate}</td>}
                {columnVisibility.payer && <td>{receipt.payer}</td>}
                {columnVisibility.receiver && <td>{receipt.receiver}</td>}
                {columnVisibility.fund && <td>{receipt.fund}</td>}
                {columnVisibility.accountNumber && <td>{receipt.accountNumber}</td>}
                {columnVisibility.accountHolder && <td>{receipt.accountHolder}</td>}
                {columnVisibility.invoiceNote && <td>{receipt.invoiceNote}</td>}
                {columnVisibility.receiptNote && <td>{receipt.receiptNote}</td>}
                {columnVisibility.businessType && <td>{receipt.businessType}</td>}
                {columnVisibility.actions && (
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit-btn" title="Sửa">✏️</button>
                      <button className="action-btn delete-btn" title="Xóa">🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Search Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>{getModalTitle(modalType)}</h2>
              </div>
              <div className="modal-actions">
                <button className="modal-action-btn btn-c">C</button>
                <button className="modal-action-btn btn-i">I</button>
                <button className="modal-action-btn btn-settings">⚙️</button>
                <button className="modal-close-btn" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className="modal-search-form">
              <div className="search-row">
                <label>Từ ngày:</label>
                <div className="date-input-with-calendar">
                  <input type="date" className="date-input" defaultValue="2025-08-01" />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>
              <div className="search-row">
                <label>Đến ngày:</label>
                <div className="date-input-with-calendar">
                  <input type="date" className="date-input" defaultValue="2025-08-02" />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>
              <div className="search-row">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Hiển thị dữ liệu theo khoảng thời gian
                </label>
              </div>
              <div className="search-row">
                <button className="modal-search-btn">🔍 Tìm kiếm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo phiếu thu từ phiếu bán hàng */}
      {showCreateReceiptModal && (
        <div className="modal-overlay" onClick={closeCreateReceiptModal}>
          <div className="create-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>TẠO PHIẾU THU TỪ PHIẾU BÁN HÀNG</h2>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={closeCreateReceiptModal}
              >
                ×
              </button>
            </div>

            {/* Nút chọn đơn hàng - di chuyển ra ngoài header */}
            <div className="create-receipt-header-actions">
              <button 
                className="btn-chon-don-hang"
                onClick={openInvoiceListModal}
              >Chọn đơn hàng</button>
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

      {/* Modal Danh sách hóa đơn */}
      {showInvoiceListModal && (
        <div className="modal-overlay" onClick={closeInvoiceListModal}>
          <div className="invoice-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>DANH SÁCH HÓA ĐƠN</h2>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={closeInvoiceListModal}
              >
                ×
              </button>
            </div>

            {/* Form tìm kiếm hóa đơn */}
            <div className="invoice-search-form">
              <div className="invoice-search-row">
                <div className="invoice-search-field">
                  <input 
                    type="text" 
                    value={invoiceSearchCriteria.fromDate}
                    onChange={(e) => handleInvoiceSearchChange('fromDate', e.target.value)}
                    placeholder="01/08/2025"
                  />
                  <span className="arrow">→</span>
                  <input 
                    type="text" 
                    value={invoiceSearchCriteria.toDate}
                    onChange={(e) => handleInvoiceSearchChange('toDate', e.target.value)}
                    placeholder="02/08/2025"
                  />
                </div>
                <div className="invoice-search-field">
                  <select 
                    value={invoiceSearchCriteria.customer}
                    onChange={(e) => handleInvoiceSearchChange('customer', e.target.value)}
                  >
                    <option value="">khách hàng</option>
                    <option value="kh001">Khách hàng 1</option>
                    <option value="kh002">Khách hàng 2</option>
                  </select>
                </div>
                <button 
                  className="invoice-search-btn"
                  onClick={handleInvoiceSearch}
                >
                  🔍 Tìm kiếm
                </button>
              </div>

              <div className="invoice-summary">
                <span>Tổng 304</span>
                <div className="invoice-action-buttons">
                  <button className="invoice-action-btn green-btn">📄</button>
                  <button className="invoice-action-btn purple-btn">C</button>
                  <button className="invoice-action-btn pink-btn">I</button>
                  <button className="invoice-action-btn gray-btn">⚙️</button>
                </div>
              </div>
            </div>

            {/* Bảng danh sách hóa đơn */}
            <div className="invoice-list-table-container">
              <table className="invoice-list-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
                    <th>Số hóa đơn 🔍</th>
                    <th>Ngày hóa đơn</th>
                    <th>Nhân viên sale</th>
                    <th>Tên khách hàng</th>
                    <th>Ghi chú hd</th>
                    <th>Ghi chú giao hàng</th>
                    <th>Trạng thái 🔍</th>
                    <th>Phải thu</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesList.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><input type="checkbox" /></td>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.invoiceDate}</td>
                      <td>{invoice.salesStaff}</td>
                      <td>{invoice.customerName}</td>
                      <td>{invoice.invoiceNote}</td>
                      <td>{invoice.deliveryNote}</td>
                      <td>{invoice.status}</td>
                      <td>{invoice.amountDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="invoice-pagination">
              <span>Dòng 1-10 trên tổng 304 dòng</span>
              <div className="pagination-controls">
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <span>...</span>
                <button>31</button>
                <button>→</button>
                <select>
                  <option>10 / trang</option>
                  <option>20 / trang</option>
                  <option>50 / trang</option>
                </select>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="invoice-modal-actions">
              <button 
                className="action-button blue-btn"
                onClick={closeInvoiceListModal}
              >
                Đồng ý
              </button>
              <button 
                className="action-button gray-btn"
                onClick={closeInvoiceListModal}
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

export default ReceiptVoucher;
