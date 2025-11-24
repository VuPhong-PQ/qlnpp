import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { ExcelButtons } from '../common/ExcelButtons.jsx';

const TransactionContents = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState([]);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();

  useEffect(() => {
    fetchTransactionContents();
  }, []);

  const fetchTransactionContents = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.transactionContents);
      setContents(data);
    } catch (error) {
      console.error('Error fetching transaction contents:', error);
      alert('Không thể tải dữ liệu nội dung giao dịch. Vui lòng kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  // Excel Import/Export
  const {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  } = useExcelImportExport({
    data: contents,
    loadData: fetchTransactionContents,
    apiPost: (data) => api.post(API_ENDPOINTS.transactionContents, data),
    columnMapping: {
      'Mã nội dung': 'code',
      'Tên nội dung': 'name',
      'Kiểu': 'type',
      'Tài khoản Nợ': 'debtAccount',
      'Tài khoản Có': 'creditAccount',
      'Ghi chú': 'note',
      'Trạng thái': 'status'
    },
    requiredFields: ['Mã nội dung', 'Tên nội dung'],
    filename: 'Danh_sach_noi_dung_giao_dich',
    sheetName: 'Nội dung GD',
    transformDataForExport: (item) => ({
      'Mã nội dung': item.code || '',
      'Tên nội dung': item.name || '',
      'Kiểu': item.type || '',
      'Tài khoản Nợ': item.debtAccount || '',
      'Tài khoản Có': item.creditAccount || '',
      'Ghi chú': item.note || '',
      'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
    }),
    transformDataForImport: (row) => ({
      code: row['Mã nội dung'],
      name: row['Tên nội dung'],
      type: row['Kiểu'] || '',
      debtAccount: row['Tài khoản Nợ'] || '',
      creditAccount: row['Tài khoản Có'] || '',
      note: row['Ghi chú'] || '',
      status: row['Trạng thái'] === 'Ngưng hoạt động' ? 'inactive' : 'active'
    }),
    onImportStart: () => setLoading(true),
    onImportComplete: () => setLoading(false)
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        await api.put(API_ENDPOINTS.transactionContents, editingItem.id, formData);
        alert('Cập nhật nội dung giao dịch thành công!');
      } else {
        await api.post(API_ENDPOINTS.transactionContents, formData);
        alert('Thêm nội dung giao dịch thành công!');
      }
      await fetchTransactionContents();
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction content:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nội dung giao dịch này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.transactionContents, id);
        alert('Xóa nội dung giao dịch thành công!');
        await fetchTransactionContents();
      } catch (error) {
        console.error('Error deleting transaction content:', error);
        alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredContents = applyFilters(contents, searchTerm, ['name', 'code', 'type', 'note']);

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


  // Cột và độ rộng mặc định
  const initialContentColumns = [
    { key: 'type', label: 'Loại nội dung' },
    { key: 'code', label: 'Mã nội dung' },
    { key: 'name', label: 'Tên nội dung' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultContentWidths = [120, 120, 180, 180, 110, 110];
  // LocalStorage keys
  const LS_KEY_COLS = 'transactionContentColumns';
  const LS_KEY_WIDTHS = 'transactionContentColWidths';
  const LS_KEY_VISIBLE = 'transactionContentVisibleCols';

  // Khôi phục từ localStorage
  const getInitialColumns = () => {
    const saved = localStorage.getItem(LS_KEY_COLS);
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // Đảm bảo luôn có cột fixed cuối cùng
        if (Array.isArray(arr) && arr.length === initialContentColumns.length) return arr;
      } catch {}
    }
    return initialContentColumns;
  };
  const getInitialWidths = () => {
    const saved = localStorage.getItem(LS_KEY_WIDTHS);
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === defaultContentWidths.length) return arr;
      } catch {}
    }
    return defaultContentWidths;
  };
  const getInitialVisible = (columns) => {
    const saved = localStorage.getItem(LS_KEY_VISIBLE);
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
    return columns.map(col => col.key);
  };

  const [contentColumns, setContentColumns] = useState(getInitialColumns());
  const [contentColWidths, setContentColWidths] = useState(getInitialWidths());
  const [contentVisibleCols, setContentVisibleCols] = useState(getInitialVisible(getInitialColumns()));
  const defaultContentVisible = initialContentColumns.map(col => col.key);
  const [showContentColSetting, setShowContentColSetting] = useState(false);
  const contentTableRef = useRef(null);
  const contentColSettingRef = useRef(null);

  // Drag state cho popup cài đặt
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragOverColIdx, setDragOverColIdx] = useState(null);

  // Kéo-thả cột trong popup cài đặt
  const handleSettingDragStart = (idx) => setDragColIdx(idx);
  const handleSettingDragOver = (idx, e) => {
    e.preventDefault();
    setDragOverColIdx(idx);
  };
  const handleSettingDrop = () => {
    if (
      dragColIdx !== null &&
      dragOverColIdx !== null &&
      dragColIdx !== dragOverColIdx
    ) {
      const newCols = [...contentColumns];
      const newWidths = [...contentColWidths];
      const [removedCol] = newCols.splice(dragColIdx, 1);
      newCols.splice(dragOverColIdx, 0, removedCol);
      const [removedWidth] = newWidths.splice(dragColIdx, 1);
      newWidths.splice(dragOverColIdx, 0, removedWidth);
      setContentColumns(newCols);
      setContentColWidths(newWidths);
      // Cập nhật lại visibleCols theo thứ tự mới
      const visibleKeys = newCols.map(col => col.key).filter(key => contentVisibleCols.includes(key));
      setContentVisibleCols(visibleKeys);
      // Lưu vào localStorage
      localStorage.setItem(LS_KEY_COLS, JSON.stringify(newCols));
      localStorage.setItem(LS_KEY_WIDTHS, JSON.stringify(newWidths));
      localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(visibleKeys));
    }
    setDragColIdx(null);
    setDragOverColIdx(null);
  };

  // Lưu thứ tự cột, độ rộng, cột hiển thị khi đóng popup
  React.useEffect(() => {
    if (!showContentColSetting) return;
    const handleClickOutside = (e) => {
      if (contentColSettingRef.current && !contentColSettingRef.current.contains(e.target)) {
        setShowContentColSetting(false);
        // Lưu vào localStorage
        localStorage.setItem(LS_KEY_COLS, JSON.stringify(contentColumns));
        localStorage.setItem(LS_KEY_WIDTHS, JSON.stringify(contentColWidths));
        localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(contentVisibleCols));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContentColSetting, contentColumns, contentColWidths, contentVisibleCols]);

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    if (!showContentColSetting) return;
    const handleClickOutside = (e) => {
      if (contentColSettingRef.current && !contentColSettingRef.current.contains(e.target)) {
        setShowContentColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContentColSetting]);

  // Kéo cột
  const handleContentMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...contentColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setContentColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right' && index < widths.length - 1) {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
          newWidths[index + 1] = Math.max(50, startWidths[index + 1] - delta);
        } else if (edge === 'left' && index > 0) {
          newWidths[index] = Math.max(50, startWidths[index] - delta);
          newWidths[index - 1] = Math.max(50, startWidths[index - 1] + delta);
        }
        // Lưu width vào localStorage
        localStorage.setItem(LS_KEY_WIDTHS, JSON.stringify(newWidths));
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
        <h1>Nội dung thu, chi, xuất, nhập</h1>
        <p>Quản lý danh mục nội dung các giao dịch tài chính và kho</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
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
            <ExcelButtons 
              onExport={handleExportExcel}
              onImport={handleImportExcel}
              onFileChange={handleFileChange}
              fileInputRef={fileInputRef}
              disabled={loading}
            />
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowContentColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showContentColSetting && (
            <div
              ref={contentColSettingRef}
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
                  checked={contentVisibleCols.length === contentColumns.length}
                  onChange={e => {
                    const newVisible = e.target.checked ? defaultContentVisible : [];
                    setContentVisibleCols(newVisible);
                    localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(newVisible));
                  }}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => {
                    setContentColumns(initialContentColumns);
                    setContentColWidths(defaultContentWidths);
                    setContentVisibleCols(defaultContentVisible);
                    localStorage.setItem(LS_KEY_COLS, JSON.stringify(initialContentColumns));
                    localStorage.setItem(LS_KEY_WIDTHS, JSON.stringify(defaultContentWidths));
                    localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(defaultContentVisible));
                  }}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {contentColumns.filter(col => !col.fixed).map((col, idx) => (
                <div
                  key={col.key}
                  style={{ display: 'flex', alignItems: 'center', marginBottom: 2, opacity: dragColIdx === idx ? 0.5 : 1, background: dragOverColIdx === idx && dragColIdx !== null ? '#e6f7ff' : undefined }}
                  draggable
                  onDragStart={() => handleSettingDragStart(idx)}
                  onDragOver={e => handleSettingDragOver(idx, e)}
                  onDrop={handleSettingDrop}
                  onDragEnd={() => { setDragColIdx(null); setDragOverColIdx(null); }}
                >
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={contentVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) {
                        const newVisible = [...contentVisibleCols, col.key];
                        setContentVisibleCols(newVisible);
                        localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(newVisible));
                      } else {
                        const newVisible = contentVisibleCols.filter(k => k !== col.key);
                        setContentVisibleCols(newVisible);
                        localStorage.setItem(LS_KEY_VISIBLE, JSON.stringify(newVisible));
                      }
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
          <table className="data-table" ref={contentTableRef}>
            <colgroup>
              {contentColWidths.map((w, i) => (
                contentVisibleCols.includes(contentColumns[i].key) ? <col key={i} style={{ width: w }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {contentColumns.map((col, idx, arr) => (
                  contentVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && contentVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleContentMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span>{col.label}</span>
                        {col.key !== 'actions' && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFilterPopup(showFilterPopup === col.key ? null : col.key);
                            }}
                            style={{ 
                              cursor: 'pointer', 
                              fontSize: '14px', 
                              opacity: columnFilters[col.key] ? 1 : 0.5,
                              color: columnFilters[col.key] ? '#1890ff' : 'inherit'
                            }}
                          >
                            🔍
                          </span>
                        )}
                      </div>
                      {col.key !== 'actions' && renderFilterPopup(col.key, col.label)}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && contentVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleContentMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContents.map((content) => (
                <tr key={content.id}>
                  {contentColumns.map((col, idx) => {
                    if (!contentVisibleCols.includes(col.key)) return null;
                    if (col.key === 'type') {
                      return (
                        <td key={col.key}>
                          <span style={{ color: getTypeColor(content.type), fontWeight: 500 }}>{content.type}</span>
                        </td>
                      );
                    }
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${content.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {content.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
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
                      );
                    }
                    return <td key={col.key}>{content[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>


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
