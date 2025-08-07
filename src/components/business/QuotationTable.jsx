// Cấu hình cột mặc định cho bảng bên trái (danh sách báo giá)
const defaultLeftColumns = [
  { key: 'code', title: 'Số báo giá' },
  { key: 'date', title: 'Ngày lập' },
  { key: 'quotationType', title: 'Loại báo giá' },
  { key: 'actions', title: '' },
];

// Cấu hình cột mặc định cho bảng bên phải (chi tiết báo giá)
const defaultRightColumns = [
  { key: 'product', title: 'Hàng hóa' },
  { key: 'unit', title: 'Đơn vị' },
  { key: 'quantity', title: 'Số lượng' },
  { key: 'price', title: 'Đơn giá' },
  { key: 'total', title: 'Thành tiền' },
  { key: 'actions', title: '' },
];

import React, { useState, useRef } from 'react';
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
import './QuotationTable.css';

// Column settings modal component
function ColumnSettings({ columns, visibleColumns, setVisibleColumns, onClose, onReset, onDragEnd }) {
  // Chia nhóm: chưa cố định (có thể kéo thả), cố định phải (không kéo thả)
  const fixedRight = columns.filter(col => col.key === 'actions');
  const normalCols = columns.filter(col => col.key !== 'actions');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const ref = useRef();

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleDragStart = (idx) => setDraggedIndex(idx);
  const handleDragOver = (idx) => setDragOverIndex(idx);
  const handleDrop = () => {
    if (draggedIndex === null || dragOverIndex === null) return;
    const newOrder = [...visibleColumns];
    const normalKeys = normalCols.map(c => c.key);
    // Chỉ reorder trong nhóm chưa cố định
    const currentOrder = visibleColumns.filter(k => normalKeys.includes(k));
    const [removed] = currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(dragOverIndex, 0, removed);
    // Ghép lại với nhóm cố định phải
    const newVisible = [...currentOrder, ...visibleColumns.filter(k => !normalKeys.includes(k))];
    setVisibleColumns(newVisible);
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (onDragEnd) onDragEnd(newVisible);
  };

  // Header checkbox: bật/tắt tất cả
  const allChecked = normalCols.every(col => visibleColumns.includes(col.key)) && fixedRight.every(col => visibleColumns.includes(col.key));
  const handleAllCheck = () => {
    if (allChecked) {
      setVisibleColumns([]);
    } else {
      setVisibleColumns(columns.map(c => c.key));
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
          <button className="popup-reset-btn" onClick={onReset}>Làm lại</button>
        </div>
        <div className="popup-group-label">Chưa cố định</div>
        <div className="popup-list">
          {normalCols.map((col, idx) => (
            <div
              key={col.key}
              className={`setting-row${visibleColumns.includes(col.key) ? '' : ' hidden'}${draggedIndex === idx ? ' dragging' : ''}${dragOverIndex === idx ? ' dragover' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
              onDrop={handleDrop}
              style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'grab'}}
            >
              <span className="drag-icon" style={{fontSize: 16, color: '#bbb', cursor: 'grab'}}>⋮⋮</span>
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
function ResizableTh({ children, width, onResize, ...props }) {
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
    <th ref={thRef} style={{ width }} {...props}>
      <div className="th-content">{children}</div>
      <div className="resize-handle" onMouseDown={handleMouseDown} />
    </th>
  );
}
function QuotationTable() {
  // State for left panel (quotation list)
  const [quotations, setQuotations] = useState(initialQuotations);
  const [selectedQuotation, setSelectedQuotation] = useState(initialQuotations[0]);
  const [leftVisibleCols, setLeftVisibleCols] = useState(defaultLeftColumns.map(c => c.key));
  const [leftColWidths, setLeftColWidths] = useState([140, 180, 120, 120, 60]);
  const [showLeftSettings, setShowLeftSettings] = useState(false);
  const [showLeftSearch, setShowLeftSearch] = useState(false);
  const [leftSearch, setLeftSearch] = useState({ code: '', dateFrom: '', dateTo: '' });

  // State for right panel (quotation details)
  const [rightVisibleCols, setRightVisibleCols] = useState(defaultRightColumns.map(c => c.key));
  const [rightColWidths, setRightColWidths] = useState(defaultRightColumns.map(() => 120));
  const [showRightSettings, setShowRightSettings] = useState(false);

  // Lọc danh sách báo giá theo tìm kiếm
  const filteredQuotations = quotations.filter(q =>
    (!leftSearch.code || q.code.toLowerCase().includes(leftSearch.code.toLowerCase()))
  );

  // Handlers for column resizing
  const handleLeftResize = (idx, w) => {
    setLeftColWidths(widths => widths.map((v, i) => (i === idx ? w : v)));
  };
  const handleRightResize = (idx, w) => {
    setRightColWidths(widths => widths.map((v, i) => (i === idx ? w : v)));
  };

  // Reset columns
  const resetLeftCols = () => setLeftVisibleCols(defaultLeftColumns.map(c => c.key));
  const resetRightCols = () => setRightVisibleCols(defaultRightColumns.map(c => c.key));
  return (
    <div className="quotation-table-page" style={{background: '#f7f8fa', minHeight: '100vh', padding: 16, display: 'flex', gap: 16}}>
      {/* Left 30% panel */}
      <div className="left-panel" style={{borderRadius: 16, boxShadow: '0 2px 16px #e5e7eb', marginRight: 0, background: '#fff', padding: 0, width: '30%'}}>
        <div className="panel-header" style={{fontSize: 22, fontWeight: 700, padding: '24px 24px 8px 24px', border: 'none'}}>
          DANH SÁCH BÁO GIÁ
        </div>
        <div style={{padding: '0 24px 8px 24px'}}>
          <div style={{margin: '8px 0 12px 0', fontSize: 16}}>Tổng {filteredQuotations.length}</div>
          <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
            <button style={{background: '#a259ec', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}}>C</button>
            <button style={{background: '#ff6f91', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}}>I</button>
            <button style={{background: '#888', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}} onClick={() => setShowLeftSettings(true)}><span className="anticon">⚙</span></button>
          </div>
          <div style={{overflowX: 'auto', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafbfc'}}>
            <table className="quotation-list-table" style={{minWidth: 320}}>
              <thead>
                <tr>
                  {defaultLeftColumns.map((col, idx) =>
                    leftVisibleCols.includes(col.key) ? (
                      <ResizableTh
                        key={col.key}
                        width={leftColWidths[idx]}
                        onResize={w => handleLeftResize(idx, w)}
                      >
                        {col.title}
                        {col.key === 'code' && (
                          <span style={{marginLeft: 8, color: '#bbb', cursor: 'pointer'}} onClick={e => { e.stopPropagation(); setShowLeftSearch('code'); }}><span className="anticon">🔍</span></span>
                        )}
                        {col.key === 'date' && (
                          <span style={{marginLeft: 8, color: '#bbb', cursor: 'pointer'}} onClick={e => { e.stopPropagation(); setShowLeftSearch('date'); }}><span className="anticon">🔍</span></span>
                        )}
                      </ResizableTh>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q, idx) => (
                  <tr
                    key={q.id}
                    className={selectedQuotation?.id === q.id ? 'selected' : ''}
                    onClick={() => setSelectedQuotation(q)}
                  >
                    {defaultLeftColumns.map((col, colIdx) => {
                      if (!leftVisibleCols.includes(col.key)) return null;
                      let value = null;
                      if (col.key === 'actions') {
                        value = (
                          <div style={{display: 'flex', gap: 8}}>
                            <button style={{background: '#4f8cff', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18}} title="Sửa"><span className="anticon">📝</span></button>
                            <button style={{background: '#ff6f91', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18}} title="Xóa"><span className="anticon">🗑️</span></button>
                          </div>
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
            Dòng 1-{filteredQuotations.length} trên tổng {filteredQuotations.length} dòng
            <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28, marginLeft: 8}}>{'<'}</button>
            <span style={{fontWeight: 600}}>1</span>
            <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}}>{'>'}</button>
            <select style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
              <option>10 / trang</option>
            </select>
          </div>
        </div>
        {showLeftSettings && (
          <div className="settings-modal-overlay">
            <ColumnSettings
              columns={defaultLeftColumns}
              visibleColumns={leftVisibleCols}
              setVisibleColumns={setLeftVisibleCols}
              onClose={() => setShowLeftSettings(false)}
              onReset={resetLeftCols}
              onDragEnd={cols => setLeftVisibleCols(cols)}
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
          <span>THÔNG TIN BÁO GIÁ</span>
          <button style={{background: '#1677ff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}>+ Tạo mới</button>
        </div>
        <div style={{padding: '0 24px 24px 24px'}}>
          {selectedQuotation ? (
            <>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, margin: '16px 0 8px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Số báo giá</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 16, background: '#f7f8fa'}} value={selectedQuotation.code} readOnly />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Ngày lập</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 16, background: '#f7f8fa'}} value={new Date().toLocaleDateString('en-GB')} readOnly />
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}><span style={{color: '#ff6f91'}}>*</span> Loại báo giá</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 16, background: '#f7f8fa'}} value={selectedQuotation.quotationType} readOnly />
                </div>
                <div style={{flex: 2, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Ghi chú</div>
                  <textarea style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 16, background: '#f7f8fa', minHeight: 38}} value={selectedQuotation.note} readOnly />
                </div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, margin: '8px 0 16px 0'}}>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Chọn hàng hóa báo giá <span style={{color: '#bbb', marginLeft: 4}} title="Chọn từng hàng hóa hoặc tất cả"><span className="anticon">?</span></span></div>
                  <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
                    <label><input type="radio" name="hhbg" disabled /> Tất cả hàng hóa</label>
                    <label><input type="radio" name="hhbg" checked readOnly /> Chọn từng hàng hóa</label>
                  </div>
                </div>
                <div style={{flex: 1, minWidth: 220}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Người lập</div>
                  <input style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 16, background: '#f7f8fa'}} value={selectedQuotation.employee} readOnly />
                </div>
              </div>
              <div style={{margin: '8px 0 8px 0', fontWeight: 600, fontSize: 16}}>Tổng 0</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                <button style={{background: '#a259ec', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}}>C</button>
                <button style={{background: '#ff6f91', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}}>I</button>
                <button style={{background: '#888', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, boxShadow: '0 2px 8px #e5e7eb'}} onClick={() => setShowRightSettings(true)}><span className="anticon">⚙</span></button>
              </div>
              <div style={{overflowX: 'auto', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fafbfc'}}>
                <table className="quotation-detail-table" style={{minWidth: 800}}>
                  <thead>
                    <tr>
                      {defaultRightColumns.map((col, idx) =>
                        rightVisibleCols.includes(col.key) ? (
                          <ResizableTh
                            key={col.key}
                            width={rightColWidths[idx]}
                            onResize={w => handleRightResize(idx, w)}
                          >
                            {col.title}
                          </ResizableTh>
                        ) : null
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={rightVisibleCols.length} style={{textAlign: 'center', padding: 32, color: '#bbb'}}>
                        <div style={{fontSize: 48, marginBottom: 8}}><span className="anticon">📦</span></div>
                        <div>Trống</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15}}>
                <button style={{background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📁</span> Lưu lại</button>
                <button style={{background: '#7d3cff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">🖨</span> In A4</button>
                <button style={{background: '#00c48c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 20px', boxShadow: '0 2px 8px #e5e7eb'}}><span className="anticon">📤</span> Xuất Excel</button>
              </div>
              {showRightSettings && (
                <div className="settings-modal-overlay">
                  <ColumnSettings
                    columns={defaultRightColumns}
                    visibleColumns={rightVisibleCols}
                    setVisibleColumns={setRightVisibleCols}
                    onClose={() => setShowRightSettings(false)}
                    onReset={resetRightCols}
                    onDragEnd={cols => setRightVisibleCols(cols)}
                  />
                </div>
              )}
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
