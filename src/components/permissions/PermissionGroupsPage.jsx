import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, api } from '../../config/api';
import '../setup/SetupPage.css';
import './PermissionStyles.css';

// Danh sách tất cả các quyền trong hệ thống
const ALL_PERMISSIONS = [
  { key: 'ban_hang', name: 'Bán hàng' },
  { key: 'bao_cao_doanh_so_loai_hang', name: 'Báo cáo doanh số theo loại hàng' },
  { key: 'bao_cao_doanh_so_mcp', name: 'Báo cáo doanh số theo MCP' },
  { key: 'bao_gia', name: 'Báo giá' },
  { key: 'cac_khoan_no_ngan_hang', name: 'Các khoản nợ ngân hàng' },
  { key: 'chi_nhanh', name: 'Chi nhánh' },
  { key: 'chi_tiet_xuat_nhap', name: 'Chi tiết xuất nhập' },
  { key: 'chon_nhan_vien_sale', name: 'Chọn nhân viên sale' },
  { key: 'chuyen_kho', name: 'Chuyển kho' },
  { key: 'chuyen_tien_quy', name: 'Chuyển tiền quỹ' },
  { key: 'cong_no_khach_hang', name: 'Công nợ khách hàng' },
  { key: 'cong_no_nha_cung_cap', name: 'Công nợ nhà cung cấp' },
  { key: 'danh_muc_hang_hoa', name: 'Danh mục hàng hóa' },
  { key: 'danh_muc_kho', name: 'Danh mục kho' },
  { key: 'danh_sach_khach_hang', name: 'Danh sách khách hàng' },
  { key: 'danh_sach_nha_cung_cap', name: 'Danh sách nhà cung cấp' },
  { key: 'danh_sach_nhan_vien', name: 'Danh sách nhân viên' },
  { key: 'don_dat_hang', name: 'Đơn đặt hàng' },
  { key: 'don_vi_tinh', name: 'Đơn vị tính' },
  { key: 'hang_hoa', name: 'Hàng hóa' },
  { key: 'ket_chuyen_no', name: 'Kết chuyển nợ' },
  { key: 'lap_phieu_chi', name: 'Lập phiếu chi' },
  { key: 'lap_phieu_thu', name: 'Lập phiếu thu' },
  { key: 'nhap_hang', name: 'Nhập hàng' },
  { key: 'nhom_khach_hang', name: 'Nhóm khách hàng' },
  { key: 'nhom_quyen', name: 'Nhóm quyền' },
  { key: 'noi_dung_giao_dich', name: 'Nội dung giao dịch' },
  { key: 'phan_quyen_nguoi_dung', name: 'Phân quyền người dùng' },
  { key: 'phuong_tien', name: 'Phương tiện' },
  { key: 'quan_tri_he_thong', name: 'Quản trị hệ thống' },
  { key: 'so_quy', name: 'Sổ quỹ' },
  { key: 'tai_khoan_quy', name: 'Tài khoản/Quỹ' },
  { key: 'thong_tin_cong_ty', name: 'Thông tin công ty' },
  { key: 'tinh_gia_von', name: 'Tính giá vốn' },
  { key: 'ton_kho', name: 'Tồn kho' },
  { key: 'trang_chu', name: 'Trang chủ' },
  { key: 'xem_bao_cao', name: 'Xem báo cáo' },
  { key: 'xuat_hang', name: 'Xuất hàng' },
];

export default function PermissionGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filtered = groups.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (g.name || '').toLowerCase().includes(q) ||
           (g.description || '').toLowerCase().includes(q);
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="setup-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#333', margin: 0 }}>DANH SÁCH NHÓM QUYỀN</h2>
        <span style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Tổng {filtered.length}</span>
      </div>

      <div className="table-container" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                Tên nhóm quyền
                <span style={{ marginLeft: 8, cursor: 'pointer', opacity: 0.5 }}>🔍</span>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                Mô tả
                <span style={{ marginLeft: 8, cursor: 'pointer', opacity: 0.5 }}>🔍</span>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e9ecef', width: 150 }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
            ) : paginatedData.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40 }}>Không có dữ liệu</td></tr>
            ) : (
              paginatedData.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '12px 16px' }}>{g.name}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{g.description}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEdit(g)} 
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: '2px solid #3b82f6',
                          background: '#fff',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16
                        }}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: '2px solid #ef4444',
                          background: '#fff',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16
                        }}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px',
          borderTop: '1px solid #e9ecef',
          background: '#f8f9fa'
        }}>
          <span style={{ fontSize: 14, color: '#666' }}>
            Dòng {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} trên tổng {filtered.length} dòng
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '4px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              &lt;
            </button>
            <span style={{ 
              padding: '4px 12px', 
              background: '#3b82f6', 
              color: '#fff', 
              borderRadius: 4,
              fontSize: 14
            }}>
              {currentPage}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ padding: '4px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              &gt;
            </button>
            <select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div style={{ 
        position: 'fixed', 
        right: 24, 
        top: '50%', 
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 100
      }}>
        <button 
          onClick={handleAdd}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}
          title="Thêm mới"
        >
          +
        </button>
        <button 
          onClick={loadGroups}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}
          title="Làm mới"
        >
          🔄
        </button>
        <button 
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(139,92,246,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}
          title="Import Excel"
        >
          📥
        </button>
        <button 
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}
          title="Cài đặt"
        >
          ⚙️
        </button>
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
    </div>
  );
}

