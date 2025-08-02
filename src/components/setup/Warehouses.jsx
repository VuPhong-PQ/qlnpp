import React, { useState } from 'react';
import './SetupPage.css';

const Warehouses = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [warehouses, setWarehouses] = useState([
    {
      id: 1,
      code: 'KHO001',
      name: 'Kho tổng',
      phone: '0123456789',
      managerName: 'Nguyễn Văn A',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      note: 'Kho chính lưu trữ hàng hóa',
      status: 'active'
    },
    {
      id: 2,
      code: 'KHO002',
      name: 'Kho chi nhánh 1',
      phone: '0987654321',
      managerName: 'Trần Thị B',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      note: 'Kho chi nhánh khu vực phía Nam',
      status: 'active'
    },
    {
      id: 3,
      code: 'KHO003',
      name: 'Kho chi nhánh 2',
      phone: '0369852147',
      managerName: 'Lê Văn C',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      note: 'Kho chi nhánh khu vực phía Bắc',
      status: 'active'
    },
    {
      id: 4,
      code: 'KHO004',
      name: 'Kho tạm thời',
      phone: '0147258369',
      managerName: 'Phạm Thị D',
      address: '321 Đường GHI, Quận 4, TP.HCM',
      note: 'Kho lưu trữ tạm thời',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    managerName: '',
    address: '',
    note: '',
    status: 'active'
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
    if (editingItem) {
      setWarehouses(warehouses.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setWarehouses([...warehouses, { ...formData, id: Date.now() }]);
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
      managerName: '',
      address: '',
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
    if (window.confirm('Bạn có chắc chắn muốn xóa kho này?')) {
      setWarehouses(warehouses.filter(item => item.id !== id));
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    alert('Chức năng export Excel đang được phát triển');
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Danh sách kho hàng</h1>
        <p>Quản lý thông tin các kho hàng trong hệ thống</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên kho, mã kho, thủ kho hoặc địa chỉ..."
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
              + Thêm kho hàng
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
              <th>Mã kho</th>
              <th>Tên kho</th>
              <th>Số điện thoại</th>
              <th>Tên thủ kho</th>
              <th>Địa chỉ</th>
              <th>Ghi chú</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarehouses.map((warehouse) => (
              <tr key={warehouse.id}>
                <td>
                  <span style={{ fontWeight: 'bold', color: '#2c5aa0' }}>
                    {warehouse.code}
                  </span>
                </td>
                <td>{warehouse.name}</td>
                <td>{warehouse.phone}</td>
                <td>{warehouse.managerName}</td>
                <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                  {warehouse.address}
                </td>
                <td style={{ maxWidth: '150px', wordWrap: 'break-word' }}>
                  {warehouse.note}
                </td>
                <td>
                  <span className={`status-badge ${warehouse.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {warehouse.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(warehouse)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(warehouse.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredWarehouses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy kho hàng nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} kho hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã kho <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: KHO001"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên kho <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên kho hàng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                  />
                </div>
                <div className="form-group">
                  <label>Tên thủ kho</label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên người quản lý kho"
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
              </div>

              <div className="form-group full-width">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ kho hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                />
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về kho hàng (diện tích, loại hàng lưu trữ, thiết bị...)"
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

export default Warehouses;
