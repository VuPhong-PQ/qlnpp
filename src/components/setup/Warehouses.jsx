import React, { useState, useRef } from 'react';
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


  // Cột và độ rộng mặc định
  const warehouseColumns = [
    { key: 'code', label: 'Mã kho' },
    { key: 'name', label: 'Tên kho' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'managerName', label: 'Tên thủ kho' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Tình trạng' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultWarehouseWidths = [100, 160, 120, 140, 200, 150, 110, 110];
  const [warehouseColWidths, setWarehouseColWidths] = useState(defaultWarehouseWidths);
  const defaultWarehouseVisible = warehouseColumns.map(col => col.key);
  const [warehouseVisibleCols, setWarehouseVisibleCols] = useState(defaultWarehouseVisible);
  const [showWarehouseColSetting, setShowWarehouseColSetting] = useState(false);
  const warehouseTableRef = useRef(null);
  const warehouseColSettingRef = useRef(null);

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    if (!showWarehouseColSetting) return;
    const handleClickOutside = (e) => {
      if (warehouseColSettingRef.current && !warehouseColSettingRef.current.contains(e.target)) {
        setShowWarehouseColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWarehouseColSetting]);

  // Kéo cột
  const handleWarehouseMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...warehouseColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setWarehouseColWidths((widths) => {
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
        <h1>Danh sách kho hàng</h1>
        <p>Quản lý thông tin các kho hàng trong hệ thống</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowWarehouseColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showWarehouseColSetting && (
            <div
              ref={warehouseColSettingRef}
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
                  checked={warehouseVisibleCols.length === warehouseColumns.length}
                  onChange={e => setWarehouseVisibleCols(e.target.checked ? defaultWarehouseVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => setWarehouseVisibleCols(defaultWarehouseVisible)}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {warehouseColumns.filter(col => !col.fixed).map(col => (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={warehouseVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setWarehouseVisibleCols(cols => [...cols, col.key]);
                      else setWarehouseVisibleCols(cols => cols.filter(k => k !== col.key));
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
          <table className="data-table" ref={warehouseTableRef}>
            <colgroup>
              {warehouseColWidths.map((w, i) => (
                warehouseVisibleCols.includes(warehouseColumns[i].key) ? <col key={i} style={{ width: w }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {warehouseColumns.map((col, idx, arr) => (
                  warehouseVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && warehouseVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleWarehouseMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && warehouseVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleWarehouseMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  {warehouseColumns.map((col, idx) => {
                    if (!warehouseVisibleCols.includes(col.key)) return null;
                    if (col.key === 'code') {
                      return (
                        <td key={col.key}>
                          <span style={{ fontWeight: 'bold', color: '#2c5aa0' }}>{warehouse.code}</span>
                        </td>
                      );
                    }
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${warehouse.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {warehouse.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
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
                      );
                    }
                    if (col.key === 'address') {
                      return (
                        <td key={col.key} style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{warehouse.address}</td>
                      );
                    }
                    if (col.key === 'note') {
                      return (
                        <td key={col.key} style={{ maxWidth: '150px', wordWrap: 'break-word' }}>{warehouse.note}</td>
                      );
                    }
                    return <td key={col.key}>{warehouse[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
