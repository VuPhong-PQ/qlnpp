import { useState, useRef, useEffect } from 'react';
import { removeVietnameseTones } from '../utils/searchUtils';

export const useColumnFilter = () => {
  const [columnFilters, setColumnFilters] = useState({});
  const [showFilterPopup, setShowFilterPopup] = useState(null);
  const filterPopupRef = useRef(null);

  // Đóng filter popup khi click ra ngoài
  useEffect(() => {
    if (!showFilterPopup) return;
    const handleClickOutside = (e) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target)) {
        setShowFilterPopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPopup]);

  // Hàm filter dữ liệu với hỗ trợ tiếng Việt không dấu
  const applyFilters = (data, searchTerm = '', searchFields = []) => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
      // Search term filter - hỗ trợ tiếng Việt không dấu
      if (searchTerm && searchFields.length > 0) {
        const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
        const matchesSearch = searchFields.some(field => {
          const fieldValue = item[field]?.toString() || '';
          const normalizedValue = removeVietnameseTones(fieldValue.toLowerCase());
          return normalizedValue.includes(normalizedSearch);
        });
        if (!matchesSearch) return false;
      }

      // Column filters - hỗ trợ tiếng Việt không dấu
      for (const [key, value] of Object.entries(columnFilters)) {
        if (!value) continue;
        
        const itemValue = item[key];
        
        if (typeof value === 'object' && value.from !== undefined) {
          // Date range filters
          if (value.from && new Date(itemValue) < new Date(value.from)) return false;
          if (value.to && new Date(itemValue) > new Date(value.to)) return false;
        } else if (Array.isArray(value)) {
          // Multi-select filter: accept if item value matches any selected value
          const normalizedItemValue = removeVietnameseTones((itemValue?.toString() || '').toLowerCase());
          const anyMatch = value.some(v => {
            const nv = removeVietnameseTones(String(v).toLowerCase());
            return nv === normalizedItemValue || normalizedItemValue.includes(nv);
          });
          if (!anyMatch) return false;
        } else if (typeof value === 'string') {
          // Text filters - hỗ trợ tiếng Việt không dấu
          const normalizedFilter = removeVietnameseTones(value.toLowerCase());
          const normalizedItemValue = removeVietnameseTones((itemValue?.toString() || '').toLowerCase());
          if (!normalizedItemValue.includes(normalizedFilter)) return false;
        }
      }
      
      return true;
    });
  };

  // Render filter popup
  // data (optional) can be provided to show suggestion list (e.g., products array)
  const renderFilterPopup = (columnKey, columnLabel, isDateColumn = false, data = []) => {
    if (showFilterPopup !== columnKey) return null;

    const valGetter = (item) => {
      const col = columnKey;
      const v = item?.[col];
      return v || '';
    };

    function normalizeStr(s) {
      try {
        return removeVietnameseTones(String(s).toLowerCase());
      } catch { return String(s).toLowerCase(); }
    }

    const FilterPopup = ({ colKey, colLabel, isDate, sourceData }) => {
      const [q, setQ] = useState('');
      const [showAll, setShowAll] = useState(false);
      const initialSelected = (() => {
        const v = columnFilters[colKey];
        if (Array.isArray(v)) return v.slice();
        if (typeof v === 'string' && v) return [v];
        return [];
      })();
      const [selected, setSelected] = useState(initialSelected);

      useEffect(() => {
        const v = columnFilters[colKey];
        if (Array.isArray(v)) setSelected(v.slice());
        else if (typeof v === 'string' && v) setSelected([v]);
        else setSelected([]);
      }, [columnFilters[colKey]]);

      if (isDate) {
        return (
          <div 
            ref={filterPopupRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1200, background: '#fff', border: '1px solid #e6eef9', borderRadius: 8, padding: 10, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 6 }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>Lọc {colLabel}</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Từ ngày</label>
              <input
                type="date"
                value={columnFilters[colKey]?.from || ''}
                onChange={(e) => setColumnFilters({
                  ...columnFilters,
                  [colKey]: { ...columnFilters[colKey], from: e.target.value }
                })}
                style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Đến ngày</label>
              <input
                type="date"
                value={columnFilters[colKey]?.to || ''}
                onChange={(e) => setColumnFilters({
                  ...columnFilters,
                  [colKey]: { ...columnFilters[colKey], to: e.target.value }
                })}
                style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { const newFilters = { ...columnFilters }; delete newFilters[colKey]; setColumnFilters(newFilters); }} style={{ flex: 1, padding: '6px 12px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Xóa lọc</button>
              <button onClick={() => setShowFilterPopup(null)} style={{ flex: 1, padding: '6px 12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Áp dụng</button>
            </div>
          </div>
        );
      }

      const allUnique = Array.from(new Set((sourceData || []).map(valGetter).filter(x => x && String(x).trim() !== '')));
      const filtered = q ? allUnique.filter(u => normalizeStr(u).includes(normalizeStr(q))) : allUnique;
      const visibleList = showAll ? filtered : filtered.slice(0, 40);

      return (
        <div ref={filterPopupRef} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1200, background: '#fff', border: '1px solid #e6eef9', borderRadius: 8, padding: 10, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 6 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Tìm {colLabel}</div>
          <input type="text" placeholder={`Tìm ${colLabel.toLowerCase()}...`} value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 6 }} />
          <div style={{ marginTop: 8 }}>
            {visibleList.length === 0 ? (
              <div style={{ color: '#999', padding: 8 }}>Không có gợi ý</div>
            ) : (
              <div className="column-filter-popup-list" style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 6 }}>
                {visibleList.map(u => (
                  <label key={u} className="column-filter-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.includes(u)} onChange={() => {
                      setSelected(s => {
                        const exists = s.includes(u);
                        if (exists) return s.filter(x => x !== u);
                        return [...s, u];
                      });
                    }} />
                    <span style={{ fontSize: 14 }}>{u}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button className="column-filter-viewall" onClick={() => setShowAll(a => !a)}>{showAll ? 'Thu gọn' : 'Xem tất cả'}</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="column-filter-clear" onClick={() => { setSelected([]); const newFilters = { ...columnFilters }; delete newFilters[colKey]; setColumnFilters(newFilters); }}>Xóa</button>
              <button className="column-filter-apply" onClick={() => {
                const newFilters = { ...columnFilters };
                if (selected.length === 0) delete newFilters[colKey];
                else if (selected.length === 1) newFilters[colKey] = selected[0];
                else newFilters[colKey] = selected.slice();
                setColumnFilters(newFilters);
                setShowFilterPopup(null);
              }}>Tìm</button>
            </div>
          </div>
        </div>
      );
    };

    return <FilterPopup colKey={columnKey} colLabel={columnLabel} isDate={isDateColumn} sourceData={data} />;
  };

  return {
    columnFilters,
    setColumnFilters,
    showFilterPopup,
    setShowFilterPopup,
    applyFilters,
    renderFilterPopup
  };
};

export default useColumnFilter;
