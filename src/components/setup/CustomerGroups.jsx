import React, { useState } from 'react';
import './SetupPage.css';

const CustomerGroups = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [customerGroups, setCustomerGroups] = useState([
    {
      id: 1,
      code: 'KH001',
      name: 'Khách sỉ',
      salesSchedule: 'Thứ 2, 4, 6',
      note: 'Nhóm khách hàng sỉ, ưu tiên giao hàng',
      status: 'active'
    },
    {
      id: 2,
      code: 'KH002',
      name: 'Khách lẻ',
      salesSchedule: 'Hàng ngày',
      note: 'Nhóm khách hàng lẻ',
      status: 'active'
    },
    {
      id: 3,
      code: 'KH003',
      name: 'Siêu thị',
      salesSchedule: 'Thứ 3, 5, 7',
      note: 'Nhóm siêu thị, cần hỗ trợ đặc biệt',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    salesSchedule: '',
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
      setCustomerGroups(customerGroups.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setCustomerGroups([...customerGroups, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      salesSchedule: '',
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
    if (window.confirm('Bạn có chắc chắn muốn xóa nhóm khách hàng này?')) {
      setCustomerGroups(customerGroups.filter(item => item.id !== id));
    }
  };

  const filteredGroups = customerGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.code.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>Nhóm khách hàng</h1>
        <p>Quản lý danh sách nhóm khách hàng</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã nhóm..."
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
              + Thêm nhóm
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
              <th>Mã nhóm</th>
              <th>Tên nhóm</th>
              <th>Lịch bán hàng</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <tr key={group.id}>
                <td>{group.code}</td>
                <td>{group.name}</td>
                <td>{group.salesSchedule}</td>
                <td>{group.note}</td>
                <td>
                  <span className={`status-badge ${group.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {group.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(group)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(group.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredGroups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy nhóm khách hàng nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} nhóm khách hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã nhóm <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã nhóm"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên nhóm <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên nhóm"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Lịch bán hàng</label>
                  <input
                    type="text"
                    name="salesSchedule"
                    value={formData.salesSchedule}
                    onChange={handleInputChange}
                    placeholder="VD: Thứ 2, 4, 6 hoặc Hàng ngày"
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
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Nhập ghi chú về nhóm khách hàng"
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

export default CustomerGroups;
