import React, { useState } from 'react';
import './SetupPage.css';

const AccountsFunds = () => {
  const [activeTab, setActiveTab] = useState('funds');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data for funds
  const [funds, setFunds] = useState([
    {
      id: 1,
      code: 'QT001',
      name: 'Quỹ tiền mặt',
      accountHolder: 'Nguyễn Văn A',
      accountNumber: '1234567890',
      bank: 'Vietcombank',
      branch: 'Chi nhánh Hà Nội',
      initialBalance: 50000000,
      note: 'Quỹ chính',
      status: 'active'
    },
    {
      id: 2,
      code: 'QT002',
      name: 'Tài khoản ngân hàng',
      accountHolder: 'Công ty ABC',
      accountNumber: '0987654321',
      bank: 'VietinBank',
      branch: 'Chi nhánh TP.HCM',
      initialBalance: 100000000,
      note: 'Tài khoản giao dịch',
      status: 'active'
    }
  ]);

  // Sample data for bank loans
  const [bankLoans, setBankLoans] = useState([
    {
      id: 1,
      accountNumber: 'VAY001',
      loanName: 'Vay mua thiết bị',
      loanDate: '2024-01-15',
      dueDate: '2026-01-15',
      interestPeriod: 'Hàng tháng',
      interestCost: 1200000,
      principalPayment: 5000000,
      principalAmount: 100000000,
      note: '8.5%',
      status: 'active'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    accountHolder: '',
    accountNumber: '',
    bank: '',
    branch: '',
    initialBalance: 0,
    note: '',
    status: 'active',
    // For bank loans
    loanName: '',
    loanDate: '',
    dueDate: '',
    interestPeriod: '',
    interestCost: 0,
    principalPayment: 0,
    principalAmount: 0
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'funds') {
      if (editingItem) {
        setFunds(funds.map(item => 
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        ));
      } else {
        setFunds([...funds, { ...formData, id: Date.now() }]);
      }
    } else {
      if (editingItem) {
        setBankLoans(bankLoans.map(item => 
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        ));
      } else {
        setBankLoans([...bankLoans, { ...formData, id: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      accountHolder: '',
      accountNumber: '',
      bank: '',
      branch: '',
      initialBalance: 0,
      note: '',
      status: 'active',
      loanName: '',
      loanDate: '',
      dueDate: '',
      interestPeriod: '',
      interestCost: 0,
      principalPayment: 0,
      principalAmount: 0
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      if (activeTab === 'funds') {
        setFunds(funds.filter(item => item.id !== id));
      } else {
        setBankLoans(bankLoans.filter(item => item.id !== id));
      }
    }
  };

  const filteredFunds = funds.filter(fund =>
    fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBankLoans = bankLoans.filter(loan =>
    loan.loanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Tài khoản quỹ & Nợ ngân hàng</h1>
        <p>Quản lý danh sách quỹ tài khoản và tài khoản nợ ngân hàng</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'funds' ? 'active' : ''}`}
          onClick={() => setActiveTab('funds')}
        >
          Danh sách quỹ - Tài khoản
        </button>
        <button 
          className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          Danh sách tài khoản nợ ngân hàng
        </button>
      </div>

      {/* Funds Tab */}
      {activeTab === 'funds' && (
        <div className="data-table-container">
          <div className="table-header">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã quỹ..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="table-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                  setEditingItem(null);
                }}
              >
                + Thêm quỹ
              </button>
              <button className="btn btn-success">📤 Export Excel</button>
              <button className="btn btn-secondary">📥 Import Excel</button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã quỹ</th>
                <th>Tên quỹ</th>
                <th>Chủ tài khoản</th>
                <th>Số tài khoản</th>
                <th>Ngân hàng</th>
                <th>Chi nhánh</th>
                <th>Số dư đầu</th>
                <th>Ghi chú</th>
                <th>Tình trạng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFunds.map((fund) => (
                <tr key={fund.id}>
                  <td>{fund.code}</td>
                  <td>{fund.name}</td>
                  <td>{fund.accountHolder}</td>
                  <td>{fund.accountNumber}</td>
                  <td>{fund.bank}</td>
                  <td>{fund.branch}</td>
                  <td>{formatCurrency(fund.initialBalance)}</td>
                  <td>{fund.note}</td>
                  <td>
                    <span className={`status-badge ${fund.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {fund.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(fund)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(fund.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bank Loans Tab */}
      {activeTab === 'loans' && (
        <div className="data-table-container">
          <div className="table-header">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khoản vay hoặc số tài khoản..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="table-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                  setEditingItem(null);
                }}
              >
                + Thêm khoản vay
              </button>
              <button className="btn btn-success">📤 Export Excel</button>
              <button className="btn btn-secondary">📥 Import Excel</button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Số tài khoản</th>
                <th>Tên khoản nợ NH</th>
                <th>Ngày vay</th>
                <th>Ngày đáo hạn</th>
                <th>Kỳ trả lãi</th>
                <th>CP lãi</th>
                <th>Trả gốc hàng kỳ</th>
                <th>Tiền trả gốc</th>
                <th>Ghi chú (%)</th>
                <th>Tình trạng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBankLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.accountNumber}</td>
                  <td>{loan.loanName}</td>
                  <td>{loan.loanDate}</td>
                  <td>{loan.dueDate}</td>
                  <td>{loan.interestPeriod}</td>
                  <td>{formatCurrency(loan.interestCost)}</td>
                  <td>{formatCurrency(loan.principalPayment)}</td>
                  <td>{formatCurrency(loan.principalAmount)}</td>
                  <td>{loan.note}</td>
                  <td>
                    <span className={`status-badge ${loan.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {loan.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(loan)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(loan.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 'funds' ? 'quỹ tài khoản' : 'khoản vay'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'funds' ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mã quỹ <span className="required">*</span></label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên quỹ <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Chủ tài khoản</label>
                    <input
                      type="text"
                      name="accountHolder"
                      value={formData.accountHolder}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số tài khoản</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngân hàng</label>
                    <input
                      type="text"
                      name="bank"
                      value={formData.bank}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chi nhánh</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số dư đầu</label>
                    <input
                      type="number"
                      name="initialBalance"
                      value={formData.initialBalance}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Số tài khoản <span className="required">*</span></label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên khoản nợ NH <span className="required">*</span></label>
                    <input
                      type="text"
                      name="loanName"
                      value={formData.loanName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày vay</label>
                    <input
                      type="date"
                      name="loanDate"
                      value={formData.loanDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày đáo hạn</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kỳ trả lãi</label>
                    <select
                      name="interestPeriod"
                      value={formData.interestPeriod}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn kỳ trả lãi</option>
                      <option value="Hàng tháng">Hàng tháng</option>
                      <option value="Hàng quý">Hàng quý</option>
                      <option value="6 tháng">6 tháng</option>
                      <option value="Hàng năm">Hàng năm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>CP lãi</label>
                    <input
                      type="number"
                      name="interestCost"
                      value={formData.interestCost}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trả gốc hàng kỳ</label>
                    <input
                      type="number"
                      name="principalPayment"
                      value={formData.principalPayment}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiền trả gốc</label>
                    <input
                      type="number"
                      name="principalAmount"
                      value={formData.principalAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú (%)</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Nhập phần trăm lãi suất..."
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsFunds;
