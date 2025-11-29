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
  { key: 'unit', title: 'Đvt' },
  { key: 'price', title: 'Đơn giá' },
  { key: 'unit1', title: 'Đvt 1' },
  { key: 'price1', title: 'Đơn giá 1' },
  { key: 'note', title: 'Ghi chú' },
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
function ResizableTh({ children, width, onResize, isLast, ...props }) {
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
        position: 'relative',
        borderRight: isLast ? undefined : '1px solid #e0e0e0',
        backgroundClip: 'padding-box',
        boxSizing: 'border-box',
      }}
      {...props}
    >
      <div className="th-content">{children}</div>
      <div className="resize-handle" onMouseDown={handleMouseDown} />
    </th>
  );
}
function QuotationTable() {
  // State for left panel (quotation list)
  const [quotations, setQuotations] = useState(initialQuotations);
  const [selectedQuotation, setSelectedQuotation] = useState(initialQuotations[0]);
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
const QUOTATION_RIGHT_COLS_KEY = 'quotation_detail_table_cols_v1';
const getInitialRightCols = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(QUOTATION_RIGHT_COLS_KEY));
    if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
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

  // Lưu cấu hình cột vào localStorage
  const saveRightColConfig = (visibleCols, order) => {
    localStorage.setItem(QUOTATION_RIGHT_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveRightColConfig(rightVisibleCols, rightColOrder);
  }, [rightVisibleCols, rightColOrder]);
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
    ? quotationDetails.filter(d => d.quotationCode === selectedQuotation.code)
    : [];

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
              <div style={{padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}} onClick={(e) => { e.stopPropagation(); setSelectedQuotation(contextMenu.quotation); setContextMenu({ visible: false, x:0, y:0, quotation: null }); }}>
                <span style={{color: '#4f8cff'}}>✏️</span>
                <span>Xem chi tiết</span>
              </div>
              <div style={{height: 1, background: '#f0f0f0'}} />
              <div style={{padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}} onClick={(e) => {
                e.stopPropagation();
                const q = contextMenu.quotation;
                if (!q) return;
                if (window.confirm('Bạn có chắc muốn xóa báo giá ' + q.code + ' ?')) {
                  setQuotations(prev => prev.filter(x => x.id !== q.id));
                  if (selectedQuotation?.id === q.id) setSelectedQuotation(null);
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
                    onClick={() => setSelectedQuotation(q)}
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
                            <Button type="primary" icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); console.log('Sửa', q); }}>
                              Sửa
                            </Button>
                            <Popconfirm
                              title="Bạn có chắc muốn xóa?"
                              onConfirm={e => { e.stopPropagation(); console.log('Đã xóa', q); }}
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
                        value = q.date ? (new Date(q.date).toLocaleString('vi-VN', { hour12: false })) : '';
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
      <div className="right-panel" style={{borderRadius: 16, boxShadow: '0 2px 16px #e5e7eb', background: '#fff', padding: 0, width: '70%'}}>
        <div className="panel-header" style={{fontSize: 22, fontWeight: 700, padding: '24px 24px 8px 24px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span>THÔNG TIN BÁO GIÁ</span>
            <button style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '6px 12px', boxShadow: '0 2px 8px #e5e7eb'}}>+ Tạo mới</button>
          </div>
          <div />
        </div>
        <div style={{padding: '0 24px 24px 24px'}}>
          {selectedQuotation ? (
            <>
              <div style={{display: 'flex', gap: 12, margin: '8px 0 6px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Số báo giá</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#f7f8fa'}} value={selectedQuotation.code} readOnly />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Ghi chú</div>
                  <textarea style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#f7f8fa', height: 36, minHeight: 36, lineHeight: '18px', resize: 'none'}} value={selectedQuotation.note} readOnly />
                </div>
              </div>

              <div style={{display: 'flex', gap: 12, margin: '6px 0 8px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Ngày lập</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#f7f8fa'}} value={new Date().toLocaleDateString('en-GB')} readOnly />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Chọn hàng hóa báo giá <span style={{color: '#bbb', marginLeft: 4}} title="Chọn từng hàng hóa hoặc tất cả"><span className="anticon">?</span></span></div>
                  <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                    <label><input type="radio" name="hhbg" disabled /> Tất cả hàng hóa</label>
                    <label><input type="radio" name="hhbg" checked readOnly /> Chọn từng hàng hóa</label>
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: 12, margin: '6px 0 8px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Loại báo giá</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#f7f8fa'}} value={selectedQuotation.quotationType} readOnly />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Người lập</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, fontSize: 15, background: '#f7f8fa'}} value={selectedQuotation.employee} readOnly />
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
              <div className="table-scroll-x" style={{borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafbfc'}}>
                <table className="quotation-detail-table" style={{minWidth: 800}}>
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
                      detailRows.map((row, rowIdx) => (
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
                            let value = row[key];
                            // Format giá
                            if ((key === 'price' || key === 'price1') && value) {
                              value = Number(value).toLocaleString('vi-VN');
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
              <div style={{margin: '12px 0 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 15}}>
                <button style={{background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📁</span> Lưu lại</button>
                <button style={{background: '#7d3cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">🖨</span> In A4</button>
                <button style={{background: '#00c48c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📤</span> Xuất Excel</button>
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
export default QuotationTable;
