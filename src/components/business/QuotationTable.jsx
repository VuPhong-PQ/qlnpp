// Cấu hình cột mặc định cho bảng bên trái (danh sách báo giá)
const defaultLeftColumns = [
  { key: 'code', title: 'Số báo giá' },
  { key: 'date', title: 'Ngày lập' },
  { key: 'actions', title: 'Thao tác' },
];

// Cấu hình cột mới cho bảng bên phải (chi tiết báo giá) theo yêu cầu
const defaultRightColumns = [
  { key: 'itemType', title: 'Loại hàng' },
  { key: 'barcode', title: 'Mã vạch' },
  { key: 'itemCode', title: 'Mã hàng' },
  { key: 'itemName', title: 'Tên hàng' },
  { key: 'description', title: 'Mô tả' },
  { key: 'vat', title: 'Vat %' },
  { key: 'unit', title: 'Đvt' },
  { key: 'price', title: 'Đơn giá' },
  { key: 'unit1', title: 'Đvt 1' },
  { key: 'price1', title: 'Đơn giá 1' },
  { key: 'note', title: 'Ghi chú' },
  { key: 'Conversion1', title: 'Quy đổi' },
  { key: 'actions', title: 'Thao tác' },
];

import React, { useState, useRef } from 'react';
// --- CẤU HÌNH CỘT, DRAG, LƯU LOCALSTORAGE ---
const QUOTATION_COLS_KEY = 'quotation_table_cols_v1';
const getInitialQuotationCols = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(QUOTATION_COLS_KEY));
    if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
      return [saved.visibleCols, saved.order];
    }
  } catch {}
  // Mặc định: ngày lập, số báo giá, actions
  const defaultOrder = ['date', 'code', 'actions'];
  return [defaultOrder, defaultOrder];
};
import { Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
// Dummy data for initial quotations
const initialQuotations = [
  {
    id: 1,
    code: 'BG001',
    date: '2023-08-01T09:00:00',
    quotationType: 'Bán buôn',
    note: 'Khách hàng A',
    employee: 'Nguyễn Văn A',
  },
  {
    id: 2,
    code: 'BG002',
    date: '2023-08-02T10:30:00',
    quotationType: 'Bán lẻ',
    note: 'Khách hàng B',
    employee: 'Trần Thị B',
  },
  {
    id: 3,
    code: 'BG003',
    date: '2023-08-03T14:15:00',
    quotationType: 'Dịch vụ',
    note: 'Khách hàng C',
    employee: 'Lê Văn C',
  },
];

// Dummy data for quotation details (panel phải), liên kết với code báo giá
const quotationDetails = [
  // Chi tiết cho BG001
  {
    quotationCode: 'BG001',
    itemType: 'Hàng hóa',
    barcode: '8938505970011',
    itemCode: 'SP001',
    itemName: 'Sản phẩm A',
    description: 'Mô tả sản phẩm A',
    unit: 'Cái',
    price: 120000,
    unit1: 'Thùng',
    price1: 115000,
    note: 'Giao nhanh',
  },
  {
    quotationCode: 'BG001',
    itemType: 'Hàng hóa',
    barcode: '8938505970012',
    itemCode: 'SP002',
    itemName: 'Sản phẩm B',
    description: 'Mô tả sản phẩm B',
    unit: 'Cái',
    price: 95000,
    unit1: 'Thùng',
    price1: 90000,
    note: '',
  },
  // Chi tiết cho BG002
  {
    quotationCode: 'BG002',
    itemType: 'Dịch vụ',
    barcode: '',
    itemCode: 'DV001',
    itemName: 'Dịch vụ X',
    description: 'Dịch vụ bảo trì',
    unit: 'Lần',
    price: 500000,
    unit1: '',
    price1: '',
    note: 'Bảo hành 6 tháng',
  },
  // Chi tiết cho BG003
  {
    quotationCode: 'BG003',
    itemType: 'Hàng hóa',
    barcode: '8938505970033',
    itemCode: 'SP003',
    itemName: 'Sản phẩm C',
    description: 'Mô tả sản phẩm C',
    unit: 'Cái',
    price: 150000,
    unit1: 'Thùng',
    price1: 140000,
    note: '',
  },
];
import './QuotationTable.css';

// Column settings modal component
function ColumnSettings({ columns, visibleColumns, colOrder, setVisibleColumns, setColOrder, onClose, onReset, setColWidths }) {
  // Chia nhóm: chưa cố định (có thể kéo thả), cố định phải (không kéo thả)
  const fixedRight = columns.filter(col => col.key === 'actions');
  const normalCols = columns.filter(col => col.key !== 'actions');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const ref = useRef();

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Kéo thả đổi vị trí cột (chỉ đổi colOrder, không đổi visibleCols)
  const handleDragStart = (idx) => setDraggedIndex(idx);
  const handleDragOver = (idx) => {
    if (draggedIndex !== null && idx !== draggedIndex) setDragOverIndex(idx);
  };
  const handleDrop = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const nonFixedKeys = normalCols.map(c => c.key);
    const currentOrder = colOrder.filter(k => nonFixedKeys.includes(k));
    if (currentOrder.length < 2) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dragOverIndex, 0, removed);
    // Ghép lại với nhóm cố định phải
    const newColOrder = [...newOrder, ...colOrder.filter(k => !nonFixedKeys.includes(k))];
    setColOrder(newColOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Header checkbox: bật/tắt tất cả (chỉ đổi visibleCols)
  const allChecked = normalCols.every(col => visibleColumns.includes(col.key)) && fixedRight.every(col => visibleColumns.includes(col.key));
  const handleAllCheck = () => {
    if (allChecked) {
      setVisibleColumns([]);
    } else {
      setVisibleColumns(columns.map(c => c.key));
    }
  };

  // Nút làm lại: reset về mặc định cho panel phải hoặc trái
  const handleReset = () => {
    if (setColWidths && columns.length > 0) {
      // Panel phải: reset về mặc định tất cả
      const def = columns.map(c => c.key);
      setVisibleColumns(def);
      setColOrder(def);
      setColWidths(columns.map(() => 120));
      if (onReset) onReset();
    } else {
      // Panel trái: reset về ['date', 'code', 'actions']
      setVisibleColumns(['date', 'code', 'actions']);
      setColOrder(['date', 'code', 'actions']);
      if (onReset) onReset(['date', 'code', 'actions']);
    }
  };

  return (
    <div>
      <div className="column-settings-modal column-settings-popup" ref={ref}>
        <div className="popup-arrow" />
        <div className="popup-header">
          <label style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15}}>
            <input type="checkbox" checked={allChecked} onChange={handleAllCheck} />
            Cột hiển thị
          </label>
          <button className="popup-reset-btn" onClick={handleReset}>Làm lại</button>
        </div>
        <div className="popup-group-label">Chưa cố định</div>
        <div className="popup-list">
          {colOrder.filter(key => !fixedRight.find(col => col.key === key)).map((key, idx) => {
            const col = columns.find(c => c.key === key);
            return (
              <div
                key={col.key}
                className={`setting-row${visibleColumns.includes(col.key) ? '' : ' hidden'}${draggedIndex === idx ? ' dragging' : ''}${dragOverIndex === idx ? ' dragover' : ''}`}
                draggable={colOrder.filter(k => !fixedRight.find(col => col.key === k)).length > 1}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
                onDrop={handleDrop}
                style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: colOrder.filter(k => !fixedRight.find(col => col.key === k)).length > 1 ? 'grab' : 'default'}}
              >
                <span className="drag-icon" style={{fontSize: 16, color: '#bbb', cursor: colOrder.filter(k => !fixedRight.find(col => col.key === k)).length > 1 ? 'grab' : 'default'}}>⋮⋮</span>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => {
                    setVisibleColumns(
                      visibleColumns.includes(col.key)
                        ? visibleColumns.filter(k => k !== col.key)
                        : [...visibleColumns, col.key]
                    );
                  }}
                />
                <span>{col.title}</span>
              </div>
            );
          })}
        </div>
        <div className="popup-group-label">Cố định phải</div>
        <div className="popup-list">
          {fixedRight.map((col) => (
            <div key={col.key} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', opacity: 1}}>
              <span className="drag-icon" style={{fontSize: 16, color: '#eee', cursor: 'not-allowed'}}>⋮⋮</span>
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => {
                  setVisibleColumns(
                    visibleColumns.includes(col.key)
                      ? visibleColumns.filter(k => k !== col.key)
                      : [...visibleColumns, col.key]
                  );
                }}
              />
              <span>{col.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Resizable table header cell
function ResizableTh({ children, width, onResize, isLast, draggable, onHeaderDragStart, onHeaderDragOver, onHeaderDrop, onHeaderDragEnd, ...rest }) {
  const thRef = useRef();
  const startX = useRef();
  const startWidth = useRef();
  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    startWidth.current = thRef.current.offsetWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e) => {
    const newWidth = Math.max(60, startWidth.current + e.clientX - startX.current);
    onResize(newWidth);
  };
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  return (
    <th
      ref={thRef}
      style={{
        width,
        borderRight: isLast ? undefined : '1px solid #e0e0e0',
        backgroundClip: 'padding-box',
        boxSizing: 'border-box',
      }}
      draggable={draggable}
      onDragStart={onHeaderDragStart}
      onDragOver={onHeaderDragOver}
      onDrop={onHeaderDrop}
      onDragEnd={onHeaderDragEnd}
      {...rest}
    >
      <div className="th-inner" style={{ position: 'relative', height: '100%' }}>
        <div className="th-content" draggable={false}>{children}</div>
        <div
          className="resize-handle"
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleMouseDown(e); }}
          onDragStart={(e) => { e.preventDefault(); }}
        />
      </div>
    </th>
  );
}
function QuotationTable() {
  // State for left panel (quotation list)
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  // Lấy cấu hình cột từ localStorage nếu có
  const [[initLeftVisible, initLeftOrder]] = [getInitialQuotationCols()];
  const [leftVisibleCols, setLeftVisibleCols] = useState(initLeftVisible);
  const [leftColOrder, setLeftColOrder] = useState(initLeftOrder);
  const [leftColWidths, setLeftColWidths] = useState([140, 180, 120]);
  const [showLeftSettings, setShowLeftSettings] = useState(false);
  const [showLeftSearch, setShowLeftSearch] = useState(false);
  const [leftSearch, setLeftSearch] = useState({ code: '', dateFrom: '', dateTo: '' });
  // pagination for left panel
  const [leftPage, setLeftPage] = useState(1);
  const [leftPageSize, setLeftPageSize] = useState(10);
  // context menu state for left rows
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, quotation: null });

