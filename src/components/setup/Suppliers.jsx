import React, { useState } from 'react';
import './SetupPage.css';

const Suppliers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      code: 'NCC001',
      name: 'Công ty TNHH Phân phối ABC',
      phone: '0281234567',
      address: '123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      taxCode: '0123456789',
      productType: 'Điện tử, Gia dụng',
      note: 'Nhà cung cấp chính, uy tín',
      status: 'active'
    },
    {
      id: 2,
      code: 'NCC002',
      name: 'Công ty Cổ phần XYZ',
      phone: '0287654321',
      address: '456 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM',
      taxCode: '9876543210',
      productType: 'Thực phẩm, Đồ uống',
      note: 'Chất lượng tốt, giao hàng nhanh',
      status: 'active'
    },
    {
      id: 3,
      code: 'NCC003',
      name: 'Doanh nghiệp tư nhân DEF',
      phone: '0901122334',
      address: '789 Đường Lê Văn Việt, Quận 9, TP.HCM',
      taxCode: '1357924680',
      productType: 'Văn phòng phẩm',
      note: 'Giá cả hợp lý',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    address: '',
    taxCode: '',
    productType: '',
    note: '',
    status: 'active'
  });

  const productTypes = [
    'Điện tử, Gia dụng',
    'Thực phẩm, Đồ uống',
    'Văn phòng phẩm',
    'Quần áo, Thời trang',
    'Xây dựng, Vật liệu',
    'Y tế, Dược phẩm',
    'Nông sản, Thực phẩm tươi sống',
    'Khác'
  ];

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
      setSuppliers(suppliers.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setSuppliers([...suppliers, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      phone: '',
      address: '',
      taxCode: '',
      productType: '',
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
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      setSuppliers(suppliers.filter(item => item.id !== id));
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Logic export to Excel
    alert('Chức năng export Excel đang được phát triển');
  };

  const handleImport = () => {
    // Logic import from Excel
    alert('Chức năng import Excel đang được phát triển');
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Danh sách nhà cung cấp</h1>
        <p>Quản lý danh sách nhà cung cấp hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã, số điện thoại hoặc loại hàng..."
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
              + Thêm nhà cung cấp
            </button>
            <button className="btn btn-success" onClick={handleExport}>
              📤 Export Excel
            </button>
            <button className="btn btn-secondary" onClick={handleImport}>
              📥 Import Excel
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên nhà cung cấp</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Mã số thuế</th>
              <th>Loại hàng</th>
              <th>Ghi chú</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.code}</td>
                <td>{supplier.name}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.address}</td>
                <td>{supplier.taxCode}</td>
                <td>{supplier.productType}</td>
                <td>{supplier.note}</td>
                <td>
                  <span className={`status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {supplier.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(supplier)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSuppliers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy nhà cung cấp nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} nhà cung cấp</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã nhà cung cấp <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã nhà cung cấp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên nhà cung cấp <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên nhà cung cấp"
                    required
                  />
                </div>
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
                  <label>Mã số thuế</label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleInputChange}
                    placeholder="Nhập mã số thuế"
                  />
                </div>
                <div className="form-group">
                  <label>Loại hàng</label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn loại hàng</option>
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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
              </div>

              <div className="form-group full-width">
                <label>Địa chỉ <span className="required">*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ nhà cung cấp"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về nhà cung cấp"
                />
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

export default Suppliers;
