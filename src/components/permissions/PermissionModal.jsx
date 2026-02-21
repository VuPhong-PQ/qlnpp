import React, { useState, useEffect } from 'react';
import '../setup/SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { vietnameseSearch } from '../../utils/searchUtils';

// Cấu trúc quyền được phân theo nhóm - dễ dàng quản lý và phân quyền
const permissionGroups = [
  {
    groupKey: 'setup',
    groupName: 'Thiết lập ban đầu',
    icon: '⚙️',
    items: [
      { key: 'company_info', name: 'Thông tin doanh nghiệp' },
      { key: 'accounts_funds', name: 'Tài khoản quỹ & Nợ ngân hàng' },
      { key: 'customer_groups', name: 'Nhóm khách hàng' },
      { key: 'customers', name: 'Khách hàng' },
      { key: 'suppliers', name: 'Nhà cung cấp' },
      { key: 'product_categories', name: 'Danh sách loại hàng' },
      { key: 'products', name: 'Danh sách hàng hóa' },
      { key: 'units', name: 'Đơn vị tính' },
      { key: 'transaction_contents', name: 'Nội dung thu, chi, xuất, nhập' },
      { key: 'warehouses', name: 'Danh sách kho hàng' },
      { key: 'vehicles', name: 'Khai báo xe' }
    ]
  },
  {
    groupKey: 'business',
    groupName: 'Quản lý nghiệp vụ',
    icon: '💼',
    items: [
      { key: 'quotations', name: 'Bảng báo giá' },
      { key: 'imports', name: 'Nhập hàng' },
      { key: 'exports', name: 'Xuất hàng' },
      { key: 'warehouse_transfers', name: 'Chuyển kho' },
      { key: 'orders', name: 'Bán hàng' },
      { key: 'sale_management', name: 'Quản lý bán hàng (User)' },
      { key: 'order_management', name: 'Quản lý đơn hàng (Admin)' },
      { key: 'print_order', name: 'In đơn hàng' },
      { key: 'in-bang-ke-tong', name: 'In bảng kê tổng' },
      { key: 'mo_khoa_ngay_lap', name: 'Mở khóa ngày lập đơn hàng' },
      { key: 'chon_nhan_vien_sale', name: 'Chọn nhân viên bán hàng' },
      { key: 'receipt_voucher', name: 'Phiếu thu' },
      { key: 'expense_voucher', name: 'Phiếu chi' },
      { key: 'cost_calculation', name: 'Tính giá vốn' },
      { key: 'adjustments', name: 'Điều chỉnh kho' },
      { key: 'returns', name: 'Khách trả hàng' }
    ]
  },
  {
    groupKey: 'reports',
    groupName: 'Báo cáo thống kê',
    icon: '📊',
    items: [
      { key: 'sales_report', name: 'Báo cáo bán hàng' },
      { key: 'inventory_report', name: 'Báo cáo tồn kho' },
      { key: 'financial_report', name: 'Báo cáo tài chính' }
    ]
  },
  {
    groupKey: 'admin',
    groupName: 'Quản trị hệ thống',
    icon: '🛠️',
    items: [
      { key: 'manage_data', name: 'Quản lý dữ liệu' },
      { key: 'permission_groups', name: 'Nhóm quyền' },
      { key: 'user_permissions', name: 'Phân quyền người dùng' },
      { key: 'users', name: 'Quản lý người dùng' }
    ]
  }
];

// Flatten để dùng cho xử lý dữ liệu
const allPermissions = permissionGroups.flatMap(g => g.items);

// Giữ lại samplePermissions cho compatibility
const samplePermissions = allPermissions;

