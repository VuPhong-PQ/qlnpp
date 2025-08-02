import React, { useState } from 'react';
import '../BusinessPage.css';
import './ReceiptVoucher.css';

const ReceiptVoucher = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    fromDate: '01/08/2025',
    toDate: '02/08/2025',
    fund: '',
    receiver: ''
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
            <button className="action-btn add-btn">+ Thêm phiếu thu</button>
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
    </div>
  );
};

export default ReceiptVoucher;
