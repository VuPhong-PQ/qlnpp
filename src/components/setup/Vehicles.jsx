import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import { Pagination } from '../common/Pagination';

const Vehicles = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();

  const [vehicles, setVehicles] = useState([]);
  const vehicleImportRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state for STT checkboxes (moved up so it's available before use)
  const [selectedIds, setSelectedIds] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

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

  const handleRowContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, item: null });

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

  const handleImport = () => {
    if (vehicleImportRef.current) vehicleImportRef.current.click();
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.vehicles}/export`, { method: 'GET' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vehicles.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Xuất Excel thất bại');
    }
  };

  const toggleSelectAll = () => {
    const currentBase = applyFilters(vehicles, searchTerm, ['code', 'licensePlate', 'name']);
    if (selectedIds.length > 0 && selectedIds.length === currentBase.length) {
      setSelectedIds([]);
      setShowOnlySelected(false);
    } else {
      const ids = currentBase.map(v => v.id);
      setSelectedIds(ids);
      setShowOnlySelected(true);
    }
  };

  const baseFilteredVehicles = applyFilters(vehicles, searchTerm, ['code', 'licensePlate', 'name']);
  const filteredVehicles = showOnlySelected
    ? baseFilteredVehicles.filter(v => selectedIds.includes(v.id))
    : baseFilteredVehicles;

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

  // Styles for status buttons in modal
  const statusBtnActive = {
    padding: '8px 14px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: '#4CAF50',
    color: 'white',
    fontWeight: 600
  };
  const statusBtnInactive = {
    padding: '8px 14px',
    borderRadius: 6,
    border: '1px solid #ddd',
    cursor: 'pointer',
    background: '#fff',
    color: '#333'
  };

  // Persist status change to backend with rollback on failure
  const persistStatusChange = async (vehicleId, updatedFields, prevVehicles) => {
    try {
      // Build payload for PUT: need full vehicle object. Try to find current vehicle data.
      const existing = vehicles.find(v => String(v.id) === String(vehicleId)) || editingItem || {};
      const payload = { ...existing, ...updatedFields, id: existing.id ?? vehicleId };
      await api.put(API_ENDPOINTS.vehicles, payload.id, payload);
      // success: nothing else (UI already updated optimistically)
    } catch (err) {
      console.error('Persist status failed', err);
      alert('Lưu trạng thái thất bại: ' + (err.message || '')); 
      // rollback
      if (prevVehicles) setVehicles(prevVehicles);
      if (editingItem && editingItem.id === vehicleId) {
        setEditingItem(prev => prev ? { ...prev, status: prev.status } : prev);
      }
    }
  };

  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng xe ---
  const vehicleTableRef = useRef(null);
  const defaultVehicleColumns = [
    { key: 'stt', label: 'Số TT', fixed: true },
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
  const defaultVehicleWidths = [60, 100, 120, 200, 100, 100, 100, 130, 150, 150, 200, 110, 150];
  
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
  // Selection state for STT checkboxes

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

  // Close context menu on any click outside
  React.useEffect(() => {
    const onGlobalClick = (e) => {
      if (contextMenu.visible) closeContextMenu();
    };
    document.addEventListener('click', onGlobalClick);
    return () => document.removeEventListener('click', onGlobalClick);
  }, [contextMenu.visible]);

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
              <span style={{ fontSize: '18px', marginRight: '8px' }}>📄</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Thêm</span>
            </button>
            <button className="btn" style={{ background: '#4CAF50', color: 'white' }} onClick={handleExport}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>📤</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Export</span>
            </button>
            <button className="btn" style={{ background: '#E91E63', color: 'white' }} onClick={handleImport}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>📥</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Import</span>
            </button>
            
            <button
              className="btn"
              style={{ background: '#9E9E9E', color: 'white' }}
              onClick={() => setShowVehicleColSetting(v => !v)}
            >
              <span style={{ fontSize: '18px', marginRight: '8px' }}>⚙️</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Cài đặt</span>
            </button>
          </div>

          {/* Hidden file input for import */}
          <input
            ref={vehicleImportRef}
            id="vehicle-import-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              const form = new FormData();
              form.append('file', file);
              try {
                const res = await fetch(`${API_ENDPOINTS.vehicles}/import`, { method: 'POST', body: form });
                if (!res.ok) {
                  const txt = await res.text();
                  throw new Error(txt || 'Import failed');
                }
                const json = await res.json();
                alert(json.message || 'Import thành công');
                await loadVehicles();
              } catch (err) {
                console.error('Vehicle import error', err);
                alert('Import thất bại: ' + (err.message || ''));
              } finally {
                e.target.value = '';
              }
            }}
          />

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
                      {col.key === 'stt' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.length > 0 && baseFilteredVehicles.length > 0 && selectedIds.length === baseFilteredVehicles.length}
                            onChange={toggleSelectAll}
                          />
                          <span style={{ fontWeight: 600 }}>{col.label}</span>
                        </span>
                      ) : (
                        col.label
                      )}
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
              {paginatedVehicles.map((vehicle, rowIndex) => (
                <tr key={vehicle.id} onContextMenu={(e) => handleRowContextMenu(e, vehicle)}>
                  {vehicleColumns.map((col) => {
                    if (!vehicleVisibleCols.includes(col.key)) return null;
                    if (col.key === 'stt') {
                      return (
                        <td key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(vehicle.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setSelectedIds(ids => Array.from(new Set([...ids, vehicle.id])));
                                setShowOnlySelected(true);
                              } else {
                                setSelectedIds(ids => {
                                  const next = ids.filter(id => id !== vehicle.id);
                                  if (next.length === 0) setShowOnlySelected(false);
                                  return next;
                                });
                              }
                            }}
                          />
                          <span style={{ color: '#666' }}>{startIndex + rowIndex + 1}</span>
                        </td>
                      );
                    }
                    if (col.key === 'status') {
                      const statusText = vehicle.status ? vehicle.status.toString().toLowerCase().trim() : '';
                      const isInactive = statusText.includes('ngưng');
                      const displayText = isInactive ? 'Ngưng hoạt động' : 'Hoạt động';
                      return (
                        <td key={col.key}>
                          <span style={{ 
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: !isInactive ? '#4CAF50' : '#f44336',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}>
                            {displayText}
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

        {/* Context menu for rows */}
        {contextMenu.visible && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 6,
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              zIndex: 2000,
              minWidth: 160,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              onClick={() => {
                // open edit modal
                setEditingItem(contextMenu.item);
                setFormData(contextMenu.item);
                setShowModal(true);
                closeContextMenu();
              }}
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ color: '#2c5aa0' }}>✏️</span>
              <span>Xem chi tiết (Sửa)</span>
            </div>
            <div style={{ height: 1, background: '#f0f0f0' }} />
            <div
              onClick={() => {
                // delete
                if (contextMenu.item && contextMenu.item.id) {
                  handleDelete(contextMenu.item.id);
                }
                closeContextMenu();
              }}
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#d32f2f' }}
            >
              <span>🗑️</span>
              <span>Xóa</span>
            </div>
          </div>
        )}

        {filteredVehicles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredVehicles.length}
            startIndex={startIndex}
            endIndex={endIndex}
          />
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
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#444' }}>Trạng thái:</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* helper to set status in formData and update UI optimistically when editing */}
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = 'Hoạt động';
                        // save previous snapshot for rollback
                        const prev = [...vehicles];
                        setFormData({ ...formData, status: newStatus });
                        if (editingItem) {
                          setVehicles(prevV => prevV.map(v => {
                            const matchById = editingItem.id != null && String(v.id) === String(editingItem.id);
                            const matchByCode = editingItem.code && v.code && String(v.code) === String(editingItem.code);
                            return (matchById || matchByCode) ? { ...v, status: newStatus } : v;
                          }));
                          setEditingItem(prevE => prevE ? { ...prevE, status: newStatus } : prevE);
                          await persistStatusChange(editingItem.id ?? editingItem.code, { status: newStatus }, prev);
                        }
                      }}
                      style={formData.status === 'Hoạt động' ? statusBtnActive : statusBtnInactive}
                    >
                      Hoạt động
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = 'Ngưng hoạt động';
                        const prev = [...vehicles];
                        setFormData({ ...formData, status: newStatus });
                        if (editingItem) {
                          setVehicles(prevV => prevV.map(v => {
                            const matchById = editingItem.id != null && String(v.id) === String(editingItem.id);
                            const matchByCode = editingItem.code && v.code && String(v.code) === String(editingItem.code);
                            return (matchById || matchByCode) ? { ...v, status: newStatus } : v;
                          }));
                          setEditingItem(prevE => prevE ? { ...prevE, status: newStatus } : prevE);
                          await persistStatusChange(editingItem.id ?? editingItem.code, { status: newStatus }, prev);
                        }
                      }}
                      style={formData.status === 'Ngưng hoạt động' ? { ...statusBtnActive, background: '#f44336' } : statusBtnInactive}
                    >
                      Ngưng hoạt động
                    </button>
                  </div>
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
