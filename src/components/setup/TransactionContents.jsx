import React, { useState } from 'react';
import './SetupPage.css';

const TransactionContents = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [contents, setContents] = useState([
    {
      id: 1,
      type: 'Thu',
      code: 'THU001',
      name: 'Thu tiền bán hàng',
      note: 'Thu tiền từ khách hàng khi bán hàng',
      status: 'active'
    },
    {
      id: 2,
      type: 'Chi',
      code: 'CHI001',
      name: 'Chi phí vận chuyển',
      note: 'Chi phí vận chuyển hàng hóa',
      status: 'active'
    },
    {
      id: 3,
      type: 'Xuất',
      code: 'XUAT001',
      name: 'Xuất bán hàng',
      note: 'Xuất hàng để bán cho khách',
      status: 'active'
    },
    {
      id: 4,
      type: 'Nhập',
      code: 'NHAP001',
      name: 'Nhập từ nhà cung cấp',
      note: 'Nhập hàng từ nhà cung cấp',
      status: 'active'
    },
    {
      id: 5,
      type: 'Chi',
      code: 'CHI002',
      name: 'Chi phí điện nước',
      note: 'Chi phí điện nước văn phòng',
      status: 'inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    type: '',
    code: '',
    name: '',
    note: '',
    status: 'active'
  });

  const contentTypes = ['Thu', 'Chi', 'Xuất', 'Nhập'];

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
      setContents(contents.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setContents([...contents, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: '',
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
    if (window.confirm('Bạn có chắc chắn muốn xóa nội dung này?')) {
      setContents(contents.filter(item => item.id !== id));
    }
  };

  const filteredContents = contents.filter(content =>
    content.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    alert('Chức năng export Excel đang được phát triển');
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Thu': return '#28a745';
      case 'Chi': return '#dc3545';
      case 'Xuất': return '#fd7e14';
      case 'Nhập': return '#20c997';
      default: return '#6c757d';
    }
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Nội dung thu, chi, xuất, nhập</h1>
        <p>Quản lý danh mục nội dung các giao dịch tài chính và kho</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã nội dung hoặc loại..."
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
              + Thêm nội dung
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
              <th>Loại nội dung</th>
              <th>Mã nội dung</th>
              <th>Tên nội dung</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredContents.map((content) => (
              <tr key={content.id}>
                <td>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getTypeColor(content.type),
                      color: 'white'
                    }}
                  >
                    {content.type}
                  </span>
                </td>
                <td>{content.code}</td>
                <td>{content.name}</td>
                <td>{content.note}</td>
                <td>
                  <span className={`status-badge ${content.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {content.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(content)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(content.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy nội dung nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} nội dung giao dịch</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Loại nội dung <span className="required">*</span></label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn loại nội dung</option>
                    {contentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                    Thu/Chi: Giao dịch tài chính | Xuất/Nhập: Giao dịch kho
                  </small>
                </div>
                <div className="form-group">
                  <label>Mã nội dung <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: THU001, CHI001"
                    style={{ textTransform: 'uppercase' }}
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
                <label>Tên nội dung <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên nội dung giao dịch"
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
                  placeholder="Nhập ghi chú mô tả chi tiết về nội dung giao dịch"
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

export default TransactionContents;
