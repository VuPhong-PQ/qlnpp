import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, api } from '../../config/api';
import '../setup/SetupPage.css';
import './PermissionStyles.css';

export default function PermissionGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.permissionGroups);
      setGroups(data || []);
    } catch (err) {
      console.error('Load permission groups failed', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (group) => {
    setEditing(group);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm quyền này?')) return;
    try {
      setLoading(true);
      await api.delete(API_ENDPOINTS.permissionGroups, id);
      await loadGroups();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Xóa thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      setLoading(true);
      if (editing?.id) {
        await api.put(API_ENDPOINTS.permissionGroups, editing.id, { ...data, id: editing.id });
      } else {
        await api.post(API_ENDPOINTS.permissionGroups, data);
      }
      setShowModal(false);
      setEditing(null);
      await loadGroups();
    } catch (err) {
      console.error('Save failed', err);
      alert('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPermissions = (group) => {
    setSelectedGroup(group);
    setShowPermissionModal(true);
  };

  const filtered = groups.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (g.name || '').toLowerCase().includes(q) ||
           (g.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="setup-page">
      <div className="page-header">
        <h2>QUẢN LÝ NHÓM QUYỀN</h2>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-primary" onClick={handleAdd}>
            <span>➕</span> Thêm mới
          </button>
        </div>
        <div className="toolbar-right">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>STT</th>
              <th>Tên nhóm quyền</th>
              <th>Mô tả</th>
              <th style={{ width: 100 }}>Trạng thái</th>
              <th style={{ width: 200 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>Không có dữ liệu</td></tr>
            ) : (
              filtered.map((g, idx) => (
                <tr key={g.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>{g.name}</td>
                  <td>{g.description}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${g.isActive ? 'active' : 'inactive'}`}>
                      {g.isActive ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-info" onClick={() => handleSetPermissions(g)} title="Phân quyền">
                        🔑
                      </button>
                      <button className="btn btn-sm btn-warning" onClick={() => handleEdit(g)} title="Sửa">
                        ✏️
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(g.id)} title="Xóa">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa nhóm quyền */}
      {showModal && (
        <GroupModal
          show={showModal}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
          initialData={editing}
        />
      )}

      {/* Modal phân quyền chi tiết */}
      {showPermissionModal && selectedGroup && (
        <GroupPermissionDetailModal
          show={showPermissionModal}
          onClose={() => { setShowPermissionModal(false); setSelectedGroup(null); }}
          group={selectedGroup}
          onSaved={loadGroups}
        />
      )}
    </div>
  );
}

// Modal thêm/sửa nhóm quyền
function GroupModal({ show, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        isActive: initialData.isActive !== false
      });
    } else {
      setForm({ name: '', description: '', isActive: true });
    }
  }, [initialData, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Vui lòng nhập tên nhóm quyền');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3>{initialData ? 'Sửa nhóm quyền' : 'Thêm nhóm quyền mới'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><span className="required">*</span> Tên nhóm quyền</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nhập tên nhóm quyền"
            />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang hoạt động
            </label>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">Lưu</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal phân quyền chi tiết cho nhóm
function GroupPermissionDetailModal({ show, onClose, group, onSaved }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // Danh sách các resource có thể phân quyền
  const resources = [
    { key: 'dashboard', name: 'Trang chủ', category: 'Hệ thống' },
    { key: 'company_info', name: 'Thông tin công ty', category: 'Thiết lập' },
    { key: 'accounts_funds', name: 'Tài khoản/Quỹ', category: 'Thiết lập' },
    { key: 'customer_groups', name: 'Nhóm khách hàng', category: 'Thiết lập' },
    { key: 'customers', name: 'Khách hàng', category: 'Danh mục' },
    { key: 'suppliers', name: 'Nhà cung cấp', category: 'Danh mục' },
    { key: 'product_categories', name: 'Danh mục hàng hóa', category: 'Thiết lập' },
    { key: 'products', name: 'Hàng hóa', category: 'Danh mục' },
    { key: 'units', name: 'Đơn vị tính', category: 'Thiết lập' },
    { key: 'transaction_contents', name: 'Nội dung giao dịch', category: 'Thiết lập' },
    { key: 'warehouses', name: 'Kho hàng', category: 'Thiết lập' },
    { key: 'vehicles', name: 'Phương tiện', category: 'Thiết lập' },
    { key: 'users', name: 'Nhân viên', category: 'Phân quyền' },
    { key: 'permission_groups', name: 'Nhóm quyền', category: 'Phân quyền' },
    { key: 'user_permissions', name: 'Phân quyền người dùng', category: 'Phân quyền' },
    { key: 'quotations', name: 'Báo giá', category: 'Nghiệp vụ' },
    { key: 'imports', name: 'Nhập kho', category: 'Nghiệp vụ' },
    { key: 'exports', name: 'Xuất kho', category: 'Nghiệp vụ' },
    { key: 'warehouse_transfers', name: 'Chuyển kho', category: 'Nghiệp vụ' },
    { key: 'orders', name: 'Đơn hàng', category: 'Nghiệp vụ' },
    { key: 'receipts', name: 'Phiếu thu', category: 'Kế toán' },
    { key: 'expenses', name: 'Phiếu chi', category: 'Kế toán' },
    { key: 'cost_calculation', name: 'Tính giá vốn', category: 'Kế toán' },
    { key: 'report_sales', name: 'Báo cáo bán hàng', category: 'Báo cáo' },
    { key: 'report_inventory', name: 'Báo cáo tồn kho', category: 'Báo cáo' },
    { key: 'report_debt', name: 'Báo cáo công nợ', category: 'Báo cáo' },
    { key: 'report_revenue', name: 'Báo cáo doanh thu', category: 'Báo cáo' },
    { key: 'admin', name: 'Quản trị hệ thống', category: 'Hệ thống' }
  ];

  useEffect(() => {
    if (show && group) {
      loadPermissions();
    }
  }, [show, group]);

  const loadPermissions = () => {
    // Load existing permissions from group
    const perms = {};
    resources.forEach(r => {
      perms[r.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
    });
    
    // Map existing permissions
    if (group.permissionDetails) {
      group.permissionDetails.forEach(p => {
        if (perms[p.resourceKey]) {
          perms[p.resourceKey] = {
            view: p.canView || false,
            add: p.canAdd || false,
            edit: p.canEdit || false,
            delete: p.canDelete || false,
            print: p.canPrint || false,
            import: p.canImport || false,
            export: p.canExport || false
          };
        }
      });
    }
    setPermissions(perms);
  };

  const togglePerm = (key, field) => {
    setPermissions(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: !prev[key][field] }
    }));
  };

  const toggleAllForResource = (key, checked) => {
    setPermissions(prev => ({
      ...prev,
      [key]: { view: checked, add: checked, edit: checked, delete: checked, print: checked, import: checked, export: checked }
    }));
  };

  const toggleAllResources = (checked) => {
    const newPerms = {};
    resources.forEach(r => {
      newPerms[r.key] = { view: checked, add: checked, edit: checked, delete: checked, print: checked, import: checked, export: checked };
    });
    setPermissions(newPerms);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const permissionDetails = [];
      Object.keys(permissions).forEach(key => {
        const p = permissions[key];
        const resource = resources.find(r => r.key === key);
        permissionDetails.push({
          resourceKey: key,
          resourceName: resource?.name || key,
          canView: p.view,
          canAdd: p.add,
          canEdit: p.edit,
          canDelete: p.delete,
          canPrint: p.print,
          canImport: p.import,
          canExport: p.export
        });
      });

      await fetch(`${API_ENDPOINTS.permissionGroups}/${group.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionDetails)
      });

      alert('Lưu phân quyền thành công');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Save permissions failed', err);
      alert('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  // Group resources by category
  const categories = [...new Set(resources.map(r => r.category))];

  return (
    <div className="modal-overlay">
      <div className="modal-content permission-modal" style={{ maxWidth: 1200, maxHeight: '90vh' }}>
        <div className="modal-header">
          <h3>PHÂN QUYỀN CHO NHÓM: {group.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="permission-table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="permission-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>
                  <input
                    type="checkbox"
                    onChange={(e) => toggleAllResources(e.target.checked)}
                    title="Chọn tất cả"
                  />
                </th>
                <th style={{ width: 200 }}>Chức năng</th>
                <th>Xem</th>
                <th>Thêm</th>
                <th>Sửa</th>
                <th>Xóa</th>
                <th>In</th>
                <th>Import</th>
                <th>Export</th>
                <th style={{ width: 80 }}>Tất cả</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <React.Fragment key={cat}>
                  <tr className="category-row">
                    <td colSpan={10}><strong>{cat}</strong></td>
                  </tr>
                  {resources.filter(r => r.category === cat).map(r => {
                    const p = permissions[r.key] || {};
                    const allChecked = p.view && p.add && p.edit && p.delete && p.print && p.import && p.export;
                    return (
                      <tr key={r.key}>
                        <td></td>
                        <td>{r.name}</td>
                        <td><input type="checkbox" checked={p.view || false} onChange={() => togglePerm(r.key, 'view')} /></td>
                        <td><input type="checkbox" checked={p.add || false} onChange={() => togglePerm(r.key, 'add')} /></td>
                        <td><input type="checkbox" checked={p.edit || false} onChange={() => togglePerm(r.key, 'edit')} /></td>
                        <td><input type="checkbox" checked={p.delete || false} onChange={() => togglePerm(r.key, 'delete')} /></td>
                        <td><input type="checkbox" checked={p.print || false} onChange={() => togglePerm(r.key, 'print')} /></td>
                        <td><input type="checkbox" checked={p.import || false} onChange={() => togglePerm(r.key, 'import')} /></td>
                        <td><input type="checkbox" checked={p.export || false} onChange={() => togglePerm(r.key, 'export')} /></td>
                        <td>
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => toggleAllForResource(r.key, e.target.checked)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu phân quyền'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
