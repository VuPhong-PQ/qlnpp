import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';

const Vehicles = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();

  const [vehicles, setVehicles] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load vehicles from API
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.vehicles);
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      alert('Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    code: '',
    licensePlate: '',
    name: '',
    loadCapacity: 0,
    volume: 0,
    purchaseYear: new Date().getFullYear(),
    purchasePrice: 0,
    depreciationMonths: 0,
    depreciationValue: 0,
    note: '',
    status: 'Hoạt động'
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
        await api.put(API_ENDPOINTS.vehicles, editingItem.id, formData);
      } else {
        await api.post(API_ENDPOINTS.vehicles, formData);
      }
      await loadVehicles();
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Không thể lưu xe');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      licensePlate: '',
      name: '',
      loadCapacity: 0,
      volume: 0,
      purchaseYear: new Date().getFullYear(),
      purchasePrice: 0,
      depreciationMonths: 0,
      depreciationValue: 0,
      note: '',
      status: 'Hoạt động'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.vehicles, id);
        await loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Không thể xóa xe');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredVehicles = applyFilters(vehicles, searchTerm, ['code', 'licensePlate', 'name']);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng xe ---
  const vehicleTableRef = useRef(null);
  const defaultVehicleColumns = [
    { key: 'code', label: 'Mã xe' },
    { key: 'licensePlate', label: 'Biển số' },
    { key: 'name', label: 'Tên xe' },
    { key: 'loadCapacity', label: 'Trọng tải' },
    { key: 'volume', label: 'Số khối' },
    { key: 'purchaseYear', label: 'Năm mua' },
    { key: 'purchasePrice', label: 'Trị giá' },
    { key: 'depreciationMonths', label: 'Số tháng khấu hao' },
    { key: 'depreciationValue', label: 'Trị giá khấu hao' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultVehicleWidths = [100, 120, 200, 100, 100, 100, 130, 150, 150, 200, 110, 150];
  
  const [vehicleColumns, setVehicleColumns] = useState(() => {
    const saved = localStorage.getItem('vehicleColumns');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        const mergedColumns = [...defaultVehicleColumns];
        arr.forEach(savedCol => {
          const index = mergedColumns.findIndex(c => c.key === savedCol.key);
          if (index !== -1) {
            mergedColumns[index] = { ...mergedColumns[index], ...savedCol };
          }
        });
        return mergedColumns;
      } catch {
        return defaultVehicleColumns;
      }
    }
    return defaultVehicleColumns;
  });

  const [vehicleColWidths, setVehicleColWidths] = useState(() => {
    const saved = localStorage.getItem('vehicleColWidths');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          if (arr.length === defaultVehicleWidths.length) {
            return arr;
          } else if (arr.length < defaultVehicleWidths.length) {
            return [...arr, ...defaultVehicleWidths.slice(arr.length)];
          }
        }
      } catch {}
    }
    return defaultVehicleWidths;
  });

  const defaultVehicleVisible = defaultVehicleColumns.map(col => col.key);
  const [vehicleVisibleCols, setVehicleVisibleCols] = useState(() => {
    const saved = localStorage.getItem('vehicleVisibleCols');
    if (saved) {
      try {
        const savedCols = JSON.parse(saved);
        const allKeys = defaultVehicleColumns.map(c => c.key);
        const newKeys = allKeys.filter(k => !savedCols.includes(k) && k !== 'actions');
        return [...savedCols, ...newKeys];
      } catch {}
    }
    return defaultVehicleVisible;
  });

  const [showVehicleColSetting, setShowVehicleColSetting] = useState(false);
  const vehicleColSettingRef = useRef(null);
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => {
    localStorage.setItem('vehicleColumns', JSON.stringify(vehicleColumns));
  }, [vehicleColumns]);

  useEffect(() => {
    localStorage.setItem('vehicleColWidths', JSON.stringify(vehicleColWidths));
  }, [vehicleColWidths]);

  useEffect(() => {
    localStorage.setItem('vehicleVisibleCols', JSON.stringify(vehicleVisibleCols));
  }, [vehicleVisibleCols]);

  useEffect(() => {
    if (!showVehicleColSetting) return;
    const handleClickOutside = (e) => {
      if (vehicleColSettingRef.current && !vehicleColSettingRef.current.contains(e.target)) {
        setShowVehicleColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVehicleColSetting]);

  const handleVehicleMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...vehicleColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setVehicleColWidths((widths) => {
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
        <h1>DANH SÁCH XE</h1>
        <p>Quản lý danh sách xe</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Tổng {vehicles.length}</span>
          </div>
          <div className="table-actions">
            <button 
              className="btn"
              style={{ background: '#2196F3', color: 'white' }}
              onClick={() => {
                resetForm();
                setShowModal(true);
                setEditingItem(null);
              }}
            >
              <span style={{ fontSize: '18px', marginRight: '5px' }}>📄</span>
            </button>
            <button className="btn" style={{ background: '#4CAF50', color: 'white' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
            </button>
            <button className="btn" style={{ background: '#9C27B0', color: 'white' }}>
              <span style={{ fontSize: '18px' }}>🔄</span>
            </button>
            <button className="btn" style={{ background: '#E91E63', color: 'white' }}>
              <span style={{ fontSize: '18px' }}>📥</span>
            </button>
            <button
              className="btn"
              style={{ background: '#9E9E9E', color: 'white' }}
              onClick={() => setShowVehicleColSetting(v => !v)}
            >
              <span style={{ fontSize: '18px' }}>⚙️</span>
            </button>
          </div>

          {showVehicleColSetting && (
            <div
              ref={vehicleColSettingRef}
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
                  checked={vehicleVisibleCols.length === vehicleColumns.length}
                  onChange={e => setVehicleVisibleCols(e.target.checked ? defaultVehicleVisible : [])}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => {
                    setVehicleVisibleCols(defaultVehicleVisible);
                    setVehicleColumns(defaultVehicleColumns);
                    setVehicleColWidths(defaultVehicleWidths);
                  }}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {vehicleColumns.filter(col => !col.fixed).map((col, idx) => (
                <div
                  key={col.key}
                  style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: dragOverIdx === idx ? '#f0f7ff' : undefined }}
                  draggable
                  onDragStart={() => setDragColIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={() => {
                    if (dragColIdx === null || dragColIdx === idx) return;
                    const newCols = [...vehicleColumns];
                    const [moved] = newCols.splice(dragColIdx, 1);
                    newCols.splice(idx, 0, moved);
                    setVehicleColumns(newCols);
                    const newWidths = [...vehicleColWidths];
                    const [w] = newWidths.splice(dragColIdx, 1);
                    newWidths.splice(idx, 0, w);
                    setVehicleColWidths(newWidths);
                    setDragColIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragColIdx(null); setDragOverIdx(null); }}
                >
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={vehicleVisibleCols.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) setVehicleVisibleCols(cols => [...cols, col.key]);
                      else setVehicleVisibleCols(cols => cols.filter(k => k !== col.key));
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

        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className="data-table" ref={vehicleTableRef} style={{ minWidth: '1500px' }}>
            <colgroup>
              {vehicleColumns.map((col, i) => (
                vehicleVisibleCols.includes(col.key) ? <col key={col.key} style={{ width: vehicleColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {vehicleColumns.map((col, idx, arr) => (
                  vehicleVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {idx > 0 && vehicleVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleVehicleMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {col.key !== 'actions' && (
                        <span
                          onClick={() => setShowFilterPopup(col.key)}
                          style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '14px' }}
                        >
                          🔍
                        </span>
                      )}
                      {renderFilterPopup(col.key, col.label, false)}
                      {idx < arr.length - 1 && vehicleVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleVehicleMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  {vehicleColumns.map((col) => {
                    if (!vehicleVisibleCols.includes(col.key)) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span style={{ 
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: vehicle.status === 'Hoạt động' ? '#4CAF50' : '#f44336',
                            color: 'white',
                            fontSize: '12px'
                          }}>
                            ⊙
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'purchasePrice' || col.key === 'depreciationValue') {
                      return <td key={col.key}>{formatCurrency(vehicle[col.key] || 0)}</td>;
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              style={{ 
                                padding: '6px 12px',
                                background: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '5px'
                              }}
                              onClick={() => handleEdit(vehicle)}
                            >
                              ✏️
                            </button>
                            <button 
                              style={{ 
                                padding: '6px 12px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleDelete(vehicle.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{vehicle[col.key] || ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy xe nào
          </div>
        )}

        {filteredVehicles.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px' }}>
            <div style={{ color: '#666' }}>
              Dòng {startIndex + 1}-{Math.min(endIndex, filteredVehicles.length)} trên tổng {filteredVehicles.length} dòng
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{ 
                  padding: '6px 12px', 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
                  opacity: currentPage === 1 ? 0.5 : 1,
                  border: '1px solid #ddd',
                  background: 'white'
                }}
              >
                ◀◀
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ 
                  padding: '6px 12px', 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
                  opacity: currentPage === 1 ? 0.5 : 1,
                  border: '1px solid #ddd',
                  background: 'white'
                }}
              >
                ◀
              </button>
              <span style={{ padding: '6px 12px', border: '1px solid #ddd', background: '#f5f5f5' }}>
                {currentPage}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ 
                  padding: '6px 12px', 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  border: '1px solid #ddd',
                  background: 'white'
                }}
              >
                ▶
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{ 
                  padding: '6px 12px', 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  border: '1px solid #ddd',
                  background: 'white'
                }}
              >
                ▶▶
              </button>
              <select 
                value={itemsPerPage}
                style={{ padding: '6px', border: '1px solid #ddd' }}
              >
                <option value="10">10 / trang</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} xe</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Mã xe <span className="required">*</span></label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Biển số <span className="required">*</span></label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Tên xe <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Trọng tải (tấn)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="loadCapacity"
                      value={formData.loadCapacity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số khối (m³)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Năm mua</label>
                    <input
                      type="number"
                      name="purchaseYear"
                      value={formData.purchaseYear}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trị giá</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Số tháng khấu hao</label>
                    <input
                      type="number"
                      name="depreciationMonths"
                      value={formData.depreciationMonths}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trị giá khấu hao</label>
                    <input
                      type="number"
                      name="depreciationValue"
                      value={formData.depreciationValue}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status === 'Hoạt động'}
                      onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Hoạt động' : 'Ngưng hoạt động'})}
                    />
                    Ngưng hoạt động
                  </label>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '100px' }}>
                  Lưu lại
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-danger" style={{ minWidth: '100px' }}>
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
