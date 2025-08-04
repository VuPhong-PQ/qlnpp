import React, { useState, useRef } from 'react';
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



  // Cột và độ rộng mặc định
  const initialSupplierColumns = [
    { key: 'code', label: 'Mã NCC' },
    { key: 'name', label: 'Tên nhà cung cấp' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'productType', label: 'Loại hàng' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Tình trạng' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultSupplierWidths = [100, 180, 120, 200, 120, 140, 140, 110, 110];
  const [supplierColumns, setSupplierColumns] = useState(initialSupplierColumns);
  const [supplierColWidths, setSupplierColWidths] = useState(defaultSupplierWidths);
  const defaultSupplierVisible = supplierColumns.map(col => col.key);
  const [supplierVisibleCols, setSupplierVisibleCols] = useState(defaultSupplierVisible);
  const [showSupplierColSetting, setShowSupplierColSetting] = useState(false);
  const supplierTableRef = useRef(null);
  const supplierColSettingRef = useRef(null);

  // Drag & drop state
  const [dragColIndex, setDragColIndex] = useState(null);
  const [dragOverColIndex, setDragOverColIndex] = useState(null);

  // Kéo-thả cột
  const handleColDragStart = (idx) => {
    setDragColIndex(idx);
  };
  const handleColDragOver = (idx, e) => {
    e.preventDefault();
    setDragOverColIndex(idx);
  };
  const handleColDrop = () => {
    if (
      dragColIndex !== null &&
      dragOverColIndex !== null &&
      dragColIndex !== dragOverColIndex
    ) {
      // Hoán đổi vị trí cột trong supplierColumns, supplierColWidths
      const newColumns = [...supplierColumns];
      const newWidths = [...supplierColWidths];
      const [removedCol] = newColumns.splice(dragColIndex, 1);
      newColumns.splice(dragOverColIndex, 0, removedCol);
      const [removedWidth] = newWidths.splice(dragColIndex, 1);
      newWidths.splice(dragOverColIndex, 0, removedWidth);
      setSupplierColumns(newColumns);
      setSupplierColWidths(newWidths);
      // Cập nhật lại visibleCols theo thứ tự mới
      const visibleKeys = newColumns.map(col => col.key).filter(key => supplierVisibleCols.includes(key));
      setSupplierVisibleCols(visibleKeys);
    }
    setDragColIndex(null);
    setDragOverColIndex(null);
  };

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    if (!showSupplierColSetting) return;
    const handleClickOutside = (e) => {
      if (supplierColSettingRef.current && !supplierColSettingRef.current.contains(e.target)) {
        setShowSupplierColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSupplierColSetting]);

  // Kéo cột
  const handleSupplierMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...supplierColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setSupplierColWidths((widths) => {
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
        <h1>Danh sách nhà cung cấp</h1>
        <p>Quản lý danh sách nhà cung cấp hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowSupplierColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showSupplierColSetting && (
            <div
              ref={supplierColSettingRef}
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
                  checked={supplierVisibleCols.length === supplierColumns.length}
                  onChange={e => setSupplierVisibleCols(e.target.checked ? defaultSupplierVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => setSupplierVisibleCols(defaultSupplierVisible)}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {supplierColumns.filter(col => !col.fixed).map(col => (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={supplierVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setSupplierVisibleCols(cols => [...cols, col.key]);
                      else setSupplierVisibleCols(cols => cols.filter(k => k !== col.key));
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
          <table className="data-table" ref={supplierTableRef}>
            <colgroup>
              {supplierColWidths.map((w, i) => (
                supplierVisibleCols.includes(supplierColumns[i].key) ? <col key={i} style={{ width: w }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {supplierColumns.map((col, idx, arr) =>
                  supplierVisibleCols.includes(col.key) ? (
                    <th
                      key={col.key}
                      style={{
                        position: 'relative',
                        opacity: dragColIndex === idx ? 0.5 : 1,
                        background: dragOverColIndex === idx && dragColIndex !== null ? '#e6f7ff' : undefined,
                        cursor: 'move'
                      }}
                      draggable
                      onDragStart={() => handleColDragStart(idx)}
                      onDragOver={e => handleColDragOver(idx, e)}
                      onDrop={handleColDrop}
                      onDragEnd={() => {
                        setDragColIndex(null);
                        setDragOverColIndex(null);
                      }}
                    >
                      {/* Mép trái */}
                      {idx > 0 && supplierVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleSupplierMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && supplierVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleSupplierMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                )}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  {supplierColumns.map((col, idx) => {
                    if (!supplierVisibleCols.includes(col.key)) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {supplier.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
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
                      );
                    }
                    return <td key={col.key}>{supplier[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
