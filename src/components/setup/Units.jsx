import React, { useState } from 'react';
import './SetupPage.css';

const Units = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [units, setUnits] = useState([
    {
      id: 1,
      code: 'CAI',
      name: 'Cái',
      note: 'Đơn vị đếm cho các sản phẩm rời',
      status: 'active'
    },
    {
      id: 2,
      code: 'KG',
      name: 'Kilogram',
      note: 'Đơn vị khối lượng',
      status: 'active'
    },
    {
      id: 3,
      code: 'THUNG',
      name: 'Thùng',
      note: 'Đơn vị đóng gói lớn',
      status: 'active'
    },
    {
      id: 4,
      code: 'GOI',
      name: 'Gói',
      note: 'Đơn vị đóng gói nhỏ',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
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
      setUnits(units.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setUnits([...units, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
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
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị tính này?')) {
      setUnits(units.filter(item => item.id !== id));
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>Danh sách đơn vị tính</h1>
        <p>Quản lý các đơn vị tính sử dụng trong hệ thống</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã đơn vị..."
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
              + Thêm đơn vị
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
              <th>Mã đơn vị</th>
              <th>Tên đơn vị</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit) => (
              <tr key={unit.id}>
                <td>{unit.code}</td>
                <td>{unit.name}</td>
                <td>{unit.note}</td>
                <td>
                  <span className={`status-badge ${unit.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {unit.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(unit)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(unit.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUnits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy đơn vị tính nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} đơn vị tính</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã đơn vị <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã đơn vị (VD: KG, CAI)"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                    Mã đơn vị sẽ được chuyển thành chữ in hoa
                  </small>
                </div>
                <div className="form-group">
                  <label>Tên đơn vị <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên đơn vị"
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
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về đơn vị tính"
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

export default Units;