export default function PermissionModal({ show, onClose, onSave, user, isGroup=false }) {
  const [permissions, setPermissions] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [userGroups, setUserGroups] = useState([]); // All groups that user belongs to
  const [pendingGroups, setPendingGroups] = useState([]); // Groups pending to be added
  const [allowedPermissionKeys, setAllowedPermissionKeys] = useState(null); // Keys from selected group's permissionDetails (null = show all)

  useEffect(() => {
    // init permissions (all false)
    const init = {};
    samplePermissions.forEach(p => {
      init[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
    });
    setPermissions(init);
    setSelectAll(false);
    setGroupName('');
    setSelectedGroupId(null);
    setUserGroups([]);
    setPendingGroups([]);
    setAllowedPermissionKeys(null);
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

  // Load permission groups for selection
  useEffect(() => {
    const loadGroups = async () => {
      if (!show) return;
      try {
        if (API_ENDPOINTS.permissionGroups) {
          const gs = await api.get(API_ENDPOINTS.permissionGroups);
          setGroups(gs || []);
        }
      } catch (e) {
        console.error('Load permission groups failed', e);
        setGroups([]);
      }
    };
    loadGroups();
  }, [show]);

  // If user already belongs to permission groups, detect all of them
  useEffect(() => {
    const detectUserGroups = async () => {
      if (!show || !user?.id || !groups || groups.length === 0) return;
      try {
        const foundGroups = [];
        for (const g of groups) {
          try {
            const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}/users`);
            if (!res.ok) continue;
            const usersInGroup = await res.json();
            if (Array.isArray(usersInGroup) && usersInGroup.find(u => u.id === user.id)) {
              foundGroups.push(g);
            }
          } catch (er) {
            // ignore per-group fetch errors
          }
        }
        setUserGroups(foundGroups);
        // If user belongs to groups, preselect first one and filter permissions
        if (foundGroups.length > 0) {
          setSelectedGroupId(foundGroups[0].id);
          setGroupName(foundGroups[0].name || '');
          setGroupSearch(foundGroups.map(g => g.name).join(', '));
          
          // Fetch permission details from all user's groups and combine allowed keys
          const allAllowedKeys = new Set();
          for (const g of foundGroups) {
            try {
              const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}`);
              if (res.ok) {
                const grp = await res.json();
                const details = grp.permissionDetails || grp.PermissionDetails || [];
                details.forEach(d => {
                  const key = (d.resourceKey || d.ResourceKey || '').toString().toLowerCase();
                  if (key) allAllowedKeys.add(key);
                });
              }
            } catch (er) { }
          }
          // Set allowed permission keys to filter display
          setAllowedPermissionKeys([...allAllowedKeys]);
          
          // Also load permission values from first group for display
          try {
            const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${foundGroups[0].id}`);
            if (res.ok) {
              const grp = await res.json();
              const details = grp.permissionDetails || grp.PermissionDetails || [];
              const next = {};
              samplePermissions.forEach(p => {
                const found = details.find(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase() === p.key.toLowerCase());
                if (found) {
                  next[p.key] = {
                    view: !!(found.canView ?? found.CanView),
                    add: !!(found.canAdd ?? found.CanAdd),
                    edit: !!(found.canEdit ?? found.CanEdit),
                    delete: !!(found.canDelete ?? found.CanDelete),
                    print: !!(found.canPrint ?? found.CanPrint),
                    import: !!(found.canImport ?? found.CanImport),
                    export: !!(found.canExport ?? found.CanExport)
                  };
                } else {
                  next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
                }
              });
              setPermissions(next);
              const all = Object.values(next).length > 0 && Object.values(next).every(r => Object.values(r).every(Boolean));
              setSelectAll(all);
            }
          } catch (er) { }
        }
      } catch (e) {
        // ignore
      }
    };
    detectUserGroups();
  }, [show, user, groups]);

  if (!show) return null;

  const togglePerm = (key, field) => {
    setPermissions(prev => ({ ...prev, [key]: { ...prev[key], [field]: !prev[key][field] } }));
  };

  // Set all permissions for a group to true
  const handleGroupSetAll = (group) => {
    setPermissions(prev => {
      const next = { ...prev };
      group.items.forEach(p => {
        next[p.key] = { view: true, add: true, edit: true, delete: true, print: true, import: true, export: true };
      });
      return next;
    });
  };

  // Set all permissions for a group to false
  const handleGroupSetNone = (group) => {
    setPermissions(prev => {
      const next = { ...prev };
      group.items.forEach(p => {
        next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
      });
      return next;
    });
  };

  // Set all permissions for a single resource (row) to true/false
  const handleRowSetAll = (key, checked) => {
    setPermissions(prev => ({ ...prev, [key]: { view: checked, add: checked, edit: checked, delete: checked, print: checked, import: checked, export: checked } }));
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
    // If there are pending groups, add them all to user
    if (pendingGroups.length > 0 && user?.id) {
      let successCount = 0;
      for (const g of pendingGroups) {
        try {
          const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}/users/${user.id}`, { method: 'POST' });
          if (res.ok) {
            successCount++;
          }
        } catch (e) {
          console.error('Error adding user to group:', g.name, e);
        }
      }
      if (successCount > 0) {
        alert(`Đã gán ${successCount} nhóm quyền thành công!`);
        if (onSave) onSave({ user, isGroup, groupIds: pendingGroups.map(g => g.id) });
        onClose();
        return;
      }
    }
    
    // If a single group was selected (legacy behavior), call API to add user to group
    if (selectedGroupId && user?.id) {
      try {
        const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${selectedGroupId}/users/${user.id}`, { method: 'POST' });
        if (res.ok) {
          alert('Gán nhóm quyền thành công!');
          if (onSave) onSave({ user, isGroup, groupId: selectedGroupId });
          onClose();
          return;
        } else {
          // Check if user already in group
          const errData = await res.json().catch(() => ({}));
          if (errData.error && errData.error.includes('đã thuộc')) {
            alert('Người dùng đã thuộc nhóm quyền này. Đang cập nhật quyền chi tiết...');
            } else {
            // If error adding to group, save individual permissions instead
          }
        }
      } catch (e) {
        console.error('Error adding user to group:', e);
      }
    }

    // Save individual permissions
    try {
      if (API_ENDPOINTS.users && user?.id) {
        const endpoint = `${API_ENDPOINTS.users}/${user.id}/permissions`;
        // Build model with lowercase keys for ASP.NET Core JSON serialization
        const model = { permissions: {} };
        // convert our frontend keys to backend DTO shape
        Object.keys(permissions).forEach(key => {
          const p = permissions[key];
          model.permissions[key] = {
            canView: !!p.view,
            canAdd: !!p.add,
            canEdit: !!p.edit,
            canDelete: !!p.delete,
            canPrint: !!p.print,
            canImport: !!p.import,
            canExport: !!p.export
          };
        });

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model)
        });

        if (res.ok || res.status === 204) {
          alert('Lưu phân quyền thành công!');
          if (onSave) onSave({ user, isGroup, groupName, permissions });
          onClose();
          return;
        } else {
          const errText = await res.text().catch(() => '');
          console.error('Save permissions failed:', res.status, errText);
        }
      }

      // Fallback: just close
      if (onSave) onSave({ user, isGroup, groupName, permissions });
      onClose();
    } catch (err) {
      console.error('Save permissions failed', err);
      alert('Lưu phân quyền thất bại. Vui lòng kiểm tra API endpoint hoặc cấu hình backend.');
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000 }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '100%', height: '100vh', maxHeight: '100vh', borderRadius: 0, margin: 0 }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{isGroup ? 'CẤP QUYỀN CHO NHÓM' : `CẤP QUYỀN CHO NHÂN VIÊN${user?.name ? ': ' + user.name : ''}`}</h3>
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: 12, top: 8 }}>×</button>
        </div>

        <div style={{ padding: '8px 16px' }}>
          {/* Display user's assigned groups if 2 or more */}
          {userGroups.length >= 2 && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e3f2fd', borderRadius: 6, border: '1px solid #90caf9' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#1565c0' }}>
                Nhân viên thuộc {userGroups.length} nhóm quyền:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {userGroups.map(g => (
                  <span 
                    key={g.id} 
                    onClick={async () => {
                      setSelectedGroupId(g.id);
                      setGroupName(g.name);
                      setGroupSearch(g.name);
                      // fetch group details and show permissions
                      try {
                        const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}`);
                        if (res.ok) {
                          const grp = await res.json();
                          const details = grp.permissionDetails || grp.PermissionDetails || [];
                          // Extract allowed keys from group's permissionDetails
                          const allowedKeys = details.map(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase());
                          setAllowedPermissionKeys(allowedKeys);
                          const next = {};
                          samplePermissions.forEach(p => {
                            const found = details.find(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase() === p.key.toLowerCase() || (d.resourceName || d.ResourceName || '').toString().toLowerCase().includes(p.name.toLowerCase()));
                            if (found) {
                              next[p.key] = {
                                view: !!(found.canView ?? found.CanView),
                                add: !!(found.canAdd ?? found.CanAdd),
                                edit: !!(found.canEdit ?? found.CanEdit),
                                delete: !!(found.canDelete ?? found.CanDelete),
                                print: !!(found.canPrint ?? found.CanPrint),
                                import: !!(found.canImport ?? found.CanImport),
                                export: !!(found.canExport ?? found.CanExport)
                              };
                            } else {
                              next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
                            }
                          });
                          setPermissions(next);
                          const all = Object.values(next).length > 0 && Object.values(next).every(r => Object.values(r).every(Boolean));
                          setSelectAll(all);
                        }
                      } catch (er) { }
                    }}
                    style={{ 
                      padding: '4px 10px', 
                      background: selectedGroupId === g.id ? '#1976d2' : '#fff', 
                      color: selectedGroupId === g.id ? '#fff' : '#333',
                      border: '1px solid #1976d2', 
                      borderRadius: 16, 
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: selectedGroupId === g.id ? 600 : 400
                    }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ position: 'relative', flex: 1, marginRight: 12 }}>
              <input
                value={groupSearch}
                onChange={(e) => { setGroupSearch(e.target.value); setShowGroupDropdown(true); }}
                onFocus={() => setShowGroupDropdown(true)}
                placeholder="Tìm và chọn nhóm quyền để thêm..."
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              />

              {showGroupDropdown && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '42px', maxHeight: 220, overflow: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: 6, zIndex: 2000 }}>
                  {/* list filtered groups */}
                  {((groups || []).filter(g => !groupSearch || vietnameseSearch(g.name || g.code || '', groupSearch))).length === 0 ? (
                    <div style={{ padding: 8, color: '#999' }}>Không tìm thấy nhóm quyền</div>
                  ) : (
                    (groups || []).filter(g => !groupSearch || vietnameseSearch(g.name || g.code || '', groupSearch)).map(g => {
                      // Check if already in userGroups or pendingGroups
                      const isInUserGroups = userGroups.some(ug => ug.id === g.id);
                      const isInPendingGroups = pendingGroups.some(pg => pg.id === g.id);
                      const isAlreadyAdded = isInUserGroups || isInPendingGroups;
                      
                      return (
                      <div key={g.id} onMouseDown={async (ev) => { ev.preventDefault();
                        if (isAlreadyAdded) {
                          // Already added, do nothing or show message
                          return;
                        }
                        // Add to pending groups
                        setPendingGroups(prev => [...prev, g]);
                        // Clear search for next selection
                        setGroupSearch('');
                        setShowGroupDropdown(false);
                        // Also set as selected for preview
                        setSelectedGroupId(g.id);
                        setGroupName(g.name);
                        // fetch group details for preview
                        try {
                          const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}`);
                          if (res.ok) {
                            const grp = await res.json();
                            const details = grp.permissionDetails || grp.PermissionDetails || [];
                            // Extract allowed keys from group's permissionDetails
                            const allowedKeys = details.map(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase());
                            setAllowedPermissionKeys(allowedKeys);
                            const next = {};
                            samplePermissions.forEach(p => {
                              const found = details.find(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase() === p.key.toLowerCase() || (d.resourceName || d.ResourceName || '').toString().toLowerCase().includes(p.name.toLowerCase()));
                              if (found) {
                                next[p.key] = {
                                  view: !!(found.canView ?? found.CanView),
                                  add: !!(found.canAdd ?? found.CanAdd),
                                  edit: !!(found.canEdit ?? found.CanEdit),
                                  delete: !!(found.canDelete ?? found.CanDelete),
                                  print: !!(found.canPrint ?? found.CanPrint),
                                  import: !!(found.canImport ?? found.CanImport),
                                  export: !!(found.canExport ?? found.CanExport)
                                };
                              } else {
                                next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
                              }
                            });
                            setPermissions(next);
                            const all = Object.values(next).length > 0 && Object.values(next).every(r => Object.values(r).every(Boolean));
                            setSelectAll(all);
                          }
                        } catch (er) { }
                      }} style={{ 
                        padding: 8, 
                        borderBottom: '1px solid #f0f0f0', 
                        cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                        backgroundColor: isAlreadyAdded ? '#f5f5f5' : 'transparent',
                        color: isAlreadyAdded ? '#999' : '#333'
                      }}>
                        {g.name} {isAlreadyAdded && <span style={{ fontSize: 11, color: '#999' }}>(đã thêm)</span>}
                      </div>
                    );
                    })
                  )}
                </div>
              )}
            </div>
            <button className="btn btn-danger" onClick={async () => {
              // If a group is selected, try to remove user from that group
              if (selectedGroupId && user?.id) {
                try {
                  const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${selectedGroupId}/users/${user.id}`, { method: 'DELETE' });
                  if (res.ok) {
                    alert('Đã gỡ nhóm quyền cho người dùng');
                    // Remove from userGroups list
                    setUserGroups(prev => prev.filter(g => g.id !== selectedGroupId));
                  } else {
                    // ignore
                  }
                } catch (e) {
                  // ignore
                }
              }
              // Also remove from pendingGroups if present
              setPendingGroups(prev => prev.filter(g => g.id !== selectedGroupId));
              // clear selection and reset permissions
              setSelectedGroupId(null);
              setGroupName('');
              setGroupSearch('');
              setAllowedPermissionKeys(null); // Reset to show all permissions
              const init = {};
              samplePermissions.forEach(p => {
                init[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
              });
              setPermissions(init);
              setSelectAll(false);
            }} style={{ padding: '6px 12px', height: 36 }}>Xóa</button>
          </div>
          
          {/* Display pending groups to be added */}
          {pendingGroups.length > 0 && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fff3e0', borderRadius: 6, border: '1px solid #ffcc80' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#e65100', fontSize: 13 }}>
                Nhóm quyền sẽ được thêm ({pendingGroups.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {pendingGroups.map(g => (
                  <span 
                    key={g.id}
                    style={{ 
                      padding: '4px 8px', 
                      background: selectedGroupId === g.id ? '#ff9800' : '#fff', 
                      color: selectedGroupId === g.id ? '#fff' : '#333',
                      border: '1px solid #ff9800', 
                      borderRadius: 16, 
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span 
                      style={{ cursor: 'pointer' }}
                      onClick={async () => {
                        setSelectedGroupId(g.id);
                        setGroupName(g.name);
                        // fetch group details for preview
                        try {
                          const res = await fetch(`${API_ENDPOINTS.permissionGroups}/${g.id}`);
                          if (res.ok) {
                            const grp = await res.json();
                            const details = grp.permissionDetails || grp.PermissionDetails || [];
                            // Extract allowed keys from group's permissionDetails
                            const allowedKeys = details.map(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase());
                            setAllowedPermissionKeys(allowedKeys);
                            const next = {};
                            samplePermissions.forEach(p => {
                              const found = details.find(d => (d.resourceKey || d.ResourceKey || '').toString().toLowerCase() === p.key.toLowerCase() || (d.resourceName || d.ResourceName || '').toString().toLowerCase().includes(p.name.toLowerCase()));
                              if (found) {
                                next[p.key] = {
                                  view: !!(found.canView ?? found.CanView),
                                  add: !!(found.canAdd ?? found.CanAdd),
                                  edit: !!(found.canEdit ?? found.CanEdit),
                                  delete: !!(found.canDelete ?? found.CanDelete),
                                  print: !!(found.canPrint ?? found.CanPrint),
                                  import: !!(found.canImport ?? found.CanImport),
                                  export: !!(found.canExport ?? found.CanExport)
                                };
                              } else {
                                next[p.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
                              }
                            });
                            setPermissions(next);
                            const all = Object.values(next).length > 0 && Object.values(next).every(r => Object.values(r).every(Boolean));
                            setSelectAll(all);
                          }
                        } catch (er) { }
                      }}
                    >
                      {g.name}
                    </span>
                    <span 
                      onClick={() => {
                        setPendingGroups(prev => prev.filter(pg => pg.id !== g.id));
                        if (selectedGroupId === g.id) {
                          setSelectedGroupId(null);
                          setGroupName('');
                        }
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        color: selectedGroupId === g.id ? '#fff' : '#e65100',
                        marginLeft: 2
                      }}
                      title="Bỏ chọn"
                    >×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto', height: 'calc(100vh - 240px)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
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

                {/* Render each permission group with header */}
                {/* Only show permissions when a group is selected (allowedPermissionKeys is set) */}
                {allowedPermissionKeys !== null && (() => {
                  let rowNum = 2;
                  return permissionGroups.map((group) => {
                    // Filter items based on allowedPermissionKeys
                    const filteredItems = group.items.filter(p => allowedPermissionKeys.includes(p.key.toLowerCase()));
                    
                    // Skip group if no items match
                    if (filteredItems.length === 0) return null;
                    
                    return (
                    <React.Fragment key={group.groupKey}>
                      {/* Group header row */}
                      <tr style={{ background: '#e8f4fc' }}>
                        <td colSpan={3} style={{ padding: '10px 8px', border: '1px solid #eaeaea', fontWeight: 700, fontSize: 14, color: '#2c3e50' }}>
                          <span style={{ marginRight: 8 }}>{group.icon}</span>
                          {group.groupName}
                        </td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            title="Chọn tất cả quyền trong nhóm"
                            onChange={(e) => handleGroupSetAll(e.target.checked ? { ...group, items: filteredItems } : { items: [] })}
                          />
                        </td>
                        <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            title="Không (bỏ hết quyền trong nhóm)"
                            onChange={(e) => handleGroupSetNone(e.target.checked ? { ...group, items: filteredItems } : { items: [] })}
                          />
                        </td>
                      </tr>

                      {/* Permission items in group */}
                      {filteredItems.map((p) => {
                        const currentRowNum = rowNum++;
                        return (
                          <tr key={p.key} style={{ background: '#fff' }}>
                            <td style={{ padding: 8, border: '1px solid #eaeaea', paddingLeft: 20 }}>{currentRowNum}</td>
                            <td style={{ padding: 8, border: '1px solid #eaeaea', paddingLeft: 24 }}>{p.name}</td>
                            <td style={{ padding: 8, border: '1px solid #eaeaea' }}></td>
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
                              <input type="checkbox" title="Tất cả" checked={
                                permissions[p.key] && Object.values(permissions[p.key]).every(Boolean)
                              } onChange={(e) => handleRowSetAll(p.key, e.target.checked)} />
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eaeaea', textAlign: 'center' }}>
                              <input type="checkbox" title="Không" checked={
                                permissions[p.key] && Object.values(permissions[p.key]).every(v => !v)
                              } onChange={(e) => handleRowSetAll(p.key, !e.target.checked ? true : false)} />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                  });
                })()}
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
