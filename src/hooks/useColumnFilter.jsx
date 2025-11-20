import { useState, useRef, useEffect } from 'react';

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

  // Hàm filter dữ liệu
  const applyFilters = (data, searchTerm = '', searchFields = []) => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
      // Search term filter
      if (searchTerm && searchFields.length > 0) {
        const matchesSearch = searchFields.some(field => 
          item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matchesSearch) return false;
      }

      // Column filters
      for (const [key, value] of Object.entries(columnFilters)) {
        if (!value) continue;
        
        const itemValue = item[key];
        
        if (typeof value === 'object' && value.from !== undefined) {
          // Date range filters
          if (value.from && new Date(itemValue) < new Date(value.from)) return false;
          if (value.to && new Date(itemValue) > new Date(value.to)) return false;
        } else if (typeof value === 'string') {
          // Text filters
          if (!itemValue?.toString().toLowerCase().includes(value.toLowerCase())) return false;
        }
      }
      
      return true;
    });
  };

  // Render filter popup
  const renderFilterPopup = (columnKey, columnLabel, isDateColumn = false) => {
    if (showFilterPopup !== columnKey) return null;

    return (
      <div 
        ref={filterPopupRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '12px',
          minWidth: '250px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          marginTop: '4px'
        }}
      >
        {isDateColumn ? (
          <>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>Lọc {columnLabel}</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Từ ngày</label>
              <input
                type="date"
                value={columnFilters[columnKey]?.from || ''}
                onChange={(e) => setColumnFilters({
                  ...columnFilters,
                  [columnKey]: { ...columnFilters[columnKey], from: e.target.value }
                })}
                style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Đến ngày</label>
              <input
                type="date"
                value={columnFilters[columnKey]?.to || ''}
                onChange={(e) => setColumnFilters({
                  ...columnFilters,
                  [columnKey]: { ...columnFilters[columnKey], to: e.target.value }
                })}
                style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>Tìm {columnLabel}</div>
            <input
              type="text"
              placeholder={`Nhập ${columnLabel.toLowerCase()}...`}
              value={columnFilters[columnKey] || ''}
              onChange={(e) => setColumnFilters({ ...columnFilters, [columnKey]: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '6px 8px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '4px',
                marginBottom: '12px'
              }}
            />
          </>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              const newFilters = { ...columnFilters };
              delete newFilters[columnKey];
              setColumnFilters(newFilters);
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Xóa lọc
          </button>
          <button
            onClick={() => setShowFilterPopup(null)}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>
    );
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