// Modal thêm/sửa nhóm quyền với danh sách checkbox quyền
function GroupModal({ show, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    selectedPermissions: []
  });

  useEffect(() => {
    if (initialData) {
      // Load existing permissions from group
      const existingPerms = initialData.permissionDetails?.map(p => p.resourceKey) || [];
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        isActive: initialData.isActive !== false,
        selectedPermissions: existingPerms
      });
    } else {
      setForm({ name: '', description: '', isActive: true, selectedPermissions: [] });
    }
  }, [initialData, show]);

  if (!show) return null;

  const togglePermission = (key) => {
    setForm(prev => {
      const perms = prev.selectedPermissions.includes(key)
        ? prev.selectedPermissions.filter(k => k !== key)
        : [...prev.selectedPermissions, key];
      return { ...prev, selectedPermissions: perms };
    });
  };

  const toggleAll = (checked) => {
    if (checked) {
      setForm(prev => ({ ...prev, selectedPermissions: ALL_PERMISSIONS.map(p => p.key) }));
    } else {
      setForm(prev => ({ ...prev, selectedPermissions: [] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Vui lòng nhập tên nhóm quyền');
      return;
    }

    // Convert selected permissions to permission details format
    const permissionDetails = form.selectedPermissions.map(key => {
      const perm = ALL_PERMISSIONS.find(p => p.key === key);
      return {
        resourceKey: key,
        resourceName: perm?.name || key,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canPrint: true,
        canImport: true,
        canExport: true
      };
    });

    onSave({
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      permissionDetails
    });
  };

  const allSelected = form.selectedPermissions.length === ALL_PERMISSIONS.length;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        width: 500,
        maxWidth: '90%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
            THÔNG TIN NHÓM QUYỀN
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
            {/* Tên nhóm quyền */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333' }}>
                <span style={{ color: '#ef4444' }}>*</span> Tên nhóm quyền
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên nhóm quyền"
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
                {form.name && (
                  <span style={{ 
                    position: 'absolute', 
                    right: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#10b981',
                    fontSize: 18
                  }}>✓</span>
                )}
              </div>
            </div>

            {/* Ghi chú */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333' }}>
                Ghi chú
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Nhập ghi chú"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Danh sách quyền */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {/* Header chọn tất cả */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8f9fa',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  style={{ marginRight: 10, width: 18, height: 18, accentColor: '#3b82f6' }}
                />
                <span style={{ fontWeight: 500, color: '#333' }}>Tên quyền</span>
              </div>

              {/* Danh sách các quyền */}
              {ALL_PERMISSIONS.map((perm) => (
                <div 
                  key={perm.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: form.selectedPermissions.includes(perm.key) ? '#eff6ff' : '#fff'
                  }}
                  onClick={() => togglePermission(perm.key)}
                >
                  <input
                    type="checkbox"
                    checked={form.selectedPermissions.includes(perm.key)}
                    onChange={() => {}}
                    style={{ marginRight: 10, width: 18, height: 18, accentColor: '#3b82f6' }}
                  />
                  <span style={{ fontSize: 14, color: '#333' }}>{perm.name}</span>
                </div>
              ))}
            </div>

            {/* Checkbox hoạt động */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: 16,
              padding: '10px 12px',
              background: '#f8f9fa',
              borderRadius: 6
            }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                style={{ marginRight: 10, width: 18, height: 18, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: 14, color: '#333' }}>Hoạt động</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 20px',
            borderTop: '1px solid #e9ecef',
            background: '#f8f9fa'
          }}>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              💾 Lưu lại
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ✕ Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
