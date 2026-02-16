import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { ExcelButtons } from '../common/ExcelButtons.jsx';
import { Pagination } from '../common/Pagination';

const ProductCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters, showFilterPopup } = useColumnFilter();
  const auth = useAuth();
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Context menu (chuột phải)
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Load data from API when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.productCategories);

      // If user has category-level permissions, only show allowed categories
      try {
        const currentUser = auth.user;
        const name = (currentUser?.username || currentUser?.name || '').toString().toLowerCase();
        const isSuperAdmin = name === 'superadmin' || name === 'admin';
        
        // If no current user or superadmin/admin, show all
        if (!currentUser || isSuperAdmin || auth.canView('admin') || auth.hasPermission('admin', 'full-access')) {
          setCategories(data);
        } else if (auth.categoryPermissions && auth.categoryPermissions.length > 0) {
          // Use categoryPermissions from AuthContext
          const filtered = data.filter(c => auth.categoryPermissions.includes(c.id));
          setCategories(filtered);
        } else {
          // Fallback: Fetch product category permissions for current user
          const permsRes = await fetch(`${API_ENDPOINTS.productCategoryPermissions}/user/${currentUser.id}`);
          if (permsRes.ok) {
            const perms = await permsRes.json();
            const allowedIds = (perms || [])
              .filter(p => p.canView || p.CanView)
              .map(p => p.productCategoryId || p.ProductCategoryId || (p.productCategory && p.productCategory.id));
            const filtered = data.filter(c => allowedIds.includes(c.id));
            setCategories(filtered);
          } else {
            setCategories(data);
          }
        }
      } catch (e) {
        // If anything fails, fall back to showing all categories
        console.error('Error applying category permissions', e);
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Không thể tải dữ liệu loại hàng. Vui lòng kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestions = (value) => {
    if (!value || !categories || categories.length === 0) {
      setSuggestions([]);
      return;
    }
    const q = value.toString().toLowerCase();
    const matched = categories.filter(c => {
      return (c.name || '').toString().toLowerCase().includes(q)
        || (c.code || '').toString().toLowerCase().includes(q)
        || (c.note || '').toString().toLowerCase().includes(q);
    }).slice(0, 8);
    setSuggestions(matched);
  };

  // Excel Import/Export
  const {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  } = useExcelImportExport({
    data: categories,
    loadData: fetchCategories,
    apiPost: (data) => api.post(API_ENDPOINTS.productCategories, data),
    columnMapping: {
      'Mã danh mục': 'code',
      'Tên danh mục': 'name',
      'Ghi chú': 'note',
      'Trạng thái': 'status'
    },
    requiredFields: ['Mã danh mục', 'Tên danh mục'],
    filename: 'Danh_sach_danh_muc_san_pham',
    sheetName: 'Danh mục SP',
    transformDataForExport: (item) => ({
      'Mã danh mục': item.code || '',
      'Tên danh mục': item.name || '',
      'Ghi chú': item.note || '',
      'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
    }),
    transformDataForImport: (row) => ({
      code: row['Mã danh mục'],
      name: row['Tên danh mục'],
      note: row['Ghi chú'] || '',
      status: row['Trạng thái'] === 'Ngưng hoạt động' ? 'inactive' : 'active'
    }),
    onImportStart: () => setLoading(true),
    onImportComplete: () => setLoading(false)
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    noGroupOrder: false,
    note: '',
    status: 'active'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        // Update existing category - include id in the data
        const dataToUpdate = { ...formData, id: editingItem.id };
        await api.put(API_ENDPOINTS.productCategories, editingItem.id, dataToUpdate);
        alert('Cập nhật loại hàng thành công!');
      } else {
        // Create new category
        await api.post(API_ENDPOINTS.productCategories, formData);
        alert('Thêm loại hàng thành công!');
      }
      await fetchCategories(); // Reload data
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      noGroupOrder: false,
      note: '',
      status: 'active'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      name: item.name || '',
      noGroupOrder: item.noGroupOrder || false,
      note: item.note || '',
      status: item.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa loại hàng này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.productCategories, id);
        alert('Xóa loại hàng thành công!');
        await fetchCategories(); // Reload data
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCategories = applyFilters(categories, searchTerm, ['name', 'code', 'note']);
  
  // Tính toán phân trang
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
  
  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);
  
  // Đóng context menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);
  
  // Xử lý chuột phải
  const handleContextMenu = (e, category) => {
    e.preventDefault();
    setSelectedRow(category);
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleContextEdit = () => {
    if (selectedRow) {
      handleEdit(selectedRow);
      setContextMenu(null);
    }
  };
  
  const handleContextDelete = () => {
    if (selectedRow) {
      handleDelete(selectedRow.id);
      setContextMenu(null);
    }
  };

  const handleExport = () => {
    alert('Chức năng export Excel đang được phát triển');
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };



  // --- CẤU HÌNH CỘT, DRAG, LƯU LOCALSTORAGE ---
  const CATEGORY_COLS_KEY = 'product_categories_table_cols_v1';
  const categoryColumns = [
    { key: 'code', label: 'Mã loại' },
    { key: 'name', label: 'Tên loại' },
    { key: 'noGroupOrder', label: 'Không gộp đơn hàng' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultCategoryOrder = categoryColumns.map(col => col.key);
  // Mặc định chỉ các cột này hiển thị và đúng thứ tự khi "Làm lại"
  const defaultCategoryVisible = ['code', 'name', 'noGroupOrder', 'note', 'status', 'actions'];
  // Lấy cấu hình cột từ localStorage nếu có
  const getInitialCategoryCols = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORY_COLS_KEY));
      if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
        // Nếu cấu hình cũ không có cột actions, reset về mặc định
        if (!saved.visibleCols.includes('actions')) {
          return [defaultCategoryVisible, defaultCategoryOrder];
        }
        return [saved.visibleCols, saved.order];
      }
    } catch {}
    return [defaultCategoryVisible, defaultCategoryOrder];
  };
  const [[initCategoryVisible, initCategoryOrder]] = [getInitialCategoryCols()];
  const [categoryVisibleCols, setCategoryVisibleCols] = useState(initCategoryVisible);
  const [categoryColOrder, setCategoryColOrder] = useState(initCategoryOrder);
  const [showCategoryColSetting, setShowCategoryColSetting] = useState(false);
  const [categoryColWidths, setCategoryColWidths] = useState([100, 180, 140, 180, 110, 110]);
  const categoryTableRef = useRef(null);
  const categoryColSettingRef = useRef(null);
  // Drag state cho popup
  const [popupDragIndex, setPopupDragIndex] = useState(null);
  const [popupDragOverIndex, setPopupDragOverIndex] = useState(null);
  // Lưu cấu hình cột vào localStorage
  const saveCategoryColConfig = (visibleCols, order) => {
    localStorage.setItem(CATEGORY_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveCategoryColConfig(categoryVisibleCols, categoryColOrder);
  }, [categoryVisibleCols, categoryColOrder]);
  // Đóng popup khi click ra ngoài và tự động lưu
  React.useEffect(() => {
    if (!showCategoryColSetting) return;
    const handleClick = (e) => {
      if (categoryColSettingRef.current && !categoryColSettingRef.current.contains(e.target)) {
        setShowCategoryColSetting(false);
        saveCategoryColConfig(categoryVisibleCols, categoryColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCategoryColSetting, categoryVisibleCols, categoryColOrder]);
  // Drag & drop trong popup
  const handlePopupDragStart = (idx) => setPopupDragIndex(idx);
  const handlePopupDragOver = (idx, e) => { e.preventDefault(); setPopupDragOverIndex(idx); };
  const handlePopupDrop = () => {
    if (popupDragIndex === null || popupDragOverIndex === null || popupDragIndex === popupDragOverIndex) {
      setPopupDragIndex(null); setPopupDragOverIndex(null); return;
    }
    const cols = categoryColOrder.filter(k => !categoryColumns.find(col => col.key === k)?.fixed);
    const dragged = cols[popupDragIndex];
    cols.splice(popupDragIndex, 1);
    cols.splice(popupDragOverIndex, 0, dragged);
    // Thêm lại các cột fixed cuối cùng
    const newOrder = [...cols, ...categoryColumns.filter(col => col.fixed).map(col => col.key)];
    setCategoryColOrder(newOrder);
    setPopupDragIndex(null); setPopupDragOverIndex(null);
  };
  // Khi click checkbox cột hiển thị
  const handleColVisibleChange = (key, checked) => {
    if (checked) setCategoryVisibleCols(cols => [...cols, key]);
    else setCategoryVisibleCols(cols => cols.filter(k => k !== key));
  };
  // Khi click "Làm lại"
  const handleResetCols = () => {
    setCategoryVisibleCols(defaultCategoryVisible);
    setCategoryColOrder(defaultCategoryVisible);
  };

  // Kéo cột
  const handleCategoryMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...categoryColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setCategoryColWidths((widths) => {
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
        <h1>Danh sách loại hàng</h1>
        <p>Quản lý danh mục loại hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã loại hàng..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); updateSuggestions(e.target.value); setShowSuggestions(true); setActiveSuggestion(-1); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  setActiveSuggestion(a => Math.min(a + 1, suggestions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  setActiveSuggestion(a => Math.max(a - 1, 0));
                } else if (e.key === 'Enter') {
                  if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
                    const s = suggestions[activeSuggestion];
                    setSearchTerm(s.name || s.code || '');
                    setShowSuggestions(false);
                    setActiveSuggestion(-1);
                    setCurrentPage(1);
                    e.preventDefault();
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setActiveSuggestion(-1);
                }
              }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
            />
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', left: 0, top: 40, zIndex: 2000, width: 420, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} onMouseDown={(e) => e.preventDefault()}>
                {suggestions.map((s, idx) => (
                  <div key={s.id || s.code || idx} onClick={() => { setSearchTerm(s.name || s.code || ''); setShowSuggestions(false); setActiveSuggestion(-1); setCurrentPage(1); }} onMouseEnter={() => setActiveSuggestion(idx)} style={{ padding: '8px 12px', cursor: 'pointer', background: activeSuggestion === idx ? '#f5f7fb' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 600 }}>{s.name || s.code}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{s.code ? `Mã: ${s.code}` : ''}{s.note ? ` · ${s.note}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="table-actions">
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
                setEditingItem(null);
              }}
            >
              + Thêm loại hàng
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
              onClick={() => setShowCategoryColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showCategoryColSetting && (
            <div
              ref={categoryColSettingRef}
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
                    categoryColumns.filter(col => !col.fixed).every(col => categoryVisibleCols.includes(col.key)) &&
                    categoryColumns.filter(col => !col.fixed).length === categoryVisibleCols.filter(key => !categoryColumns.find(col => col.key === key)?.fixed).length
                  }
                  onChange={e => {
                    const nonFixedCols = categoryColumns.filter(col => !col.fixed).map(col => col.key);
                    if (e.target.checked) {
                      // Thêm các cột chưa cố định vào visible, giữ nguyên các cột cố định nếu đã có
                      const newVisible = Array.from(new Set([...categoryVisibleCols, ...nonFixedCols, ...categoryColumns.filter(col => col.fixed).map(col => col.key)]));
                      setCategoryVisibleCols(newVisible);
                      setCategoryColOrder([...nonFixedCols, ...categoryColumns.filter(col => col.fixed).map(col => col.key)]);
                      saveCategoryColConfig(newVisible, [...nonFixedCols, ...categoryColumns.filter(col => col.fixed).map(col => col.key)]);
                    } else {
                      // Bỏ các cột chưa cố định khỏi visible, giữ lại cột cố định
                      const fixedCols = categoryColumns.filter(col => col.fixed).map(col => col.key);
                      setCategoryVisibleCols(fixedCols);
                      setCategoryColOrder([...nonFixedCols, ...fixedCols]);
                      saveCategoryColConfig(fixedCols, [...nonFixedCols, ...fixedCols]);
                    }
                  }}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => {
                    setCategoryVisibleCols(defaultCategoryVisible);
                    setCategoryColOrder(defaultCategoryVisible);
                    saveCategoryColConfig(defaultCategoryVisible, defaultCategoryVisible);
                  }}
                >Làm lại</button>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {categoryColOrder.filter(key => !categoryColumns.find(col => col.key === key)?.fixed).map((key, idx) => {
                const col = categoryColumns.find(c => c.key === key);
                return (
                  <div
                    key={col.key}
                    style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: popupDragOverIndex === idx && popupDragIndex !== null ? '#e6f7ff' : undefined, opacity: popupDragIndex === idx ? 0.5 : 1, cursor: 'move', borderRadius: 4 }}
                    draggable
                    onDragStart={() => handlePopupDragStart(idx)}
                    onDragOver={e => handlePopupDragOver(idx, e)}
                    onDrop={handlePopupDrop}
                    onDragEnd={() => { setPopupDragIndex(null); setPopupDragOverIndex(null); }}
                  >
                    <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                    <input
                      type="checkbox"
                      checked={categoryVisibleCols.includes(col.key)}
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

        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', position: 'relative' }}>
          <table className="data-table" ref={categoryTableRef}>
            <colgroup>
              {categoryColOrder.map((key, i) => (
                categoryVisibleCols.includes(key) ? <col key={key} style={{ width: categoryColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa' }}>
              <tr>
                {categoryColOrder.map((key, idx, arr) => {
                  const col = categoryColumns.find(c => c.key === key);
                  if (!col || !categoryVisibleCols.includes(key)) return null;
                  return (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && categoryVisibleCols.includes(arr[idx - 1]) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleCategoryMouseDown(idx, e, 'left')}
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
                      {col.key !== 'actions' && renderFilterPopup(col.key, col.label, false, categories)}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && categoryVisibleCols.includes(arr[idx + 1]) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleCategoryMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((category) => (
                <tr 
                  key={category.id}
                  onContextMenu={(e) => handleContextMenu(e, category)}
                  style={{ cursor: 'context-menu' }}
                >
                  {categoryColOrder.map((key, idx) => {
                    if (!categoryVisibleCols.includes(key)) return null;
                    const col = categoryColumns.find(c => c.key === key);
                    if (!col) return null;
                    if (col.key === 'noGroupOrder') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${category.noGroupOrder ? 'status-inactive' : 'status-active'}`}>
                            {category.noGroupOrder ? 'Có' : 'Không'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${category.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {category.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
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
                              onClick={() => handleEdit(category)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(category.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{category[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {filteredCategories.length > 0 && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredCategories.length}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        )}

        {filteredCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy loại hàng nào
          </div>
        )}
      </div>

      {/* Context Menu chuột phải */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={handleContextEdit}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span>✏️</span>
            <span>Xem chi tiết</span>
          </div>
          <div
            onClick={handleContextDelete}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc3545'
            }}
            onMouseEnter={(e) => e.target.style.background = '#fff5f5'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span>🗑️</span>
            <span>Xóa</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} loại hàng</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã loại <span className="required">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Nhập mã loại hàng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tên loại <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên loại hàng"
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
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="noGroupOrder"
                      checked={formData.noGroupOrder}
                      onChange={handleInputChange}
                    />
                    Không gộp đơn hàng
                  </label>
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>
                    Chọn nếu loại hàng này không được gộp chung trong đơn hàng
                  </small>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập ghi chú về loại hàng"
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

export default ProductCategories;
