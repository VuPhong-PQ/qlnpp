import React, { useState } from 'react';
import './SetupPage.css';

const ProductCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [categories, setCategories] = useState([
    {
      id: 1,
      code: 'LH001',
      name: 'Điện tử - Gia dụng',
      noGroupOrder: false,
      note: 'Các sản phẩm điện tử và gia dụng',
      status: 'active'
    },
    {
      id: 2,
      code: 'LH002',
      name: 'Thực phẩm tươi sống',
      noGroupOrder: true,
      note: 'Thực phẩm cần bảo quản lạnh, không gộp đơn',
      status: 'active'
    },
    {
      id: 3,
      code: 'LH003',
      name: 'Văn phòng phẩm',
      noGroupOrder: false,
      note: 'Đồ dùng văn phòng, học tập',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    noGroupOrder: false,
    note: '',
    status: 'active'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setCategories(categories.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setCategories([...categories, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      noGroupOrder: false,
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
    if (window.confirm('Bạn có chắc chắn muốn xóa loại hàng này?')) {
      setCategories(categories.filter(item => item.id !== id));
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>Danh sách loại hàng</h1>
        <p>Quản lý danh mục loại hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã loại hàng..."
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
              + Thêm loại hàng
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
              <th>Mã loại</th>
              <th>Tên loại</th>
              <th>Không gộp đơn hàng</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category.id}>
                <td>{category.code}</td>
                <td>{category.name}</td>
                <td>
                  <span className={`status-badge ${category.noGroupOrder ? 'status-inactive' : 'status-active'}`}>
                    {category.noGroupOrder ? 'Có' : 'Không'}
                  </span>
                </td>
                <td>{category.note}</td>
                <td>
                  <span className={`status-badge ${category.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {category.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(category)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(category.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy loại hàng nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} loại hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã loại <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã loại hàng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên loại <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên loại hàng"
                    required
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
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="noGroupOrder"
                      checked={formData.noGroupOrder}
                      onChange={handleInputChange}
                    />
                    Không gộp đơn hàng
                  </label>
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                    Chọn nếu loại hàng này không được gộp chung trong đơn hàng
                  </small>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về loại hàng"
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

export default ProductCategories;
