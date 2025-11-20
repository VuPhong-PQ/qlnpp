import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';

const CustomerGroups = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerGroups, setCustomerGroups] = useState([]);

  useEffect(() => {
    fetchCustomerGroups();
  }, []);

  const fetchCustomerGroups = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.customerGroups);
      setCustomerGroups(data);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      alert('Không thể tải dữ liệu nhóm khách hàng. Vui lòng kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        await api.put(API_ENDPOINTS.customerGroups, editingItem.id, formData);
        alert('Cập nhật nhóm khách hàng thành công!');
      } else {
        await api.post(API_ENDPOINTS.customerGroups, formData);
        alert('Thêm nhóm khách hàng thành công!');
      }
      await fetchCustomerGroups();
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving customer group:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhóm khách hàng này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.customerGroups, id);
        alert('Xóa nhóm khách hàng thành công!');
        await fetchCustomerGroups();
      } catch (error) {
        console.error('Error deleting customer group:', error);
        alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
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



  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng nhóm khách hàng ---
  const groupTableRef = useRef(null);
  const defaultGroupColumns = [
    { key: 'code', label: 'Mã nhóm' },
    { key: 'name', label: 'Tên nhóm' },
    { key: 'salesSchedule', label: 'Lịch bán hàng' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultGroupWidths = [100, 140, 140, 180, 110, 110];
  const [groupColumns, setGroupColumns] = useState(() => {
    const saved = localStorage.getItem('groupColumns');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        return arr.map(col => {
          const def = defaultGroupColumns.find(d => d.key === col.key);
          return def ? { ...def, ...col } : col;
        });
      } catch {
        return defaultGroupColumns;
      }
    }
    return defaultGroupColumns;
  });
  const [groupColWidths, setGroupColWidths] = useState(() => {
    const saved = localStorage.getItem('groupColWidths');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === defaultGroupWidths.length) return arr;
      } catch {}
    }
    return defaultGroupWidths;
  });
  const defaultGroupVisible = defaultGroupColumns.map(col => col.key);
  const [groupVisibleCols, setGroupVisibleCols] = useState(() => {
    const saved = localStorage.getItem('groupVisibleCols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return defaultGroupVisible;
  });
  const [showGroupColSetting, setShowGroupColSetting] = useState(false);
  const groupColSettingRef = useRef(null);
  // Drag state
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Lưu cấu hình cột vào localStorage
  useEffect(() => {
    localStorage.setItem('groupColumns', JSON.stringify(groupColumns));
  }, [groupColumns]);
  useEffect(() => {
    localStorage.setItem('groupColWidths', JSON.stringify(groupColWidths));
  }, [groupColWidths]);
  useEffect(() => {
    localStorage.setItem('groupVisibleCols', JSON.stringify(groupVisibleCols));
  }, [groupVisibleCols]);

  // Đóng popup + tự động lưu khi click ra ngoài cho popup cài đặt cột nhóm khách hàng
  useEffect(() => {
    if (!showGroupColSetting) return;
    const handleClickOutside = (e) => {
      if (groupColSettingRef.current && !groupColSettingRef.current.contains(e.target)) {
        setShowGroupColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGroupColSetting]);

  // Kéo cột
  const handleGroupMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...groupColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setGroupColWidths((widths) => {
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
        <h1>Nhóm khách hàng</h1>
        <p>Quản lý danh sách nhóm khách hàng</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowGroupColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showGroupColSetting && (
            <div
              ref={groupColSettingRef}
              style={{
                position: 'fixed',
                top: '80px',
                right: '40px',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                zIndex: 9999,
                minWidth: 220,
                padding: 14
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={groupVisibleCols.length === groupColumns.length}
                  onChange={e => setGroupVisibleCols(e.target.checked ? defaultGroupVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => {
                    setGroupVisibleCols(defaultGroupVisible);
                    setGroupColumns(defaultGroupColumns);
                    setGroupColWidths(defaultGroupWidths);
                  }}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {groupColumns.filter(col => !col.fixed).map((col, idx) => (
                <div
                  key={col.key}
                  style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: dragOverIdx === idx ? '#f0f7ff' : undefined }}
                  draggable
                  onDragStart={() => setDragColIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={() => {
                    if (dragColIdx === null || dragColIdx === idx) return;
                    const newCols = [...groupColumns];
                    const [moved] = newCols.splice(dragColIdx, 1);
                    newCols.splice(idx, 0, moved);
                    setGroupColumns(newCols);
                    // Cập nhật width theo thứ tự mới
                    const newWidths = [...groupColWidths];
                    const [w] = newWidths.splice(dragColIdx, 1);
                    newWidths.splice(idx, 0, w);
                    setGroupColWidths(newWidths);
                    setDragColIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragColIdx(null); setDragOverIdx(null); }}
                >
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={groupVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setGroupVisibleCols(cols => [...cols, col.key]);
                      else setGroupVisibleCols(cols => cols.filter(k => k !== col.key));
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

        <table className="data-table" ref={groupTableRef}>
          <colgroup>
            {groupColumns.map((col, i) => (
              groupVisibleCols.includes(col.key) ? <col key={col.key} style={{ width: groupColWidths[i] }} /> : null
            ))}
          </colgroup>
          <thead>
            <tr>
              {groupColumns.map((col, idx, arr) => (
                groupVisibleCols.includes(col.key) ? (
                  <th key={col.key} style={{ position: 'relative' }}>
                    {/* Mép trái */}
                    {idx > 0 && groupVisibleCols.includes(arr[idx - 1].key) && (
                      <span
                        className="col-resizer left"
                        onMouseDown={e => handleGroupMouseDown(idx, e, 'left')}
                        style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                      />
                    )}
                    {col.label}
                    {/* Mép phải */}
                    {idx < arr.length - 1 && groupVisibleCols.includes(arr[idx + 1].key) && (
                      <span
                        className="col-resizer right"
                        onMouseDown={e => handleGroupMouseDown(idx, e, 'right')}
                        style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                      />
                    )}
                  </th>
                ) : null
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <tr key={group.id}>
                {groupColumns.map((col, idx) => {
                  if (!groupVisibleCols.includes(col.key)) return null;
                  if (col.key === 'status') {
                    return (
                      <td key={col.key}>
                        <span className={`status-badge ${group.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                          {group.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
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
                    );
                  }
                  return <td key={col.key}>{group[col.key]}</td>;
                })}
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
