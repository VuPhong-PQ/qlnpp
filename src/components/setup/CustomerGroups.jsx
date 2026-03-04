import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import './CustomerGroups.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import { exportToExcelWithHeader, importFromExcel } from '../../utils/excelUtils';
import { Pagination } from '../common/Pagination';

// Hàm xóa dấu tiếng Việt để tìm kiếm
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const CustomerGroups = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, showFilterPopup, columnFilters } = useColumnFilter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Column Settings Modal
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [settingsDragItem, setSettingsDragItem] = useState(null);
  
  // Search input ref
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchCustomerGroups();
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.companyInfos);
      if (data && data.length > 0) {
        setCompanyInfo({
          name: data[0].companyName || '',
          address: data[0].address || '',
          phone: data[0].phone || ''
        });
      }
    } catch (error) {
        // error fetching company info
    }
  };

  const fetchCustomerGroups = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.customerGroups);
      setCustomerGroups(data);
    } catch (error) {
        // error fetching customer groups
      alert('Không thể tải dữ liệu nhóm khách hàng. Vui lòng kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  // Excel Import/Export
  const fileInputRef = useRef(null);

  const handleExportExcel = () => {
    if (customerGroups.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const excelData = customerGroups.map(item => ({
      'Người tạo': '',
      'Thời gian tạo': '',
      'Người sửa': '',
      'Thời gian sửa': '',
      'Id': item.id || '',
      'Mã': item.code || '',
      'Tên': item.name || '',
      'Lịch bán hàng/Vùng hoạt động': item.salesSchedule || '',
      'Ghi chú': item.note || '',
      'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
    }));

    exportToExcelWithHeader(
      excelData,
      'Danh_sach_nhom_khach_hang',
      'DANH SÁCH NHÓM KH',
      companyInfo
    );
  };

  const handleImportExcel = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Import with skipRows=7 to skip company header and title
      importFromExcel(file, async (jsonData) => {
        // imported data received (debug logs removed)
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const row of jsonData) {
          try {
            const newItem = {
              code: row['Mã']?.toString().trim() || '',
              name: row['Tên']?.toString().trim() || '',
              salesSchedule: row['Lịch bán hàng/Vùng hoạt động']?.toString().trim() || '',
              note: row['Ghi chú']?.toString().trim() || '',
              status: row['Trạng thái']?.toString().toLowerCase().includes('ngưng') ? 'inactive' : 'active'
            };

            if (!newItem.code || !newItem.name) {
              errors.push(`Dòng thiếu mã hoặc tên: ${JSON.stringify(row)}`);
              errorCount++;
              continue;
            }

            await api.post(API_ENDPOINTS.customerGroups, newItem);
            successCount++;
          } catch (error) {
            // error importing row
            errors.push(`Lỗi: ${error.message}`);
            errorCount++;
          }
        }

        await fetchCustomerGroups();
        
        let message = `Import hoàn tất!\n- Thành công: ${successCount}\n- Lỗi: ${errorCount}`;
        if (errors.length > 0) {
          message += `\n\nChi tiết lỗi:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... và ${errors.length - 5} lỗi khác`;
          }
        }
        alert(message);
      }, 7); // Skip 7 rows (company info + title + headers)
      
    } catch (error) {
      // error importing file
      alert('Lỗi khi import file: ' + error.message);
    } finally {
      setLoading(false);
      e.target.value = '';
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
      // error saving customer group
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
        // error deleting customer group
        alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter with Vietnamese tone removal
  const filteredGroups = customerGroups.filter(group => {
    if (!searchTerm.trim()) return true;
    const search = removeVietnameseTones(searchTerm);
    return (
      removeVietnameseTones(group.name || '').includes(search) ||
      removeVietnameseTones(group.code || '').includes(search) ||
      removeVietnameseTones(group.salesSchedule || '').includes(search) ||
      removeVietnameseTones(group.note || '').includes(search)
    );
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  const handleExport = () => {
    // Logic export to Excel
    alert('Chức năng export Excel đang được phát triển');
  };

  const handleImport = () => {
    // Logic import from Excel
    alert('Chức năng import Excel đang được phát triển');
  };
  
  // Focus search input when opened
  useEffect(() => {
    if (showSearchBox && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBox]);

  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng nhóm khách hàng ---
  const groupTableRef = useRef(null);
  const COLUMN_SETTINGS_KEY = 'customerGroupsColumnSettings';
  
  const defaultColumns = [
    { id: 'code', label: 'Mã nhóm', width: 100, visible: true },
    { id: 'name', label: 'Tên nhóm', width: 140, visible: true },
    { id: 'salesSchedule', label: 'Lịch bán hàng', width: 140, visible: true },
    { id: 'note', label: 'Ghi chú', width: 180, visible: true },
    { id: 'status', label: 'Trạng thái', width: 110, visible: true },
    { id: 'actions', label: 'Thao tác', width: 110, visible: true }
  ];
  
  const loadColumnSettings = () => {
    try {
      const s = localStorage.getItem(COLUMN_SETTINGS_KEY);
      if (!s) return null;
      return JSON.parse(s);
    } catch (error) {
      return null;
    }
  };

  const saveColumnSettings = (cols) => {
    try {
      localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(cols));
    } catch (error) {
      // error saving column settings
    }
  };

  const [columns, setColumns] = useState(() => {
    const saved = loadColumnSettings();
    return saved || defaultColumns;
  });
  
  // Column header drag / resize
  const [dragColumn, setDragColumn] = useState(null);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  useEffect(() => {
    saveColumnSettings(columns);
  }, [columns]);

  const toggleColumnVisibility = (id) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const resetColumns = () => {
    setColumns(defaultColumns);
  };

  const handleSettingsDragStart = (e, index) => {
    setSettingsDragItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSettingsDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSettingsDrop = (e, index) => {
    e.preventDefault();
    if (settingsDragItem === null || settingsDragItem === index) return;
    setColumns(prev => {
      const arr = [...prev];
      const item = arr.splice(settingsDragItem, 1)[0];
      arr.splice(index, 0, item);
      return arr;
    });
    setSettingsDragItem(null);
  };

  const handleSettingsDragEnd = () => {
    setSettingsDragItem(null);
  };

  // Column reorder handlers
  const handleColumnDragStart = (e, id) => {
    setDragColumn(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, id) => {
    e.preventDefault();
    if (!dragColumn || dragColumn === id) return;
    setColumns(prev => {
      const arr = [...prev];
      const from = arr.findIndex(c => c.id === dragColumn);
      const to = arr.findIndex(c => c.id === id);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setDragColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDragColumn(null);
  };

  // Column resize handlers
  const handleResizeStart = (e, id) => {
    e.preventDefault();
    const col = columns.find(c => c.id === id);
    const initialX = e.clientX;
    const initialWidth = col ? col.width : 120;
    
    const onMouseMove = (ev) => {
      const dx = ev.clientX - initialX;
      setColumns(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(60, initialWidth + dx) } : c));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Legacy variables for compatibility
  const groupColumns = columns;
  const groupVisibleCols = columns.filter(c => c.visible).map(c => c.id);
  const groupColWidths = columns.map(c => c.width);
  
  const setGroupVisibleCols = (newCols) => {
    if (typeof newCols === 'function') {
      setColumns(prev => {
        const currentVisible = prev.filter(c => c.visible).map(c => c.id);
        const updated = newCols(currentVisible);
        return prev.map(c => ({ ...c, visible: updated.includes(c.id) }));
      });
    } else {
      setColumns(prev => prev.map(c => ({ ...c, visible: newCols.includes(c.id) })));
    }
  };

  return (
    <div className="setup-page customer-groups-page">
      {/* Search Panel - PrintOrder style header */}
      <div className="search-panel">
        <div className="search-header">
          <h1>Nhóm khách hàng</h1>
          <div className="header-search-wrapper">
            {showSearchBox ? (
              <div className="header-search-input-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã nhóm, lịch bán hàng..."
                  className="header-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearchBox(false);
                      setSearchTerm('');
                    }
                  }}
                />
                <button 
                  className="header-search-close"
                  onClick={() => {
                    setShowSearchBox(false);
                    setSearchTerm('');
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button 
                className="header-search-btn"
                onClick={() => setShowSearchBox(true)}
                title="Tìm kiếm"
              >
                🔍
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Header - PrintOrder style */}
      <div className="action-header">
        <div className="total-info">
          Tổng {filteredGroups.length} nhóm khách hàng
        </div>
        <div className="action-buttons">
          <button 
            className="action-btn btn-add"
            onClick={() => {
              resetForm();
              setShowModal(true);
              setEditingItem(null);
            }}
            title="Thêm nhóm"
          >
            ➕
          </button>
          <button 
            className="action-btn btn-export" 
            onClick={handleExportExcel}
            disabled={loading}
            title="Xuất Excel"
          >
            📊
          </button>
          <button 
            className="action-btn btn-import" 
            onClick={handleImportExcel}
            disabled={loading}
            title="Import Excel"
          >
            📥
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
          <button 
            className="action-btn btn-refresh"
            onClick={fetchCustomerGroups}
            title="Làm mới"
          >
            🔄
          </button>
          <button 
            className="action-btn btn-settings" 
            title="Cài đặt cột" 
            onClick={() => setShowColumnSettings(true)}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <table className="data-table" ref={groupTableRef}>
            <thead>
              <tr>
                {columns.filter(c => c.visible).map(col => (
                  <th 
                    key={col.id}
                    style={{ 
                      width: col.width + 'px', 
                      minWidth: col.width + 'px', 
                      position: 'relative', 
                      cursor: dragColumn === col.id ? 'grabbing' : (col.id !== 'actions' ? 'grab' : 'default') 
                    }}
                    draggable={col.id !== 'actions'}
                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => handleColumnDrop(e, col.id)}
                    onDragEnd={handleColumnDragEnd}
                    className={dragColumn === col.id ? 'dragging' : ''}
                  >
                    <div className="th-content">
                      <span>{col.label}</span>
                      {col.id !== 'actions' && (
                        <button 
                          className="col-search-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFilterPopup(showFilterPopup === col.id ? null : col.id);
                          }} 
                          title={`Tìm kiếm theo ${col.label}`}
                        >
                          🔍
                        </button>
                      )}
                    </div>
                    {col.id !== 'actions' && renderFilterPopup(col.id, col.label)}
                    {col.id !== 'actions' && (
                      <div 
                        className="resize-handle" 
                        onMouseDown={(e) => handleResizeStart(e, col.id)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length} className="no-data">
                    Không tìm thấy nhóm khách hàng nào
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => (
                  <tr key={group.id}>
                    {columns.filter(c => c.visible).map(col => {
                      if (col.id === 'status') {
                        return (
                          <td key={col.id}>
                            <span className={`status-badge ${group.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                              {group.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                            </span>
                          </td>
                        );
                      }
                      if (col.id === 'actions') {
                        return (
                          <td key={col.id}>
                            <div className="table-actions">
                              <button 
                                className="action-btn btn-edit"
                                onClick={() => handleEdit(group)}
                                title="Sửa"
                              >
                                ✏️
                              </button>
                              <button 
                                className="action-btn btn-delete"
                                onClick={() => handleDelete(group.id)}
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        );
                      }
                      return <td key={col.id}>{group[col.id] || '-'}</td>;
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredGroups.length > 0 && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={filteredGroups.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      )}

      {/* Column Settings Modal - PrintOrder style */}
      {showColumnSettings && (
        <div className="search-modal-overlay" onClick={() => setShowColumnSettings(false)}>
          <div className="column-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3 className="search-modal-title">⚙️ Cài đặt hiển thị cột</h3>
              <button className="search-modal-close" onClick={() => setShowColumnSettings(false)}>×</button>
            </div>

            <div className="column-settings-body">
              <div className="column-settings-actions">
                <button 
                  className="reset-columns-btn"
                  onClick={resetColumns}
                  title="Khôi phục cài đặt mặc định"
                >
                  🔄 Reset về mặc định
                </button>
                <div className="column-count">
                  Hiển thị {columns.filter(col => col.visible).length}/{columns.length} cột
                </div>
              </div>
              
              <div className="column-settings-list">
                <div className="column-settings-help">
                  💡 Kéo thả để sắp xếp, tick/untick để ẩn/hiện cột
                </div>
                
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className={`column-settings-item ${settingsDragItem === index ? 'dragging' : ''}`}
                    draggable={true}
                    onDragStart={(e) => handleSettingsDragStart(e, index)}
                    onDragOver={handleSettingsDragOver}
                    onDrop={(e) => handleSettingsDrop(e, index)}
                    onDragEnd={handleSettingsDragEnd}
                  >
                    <div className="column-drag-handle" title="Kéo để sắp xếp">
                      ⋮⋮
                    </div>
                    
                    <label className="column-checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumnVisibility(column.id)}
                        className="column-checkbox"
                      />
                      <span className="column-name">{column.label}</span>
                    </label>
                    
                    <div className="column-info">
                      <span className="column-width" title="Độ rộng hiện tại">
                        {column.width}px
                      </span>
                      {!column.visible && (
                        <span className="column-hidden-badge">Ẩn</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="column-settings-footer">
                <button 
                  className="apply-settings-btn"
                  onClick={() => setShowColumnSettings(false)}
                >
                  ✓ Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
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