// --- CẤU HÌNH CỘT, DRAG, LƯU LOCALSTORAGE PANEL PHẢI ---
const QUOTATION_RIGHT_COLS_KEY = 'quotation_detail_table_cols_v2'; // Updated version to include VAT
const getInitialRightCols = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(QUOTATION_RIGHT_COLS_KEY));
    if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
      // Ensure new columns (like 'vat') are included
      const defaultKeys = defaultRightColumns.map(c => c.key);
      const missingKeys = defaultKeys.filter(key => !saved.visibleCols.includes(key));
      
      if (missingKeys.length > 0) {
        // Add missing columns to the saved config
        const updatedVisibleCols = [...saved.visibleCols];
        const updatedOrder = [...saved.order];
        
        missingKeys.forEach(key => {
          if (!updatedVisibleCols.includes(key)) {
            updatedVisibleCols.push(key);
          }
          if (!updatedOrder.includes(key)) {
            // Insert 'vat' after 'description' if it exists, otherwise append
            if (key === 'vat') {
              const descIndex = updatedOrder.indexOf('description');
              if (descIndex !== -1) {
                updatedOrder.splice(descIndex + 1, 0, key);
              } else {
                updatedOrder.push(key);
              }
            } else {
              updatedOrder.push(key);
            }
          }
        });
        
        return [updatedVisibleCols, updatedOrder];
      }
      
      return [saved.visibleCols, saved.order];
    }
  } catch {}
  const defaultOrder = defaultRightColumns.map(c => c.key);
  return [defaultOrder, defaultOrder];
};

  const [[initRightVisible, initRightOrder]] = [getInitialRightCols()];
  const [rightVisibleCols, setRightVisibleCols] = useState(initRightVisible);
  const [rightColOrder, setRightColOrder] = useState(initRightOrder);
  const [rightColWidths, setRightColWidths] = useState(defaultRightColumns.map(() => 120));
  const [showRightSettings, setShowRightSettings] = useState(false);
  // Pagination for right detail table (inherit Products layout)
  const [rightCurrentPage, setRightCurrentPage] = useState(1);
  const [rightItemsPerPage, setRightItemsPerPage] = useState(10);
  const [rightShowPageSizeDropdown, setRightShowPageSizeDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productList, setProductList] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  // Detection: should naive ISO strings be treated as UTC?
  const [treatNaiveIsoAsUtc, setTreatNaiveIsoAsUtc] = useState(null);
  // Drag state for reordering right-panel columns by dragging headers
  const [rightDragIndex, setRightDragIndex] = useState(null);
  const [rightDragOverIndex, setRightDragOverIndex] = useState(null);

  // Try to determine the currently logged-in user's display name from common places
  const getCurrentUserName = () => {
    try {
      // global injected object (if app sets window.__USER__)
      if (window && window.__USER__) return window.__USER__.name || window.__USER__.username || window.__USER__.displayName || '';
    } catch {}
    try {
      const raw = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('loggedUser');
      if (raw) {
        const u = JSON.parse(raw);
        return u?.name || u?.username || u?.displayName || u?.fullName || '';
      }
    } catch {}
    try {
      const name = localStorage.getItem('username') || localStorage.getItem('displayName') || localStorage.getItem('userName');
      if (name) return name;
    } catch {}
    return '';
  };

  // Format quotation date for display in left list
  const formatQuotationDate = (raw) => {
    if (!raw && raw !== 0) return '';
    try {
      const timeZone = 'Asia/Ho_Chi_Minh'; // Vietnam timezone (UTC+7)
      // If not a string, assume it's a timestamp or Date-compatible and convert
      if (typeof raw !== 'string') {
        const d = new Date(raw);
        if (isNaN(d)) return String(raw);
        return d.toLocaleString('vi-VN', { hour12: false, timeZone });
      }

      // If string contains timezone info (Z or +hh:mm), let Date parse it
      const tzRegex = /[Zz]|[+-]\d{2}:?\d{2}/;
      const naiveIsoRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
      if (tzRegex.test(raw)) {
        const d = new Date(raw);
        if (!isNaN(d)) return d.toLocaleString('vi-VN', { hour12: false, timeZone });
      }

      // For naive ISO strings (no timezone), decide how to interpret based on detected flag.
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
      if (m) {
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        const hour = parseInt(m[4], 10);
        const minute = parseInt(m[5], 10);
        const second = parseInt(m[6], 10);
        // Default behavior: treat naive ISO as UTC unless detector says otherwise.
        const treatAsUtc = (treatNaiveIsoAsUtc === null) ? true : Boolean(treatNaiveIsoAsUtc);
        if (treatAsUtc) {
          // Interpret fields as UTC and then display in VN timezone
          const utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
          const d = new Date(utcMs);
          return d.toLocaleString('vi-VN', { hour12: false, timeZone });
        } else {
          // Interpret fields as VN local time (UTC+7): convert to UTC by subtracting 7 hours
          const utcMs = Date.UTC(year, month - 1, day, hour - 7, minute, second);
          const d = new Date(utcMs);
          return d.toLocaleString('vi-VN', { hour12: false, timeZone });
        }
      }

      // Fallback: return raw string
      return raw;
    } catch (err) {
      return String(raw);
    }
  };

  // Lưu cấu hình cột vào localStorage
  const saveRightColConfig = (visibleCols, order) => {
    localStorage.setItem(QUOTATION_RIGHT_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveRightColConfig(rightVisibleCols, rightColOrder);
  }, [rightVisibleCols, rightColOrder]);

  // Ensure the 'Conversion1' (Quy đổi) column is present and positioned next to 'note'
  // This helps users who have no saved config or older config where the column was missing.
  React.useEffect(() => {
    const key = 'Conversion1';
    let needsOrder = !rightColOrder.includes(key);
    let needsVisible = !rightVisibleCols.includes(key);
    if (!needsOrder && !needsVisible) return;
    if (needsOrder) {
      const idx = rightColOrder.indexOf('note');
      const newOrder = [...rightColOrder];
      if (idx >= 0) newOrder.splice(idx + 1, 0, key); else newOrder.push(key);
      setRightColOrder(newOrder);
    }
    if (needsVisible) {
      setRightVisibleCols(prev => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
    }
  }, []); // run once on mount
  // Đóng popup khi click ra ngoài và tự động lưu
  const rightSettingsRef = useRef(null);
  React.useEffect(() => {
    if (!showRightSettings) return;
    const handleClick = (e) => {
      if (rightSettingsRef.current && !rightSettingsRef.current.contains(e.target)) {
        setShowRightSettings(false);
        saveRightColConfig(rightVisibleCols, rightColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showRightSettings, rightVisibleCols, rightColOrder]);
  // Reset columns
  // Đổi tên hàm reset cho panel phải để tránh trùng lặp
  const resetRightDetailCols = () => {
    const def = defaultRightColumns.map(c => c.key);
    setRightVisibleCols(def);
    setRightColOrder(def);
    setRightColWidths(defaultRightColumns.map(() => 120));
    saveRightColConfig(def, def);
    setShowRightSettings(false); // Đóng popup sau khi reset
  };

  // Lọc danh sách báo giá theo tìm kiếm
  const filteredQuotations = quotations.filter(q =>
    (!leftSearch.code || q.code.toLowerCase().includes(leftSearch.code.toLowerCase()))
  );
  // paging for left panel
  const leftTotal = filteredQuotations.length;
  const leftTotalPages = Math.max(1, Math.ceil(leftTotal / leftPageSize));
  const leftStart = leftTotal === 0 ? 0 : (leftPage - 1) * leftPageSize + 1;
  const leftEnd = Math.min(leftTotal, leftPage * leftPageSize);
  const pagedLeftQuotations = filteredQuotations.slice((leftPage - 1) * leftPageSize, (leftPage - 1) * leftPageSize + leftPageSize);

  // Handlers for column resizing
  const handleLeftResize = (idx, w) => {
    setLeftColWidths(widths => widths.map((v, i) => (i === idx ? w : v)));
  };
  const handleRightResize = (idx, w) => {
    setRightColWidths(widths => widths.map((v, i) => (i === idx ? w : v)));
  };

  // Header drag handlers for right panel (reorder columns)
  const handleRightHeaderDragStart = (e, idx) => {
    // avoid starting drag when resizing (resize uses mousedown on handle)
    setRightDragIndex(idx);
    try { e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
  };
  const handleRightHeaderDragOver = (e, idx) => {
    e.preventDefault();
    setRightDragOverIndex(idx);
  };
  const handleRightHeaderDrop = (e, idx) => {
    e.preventDefault();
    if (rightDragIndex === null || rightDragIndex === idx) {
      setRightDragIndex(null);
      setRightDragOverIndex(null);
      return;
    }
    const newOrder = [...rightColOrder];
    // move element at rightDragIndex to position idx
    const [moved] = newOrder.splice(rightDragIndex, 1);
    newOrder.splice(idx, 0, moved);
    setRightColOrder(newOrder);
    // also move corresponding width entry so column width follows the column key
    try {
      const w = [...rightColWidths];
      const [movedW] = w.splice(rightDragIndex, 1);
      w.splice(idx, 0, movedW);
      setRightColWidths(w);
    } catch (err) {
      // ignore if widths mismatch
    }
    setRightDragIndex(null);
    setRightDragOverIndex(null);
  };
  const handleRightHeaderDragEnd = () => {
    setRightDragIndex(null);
    setRightDragOverIndex(null);
  };

  // Lưu cấu hình cột vào localStorage
  const saveQuotationColConfig = (visibleCols, order) => {
    localStorage.setItem(QUOTATION_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveQuotationColConfig(leftVisibleCols, leftColOrder);
  }, [leftVisibleCols, leftColOrder]);
  // Đóng popup khi click ra ngoài và tự động lưu
  const leftSettingsRef = useRef(null);
  React.useEffect(() => {
    if (!showLeftSettings) return;
    const handleClick = (e) => {
      if (leftSettingsRef.current && !leftSettingsRef.current.contains(e.target)) {
        setShowLeftSettings(false);
        saveQuotationColConfig(leftVisibleCols, leftColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLeftSettings, leftVisibleCols, leftColOrder]);

  // Reset columns
  const resetLeftCols = () => {
    setLeftVisibleCols(['date', 'code', 'actions']);
    setLeftColOrder(['date', 'code', 'actions']);
    saveQuotationColConfig(['date', 'code', 'actions'], ['date', 'code', 'actions']);
  };
  const resetRightCols = () => setRightVisibleCols(defaultRightColumns.map(c => c.key));
  // Lọc chi tiết theo báo giá đang chọn
  const detailRows = selectedQuotation
    ? (selectedQuotation.items || selectedQuotation.Items || []).map(item => ({
        ...item,
        // normalize Conversion1 for consistency (server uses Conversion1)
        Conversion1: item.Conversion1 ?? item.conversion1 ?? item.conversion ?? 0,
        note: item.note || item.Note || '',
        vat: item.vat ?? item.Vat ?? item.vatPercent ?? item.VatPercent ?? 10 // Default VAT 10% if not provided
      }))
    : [];

  // Right table pagination calculations (Products-like)
  const rightTotal = detailRows.length;
  const rightTotalPages = Math.max(1, Math.ceil(rightTotal / Math.max(1, rightItemsPerPage)));
  const rightStart = rightTotal === 0 ? 0 : (rightCurrentPage - 1) * rightItemsPerPage + 1;
  const rightEnd = Math.min(rightTotal, rightCurrentPage * rightItemsPerPage);
  const paginatedDetailRows = detailRows.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage);

  // Reset right pagination when quotation changes or rows change
  React.useEffect(() => {
    setRightCurrentPage(1);
  }, [selectedQuotation?.id, rightTotal]);

  // Load quotations list from backend
  const loadQuotations = async () => {
    try {
      const res = await fetch('/api/Quotations');
      if (!res.ok) throw new Error('Failed to load quotations');
      const data = await res.json();
      // Detect whether API returns naive ISO datetimes (no timezone) and
      // if so, assume they are UTC (so we display in VN timezone correctly).
      try {
        if (Array.isArray(data) && data.length > 0) {
          const naiveIsoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
          const tzRegex = /[Zz]|[+-]\d{2}:?\d{2}/;
          let foundNaive = false;
          let foundTz = false;
          for (const q of data) {
            const d = q?.date;
            if (typeof d === 'string') {
              if (naiveIsoRegex.test(d)) foundNaive = true;
              if (tzRegex.test(d)) foundTz = true;
            }
          }
          if (foundNaive && !foundTz) setTreatNaiveIsoAsUtc(true);
          else if (foundTz && !foundNaive) setTreatNaiveIsoAsUtc(false);
          else setTreatNaiveIsoAsUtc(true); // default to interpreting naive as UTC
        }
      } catch (e) {
        setTreatNaiveIsoAsUtc(true);
      }
      setQuotations(data || []);
      if (data && data.length > 0) {
        // load details for first item
        await loadQuotationDetails(data[0].id);
      } else {
        setSelectedQuotation(null);
      }
    } catch (err) {
      console.error('Load quotations error', err);
      // Fallback to local dummy data when backend is unavailable (dev convenience)
      console.warn('Using local sample quotations as fallback');
      setQuotations(initialQuotations);
      // fallback: our sample uses naive ISO strings, assume they are UTC
      setTreatNaiveIsoAsUtc(true);
      if (initialQuotations && initialQuotations.length > 0) {
        // load details for first sample quotation (if any)
        try {
          await loadQuotationDetails(initialQuotations[0].id);
        } catch (e) {
          // ignore
        }
      } else {
        setSelectedQuotation(null);
      }
    }
  };

  const loadQuotationDetails = async (id) => {
    try {
      const res = await fetch(`/api/Quotations/${id}`);
      if (!res.ok) throw new Error('Failed to load quotation details');
      const data = await res.json();
      // If the quotation doesn't have an employee set, default to current user name
      const emp = getCurrentUserName();
      if (data && !data.employee && emp) data.employee = emp;
      
      // Ensure all items have VAT field with default value
      if (data && data.items) {
        data.items = data.items.map(item => ({
          ...item,
          vat: item.vat ?? item.Vat ?? item.vatPercent ?? item.VatPercent ?? 10
        }));
      }
      if (data && data.Items) {
        data.Items = data.Items.map(item => ({
          ...item,
          vat: item.vat ?? item.Vat ?? item.vatPercent ?? item.VatPercent ?? 10
        }));
      }
      
      setSelectedQuotation(data);
    } catch (err) {
      console.error('Load quotation details error', err);
    }
  };

  React.useEffect(() => {
    loadQuotations();
  }, []);

  // Ensure VAT is set for all items when selectedQuotation changes
  React.useEffect(() => {
    if (selectedQuotation) {
      ensureVatInItems();
    }
  }, [selectedQuotation?.id]);

  // Create a new quotation with minimal data and open it
  const createNewQuotation = async () => {
    try {
      const code = 'BG' + (new Date()).toISOString().replace(/[^0-9]/g, '').slice(-8);
      const payload = {
        code,
        date: new Date().toISOString(),
        quotationType: '',
        note: '',
        employee: getCurrentUserName() || '',
        total: 0,
        items: []
      };
      const res = await fetch('/api/Quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create quotation');
      }
      const created = await res.json();
      // refresh list and open created, enter edit mode
      await loadQuotations();
      await loadQuotationDetails(created.id);
      setIsEditing(true);
    } catch (err) {
      console.error('Create quotation error', err);
      alert('Tạo báo giá mới thất bại: ' + (err.message || err));
    }
  };

  const loadProducts = async (query = '') => {
    try {
      const url = '/api/Products' + (query ? `?search=${encodeURIComponent(query)}` : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProductList(data || []);
    } catch (err) {
      console.error('Load products error', err);
      setProductList([]);
    }
  };

  const openProductPicker = async () => {
    await loadProducts('');
    setSelectedProductIds([]);
    setShowProductPicker(true);
  };

  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedProductsToQuotation = () => {
    if (!selectedQuotation) return;
    const picked = productList.filter(p => selectedProductIds.includes(p.id));
    console.log('Selected products for quotation:', picked);
    const items = picked.map(p => {
      console.log('Product fields:', Object.keys(p));
      console.log('Conversion1 value:', p.Conversion1, 'conversion1:', p.conversion1);
      return {
        // Use lowercase/camelCase names returned by the Products API
        itemType: p.Category || p.category || 'Hàng hóa',
        barcode: p.Barcode || p.barcode || '',
        itemCode: p.Code || p.code || '',
        itemName: p.Name || p.VatName || p.name || p.nameVi || p.code || '',
        description: p.Description || p.description || p.note || '',
        unit: p.DefaultUnit || p.BaseUnit || p.defaultUnit || p.baseUnit || '',
        // include conversion/quy đổi if available on product (use Conversion1 field from DB)
        Conversion1: p.Conversion1 ?? p.conversion1 ?? p.conversion ?? 0,
        price: p.RetailPrice ?? p.retailPrice ?? 0,
        unit1: p.Unit1 || p.unit1 || '',
        price1: p.RetailPrice1 ?? p.retailPrice1 ?? null,
        note: p.note || '',
        vat: 10 // Default VAT 10% for new items
      };
    });
    console.log('Created quotation items:', items);
    const existing = selectedQuotation.items || selectedQuotation.Items || [];
    const merged = [...existing, ...items];
    setSelectedQuotation(s => ({ ...(s || {}), items: merged }));
    setShowProductPicker(false);
    setIsEditing(true);
  };

  const saveQuotation = async () => {
    try {
      if (!selectedQuotation || !selectedQuotation.id) throw new Error('No quotation selected');
      const payload = { ...selectedQuotation };
      console.log('Saving quotation payload:', payload);
      // send PUT to update
      const res = await fetch(`/api/Quotations/${selectedQuotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Save failed');
      }
      // refresh
      await loadQuotations();
      await loadQuotationDetails(selectedQuotation.id);
      setIsEditing(false);
      alert('Lưu báo giá thành công');
    } catch (err) {
      console.error('Save quotation error', err);
      alert('Lưu báo giá thất bại: ' + (err.message || err));
    }
  };

  // Update per-item note in selectedQuotation.items (keeps UI edits in state so export picks them up)
  const handleItemNoteChange = (index, value) => {
    setSelectedQuotation(s => {
      if (!s) return s;
      const items = Array.isArray(s.items) ? [...s.items] : Array.isArray(s.Items) ? [...s.Items] : [];
      items[index] = { ...(items[index] || {}), note: value, Note: value };
      return { ...s, items };
    });
  };

  // Update per-item VAT in selectedQuotation.items
  const handleItemVatChange = (index, value) => {
    setSelectedQuotation(s => {
      if (!s) return s;
      const items = Array.isArray(s.items) ? [...s.items] : Array.isArray(s.Items) ? [...s.Items] : [];
      const numValue = parseFloat(value) || 0;
      items[index] = { ...(items[index] || {}), vat: numValue, Vat: numValue };
      return { ...s, items };
    });
  };

  // Ensure all items have VAT field
  const ensureVatInItems = () => {
    if (!selectedQuotation) return;
    
    setSelectedQuotation(s => {
      if (!s) return s;
      const items = Array.isArray(s.items) ? [...s.items] : Array.isArray(s.Items) ? [...s.Items] : [];
      const updatedItems = items.map(item => ({
        ...item,
        vat: item.vat ?? item.Vat ?? item.vatPercent ?? item.VatPercent ?? 10
      }));
      
      return { ...s, items: updatedItems };
    });
  };

  // Generate and print an A4-formatted quotation
  const formatCurrency = (v) => {
    if (v === null || v === undefined || v === '') return '';
    return Number(v).toLocaleString('vi-VN');
  };

  // Format VAT display: show integer without .0 when whole, otherwise show one decimal if needed
  const formatVat = (v) => {
    if (v === null || v === undefined || v === '') return '';
    const num = Number(v);
    if (Number.isNaN(num)) return '';
    const rounded = Math.round(num * 10) / 10; // one decimal precision
    const s = (rounded % 1 === 0) ? String(Math.round(rounded)) : String(rounded).replace(/\.0+$/, '');
    return `${s} %`;
  };

  // Helper to read company fields tolerant to camelCase/PascalCase
  const getCompanyField = (c, prop) => {
    if (!c) return '';
    const camel = prop;
    const pascal = prop.charAt(0).toUpperCase() + prop.slice(1);
    return (c[camel] ?? c[pascal] ?? c[prop] ?? '');
  };

  // Escape HTML to avoid breaking Excel HTML table
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const buildA4Html = (q, company) => {
    const items = (q?.items || q?.Items || []).map((it, idx) => ({
      stt: idx + 1,
      barcode: it.barcode || it.Barcode || '',
      itemCode: it.itemCode || it.ItemCode || '',
      itemName: it.itemName || it.ItemName || '',
      description: it.description || it.Description || '',
      unit: it.unit || it.Unit || '',
      // Conversion1 (quy đổi) from backend QuotationItems model
      Conversion1: it.Conversion1 ?? it.conversion1 ?? it.conversion ?? 0,
      price: it.price ?? it.Price ?? 0,
      unit1: it.unit1 || it.Unit1 || '',
      price1: it.price1 ?? it.Price1 ?? null,
      vat: it.vat ?? it.Vat ?? 10,
      // Prefer item-level note when present, otherwise use quotation-level note
      note: (it.note || it.Note || q?.note || q?.Note || '')
    }));

    const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0);

    const css = `
      /* A4 portrait */
      @page { size: A4 portrait; margin: 18mm 12mm 12mm 12mm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
      .company { text-align: left; font-weight: 700; }
      .title { text-align: center; font-size: 18px; font-weight: 700; margin: 6px 0 6px 0; }
      .meta { margin-bottom: 8px; }
      .meta td { padding: 2px 6px; }
      table.items { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
      table.items th, table.items td { border: 1px solid #000; padding: 6px; vertical-align: top; word-wrap: break-word; box-sizing: border-box; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
      table.items th { background: #f5f5f5; font-weight: 700; }
      .right { text-align: right; }
      .center { text-align: center; }
      /* Column widths adjusted for portrait A4 */
      .col-name { width: 220px; }
      .col-desc { width: 120px; }
      tr { page-break-inside: avoid; }
    `;

    // Reorder columns so 'description' is next to 'note' (at the end)
    // Build rows matching table header columns exactly to avoid layout jumps when printing
    const rowsHtml = items.map(it => `
      <tr>
        <td class="center">${it.stt}</td>
        <td style="mso-number-format:'@';">${escapeHtml(it.barcode)}</td>
        <td style="mso-number-format:'@';">${escapeHtml(it.itemCode)}</td>
        <td>${escapeHtml(it.itemName)}</td>
        <td class="center">${escapeHtml(it.unit)}</td>
        <td class="right">${it.Conversion1 !== null && it.Conversion1 !== undefined && it.Conversion1 !== '' ? Number(it.Conversion1).toLocaleString('vi-VN') : ''}</td>
        <td class="right">${formatCurrency(it.price)}</td>
        <td class="center">${escapeHtml(it.unit1)}</td>
        <td class="right">${it.price1 !== null && it.price1 !== undefined ? Number(it.price1).toLocaleString('vi-VN') : ''}</td>
        <td>${escapeHtml(it.description)}</td>
        <td class="center">${it.vat || it.vat === 0 ? formatVat(it.vat) : ''}</td>
        <td>${escapeHtml(it.note)}</td>
      </tr>
    `).join('');

    

    // Prepare company phone display: avoid doubling the "SĐT" label if it's already present in data
    const rawPhone = (getCompanyField(company, 'phone') || getCompanyField(company, 'Phone') || '');
    const phoneDisplay = /\bSĐT\b|\bSDT\b/i.test(rawPhone) ? rawPhone : (rawPhone ? ('SĐT: ' + rawPhone) : '');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title></title>
        <style>${css}</style>
      </head>
      <body>
        <div class="company">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="font-weight:700; font-size:14px;">${getCompanyField(company, 'companyName') || getCompanyField(company, 'CompanyName') || 'NPP THỈNH PHÚ QUỐC'}</td>
              <td></td>
            </tr>
            <tr>
              <td>Địa chỉ: ${getCompanyField(company, 'address') || getCompanyField(company, 'Address') || ''}</td>
              <td></td>
            </tr>
          </table>
        </div>
        <div class="title">BÁO GIÁ</div>
        <table class="meta" width="100%">
          <tr>
            <td><strong>Số báo giá:</strong> ${q?.code || ''}</td>
            <td style="text-align:right"><strong>Ngày lập:</strong> ${q?.date ? (new Date(q.date)).toLocaleDateString('vi-VN') : ''}</td>
          </tr>
          <tr>
            <td><strong>Người lập:</strong> ${q?.employee || ''}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="2"><strong>Ghi chú:</strong> ${q?.note || ''}</td>
          </tr>
        </table>

        <table class="items">
          <thead>
            <tr>
              <th style="width:40px">STT</th>
              <th style="width:110px">Mã vạch</th>
              <th style="width:110px">Mã hàng</th>
              <th class="col-name">Tên hàng</th>
              <th style="width:60px">ĐVT</th>
              <th style="width:70px">Quy đổi</th>
              <th style="width:90px">Đơn giá theo ĐVT</th>
              <th style="width:60px">ĐVT1</th>
              <th style="width:90px">Đơn giá 1</th>
              <th class="col-desc">Mô tả</th>
              <th style="width:60px">VAT %</th>
              <th style="width:120px">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" style="font-weight:700">Tổng</td>
              <td class="right" style="font-weight:700">${formatCurrency(total)}</td>
              <td colspan="5"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  const fetchCompanyInfo = async () => {
    try {
      const res = await fetch('/api/CompanyInfos');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data[0];
      return data || null;
    } catch (err) {
      console.error('Load company info error', err);
      return null;
    }
  };

  const printQuotationA4 = async () => {
    if (!selectedQuotation) {
      alert('Vui lòng chọn báo giá để in');
      return;
    }
    const company = await fetchCompanyInfo();
    console.log('Print debug - company and quotation employee:', { company, employee: selectedQuotation?.employee });
    const html = buildA4Html(selectedQuotation, company);
    const w = window.open('', '_blank');
    if (!w) {
      alert('Không thể mở cửa sổ in (bị chặn popup). Vui lòng cho phép popup.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Try to avoid the browser showing "about:blank" in the print header by
    // replacing the history entry of the new window (same-origin) and clearing title.
    try {
      if (w.history && typeof w.history.replaceState === 'function') {
        w.history.replaceState(null, '', '/');
      }
      w.document.title = '';
    } catch (err) {
      // ignore if the browser prevents it
      console.warn('Could not replace print window history/title', err);
    }
    // give browser a moment to render styles, then print
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  // Export quotation as Excel-compatible HTML (.xls)
  const exportQuotationExcel = async (q) => {
    const quotation = q || selectedQuotation;
    if (!quotation) {
      alert('Vui lòng chọn báo giá để xuất');
      return;
    }
    const company = await fetchCompanyInfo();
    const getField = (prop) => (getCompanyField(company, prop) || getCompanyField(company, prop.charAt(0).toUpperCase() + prop.slice(1)) || '');
    // phone display for Excel export: avoid doubling 'SĐT' label if it's already included in the stored value
    const rawPhone = getField('phone');
    const phoneDisplay = /\bSĐT\b|\bSDT\b/i.test(rawPhone) ? rawPhone : (rawPhone ? ('SĐT: ' + rawPhone) : '');

    const items = (quotation?.items || quotation?.Items || []);
    const getItemField = (it, prop) => {
      if (!it) return '';
      const candidates = [prop, prop.charAt(0).toUpperCase() + prop.slice(1), prop.toLowerCase(), prop.toUpperCase(), 'notes', 'Notes', 'remark', 'Remark', 'ghiChu', 'ghi_chu', 'GhiChu'];
      for (const k of candidates) {
        if (it[k] !== undefined && it[k] !== null && String(it[k]).trim() !== '') return it[k];
      }
      return '';
    };

    const rows = items.map((it, idx) => {
      console.log('Excel export - processing item:', {
        itemCode: it.itemCode || it.ItemCode,
        conversion1: it.conversion1,
        Conversion1: it.Conversion1,
        allFields: Object.keys(it)
      });
      return {
        stt: idx + 1,
        barcode: getItemField(it, 'barcode') || '',
        itemCode: getItemField(it, 'itemCode') || '',
        itemName: getItemField(it, 'itemName') || '',
        unit: getItemField(it, 'unit') || '',
        // include Conversion1 (quy đổi) using backend field name
        Conversion1: it.Conversion1 ?? it.conversion1 ?? it.conversion ?? 0,
        price: getItemField(it, 'price') ?? 0,
        unit1: getItemField(it, 'unit1') || '',
        price1: getItemField(it, 'price1') ?? null,
        vat: getItemField(it, 'vat') ?? it.vat ?? it.Vat ?? 10,
        description: getItemField(it, 'description') || '',
        note: quotation.note || quotation.Note || ''  // Use quotation-level note for all items
      };
    });

    try { console.log('exportQuotationExcel - rows JSON:', JSON.stringify(rows, null, 2)); } catch (e) {}

    // Debug: log items and rows to help diagnose missing notes
    try { console.log('exportQuotationExcel - quotation, items, rows:', { quotation, items, rows }); } catch (e) {}

    // Build HTML table similar to sample: company header, title, metadata, then items table
    const html = `<!doctype html>
      <html><head><meta charset="utf-8" /><style>body{font-family:'Times New Roman', Times, serif; font-size:12px;}</style></head><body>
      <table>
        <tr><td style="font-weight:700; font-size:14px;">${getField('companyName') || 'NPP THỈNH PHÚ QUỐC'}</td></tr>
        <tr><td>Địa chỉ: ${getField('address')}</td></tr>
      </table>
      <h3 style="text-align:center;">CHI TIẾT PHIẾU BÁO GIÁ</h3>
      <table>
        <tr><td>Mã phiếu: ${escapeHtml(quotation.code || '')}</td><td>Ghi chú: ${escapeHtml(quotation.note || '')}</td></tr>
        <tr><td>Ngày lập: ${quotation.date ? (new Date(quotation.date)).toLocaleDateString('vi-VN') : ''}</td><td></td></tr>
        <tr><td>Người lập: ${escapeHtml(quotation.employee || '')}</td><td></td></tr>
      </table>
      <br/>
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã vạch</th>
            <th>Mã hàng</th>
            <th>Tên hàng</th>
            <th>ĐVT</th>
            <th>Đơn giá</th>
            <th>ĐVT1</th>
            <th>Đơn giá 1</th>
            <th>Mô tả</th>
            <th>VAT %</th>
            <th>Ghi chú</th>
            <th>Quy đổi</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, idx) => `
            <tr>
              <td>${idx+1}</td>
              <td style="mso-number-format:'@';">${escapeHtml(r.barcode)}</td>
              <td style="mso-number-format:'@';">${escapeHtml(r.itemCode)}</td>
              <td>${escapeHtml(r.itemName)}</td>
              <td>${escapeHtml(r.unit)}</td>
              <td style="mso-number-format:'#,##0.00';">${r.price !== null && r.price !== undefined ? r.price : ''}</td>
              <td>${escapeHtml(r.unit1)}</td>
              <td style="mso-number-format:'#,##0.00';">${r.price1 !== null && r.price1 !== undefined ? r.price1 : ''}</td>
              <td>${escapeHtml(r.description)}</td>
              <td>${r.vat || r.vat === 0 ? formatVat(r.vat) : ''}</td>
              <td>${escapeHtml(r.note)}</td>
              <td style="mso-number-format:'#,##0.00';">${r.Conversion1 !== null && r.Conversion1 !== undefined && r.Conversion1 !== '' && r.Conversion1 !== 0 ? r.Conversion1 : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </body></html>`;

    // Create blob and download as .xls
    try {
      const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoGia_${q.code || 'export'}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export excel failed', err);
      alert('Xuất Excel thất bại');
    }
  };

  // hide context menu when clicking elsewhere or pressing Escape
  React.useEffect(() => {
    const handleAnyClick = (e) => {
      if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, quotation: null });
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setContextMenu({ visible: false, x: 0, y: 0, quotation: null }); };
    document.addEventListener('mousedown', handleAnyClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleAnyClick); document.removeEventListener('keydown', handleEsc); };
  }, [contextMenu.visible]);

  return (
    <div className="quotation-table-page" style={{background: '#f7f8fa', minHeight: '100vh', padding: 16, display: 'flex', gap: 16}}>
      {/* Left 30% panel */}
      <div className="left-panel" style={{borderRadius: 16, boxShadow: '0 2px 16px #e5e7eb', marginRight: 0, background: '#fff', padding: 0, width: '30%'}}>
        <div className="panel-header" style={{fontSize: 20, fontWeight: 700, padding: '20px 20px 8px 20px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <span>DANH SÁCH BÁO GIÁ</span>
          <div className="panel-actions" style={{display: 'flex', gap: 8}}>
            {/* two small shortcut buttons removed as requested; gear moved to the total row */}
          </div>
          {/* Context menu for left list (right-click) */}
          {contextMenu.visible && (
            <div
              onClick={e => e.stopPropagation()}
              style={{position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', borderRadius: 6, zIndex: 2000, minWidth: 160}}
            >
                  <div style={{padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}} onClick={async (e) => { e.stopPropagation(); if (contextMenu.quotation) await loadQuotationDetails(contextMenu.quotation.id); setContextMenu({ visible: false, x:0, y:0, quotation: null }); }}>
                <span style={{color: '#4f8cff'}}>✏️</span>
                <span>Xem chi tiết</span>
              </div>
              <div style={{height: 1, background: '#f0f0f0'}} />
              <div style={{padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}} onClick={async (e) => {
                  e.stopPropagation();
                  const q = contextMenu.quotation;
                  if (!q) return;
                  if (!window.confirm('Bạn có chắc muốn xóa báo giá ' + q.code + ' ?')) {
                    setContextMenu({ visible: false, x:0, y:0, quotation: null });
                    return;
                  }
                  try {
                    const res = await fetch(`/api/Quotations/${q.id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Xóa thất bại');
                    setQuotations(prev => prev.filter(x => x.id !== q.id));
                    if (selectedQuotation?.id === q.id) setSelectedQuotation(null);
                  } catch (err) {
                    console.error('Delete quotation failed', err);
                    alert('Xóa báo giá thất bại');
                  }
                  setContextMenu({ visible: false, x:0, y:0, quotation: null });
              }}>
                <span style={{color: '#d9534f'}}>🗑️</span>
                <span>Xóa</span>
              </div>
            </div>
          )}
        </div>
        <div style={{padding: '0 20px 8px 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px 0'}}>
            <div style={{fontSize: 16}}>Tổng {filteredQuotations.length}</div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button style={{background: '#888', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb', marginLeft: 8}} onClick={() => setShowLeftSettings(true)} id="left-settings-gear-btn"><span className="anticon">⚙</span></button>
            </div>
          </div>
          <div style={{overflowX: 'auto', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafbfc', width: '100%'}}>
            <table className="quotation-list-table" style={{minWidth: 480, width: 'max-content'}}>
              <thead>
                <tr>
                  {leftColOrder.map((key, idx) => {
                    const col = defaultLeftColumns.find(c => c.key === key);
                    if (!col || !leftVisibleCols.includes(col.key)) return null;
                    // Find the last visible column index
                    const visibleKeys = leftColOrder.filter(k => leftVisibleCols.includes(k));
                    const isLast = visibleKeys[visibleKeys.length - 1] === key;
                    return (
                      <ResizableTh
                        key={col.key}
                        width={leftColWidths[idx]}
                        onResize={w => handleLeftResize(idx, w)}
                        isLast={isLast}
                      >
                        {col.title}
                        {col.key === 'code' && (
                          <span style={{marginLeft: 8, color: '#bbb', cursor: 'pointer'}} onClick={e => { e.stopPropagation(); setShowLeftSearch('code'); }}><span className="anticon">🔍</span></span>
                        )}
                        {col.key === 'date' && (
                          <span style={{marginLeft: 8, color: '#bbb', cursor: 'pointer'}} onClick={e => { e.stopPropagation(); setShowLeftSearch('date'); }}><span className="anticon">🔍</span></span>
                        )}
                      </ResizableTh>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedLeftQuotations.map((q, idx) => (
                  <tr
                    key={q.id}
                    className={selectedQuotation?.id === q.id ? 'selected' : ''}
                    onClick={() => loadQuotationDetails(q.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // show context menu
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, quotation: q });
                    }}
                  >
                    {leftColOrder.map((key, colIdx) => {
                      const col = defaultLeftColumns.find(c => c.key === key);
                      if (!col || !leftVisibleCols.includes(col.key)) return null;
                      let value = null;
                      if (col.key === 'actions') {
                        value = (
                          <Space>
                            <Button type="primary" icon={<EditOutlined />} size="small" onClick={async (e) => { e.stopPropagation(); await loadQuotationDetails(q.id); setIsEditing(true); }}>
                              Sửa
                            </Button>
                            <Popconfirm
                              title="Bạn có chắc muốn xóa?"
                              onConfirm={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`/api/Quotations/${q.id}`, { method: 'DELETE' });
                                  if (!res.ok) throw new Error('Xóa thất bại');
                                  setQuotations(prev => prev.filter(x => x.id !== q.id));
                                  if (selectedQuotation?.id === q.id) setSelectedQuotation(null);
                                } catch (err) {
                                  console.error('Delete quotation failed', err);
                                  alert('Xóa thất bại');
                                }
                              }}
                              okText="Có"
                              cancelText="Không"
                              onCancel={e => e && e.stopPropagation()}
                            >
                              <Button danger icon={<DeleteOutlined />} size="small" onClick={e => e.stopPropagation()}>
                                Xóa
                              </Button>
                            </Popconfirm>
                          </Space>
                        );
                      } else if (col.key === 'date') {
                        value = formatQuotationDate(q.date);
                      } else if (col.key === 'code') {
                        value = q.code || '';
                      } else {
                        value = q[col.key] || '';
                      }
                      return (
                        <td key={col.key} style={{ width: leftColWidths[colIdx], padding: 8 }}>{value}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15}}>
            <div>{`Dòng ${leftStart}-${leftEnd} trên tổng ${leftTotal} dòng`}</div>
            <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28, marginLeft: 8}} onClick={() => setLeftPage(p => Math.max(1, p - 1))}>{'<'}</button>
            <span style={{fontWeight: 600}}>{leftPage}</span>
            <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setLeftPage(p => Math.min(leftTotalPages, p + 1))}>{'>'}</button>
            <select value={leftPageSize} onChange={(e) => { setLeftPageSize(parseInt(e.target.value, 10)); setLeftPage(1); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
              <option value={200}>200 / trang</option>
              <option value={500}>500 / trang</option>
              <option value={1000}>1000 / trang</option>
            </select>
          </div>
        </div>
        {showLeftSettings && (
          <div className="settings-modal-overlay">
            <ColumnSettings
              columns={defaultLeftColumns}
              visibleColumns={leftVisibleCols}
              colOrder={leftColOrder}
              setVisibleColumns={setLeftVisibleCols}
              setColOrder={setLeftColOrder}
              onClose={() => { setShowLeftSettings(false); saveQuotationColConfig(leftVisibleCols, leftColOrder); }}
              onReset={resetLeftCols}
            />
          </div>
        )}
        {showLeftSearch === 'code' && (
          <QuotationCodeSearchModal
            quotations={quotations}
            value={leftSearch.code}
            onChange={code => setLeftSearch(s => ({ ...s, code }))}
            onClose={code => {
              setLeftSearch(s => ({ ...s, code }));
              setShowLeftSearch(false);
            }}
          />
        )}
        {showLeftSearch === 'date' && (
          <DateRangeSearchModal
            value={{ dateFrom: leftSearch.dateFrom, dateTo: leftSearch.dateTo }}
            onChange={range => setLeftSearch(s => ({ ...s, ...range }))
            }
            onClose={range => {
              setLeftSearch(s => ({ ...s, ...range }));
              setShowLeftSearch(false);
            }}
          />
        )}
      </div>
      {/* Right 70% panel */}
      <div className="right-panel" style={{borderRadius: 16, boxShadow: '0 2px 16px #e5e7eb', background: '#fff', padding: 0, width: '70%', overflowX: 'auto'}}>
        <div className="panel-header" style={{fontSize: 22, fontWeight: 700, padding: '24px 24px 8px 24px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span>THÔNG TIN BÁO GIÁ</span>
            <button onClick={createNewQuotation} style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '6px 12px', boxShadow: '0 2px 8px #e5e7eb'}}>+ Tạo mới</button>
          </div>
          <div />
        </div>
        <div style={{padding: '0 24px 24px 24px'}}>
          {selectedQuotation ? (
            <>
              <div style={{display: 'flex', gap: 12, margin: '8px 0 6px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Số báo giá</div>
                  <input
                    style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#fff'}}
                    value={selectedQuotation.code || ''}
                    onChange={e => setSelectedQuotation(s => ({ ...(s || {}), code: e.target.value }))}
                    readOnly={!isEditing}
                  />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Ghi chú</div>
                  <textarea
                    style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#fff', height: 36, minHeight: 36, lineHeight: '18px'}}
                    value={selectedQuotation.note || ''}
                    onChange={e => setSelectedQuotation(s => ({ ...(s || {}), note: e.target.value }))}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: 12, margin: '6px 0 8px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Ngày lập</div>
                  <input
                    type="date"
                    style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#fff'}}
                    value={selectedQuotation.date ? (selectedQuotation.date.split && selectedQuotation.date.split('T')[0]) : ''}
                    onChange={e => setSelectedQuotation(s => ({ ...(s || {}), date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                    readOnly={!isEditing}
                  />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div onDoubleClick={openProductPicker} style={{fontWeight: 600, marginBottom: 4, cursor: 'pointer'}} title="Nháy đúp để chọn hàng hóa">Chọn hàng hóa báo giá <span style={{color: '#bbb', marginLeft: 4}} title="Chọn từng hàng hóa hoặc tất cả"><span className="anticon">?</span></span></div>
                  <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                    <label><input type="radio" name="hhbg" disabled={!isEditing} /> Tất cả hàng hóa</label>
                    <label><input type="radio" name="hhbg" disabled={!isEditing} defaultChecked /> Chọn từng hàng hóa</label>
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: 12, margin: '6px 0 8px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Loại báo giá</div>
                  <input
                    style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#fff'}}
                    value={selectedQuotation.quotationType || ''}
                    onChange={e => setSelectedQuotation(s => ({ ...(s || {}), quotationType: e.target.value }))}
                    readOnly={!isEditing}
                  />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Người lập</div>
                  <input
                    style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#fff'}}
                    value={selectedQuotation.employee || ''}
                    onChange={e => setSelectedQuotation(s => ({ ...(s || {}), employee: e.target.value }))}
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 6px 0'}}>
                <div style={{fontWeight: 600, fontSize: 15}}>Tổng 0</div>
                <div>
                  <button
                    style={{background: '#888', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}}
                    onClick={() => setShowRightSettings(true)}
                    id="right-settings-gear-btn"
                    title="Cài đặt cột"
                  >
                    <span className="anticon">⚙</span>
                  </button>
                </div>
              </div>
              {showRightSettings && (
                <div className="settings-modal-overlay">
                  <ColumnSettings
                    columns={defaultRightColumns}
                    visibleColumns={rightVisibleCols}
                    colOrder={rightColOrder}
                    setVisibleColumns={setRightVisibleCols}
                    setColOrder={setRightColOrder}
                    setColWidths={setRightColWidths}
                    onClose={() => { setShowRightSettings(false); saveRightColConfig(rightVisibleCols, rightColOrder); }}
                    onReset={resetRightDetailCols}
                  />
                </div>
              )}
              {showProductPicker && (
                <ProductPickerModal
                  visible={showProductPicker}
                  products={productList}
                  search={productSearch}
                  onSearchChange={(s) => { setProductSearch(s); loadProducts(s); }}
                  selectedIds={selectedProductIds}
                  toggleSelect={toggleSelectProduct}
                  onAdd={addSelectedProductsToQuotation}
                  onClose={() => setShowProductPicker(false)}
                />
              )}
              <div className="table-scroll-x" style={{borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafbfc', overflowX: 'auto', padding: 12}}>
                <table className="quotation-detail-table" style={{minWidth: 900}}>
                  <thead>
                    <tr>
                      {rightColOrder.map((key, idx) => {
                        const col = defaultRightColumns.find(c => c.key === key);
                        if (!col || !rightVisibleCols.includes(col.key)) return null;
                        const visibleKeys = rightColOrder.filter(k => rightVisibleCols.includes(k));
                        const isLast = visibleKeys[visibleKeys.length - 1] === key;
                        return (
                          <ResizableTh
                            key={col.key}
                            width={rightColWidths[idx]}
                              onResize={w => handleRightResize(idx, w)}
                              isLast={isLast}
                              draggable={true}
                              onHeaderDragStart={(e) => handleRightHeaderDragStart(e, idx)}
                              onHeaderDragOver={(e) => handleRightHeaderDragOver(e, idx)}
                              onHeaderDrop={(e) => handleRightHeaderDrop(e, idx)}
                              onHeaderDragEnd={handleRightHeaderDragEnd}
                          >
                            {col.title}
                          </ResizableTh>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.length === 0 ? (
                      <tr>
                        <td colSpan={rightVisibleCols.length} style={{textAlign: 'center', padding: 32, color: '#bbb'}}>
                          <div style={{fontSize: 48, marginBottom: 8}}><span className="anticon">📦</span></div>
                          <div>Trống</div>
                        </td>
                      </tr>
                    ) : (
                      paginatedDetailRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {rightColOrder.map((key, colIdx) => {
                            if (!rightVisibleCols.includes(key)) return null;
                            if (key === 'actions') {
                              return (
                                <td key={key} style={{ width: rightColWidths[colIdx], padding: 8 }}>
                                  <Space>
                                    <Button type="primary" icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); }}>
                                      Sửa
                                    </Button>
                                    <Popconfirm
                                      title="Bạn có chắc muốn xóa?"
                                      onConfirm={e => { e.stopPropagation(); }}
                                      okText="Có"
                                      cancelText="Không"
                                      onCancel={e => e && e.stopPropagation()}
                                    >
                                      <Button danger icon={<DeleteOutlined />} size="small" onClick={e => e.stopPropagation()}>
                                        Xóa
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                </td>
                              );
                            }
                            // Special rendering for note column: editable when in edit mode
                            if (key === 'note') {
                              return (
                                <td key={key} style={{ width: rightColWidths[colIdx], padding: 8 }}>
                                  {isEditing ? (
                                    <textarea
                                      value={row.note || ''}
                                      onChange={e => handleItemNoteChange((rightCurrentPage - 1) * rightItemsPerPage + rowIdx, e.target.value)}
                                      style={{ width: '100%', minHeight: 36, borderRadius: 6, border: '1px solid #e5e7eb', padding: 6 }}
                                    />
                                  ) : (
                                    row.note || ''
                                  )}
                                </td>
                              );
                            }
                            // Special rendering for vat column: editable when in edit mode
                            if (key === 'vat') {
                              return (
                                <td key={key} style={{ width: rightColWidths[colIdx], padding: 8 }}>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={row.vat || ''}
                                      onChange={e => handleItemVatChange((rightCurrentPage - 1) * rightItemsPerPage + rowIdx, e.target.value)}
                                      style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: 6 }}
                                      min="0"
                                      max="100"
                                      step="0.1"
                                    />
                                    ) : (
                                    (row.vat || row.vat === 0) ? formatVat(row.vat) : ''
                                  )}
                                </td>
                              );
                            }
                            let value = row[key];
                            // Format numeric fields (Conversion1, price, price1)
                            if (key === 'price' || key === 'price1' || key === 'Conversion1') {
                              if (value !== null && value !== undefined && value !== '') {
                                value = Number(value).toLocaleString('vi-VN');
                              } else {
                                value = '';
                              }
                            }
                            return (
                              <td key={key} style={{ width: rightColWidths[colIdx], padding: 8 }}>{value || ''}</td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{margin: '12px 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14}}>
                <div>{`Dòng ${rightStart}-${rightEnd} trên tổng ${rightTotal} dòng`}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                  <span style={{fontWeight: 600}}>{rightCurrentPage}</span>
                  <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))}>{'>'}</button>
                  <select value={rightItemsPerPage} onChange={(e) => { setRightItemsPerPage(parseInt(e.target.value, 10)); setRightCurrentPage(1); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                    <option value={100}>100 / trang</option>
                    <option value={500}>500 / trang</option>
                    <option value={1000}>1000 / trang</option>
                  </select>
                </div>
              </div>
              <div style={{margin: '12px 0 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 15}}>
                <button onClick={saveQuotation} disabled={!isEditing} style={{background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📁</span> Lưu lại</button>
                <button onClick={() => printQuotationA4()} style={{background: '#7d3cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">🖨</span> In A4</button>
                <button onClick={() => exportQuotationExcel(selectedQuotation)} style={{background: '#00c48c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📤</span> Xuất Excel</button>
              </div>
              {/* Đã chuyển popup settings vào trong table-scroll-x để popup xuất hiện bên phải nút bánh răng */}
            </>
          ) : (
            <div className="no-selection">Chọn một báo giá để xem chi tiết</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal tìm kiếm số báo giá (không export, chỉ dùng nội bộ)
function QuotationCodeSearchModal({ quotations, value, onChange, onClose }) {
  const [search, setSearch] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);
  const list = showAll
    ? quotations
    : quotations.filter(q => q.code.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="modal-overlay" style={{alignItems: 'flex-start', justifyContent: 'center'}}>
      <div ref={ref} style={{background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: 320, maxWidth: 360, marginTop: 60, padding: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.18s'}}>
        <div style={{padding: '16px 16px 0 16px'}}>
          <div style={{display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0 8px', background: '#fafbfc'}}>
            <input
              style={{flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, padding: '8px 0'}}
              placeholder="Tìm kiếm theo số báo giá..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{color: '#bbb', fontSize: 18, marginLeft: 4}}>🔍</span>
          </div>
        </div>
        <div style={{padding: '8px 16px 0 16px', maxHeight: 180, overflowY: 'auto'}}>
          {list.length === 0 && (
            <div style={{color: '#bbb', textAlign: 'center', padding: '16px 0'}}>Không có số báo giá</div>
          )}
          {list.map((q, idx) => (
            <div key={q.code} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0'}}>
              <input
                type="checkbox"
                checked={value === q.code}
                onChange={() => onChange(q.code)}
              />
              <span>{q.code}</span>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px'}}>
          <button
            style={{background: '#f5f7fa', border: 'none', borderRadius: 6, color: '#888', fontWeight: 500, fontSize: 15, padding: '6px 16px'}}
            onClick={() => setShowAll(true)}
            disabled={showAll}
          >Xem tất cả</button>
          <button
            style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 24px'}}
            onClick={() => onClose(value)}
          >Tìm</button>
        </div>
      </div>
    </div>
  );
}

// Modal tìm kiếm ngày lập dạng date range picker
function DateRangeSearchModal({ value, onChange, onClose }) {
  const [dateFrom, setDateFrom] = React.useState(value.dateFrom || '');
  const [dateTo, setDateTo] = React.useState(value.dateTo || '');
  const ref = React.useRef();
  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose({ dateFrom, dateTo });
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, dateFrom, dateTo]);
  return (
    <div className="modal-overlay" style={{alignItems: 'flex-start', justifyContent: 'center'}}>
      <div ref={ref} style={{background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: 320, maxWidth: 360, marginTop: 60, padding: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.18s'}}>
        <div style={{padding: '16px 16px 0 16px'}}>
          <div style={{fontWeight: 600, fontSize: 15, marginBottom: 8}}>Chọn khoảng ngày lập</div>
          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); onChange({ dateFrom: e.target.value, dateTo }); }}
              style={{flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 15}}
            />
            <span style={{margin: '0 4px'}}>-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); onChange({ dateFrom, dateTo: e.target.value }); }}
              style={{flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 15}}
            />
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px'}}>
          <button
            style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 24px'}}
            onClick={() => onClose({ dateFrom, dateTo })}
          >Tìm</button>
        </div>
      </div>
    </div>
  );
}
// Product picker modal used to search and select products
function ProductPickerModal({ visible, products, search, onSearchChange, selectedIds, toggleSelect, onAdd, onClose }) {
  const ref = React.useRef();
  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);
  const [headerFilters, setHeaderFilters] = React.useState({ code: '', name: '', barcode: '', type: '' });
  const [filterPopup, setFilterPopup] = React.useState({ col: null, left: 0, top: 0, value: '' });
  const [showAllFilterItems, setShowAllFilterItems] = React.useState(false);
  const [pageSize, setPageSize] = React.useState(10);
  const pageOptions = [10,20,50,100,200,500,1000,5000];
  const [currentPage, setCurrentPage] = React.useState(1);

  if (!visible) return null;

  // normalize string: remove diacritics and lowercase
  const normalize = (s) => {
    if (!s && s !== 0) return '';
    try {
      return String(s).normalize('NFD').replace(/\u0300|\u0301|\u0303|\u0309|\u0323|\u02C6|\u0306|\u031B|\u0302|\u0304|\u0306|\u030C|\u0307|\u0308|\u030A/g, '').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    } catch (e) {
      return String(s).toLowerCase();
    }
  };

  const filteredProducts = (products || []).filter(p => {
    const typeVal = (p.category || p.Category || p.itemType || p.ItemType || p.type || p.Type || '');
    const codeMatch = headerFilters.code ? normalize(p.code || p.Code || '').includes(normalize(headerFilters.code)) : true;
    const nameMatch = headerFilters.name ? normalize((p.name || p.nameVi || p.Name || '').toString()).includes(normalize(headerFilters.name)) : true;
    const barcodeMatch = headerFilters.barcode ? normalize(p.barcode || p.Barcode || '').includes(normalize(headerFilters.barcode)) : true;
    const typeMatch = headerFilters.type ? normalize(typeVal).includes(normalize(headerFilters.type)) : true;
    // also keep global search (top search box) for convenience
    const globalQ = normalize(search || '');
    const hay = `${p.name || p.nameVi || p.Name || ''} ${p.code || p.Code || ''} ${p.barcode || p.Barcode || ''}`;
    const globalMatch = globalQ ? normalize(hay).includes(globalQ) : true;
    return typeMatch && codeMatch && nameMatch && barcodeMatch && globalMatch;
  });

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));

  // pagination for filtered products
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / Math.max(1, pageSize)));
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredProducts.length, pageSize, totalPages]);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);

  const openFilterPopup = (col, e) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const modalRect = ref.current ? ref.current.getBoundingClientRect() : { left: 0, top: 0 };
      const scrollLeft = ref.current ? ref.current.scrollLeft || 0 : 0;
      const scrollTop = ref.current ? ref.current.scrollTop || 0 : 0;
      const left = rect.left - modalRect.left + scrollLeft;
      const top = rect.bottom - modalRect.top + scrollTop + 6;
      setShowAllFilterItems(false);
      setFilterPopup({ col, left, top, value: headerFilters[col] || '' });
    } catch (err) {
      setFilterPopup({ col, left: 20, top: 40, value: headerFilters[col] || '' });
    }
  };

  const closeFilterPopup = () => setFilterPopup({ col: null, left: 0, top: 0, value: '' });

  const applyFilterFromPopup = () => {
    if (!filterPopup.col) return;
    setHeaderFilters(f => ({ ...f, [filterPopup.col]: filterPopup.value }));
    closeFilterPopup();
  };

  const clearFilterFromPopup = () => {
    if (!filterPopup.col) return;
    setHeaderFilters(f => ({ ...f, [filterPopup.col]: '' }));
    closeFilterPopup();
  };

  return (
    <div className="modal-overlay" style={{alignItems: 'flex-start', justifyContent: 'center'}}>
      <div ref={ref} className="product-picker-modal" style={{background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', minWidth: '96vw', maxWidth: '96vw', width: '96vw', marginTop: 12, padding: 0, zIndex: 1200, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.18s', height: '88vh'}}>
        <div style={{padding: 12, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0'}}>
          <div style={{fontWeight: 700, fontSize: 16}}>Chọn hàng hóa</div>
          <div style={{flex: 1}} />
        </div>

        <div style={{padding: '8px 12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <div style={{fontSize: 13, color: '#666'}}>{filteredProducts.length === 0 ? '0 kết quả' : `Hiển thị ${(filteredProducts.length>0? ((currentPage-1)*pageSize+1):0)}-${Math.min(filteredProducts.length, currentPage*pageSize)} trên ${filteredProducts.length}`}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }} style={{borderRadius: 6, border: '1px solid #e5e7eb', padding: '6px 8px'}}>
                {pageOptions.map(opt => <option key={opt} value={opt}>{opt} / trang</option>)}
              </select>
              <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>{'<'}</button>
              <span style={{fontWeight: 600}}>{currentPage}/{totalPages}</span>
              <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>{'>'}</button>
            </div>
          </div>
        </div>

        <div className="product-picker-table-container">
          <table className="product-picker-table" style={{width: '100%', borderCollapse: 'collapse', minWidth: 760}}>
            <thead>
                <tr>
                  <th style={{width: 48, textAlign: 'left', paddingLeft: 10}}>
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={(e) => {
                        if (allFilteredSelected) {
                          // unselect all filtered
                          filteredProducts.forEach(p => { if (selectedIds.includes(p.id)) toggleSelect(p.id); });
                        } else {
                          // select all filtered
                          filteredProducts.forEach(p => { if (!selectedIds.includes(p.id)) toggleSelect(p.id); });
                        }
                      }}
                    />
                  </th>
                  <th style={{width: 140}}>Loại hàng <span className="picker-header-icon" onClick={(e) => { e.stopPropagation(); openFilterPopup('type', e); }}>🔍</span></th>
                  <th style={{width: 140}}>Mã vạch <span className="picker-header-icon" onClick={(e) => { e.stopPropagation(); openFilterPopup('barcode', e); }}>🔍</span></th>
                  <th style={{width: 140}}>Mã hàng <span className="picker-header-icon" onClick={(e) => { e.stopPropagation(); openFilterPopup('code', e); }}>🔍</span></th>
                  <th style={{minWidth: 260}}>Tên hàng <span className="picker-header-icon" onClick={(e) => { e.stopPropagation(); openFilterPopup('name', e); }}>🔍</span></th>
                  <th style={{width: 100}}>ĐVT</th>
                  <th style={{width: 120, textAlign: 'right'}}>Đơn giá</th>
                </tr>
                {/* Filters are handled by popup opened when clicking the magnifier icon */}
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign: 'center', padding: 28, color: '#bbb'}}>Không có kết quả</td></tr>
              ) : (
                pagedProducts.map(p => (
                  <tr key={p.id} className={selectedIds.includes(p.id) ? 'selected-row' : ''} style={{cursor: 'pointer'}} onClick={() => toggleSelect(p.id)}>
                    <td style={{textAlign: 'center', padding: 8}}>
                      <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(p.id); }} />
                    </td>
                    <td style={{padding: 8, verticalAlign: 'top'}}>{(p.category || p.Category || p.itemType || p.ItemType || p.type || p.Type) || ''}</td>
                    <td style={{padding: 8, verticalAlign: 'top'}}>{p.barcode || p.Barcode || ''}</td>
                    <td style={{padding: 8, verticalAlign: 'top'}}>{p.code || p.Code || ''}</td>
                    <td style={{padding: 8, verticalAlign: 'top'}}>
                      <div style={{fontWeight: 600}}>{p.name || p.nameVi || p.Name || ''}</div>
                      <div style={{color: '#666', fontSize: 13}}>{(p.code || p.Code ? `${p.code || p.Code}` : '')}{(p.barcode || p.Barcode) ? ` • ${p.barcode || p.Barcode}` : ''}</div>
                    </td>
                    <td style={{padding: 8, verticalAlign: 'top'}}>{p.defaultUnit || p.DefaultUnit || p.unit || ''}</td>
                    <td style={{padding: 8, verticalAlign: 'top', textAlign: 'right', fontWeight: 600}}>{(p.retailPrice || p.RetailPrice) ? Number(p.retailPrice || p.RetailPrice).toLocaleString('vi-VN') : ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filterPopup.col && (
          <div className="picker-filter-popup" style={{position: 'absolute', left: filterPopup.left, top: filterPopup.top, zIndex: 1301}} onClick={e => e.stopPropagation()}>
            <div className="picker-filter-popup-box">
              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <input className="picker-filter-input" autoFocus placeholder={`Tìm ${filterPopup.col}`} value={filterPopup.value} onChange={e => setFilterPopup(p => ({...p, value: e.target.value}))} />
                <button className="picker-filter-btn" onClick={applyFilterFromPopup}>Áp dụng</button>
              </div>
              <div style={{marginTop: 8}}>
                {(() => {
                  const col = filterPopup.col;
                  const valGetter = (p) => {
                    if (col === 'type') return (p.category || p.Category || p.itemType || p.ItemType || p.type || p.Type || '');
                    if (col === 'barcode') return (p.barcode || p.Barcode || '');
                    if (col === 'code') return (p.code || p.Code || '');
                    if (col === 'name') return (p.name || p.nameVi || p.Name || '');
                    return '';
                  };
                  const allUnique = Array.from(new Set((products || []).map(valGetter).filter(x => x && String(x).trim() !== '') ));
                  const q = normalize(filterPopup.value || '');
                  const filtered = q ? allUnique.filter(u => normalize(u).includes(q)) : allUnique;
                  const unique = showAllFilterItems ? filtered : filtered.slice(0, 40);
                  if (unique.length === 0) return <div style={{color: '#999', padding: 8}}>Không có gợi ý</div>;
                  return (
                    <>
                      <div className="picker-filter-list" style={{maxHeight: 180, overflowY: 'auto', paddingRight: 6}}>
                        {unique.map(u => (
                          <label key={u} className="picker-filter-item" style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer'}} onClick={() => setFilterPopup(p => ({...p, value: (p.value === u ? '' : u)}))}>
                            <input type="checkbox" readOnly checked={filterPopup.value === u} />
                            <span style={{fontSize: 14}}>{u}</span>
                          </label>
                        ))}
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8}}>
                        <button className="picker-filter-viewall" onClick={() => setShowAllFilterItems(s => !s)}>{showAllFilterItems ? 'Thu gọn' : 'Xem tất cả'}</button>
                        <div style={{display: 'flex', gap: 8}}>
                          <button className="picker-filter-clear" onClick={clearFilterFromPopup}>Xóa</button>
                          <button className="picker-filter-apply" onClick={applyFilterFromPopup}>Tìm</button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f0f0f0'}}>
          <div style={{color: '#666', fontSize: 13}}>{selectedIds.length} đã chọn</div>
          <div>
            <button style={{background: '#f5f7fa', border: 'none', borderRadius: 6, color: '#888', fontWeight: 500, fontSize: 14, padding: '6px 12px', marginRight: 8}} onClick={() => onClose()}>Hủy</button>
            <button style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, padding: '8px 14px'}} onClick={() => onAdd()}>Thêm vào báo giá</button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default QuotationTable;
