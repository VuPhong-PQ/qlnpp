import React, { useEffect, useMemo, useState } from 'react';
import '../setup/SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { vietnameseSearch } from '../../utils/searchUtils';

export default function GroupPermissionModal({ show, onClose, onSave, user }) {
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set()); // Set of selected category IDs
  const [loading, setLoading] = useState(false);
  // pagination & search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  // Column search states
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchNote, setSearchNote] = useState('');
  const [activeSearchCol, setActiveSearchCol] = useState(null); // 'code' | 'name' | 'note' | null

  useEffect(() => {
    if (!show) return;
    loadData();
  }, [show, user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load all categories
      const data = API_ENDPOINTS.productCategories ? await api.get(API_ENDPOINTS.productCategories) : [];
      setCategories(data || []);

      // Load existing permissions for this user
      if (user?.id) {
        const permsRes = await fetch(`${API_ENDPOINTS.productCategoryPermissions}/user/${user.id}`);
        if (permsRes.ok) {
          const perms = await permsRes.json();
          const ids = new Set();
          (perms || []).forEach(p => {
            if (p.canView || p.CanView) {
              ids.add(p.productCategoryId || p.ProductCategoryId);
            }
          });
          setSelectedIds(ids);
        }
      }
      setPage(1);
      setSearch('');
    } catch (e) {
      console.error('Load categories failed', e);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(categories.map(c => c.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSave = async () => {
    // Build payload: list of ProductCategoryPermission objects for selected categories
    const permissions = [];
    selectedIds.forEach(catId => {
      permissions.push({
        userId: user?.id,
        productCategoryId: catId,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canViewPrice: true,
        canEditPrice: true,
        canViewStock: true
      });
    });

    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.productCategoryPermissions}/user/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
      
      if (response.ok) {
        alert('Lưu phân quyền nhóm hàng thành công!');
        if (onSave) onSave(permissions);
        onClose();
      } else {
        const err = await response.json();
        alert(err.message || 'Lưu thất bại');
      }
    } catch (err) {
      console.error('Save group permissions failed', err);
      alert('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  // filtering and pagination helpers
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const code = (c.code || c.id || '').toString();
      const name = (c.name || c.title || '').toString();
      const note = (c.note || '').toString();
      
      // Check each column filter using Vietnamese search
      if (searchCode && !vietnameseSearch(code, searchCode)) return false;
      if (searchName && !vietnameseSearch(name, searchName)) return false;
      if (searchNote && !vietnameseSearch(note, searchNote)) return false;
      
      return true;
    });
  }, [categories, searchCode, searchName, searchNote]);

  const totalPages = Math.max(1, Math.ceil((filteredCategories || []).length / pageSize));

  const pagedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (filteredCategories || []).slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  const countInfo = () => {
    const total = (filteredCategories || []).length;
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    return `Dòng ${start}-${end} trên tổng ${total} dòng`;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          style={{
            width: 32, height: 32, border: '1px solid #ddd', borderRadius: 4,
            background: i === page ? '#1890ff' : '#fff', color: i === page ? '#fff' : '#333',
            cursor: 'pointer', fontWeight: i === page ? 600 : 400
          }}
        >
          {i}
        </button>
      );
    }
    if (end < totalPages) {
      pages.push(<span key="dots" style={{ padding: '0 4px' }}>···</span>);
      pages.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          style={{
            width: 32, height: 32, border: '1px solid #ddd', borderRadius: 4,
            background: '#fff', color: '#333', cursor: 'pointer'
          }}
        >
          {totalPages}
        </button>
      );
    }
    return pages;
  };

  const isAllSelected = categories.length > 0 && categories.every(c => selectedIds.has(c.id));

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 'calc(100% - 32px)', height: 'calc(100% - 32px)', margin: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 14, color: '#666' }}>Tổng {categories.length}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadData} style={{ width: 36, height: 36, borderRadius: 4, border: 'none', background: '#17a2b8', color: '#fff', cursor: 'pointer' }} title="Làm mới">↻</button>
            <button style={{ width: 36, height: 36, borderRadius: 4, border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' }} title="Xóa chọn" onClick={() => setSelectedIds(new Set())}>🗑</button>
            <button style={{ width: 36, height: 36, borderRadius: 4, border: 'none', background: '#6c757d', color: '#fff', cursor: 'pointer' }} title="Cài đặt">⚙</button>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#cfeefb', position: 'sticky', top: 0 }}>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', width: 50 }}>
                  <input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} style={{ width: 18, height: 18 }} />
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', textAlign: 'left', position: 'relative' }}>
                  Mã loại{' '}
                  <span style={{ cursor: 'pointer', opacity: searchCode ? 1 : 0.5, color: searchCode ? '#1890ff' : 'inherit' }} onClick={() => setActiveSearchCol(activeSearchCol === 'code' ? null : 'code')}>🔍</span>
                  {activeSearchCol === 'code' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tìm mã loại..."
                        value={searchCode}
                        onChange={e => { setSearchCode(e.target.value); setPage(1); }}
                        style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, width: 160 }}
                        onKeyDown={e => e.key === 'Escape' && setActiveSearchCol(null)}
                      />
                      {searchCode && <button onClick={() => { setSearchCode(''); setPage(1); }} style={{ marginLeft: 4, padding: '4px 8px', border: 'none', background: '#e74c3c', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>×</button>}
                    </div>
                  )}
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', textAlign: 'left', position: 'relative' }}>
                  Tên loại{' '}
                  <span style={{ cursor: 'pointer', opacity: searchName ? 1 : 0.5, color: searchName ? '#1890ff' : 'inherit' }} onClick={() => setActiveSearchCol(activeSearchCol === 'name' ? null : 'name')}>🔍</span>
                  {activeSearchCol === 'name' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tìm tên loại..."
                        value={searchName}
                        onChange={e => { setSearchName(e.target.value); setPage(1); }}
                        style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, width: 160 }}
                        onKeyDown={e => e.key === 'Escape' && setActiveSearchCol(null)}
                      />
                      {searchName && <button onClick={() => { setSearchName(''); setPage(1); }} style={{ marginLeft: 4, padding: '4px 8px', border: 'none', background: '#e74c3c', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>×</button>}
                    </div>
                  )}
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  Không gộp đơn hàng <span style={{ cursor: 'pointer', opacity: 0.5 }}>▼</span>
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', textAlign: 'left', position: 'relative' }}>
                  Ghi chú{' '}
                  <span style={{ cursor: 'pointer', opacity: searchNote ? 1 : 0.5, color: searchNote ? '#1890ff' : 'inherit' }} onClick={() => setActiveSearchCol(activeSearchCol === 'note' ? null : 'note')}>🔍</span>
                  {activeSearchCol === 'note' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tìm ghi chú..."
                        value={searchNote}
                        onChange={e => { setSearchNote(e.target.value); setPage(1); }}
                        style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, width: 160 }}
                        onKeyDown={e => e.key === 'Escape' && setActiveSearchCol(null)}
                      />
                      {searchNote && <button onClick={() => { setSearchNote(''); setPage(1); }} style={{ marginLeft: 4, padding: '4px 8px', border: 'none', background: '#e74c3c', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>×</button>}
                    </div>
                  )}
                </th>
                <th style={{ padding: 12, borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  Ngưng hoạt động <span style={{ cursor: 'pointer', opacity: 0.5 }}>▼</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>Đang tải...</td></tr>
              )}
              {!loading && pagedCategories.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#999' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && pagedCategories.map((c, idx) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr
                    key={c.id || idx}
                    style={{ background: isSelected ? '#e3f2fd' : (idx % 2 === 0 ? '#fff' : '#fafafa'), cursor: 'pointer' }}
                    onClick={() => toggleCategory(c.id)}
                  >
                    <td style={{ padding: 12, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: 18, height: 18 }} />
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{c.code || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{c.name || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      {c.noGroupOrder ? (
                        <span style={{ color: '#2ecc71', fontSize: 18 }}>✓</span>
                      ) : (
                        <span style={{ color: '#e74c3c', fontSize: 18 }}>✗</span>
                      )}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #eee', color: '#999' }}>{c.note || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      {c.status === 'inactive' ? (
                        <span style={{ color: '#2ecc71', fontSize: 18 }}>✓</span>
                      ) : (
                        <span style={{ color: '#e74c3c', fontSize: 18 }}>✗</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#666' }}>{countInfo()}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{'<'}</button>
            {renderPageNumbers()}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{'>'}</button>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd' }}>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ padding: '10px 24px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ✓ Đồng ý
          </button>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ✗ Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
