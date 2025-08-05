import React, { useState, useRef } from 'react';
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


  // --- CẤU HÌNH CỘT, DRAG, LƯU LOCALSTORAGE ---
  const UNIT_COLS_KEY = 'units_table_cols_v1';
  const unitColumns = [
    { key: 'code', label: 'Mã đơn vị' },
    { key: 'name', label: 'Tên đơn vị' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultUnitOrder = unitColumns.map(col => col.key);
  const defaultUnitVisible = unitColumns.map(col => col.key);
  const defaultUnitWidths = [100, 140, 180, 110, 110];
  // Lấy cấu hình cột từ localStorage nếu có
  const getInitialUnitCols = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(UNIT_COLS_KEY));
      if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
        return [saved.visibleCols, saved.order];
      }
    } catch {}
    return [defaultUnitVisible, defaultUnitOrder];
  };
  const [[initUnitVisible, initUnitOrder]] = [getInitialUnitCols()];
  const [unitVisibleCols, setUnitVisibleCols] = useState(initUnitVisible);
  const [unitColOrder, setUnitColOrder] = useState(initUnitOrder);
  const [unitColWidths, setUnitColWidths] = useState(defaultUnitWidths);
  const [showUnitColSetting, setShowUnitColSetting] = useState(false);
  const unitTableRef = useRef(null);
  const unitColSettingRef = useRef(null);
  // Drag state cho popup
  const [popupDragIndex, setPopupDragIndex] = useState(null);
  const [popupDragOverIndex, setPopupDragOverIndex] = useState(null);
  // Lưu cấu hình cột vào localStorage
  const saveUnitColConfig = (visibleCols, order) => {
    localStorage.setItem(UNIT_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveUnitColConfig(unitVisibleCols, unitColOrder);
  }, [unitVisibleCols, unitColOrder]);
  // Đóng popup khi click ra ngoài và tự động lưu
  React.useEffect(() => {
    if (!showUnitColSetting) return;
    const handleClick = (e) => {
      if (unitColSettingRef.current && !unitColSettingRef.current.contains(e.target)) {
        setShowUnitColSetting(false);
        saveUnitColConfig(unitVisibleCols, unitColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUnitColSetting, unitVisibleCols, unitColOrder]);
  // Drag & drop trong popup
  const handleColVisibleChange = (key, checked) => {
    if (checked) setUnitVisibleCols(cols => [...cols, key]);
    else setUnitVisibleCols(cols => cols.filter(k => k !== key));
  };
  const handleResetCols = () => {
    setUnitVisibleCols(defaultUnitVisible);
    setUnitColOrder(defaultUnitOrder);
    saveUnitColConfig(defaultUnitVisible, defaultUnitOrder);
  };

  // Kéo cột
  const handleUnitMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...unitColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setUnitColWidths((widths) => {
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
        <h1>Danh sách đơn vị tính</h1>
        <p>Quản lý các đơn vị tính sử dụng trong hệ thống</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowUnitColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showUnitColSetting && (
            <div
              ref={unitColSettingRef}
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
                  checked={
                    unitColumns.filter(col => !col.fixed).every(col => unitVisibleCols.includes(col.key)) &&
                    unitColumns.filter(col => !col.fixed).length === unitVisibleCols.filter(key => !unitColumns.find(col => col.key === key)?.fixed).length
                  }
                  onChange={e => {
                    const nonFixedCols = unitColumns.filter(col => !col.fixed).map(col => col.key);
                    if (e.target.checked) {
                      // Thêm các cột chưa cố định vào visible, giữ nguyên các cột cố định nếu đã có
                      const newVisible = Array.from(new Set([...unitVisibleCols, ...nonFixedCols, ...unitColumns.filter(col => col.fixed).map(col => col.key)]));
                      setUnitVisibleCols(newVisible);
                      setUnitColOrder([...nonFixedCols, ...unitColumns.filter(col => col.fixed).map(col => col.key)]);
                      saveUnitColConfig(newVisible, [...nonFixedCols, ...unitColumns.filter(col => col.fixed).map(col => col.key)]);
                    } else {
                      // Bỏ các cột chưa cố định khỏi visible, giữ lại cột cố định
                      const fixedCols = unitColumns.filter(col => col.fixed).map(col => col.key);
                      setUnitVisibleCols(fixedCols);
                      setUnitColOrder([...nonFixedCols, ...fixedCols]);
                      saveUnitColConfig(fixedCols, [...nonFixedCols, ...fixedCols]);
                    }
                  }}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={handleResetCols}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {unitColOrder.filter(key => !unitColumns.find(col => col.key === key)?.fixed).map((key, idx) => {
                const col = unitColumns.find(c => c.key === key);
                return (
                  <div
                    key={col.key}
                    style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: popupDragOverIndex === idx && popupDragIndex !== null ? '#e6f7ff' : undefined, opacity: popupDragIndex === idx ? 0.5 : 1, cursor: 'move', borderRadius: 4 }}
                    draggable
                    onDragStart={() => setPopupDragIndex(idx)}
                    onDragOver={e => { e.preventDefault(); setPopupDragOverIndex(idx); }}
                    onDrop={() => {
                      if (popupDragIndex === null || popupDragIndex === idx) { setPopupDragIndex(null); setPopupDragOverIndex(null); return; }
                      const cols = unitColOrder.filter(k => !unitColumns.find(col => col.key === k)?.fixed);
                      const dragged = cols[popupDragIndex];
                      cols.splice(popupDragIndex, 1);
                      cols.splice(idx, 0, dragged);
                      // Thêm lại các cột fixed cuối cùng
                      const newOrder = [...cols, ...unitColumns.filter(col => col.fixed).map(col => col.key)];
                      setUnitColOrder(newOrder);
                      setPopupDragIndex(null); setPopupDragOverIndex(null);
                    }}
                    onDragEnd={() => { setPopupDragIndex(null); setPopupDragOverIndex(null); }}
                  >
                    <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                    <input
                      type="checkbox"
                      checked={unitVisibleCols.includes(col.key)}
                      onChange={e => handleColVisibleChange(col.key, e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                    <span>{col.label}</span>
                  </div>
                );
              })}
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
          <table className="data-table" ref={unitTableRef}>
            <colgroup>
              {unitColOrder.map((key, i) => (
                unitVisibleCols.includes(key) ? <col key={key} style={{ width: unitColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {unitColOrder.map((key, idx, arr) => {
                  const col = unitColumns.find(c => c.key === key);
                  if (!col || !unitVisibleCols.includes(key)) return null;
                  return (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && unitVisibleCols.includes(arr[idx - 1]) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleUnitMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && unitVisibleCols.includes(arr[idx + 1]) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleUnitMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id}>
                  {unitColOrder.map((key, idx) => {
                    if (!unitVisibleCols.includes(key)) return null;
                    const col = unitColumns.find(c => c.key === key);
                    if (!col) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${unit.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {unit.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
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
                      );
                    }
                    return <td key={col.key}>{unit[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUnits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy đơn vị nào
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
