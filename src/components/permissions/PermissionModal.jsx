import React, { useState, useEffect } from 'react';
import '../setup/SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';

const samplePermissions = [
  { key: 'customers', name: 'Khách hàng' },
  { key: 'products', name: 'Hàng hóa' },
  { key: 'orders', name: 'Đơn hàng' },
  { key: 'reports', name: 'Báo cáo' },
  { key: 'settings', name: 'Cấu hình' }
];

export default function PermissionModal({ show, onClose, onSave, user, isGroup=false }) {
  const [permissions, setPermissions] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    // init permissions (all false)
    const init = {};
    samplePermissions.forEach(p => {
      init[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
    });
    setPermissions(init);
    setSelectAll(false);
    setGroupName('');
  }, [show]);

  // load existing permissions for user when opening
  useEffect(() => {
    const load = async () => {
      if (!show || !user?.id) return;
      try {
        const endpoint = `${API_ENDPOINTS.users}/${user.id}/permissions`;
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();
        // data expected as array of { ResourceKey, CanView... }
        const next = {};
        samplePermissions.forEach(p => {
          const found = data.find(d => d.resourceKey === p.key || d.ResourceKey === p.key || d.resourceKey === p.name);
          if (found) {
            next[p.key] = {
              view: !!(found.CanView ?? found.canView),
              add: !!(found.CanAdd ?? found.canAdd),
              edit: !!(found.CanEdit ?? found.canEdit),
              delete: !!(found.CanDelete ?? found.canDelete),
              print: !!(found.CanPrint ?? found.canPrint),
              import: !!(found.CanImport ?? found.canImport),
              export: !!(found.CanExport ?? found.canExport)
            };
          } else {
            next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
          }
        });
        setPermissions(next);
        // set selectAll if all true
        const all = Object.values(next).length > 0 && Object.values(next).every(r => Object.values(r).every(Boolean));
        setSelectAll(all);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [show, user]);

  if (!show) return null;

  const togglePerm = (key, field) => {
    setPermissions(prev => ({ ...prev, [key]: { ...prev[key], [field]: !prev[key][field] } }));
  };

  const handleSelectAll = (checked) => {
    const next = {};
    samplePermissions.forEach(p => {
      next[p.key] = { view: checked, add: checked, edit: checked, delete: checked, print: checked, import: checked, export: checked };
    });
    setPermissions(next);
    setSelectAll(checked);
  };

  const handleSave = async () => {
    const payload = { userId: user?.id || null, groupName: groupName || null, permissions };

    // Try known endpoint patterns
    try {
      // 1) If explicit endpoint defined in API_ENDPOINTS
      if (API_ENDPOINTS.userPermissions) {
        // use PUT to update
        await api.put(API_ENDPOINTS.userPermissions, user?.id || '', payload);
        if (onSave) onSave({ user, isGroup, groupName, permissions });
        onClose();
        return;
      }

      // 2) Try /users/{id}/permissions if users endpoint exists (our backend controller expects a model like { Permissions: { resourceKey: { CanView... } } })
      if (API_ENDPOINTS.users && user?.id) {
        const endpoint = `${API_ENDPOINTS.users}/${user.id}/permissions`;
        const model = { Permissions: {} };
        // convert our frontend keys to backend DTO shape (CanView etc)
        Object.keys(permissions).forEach(key => {
          const p = permissions[key];
          model.Permissions[key] = {
            CanView: !!p.view,
            CanAdd: !!p.add,
            CanEdit: !!p.edit,
            CanDelete: !!p.delete,
            CanPrint: !!p.print,
            CanImport: !!p.import,
            CanExport: !!p.export
          };
        });

        // Use fetch directly to PUT the model (api.put helper constructs URL by appending id so avoid it here)
        try {
          await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(model)
          });
        } catch (e) {
          // Fallback to POST
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(model)
          });
        }

        if (onSave) onSave({ user, isGroup, groupName, permissions });
        onClose();
        return;
      }

      // 3) Try permission-groups endpoint
      if (API_ENDPOINTS.permissionGroups) {
        await api.post(API_ENDPOINTS.permissionGroups, payload);
        if (onSave) onSave({ user, isGroup, groupName, permissions });
        onClose();
        return;
      }

      // 4) Fallback: call onSave and close (no backend available)
      if (onSave) onSave({ user, isGroup, groupName, permissions });
      onClose();
    } catch (err) {
      console.error('Save permissions failed', err);
      alert('Lưu phân quyền thất bại. Vui lòng kiểm tra API endpoint hoặc cấu hình backend.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90%', maxWidth: '1200px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{isGroup ? 'CẤP QUYỀN CHO NHÓM' : 'CẤP QUYỀN CHO NHÂN VIÊN'}</h3>
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: 12, top: 8 }}>×</button>
        </div>

        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <input placeholder={isGroup ? 'Chọn nhóm quyền' : 'Chọn nhóm quyền'} value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ flex: 1, padding: 8, marginRight: 12, borderRadius: 4, border: '1px solid #ddd' }} />
              <button className="btn btn-danger" style={{ padding: '6px 12px', height: 36 }}>Xóa</button>
            </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                  <tr style={{ background: '#cfeefb' }}>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Stt</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Tên quyền</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}></th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Xem</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Thêm</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Sửa</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Xóa</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>In phiếu</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Import</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Export</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Tất cả</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #eaeaea' }}>Không</th>
                  </tr>
                </thead>
              <tbody>
                {/* first row: Chọn tất cả */}
                <tr key="select-all" style={{ background: '#fff' }}>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}>1</td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea', color: '#d9534f', fontWeight: 600 }}>Chọn tất cả</td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                    <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} />
                  </td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                    {/* empty header cell */}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}></td>
                  <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}></td>
                </tr>

                {samplePermissions.map((p, idx) => (
                  <tr key={p.key}>
                    <td style={{ padding: 8, border: '1px solid #eaeaea' }}>{idx + 2}</td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea' }}>{p.name}</td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea' }}>
                      {/* placeholder for header select-all per row */}
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.view || false} onChange={() => togglePerm(p.key, 'view')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.add || false} onChange={() => togglePerm(p.key, 'add')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.edit || false} onChange={() => togglePerm(p.key, 'edit')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.delete || false} onChange={() => togglePerm(p.key, 'delete')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.print || false} onChange={() => togglePerm(p.key, 'print')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.import || false} onChange={() => togglePerm(p.key, 'import')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <input type="checkbox" checked={permissions[p.key]?.export || false} onChange={() => togglePerm(p.key, 'export')} />
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <button className="btn btn-primary" onClick={() => {
                        // mark all true
                        setPermissions(prev => ({ ...prev, [p.key]: { view: true, add: true, edit: true, delete: true, print: true, import: true, export: true } }));
                      }}>Tất cả</button>
                    </td>
                    <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                      <button className="btn btn-danger" onClick={() => {
                        setPermissions(prev => ({ ...prev, [p.key]: { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false } }));
                      }}>Không</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, color: '#d9534f', fontSize: 13 }}>* Lưu ý: Các quyền thêm, sửa, xóa, in phiếu, xuất file sẽ được lưu lại khi có quyền truy cập.</div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px 16px' }}>Đồng ý</button>
            <button className="btn btn-danger" onClick={onClose} style={{ padding: '8px 16px' }}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
