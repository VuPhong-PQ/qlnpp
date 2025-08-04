import React, { useState, useRef } from 'react';
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


  // Cột và độ rộng mặc định
  const customerColumns = [
    { key: 'customerGroup', label: 'Nhóm KH' },
    { key: 'code', label: 'Mã KH' },
    { key: 'vatName', label: 'Tên xuất VAT' },
    { key: 'vatAddress', label: 'Địa chỉ xuất VAT' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'customerType', label: 'Loại KH' },
    { key: 'debtLimit', label: 'Hạn mức công nợ' },
    { key: 'debtTerm', label: 'Hạn nợ' },
    { key: 'initialDebt', label: 'Công nợ ban đầu' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultCustomerWidths = [100, 100, 160, 180, 110, 120, 110, 110, 130, 100, 130, 110, 110];
  const [customerColWidths, setCustomerColWidths] = useState(defaultCustomerWidths);
  const defaultCustomerVisible = customerColumns.map(col => col.key);
  const [customerVisibleCols, setCustomerVisibleCols] = useState(defaultCustomerVisible);
  const [showCustomerColSetting, setShowCustomerColSetting] = useState(false);
  const customerTableRef = useRef(null);
  const customerColSettingRef = useRef(null);

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    if (!showCustomerColSetting) return;
    const handleClickOutside = (e) => {
      if (customerColSettingRef.current && !customerColSettingRef.current.contains(e.target)) {
        setShowCustomerColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomerColSetting]);

  // Kéo cột
  const handleCustomerMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...customerColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setCustomerColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right' && index < widths.length - 1) {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
          newWidths[index + 1] = Math.max(50, startWidths[index + 1] - delta);
        } else if (edge === 'left' && index > 0) {
          newWidths[index] = Math.max(50, startWidths[index] - delta);
          newWidths[index - 1] = Math.max(50, startWidths[index - 1] + delta);
        }
        return newWidths;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Khách hàng</h1>
        <p>Quản lý danh sách khách hàng</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowCustomerColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showCustomerColSetting && (
            <div
              ref={customerColSettingRef}
              style={{
                position: 'fixed',
                top: '80px',
                right: '40px',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                zIndex: 9999,
                minWidth: 240,
                padding: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={customerVisibleCols.length === customerColumns.length}
                  onChange={e => setCustomerVisibleCols(e.target.checked ? defaultCustomerVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => setCustomerVisibleCols(defaultCustomerVisible)}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {customerColumns.filter(col => !col.fixed).map(col => (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={customerVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setCustomerVisibleCols(cols => [...cols, col.key]);
                      else setCustomerVisibleCols(cols => cols.filter(k => k !== col.key));
                    }}
                    style={{ marginRight: 6 }}
                  />
                  <span>{col.label}</span>
                </div>
              ))}
              <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                <span>Thao tác</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" ref={customerTableRef}>
            <colgroup>
              {customerColWidths.map((w, i) => (
                customerVisibleCols.includes(customerColumns[i].key) ? <col key={i} style={{ width: w }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {customerColumns.map((col, idx, arr) => (
                  customerVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && customerVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleCustomerMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && customerVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleCustomerMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  {customerColumns.map((col, idx) => {
                    if (!customerVisibleCols.includes(col.key)) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${customer.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {customer.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'debtLimit' || col.key === 'initialDebt') {
                      return <td key={col.key}>{formatCurrency(customer[col.key])}</td>;
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
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
                      );
                    }
                    return <td key={col.key}>{customer[col.key]}</td>;
                  })}
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
