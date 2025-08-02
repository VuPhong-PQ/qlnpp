import React, { useState } from 'react';
import './SetupPage.css';

const Customers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [customers, setCustomers] = useState([
    {
      id: 1,
      customerGroup: 'KH001',
      code: 'KH001001',
      vatName: 'Công ty TNHH ABC',
      vatAddress: '123 Đường Nguyễn Văn A, Quận 1, TP.HCM',
      phone: '0901234567',
      email: 'abc@company.com',
      account: 'TK001',
      taxCode: '0123456789',
      customerType: 'Khách sỉ',
      vehicle: 'Xe tải nhỏ',
      printOrder: 1,
      businessType: 'Bán lẻ',
      debtLimit: 50000000,
      debtTerm: '1 tháng',
      initialDebt: 0,
      note: 'Khách hàng VIP',
      status: 'active'
    },
    {
      id: 2,
      customerGroup: 'KH002',
      code: 'KH002001',
      vatName: 'Cửa hàng XYZ',
      vatAddress: '456 Đường Lê Văn B, Quận 2, TP.HCM',
      phone: '0907654321',
      email: 'xyz@shop.com',
      account: 'TK002',
      taxCode: '9876543210',
      customerType: 'Khách lẻ',
      vehicle: 'Xe máy',
      printOrder: 2,
      businessType: 'Tạp hóa',
      debtLimit: 10000000,
      debtTerm: '2 tuần',
      initialDebt: 500000,
      note: 'Khách hàng thường xuyên',
      status: 'active'
    }
  ]);

  const [formData, setFormData] = useState({
    customerGroup: '',
    code: '',
    vatName: '',
    vatAddress: '',
    phone: '',
    email: '',
    account: '',
    taxCode: '',
    customerType: '',
    vehicle: '',
    printOrder: 0,
    businessType: '',
    debtLimit: 0,
    debtTerm: '',
    initialDebt: 0,
    note: '',
    status: 'active'
  });

  const customerGroups = ['KH001', 'KH002', 'KH003'];
  const customerTypes = ['Khách sỉ', 'Khách lẻ', 'Siêu thị', 'Tạp hóa', 'Nhà hàng'];
  const businessTypes = ['Bán lẻ', 'Bán sỉ', 'Tạp hóa', 'Siêu thị', 'Nhà hàng', 'Khách sạn'];
  const debtTerms = ['1 tuần', '2 tuần', '1 tháng', '2 tháng', '3 tháng'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setCustomers(customers.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setCustomers([...customers, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerGroup: '',
      code: '',
      vatName: '',
      vatAddress: '',
      phone: '',
      email: '',
      account: '',
      taxCode: '',
      customerType: '',
      vehicle: '',
      printOrder: 0,
      businessType: '',
      debtLimit: 0,
      debtTerm: '',
      initialDebt: 0,
      note: '',
      status: 'active'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      setCustomers(customers.filter(item => item.id !== id));
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.vatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
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
        <h1>Khách hàng</h1>
        <p>Quản lý danh sách khách hàng</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã khách hàng hoặc số điện thoại..."
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
              + Thêm khách hàng
            </button>
            <button className="btn btn-success">📤 Export Excel</button>
            <button className="btn btn-secondary">📥 Import Excel</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nhóm KH</th>
                <th>Mã KH</th>
                <th>Tên xuất VAT</th>
                <th>Địa chỉ xuất VAT</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Mã số thuế</th>
                <th>Loại KH</th>
                <th>Hạn mức công nợ</th>
                <th>Hạn nợ</th>
                <th>Công nợ ban đầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.customerGroup}</td>
                  <td>{customer.code}</td>
                  <td>{customer.vatName}</td>
                  <td>{customer.vatAddress}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td>{customer.taxCode}</td>
                  <td>{customer.customerType}</td>
                  <td>{formatCurrency(customer.debtLimit)}</td>
                  <td>{customer.debtTerm}</td>
                  <td>{formatCurrency(customer.initialDebt)}</td>
                  <td>
                    <span className={`status-badge ${customer.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {customer.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(customer)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(customer.id)}
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

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy khách hàng nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} khách hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>Thông tin cơ bản</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nhóm khách hàng <span className="required">*</span></label>
                    <select
                      name="customerGroup"
                      value={formData.customerGroup}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn nhóm khách hàng</option>
                      {customerGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mã khách hàng <span className="required">*</span></label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Nhập mã khách hàng"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên xuất VAT <span className="required">*</span></label>
                    <input
                      type="text"
                      name="vatName"
                      value={formData.vatName}
                      onChange={handleInputChange}
                      placeholder="Nhập tên xuất VAT"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mã số thuế <span className="required">*</span></label>
                    <input
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleInputChange}
                      placeholder="Nhập mã số thuế"
                      required
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ xuất VAT <span className="required">*</span></label>
                  <textarea
                    name="vatAddress"
                    value={formData.vatAddress}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ xuất VAT"
                    rows="2"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Thông tin liên hệ</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Số điện thoại <span className="required">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tài khoản</label>
                    <input
                      type="text"
                      name="account"
                      value={formData.account}
                      onChange={handleInputChange}
                      placeholder="Nhập tài khoản"
                    />
                  </div>
                  <div className="form-group">
                    <label>Loại khách hàng</label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn loại khách hàng</option>
                      {customerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Thông tin kinh doanh</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Loại hình kinh doanh</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn loại hình kinh doanh</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Xe (ghi chú)</label>
                    <input
                      type="text"
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      placeholder="Nhập thông tin xe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số thứ tự in</label>
                    <input
                      type="number"
                      name="printOrder"
                      value={formData.printOrder}
                      onChange={handleInputChange}
                      placeholder="Nhập số thứ tự"
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Thông tin công nợ</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Hạn mức công nợ</label>
                    <input
                      type="number"
                      name="debtLimit"
                      value={formData.debtLimit}
                      onChange={handleInputChange}
                      placeholder="Nhập hạn mức công nợ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hạn nợ</label>
                    <select
                      name="debtTerm"
                      value={formData.debtTerm}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn hạn nợ</option>
                      {debtTerms.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Công nợ ban đầu</label>
                    <input
                      type="number"
                      name="initialDebt"
                      value={formData.initialDebt}
                      onChange={handleInputChange}
                      placeholder="Nhập công nợ ban đầu"
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Nhập ghi chú về khách hàng"
                  />
                </div>
              </div>

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

export default Customers;
