import React, { useState, useEffect, useRef } from 'react';
import './ExpenseVoucher.css';

const ExpenseVoucher = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    fromDate: '2025-08-01',
    toDate: '2025-08-02',
    fund: '',
    payer: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const columnSettingsRef = useRef(null);

  // State cho cột hiển thị
  const [columnVisibility, setColumnVisibility] = useState({
    stt: true,
    voucherNumber: true,
    expenseDate: true,
    expenseStaff: true,
    recipient: true,
    amount: true,
    expenseType: true,
    fund: true,
    accountNumber: true,
    accountHolder: true,
    bankName: true,
    salaryAdvanceCode: true,
    expenseContent: true,
    industryCode: true,
    expenseCode: true,
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
      voucherNumber: true,
      expenseDate: true,
      expenseStaff: true,
      recipient: true,
      amount: true,
      expenseType: true,
      fund: true,
      accountNumber: true,
      accountHolder: true,
      bankName: true,
      salaryAdvanceCode: true,
      expenseContent: true,
      industryCode: true,
      expenseCode: true,
      actions: true
    });
  };

  // Hàm xử lý click outside
  const handleClickOutside = (e) => {
    if (columnSettingsRef.current && !columnSettingsRef.current.contains(e.target)) {
      setShowColumnSettings(false);
    }
  };

  React.useEffect(() => {
    if (showColumnSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  // Mock data cho danh sách phiếu chi
  const expensesList = [
    {
      id: 1,
      voucherNumber: 'PC230802-001',
      expenseDate: '02/08/2025',
      expenseStaff: 'Nguyễn Văn A',
      recipient: 'Trần Thị B',
      amount: '2,500,000',
      expenseType: 'Chi phí vận chuyển',
      fund: 'Quỹ tiền mặt',
      accountNumber: '123456789',
      accountHolder: 'Trần Thị B',
      bankName: 'VCB',
      salaryAdvanceCode: 'UL001',
      expenseContent: 'Chi phí vận chuyển hàng hóa',
      industryCode: 'NG01',
      expenseCode: 'CP001'
    },
    {
      id: 2,
      voucherNumber: 'PC230802-002',
      expenseDate: '02/08/2025',
      expenseStaff: 'Lê Văn C',
      recipient: 'Phạm Thị D',
      amount: '1,800,000',
      expenseType: 'Chi phí văn phòng',
      fund: 'Ngân hàng VCB',
      accountNumber: '987654321',
      accountHolder: 'Phạm Thị D',
      bankName: 'ACB',
      salaryAdvanceCode: 'UL002',
      expenseContent: 'Mua văn phòng phẩm',
      industryCode: 'NG02',
      expenseCode: 'CP002'
    },
    {
      id: 3,
      voucherNumber: 'PC230802-003',
      expenseDate: '02/08/2025',
      expenseStaff: 'Hoàng Văn E',
      recipient: 'Võ Thị F',
      amount: '3,200,000',
      expenseType: 'Ứng lương',
      fund: 'Quỹ tiền mặt',
      accountNumber: '555666777',
      accountHolder: 'Võ Thị F',
      bankName: 'MB Bank',
      salaryAdvanceCode: 'UL003',
      expenseContent: 'Ứng lương tháng 8',
      industryCode: 'NG03',
      expenseCode: 'CP003'
    }
  ];

  // Hàm lấy nhãn cột
  const getColumnLabel = (key) => {
    const labels = {
      stt: 'STT',
      voucherNumber: 'Số phiếu chi',
      expenseDate: 'Ngày chi',
      expenseStaff: 'Nhân viên chi',
      recipient: 'Người nhận tiền',
      amount: 'Số tiền',
      expenseType: 'Loại chi',
      fund: 'Quỹ',
      accountNumber: 'Số tài khoản',
      accountHolder: 'Tên chủ tài khoản',
      bankName: 'Tên ngân hàng',
      salaryAdvanceCode: 'Mã ứng lương',
      expenseContent: 'Nội dung chi',
      industryCode: 'Mã ngành',
      expenseCode: 'Mã chi',
      actions: 'Thao tác'
    };
    return labels[key] || key;
  };

  // Hàm lấy tiêu đề modal
  const getModalTitle = (type) => {
    const titles = {
      voucherNumber: 'Tìm kiếm số phiếu chi',
      expenseStaff: 'Tìm kiếm nhân viên chi',
      recipient: 'Tìm kiếm người nhận tiền',
      amount: 'Tìm kiếm theo số tiền',
      expenseType: 'Tìm kiếm loại chi',
      fund: 'Tìm kiếm quỹ',
      accountNumber: 'Tìm kiếm số tài khoản',
      accountHolder: 'Tìm kiếm chủ tài khoản',
      bankName: 'Tìm kiếm ngân hàng',
      salaryAdvanceCode: 'Tìm kiếm mã ứng lương',
      expenseContent: 'Tìm kiếm nội dung chi',
      industryCode: 'Tìm kiếm mã ngành',
      expenseCode: 'Tìm kiếm mã chi'
    };
    return titles[type] || 'Tìm kiếm';
  };

  return (
    <div className="expense-voucher-page">
      {/* Header */}
      <div className="page-header">
        <h1>DANH SÁCH PHIẾU CHI</h1>
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
            <label>Nhân viên chi</label>
            <select 
              value={searchCriteria.payer}
              onChange={(e) => setSearchCriteria({...searchCriteria, payer: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="staff1">Nhân viên 1</option>
              <option value="staff2">Nhân viên 2</option>
            </select>
          </div>
          <button className="search-btn">🔍 Tìm kiếm</button>
        </div>
        
        <div className="filter-bottom">
          <div className="total-info">
            <span>Tổng: {expensesList.length} phiếu</span>
          </div>
          <div className="header-actions">
            <button className="action-btn add-btn">+ Thêm</button>
            <button className="action-btn print-btn">🖨️ In</button>
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
        <div className="column-settings-dropdown" ref={columnSettingsRef}>
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
              {columnVisibility.voucherNumber && (
                <th>
                  <div className="header-with-modal">
                    <span>Số phiếu chi</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('voucherNumber')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.expenseDate && <th>Ngày chi</th>}
              {columnVisibility.expenseStaff && (
                <th>
                  <div className="header-with-modal">
                    <span>Nhân viên chi</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('expenseStaff')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.recipient && (
                <th>
                  <div className="header-with-modal">
                    <span>Người nhận tiền</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('recipient')}
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
              {columnVisibility.expenseType && (
                <th>
                  <div className="header-with-modal">
                    <span>Loại chi</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('expenseType')}
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
              {columnVisibility.bankName && (
                <th>
                  <div className="header-with-modal">
                    <span>Tên ngân hàng</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('bankName')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.salaryAdvanceCode && (
                <th>
                  <div className="header-with-modal">
                    <span>Mã ứng lương</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('salaryAdvanceCode')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.expenseContent && (
                <th>
                  <div className="header-with-modal">
                    <span>Nội dung chi</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('expenseContent')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.industryCode && (
                <th>
                  <div className="header-with-modal">
                    <span>Mã ngành</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('industryCode')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.expenseCode && (
                <th>
                  <div className="header-with-modal">
                    <span>Mã chi</span>
                    <button 
                      className="header-modal-btn" 
                      onClick={() => openModal('expenseCode')}
                    >🔍</button>
                  </div>
                </th>
              )}
              {columnVisibility.actions && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {expensesList.map((expense, index) => (
              <tr key={expense.id}>
                {columnVisibility.stt && <td>{index + 1}</td>}
                {columnVisibility.voucherNumber && <td>{expense.voucherNumber}</td>}
                {columnVisibility.expenseDate && <td>{expense.expenseDate}</td>}
                {columnVisibility.expenseStaff && <td>{expense.expenseStaff}</td>}
                {columnVisibility.recipient && <td>{expense.recipient}</td>}
                {columnVisibility.amount && <td>{expense.amount}</td>}
                {columnVisibility.expenseType && <td>{expense.expenseType}</td>}
                {columnVisibility.fund && <td>{expense.fund}</td>}
                {columnVisibility.accountNumber && <td>{expense.accountNumber}</td>}
                {columnVisibility.accountHolder && <td>{expense.accountHolder}</td>}
                {columnVisibility.bankName && <td>{expense.bankName}</td>}
                {columnVisibility.salaryAdvanceCode && <td>{expense.salaryAdvanceCode}</td>}
                {columnVisibility.expenseContent && <td>{expense.expenseContent}</td>}
                {columnVisibility.industryCode && <td>{expense.industryCode}</td>}
                {columnVisibility.expenseCode && <td>{expense.expenseCode}</td>}
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

export default ExpenseVoucher;
