import React, { useEffect, useMemo, useState } from 'react';
import '../setup/SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';

export default function GroupPermissionModal({ show, onClose, onSave, user }) {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState({}); // { catId: { view:true,... } }
  const [rowChecked, setRowChecked] = useState({}); // selected rows
  const [selectAllRows, setSelectAllRows] = useState(false);
  // pagination & search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!show) return;
    loadCategories();
  }, [show]);

  const loadCategories = async () => {
    try {
      const data = API_ENDPOINTS.productCategories ? await api.get(API_ENDPOINTS.productCategories) : [];
      setCategories(data || []);
      // init selections
      const s = {};
      const rc = {};
      (data || []).forEach(c => {
        const key = c.id || c.code || c.name;
        s[key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
        rc[key] = false;
      });
      setSelected(s);
      setRowChecked(rc);
      setSelectAllRows(false);
      setPage(1);
      setSearch('');
    } catch (e) {
      console.error('Load categories failed', e);
      setCategories([]);
    }
  };

  const togglePerm = (catKey, field) => {
    setSelected(prev => ({ ...prev, [catKey]: { ...prev[catKey], [field]: !prev[catKey][field] } }));
  };

  const toggleRow = (catKey, checked) => {
    setRowChecked(prev => {
      const next = { ...prev, [catKey]: checked };
      // update selectAllRows state based on visible keys
      const vis = visibleKeys();
      const allSelected = vis.length > 0 && vis.every(k => next[k]);
      setSelectAllRows(allSelected);
      return next;
    });
  };

  const handleSelectAllRows = (checked) => {
    // apply select all only to visible rows (current page & filtered)
    const next = { ...rowChecked };
    const visible = visibleKeys();
    visible.forEach(k => next[k] = checked);
    setRowChecked(next);
    setSelectAllRows(checked);
  };

  const applyHeaderToggle = (field, checked) => {
    // apply to all checked rows
    const next = { ...selected };
    Object.keys(rowChecked).forEach(k => {
      if (rowChecked[k]) next[k] = { ...next[k], [field]: checked };
    });
    setSelected(next);
  };

  const handleSave = async () => {
    // Build payload: list of ProductCategoryPermission objects
    const permissions = [];
    Object.keys(selected).forEach(key => {
      if (!rowChecked[key]) return;
      const p = selected[key];
      // Find the category to get its ID
      const cat = categories.find(c => (c.id || c.code || c.name) === key);
      if (!cat) return;
      
      permissions.push({
        userId: user?.id,
        productCategoryId: cat.id,
        canView: !!p.view,
        canAdd: !!p.add,
        canEdit: !!p.edit,
        canDelete: !!p.delete,
        canViewPrice: !!p.view,
        canEditPrice: !!p.edit,
        canViewStock: !!p.view
      });
    });

    try {
      // Use productCategoryPermissions API
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
    }
  };

  // filtering and pagination helpers
  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter(c => {
      const code = (c.code || c.id || '').toString().toLowerCase();
      const name = (c.name || c.title || '').toString().toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [categories, search]);

  const totalPages = () => Math.max(1, Math.ceil((filteredCategories || []).length / pageSize));

  const pagedCategories = () => {
    const start = (page - 1) * pageSize;
    return (filteredCategories || []).slice(start, start + pageSize);
  };

  const visibleKeys = () => pagedCategories().map((c, idx) => (c.id || c.code || c.name || idx));

  const countInfo = () => {
    const total = (filteredCategories || []).length;
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    return `${start}-${end} / ${total}`;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const tp = totalPages();
    const start = Math.max(1, page - 2);
    const end = Math.min(tp, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} className={`btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i}</button>
      );
    }
    return pages;
  };

  // keep selectAllRows in sync when page/filter/selection changes
  useEffect(() => {
    const vis = visibleKeys();
    const all = vis.length > 0 && vis.every(k => !!rowChecked[k]);
    setSelectAllRows(all);
  }, [page, pageSize, search, categories, rowChecked]);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90%', maxWidth: '1200px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>PHÂN QUYỀN NHÓM HÀNG</h3>
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: 12, top: 8 }}>×</button>
        </div>

        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm kiếm nhóm / mã" style={{ flex: 1, padding: 8, marginRight: 12, borderRadius: 4, border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13 }}>Số hàng:</label>
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} style={{ padding: 6 }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <button className="btn btn-danger" style={{ padding: '6px 12px', height: 36 }}>Xóa</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#cfeefb' }}>
                  <th style={{ padding: 10, border: '1px solid #eaeaea' }}><input type="checkbox" checked={selectAllRows} onChange={(e) => handleSelectAllRows(e.target.checked)} /></th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea' }}>Mã</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea' }}>Tên</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('view', e.target.checked)} /> Xem</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('add', e.target.checked)} /> Thêm</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('edit', e.target.checked)} /> Sửa</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('delete', e.target.checked)} /> Xóa</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('print', e.target.checked)} /> In phiếu</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('import', e.target.checked)} /> Import</th>
                  <th style={{ padding: 10, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" onChange={(e) => applyHeaderToggle('export', e.target.checked)} /> Export</th>
                </tr>
              </thead>
              <tbody>
                {pagedCategories().map((c, idx) => {
                  const key = c.id || c.code || c.name || idx;
                  const sel = selected[key] || { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
                  return (
                    <tr key={key}>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!rowChecked[key]} onChange={(e) => toggleRow(key, e.target.checked)} />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea' }}>{c.code || c.id || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea' }}>{c.name || c.title || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.view} onChange={() => togglePerm(key, 'view')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.add} onChange={() => togglePerm(key, 'add')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.edit} onChange={() => togglePerm(key, 'edit')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.delete} onChange={() => togglePerm(key, 'delete')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.print} onChange={() => togglePerm(key, 'print')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.import} onChange={() => togglePerm(key, 'import')} /></td>
                      <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}><input type="checkbox" checked={!!sel.export} onChange={() => togglePerm(key, 'export')} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 13 }}>{countInfo()}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn" onClick={() => setPage(1)} disabled={page === 1}>⏮</button>
              <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
              {renderPageNumbers()}
              <button className="btn" onClick={() => setPage(p => Math.min(totalPages(), p + 1))} disabled={page === totalPages()}>▶</button>
              <button className="btn" onClick={() => setPage(totalPages())} disabled={page === totalPages()}>⏭</button>
            </div>
          </div>

          <div style={{ marginTop: 12, color: '#d9534f', fontSize: 13 }}>* Lưu ý: Các quyền thêm, sửa, xóa, in phiếu, xuất file sẽ được lưu lại khi có quyền truy cập.</div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSave}>Đồng ý</button>
            <button className="btn btn-danger" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
