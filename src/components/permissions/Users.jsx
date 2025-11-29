import React, { useState, useEffect } from 'react';
import '../setup/SetupPage.css';
import UserModal from './UserModal';
import PermissionModal from './PermissionModal';
import GroupPermissionModal from './GroupPermissionModal';
import { API_ENDPOINTS, api } from '../../config/api';
import { exportToExcel } from '../../utils/excelUtils';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permTarget, setPermTarget] = useState(null);
  const [showGroupPermModal, setShowGroupPermModal] = useState(false);
  const [search, setSearch] = useState('');
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();
  // Phân trang (kế thừa theo mẫu các trang như Products)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.users);
      setUsers(data || []);
    } catch (err) {
      console.error('Load users failed', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (u) => {
    setEditing(u);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      setLoading(true);
      await api.delete(API_ENDPOINTS.users, id);
      await loadUsers();
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
      if (editing && editing.id) {
        await api.put(API_ENDPOINTS.users, editing.id, data);
      } else {
        await api.post(API_ENDPOINTS.users, data);
      }
      setShowModal(false);
      setEditing(null);
      await loadUsers();
    } catch (err) {
      console.error('Save failed', err);
      alert('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const filtered = applyFilters(users, search, ['username', 'name', 'phone', 'email', 'idNumber']);

  // Phân trang: tính toán các giá trị
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  // Reset về trang 1 khi search hoặc column filters thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, columnFilters]);

  const handleExport = () => {
    if (!users || users.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const data = filtered.map(u => ({
      'Tên đăng nhập': u.username || '',
      'Tên nhân viên': u.name || '',
      'Số điện thoại': u.phone || '',
      'Email': u.email || '',
      'Năm sinh': u.birthYear ? new Date(u.birthYear).toLocaleDateString() : '',
      'Số CMND/CCCD': u.idNumber || '',
      'Ngày cấp': u.idIssuedDate ? new Date(u.idIssuedDate).toLocaleDateString() : '',
      'Nơi cấp': u.idIssuedPlace || '',
      'Năm vào làm': u.yearStarted ? new Date(u.yearStarted).toLocaleDateString() : '',
      'Chức vụ': u.position || '',
      'Ghi chú': u.note || ''
    }));

    exportToExcel(data, 'Danh_sach_nhan_vien', 'Nhân viên');
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Người dùng</h1>
        <p>Quản lý danh sách người dùng / nhân viên</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo Mã, Tên, SĐT, CMND..."
            className="search-box"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="table-actions">
            <button className="btn btn-primary" onClick={handleAdd}>+ Thêm nhân viên</button>
            <button className="btn btn-success" onClick={handleExport} style={{ marginLeft: 8 }}>📤 Export Excel</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                    <th style={{ position: 'relative' }}>
                      Tên đăng nhập
                      <span onClick={() => setShowFilterPopup('username')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('username', 'Tên đăng nhập', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Tên nhân viên
                      <span onClick={() => setShowFilterPopup('name')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('name', 'Tên nhân viên', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Số điện thoại
                      <span onClick={() => setShowFilterPopup('phone')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('phone', 'Số điện thoại', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Email
                      <span onClick={() => setShowFilterPopup('email')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('email', 'Email', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Năm sinh
                      <span onClick={() => setShowFilterPopup('birthYear')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('birthYear', 'Năm sinh', true)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Số CMND/CCCD
                      <span onClick={() => setShowFilterPopup('idNumber')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idNumber', 'Số CMND/CCCD', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Ngày cấp
                      <span onClick={() => setShowFilterPopup('idIssuedDate')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idIssuedDate', 'Ngày cấp', true)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Nơi cấp
                      <span onClick={() => setShowFilterPopup('idIssuedPlace')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idIssuedPlace', 'Nơi cấp', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Năm vào làm
                      <span onClick={() => setShowFilterPopup('yearStarted')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('yearStarted', 'Năm vào làm', true)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Chức vụ
                      <span onClick={() => setShowFilterPopup('position')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('position', 'Chức vụ', false)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Ghi chú
                      <span onClick={() => setShowFilterPopup('note')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('note', 'Ghi chú', false)}
                    </th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={12} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
              )}

              {!loading && paginated.map(u => (
                <tr key={u.id || u.code}>
                  <td>{u.username || ''}</td>
                  <td>{u.name || ''}</td>
                  <td>{u.phone || ''}</td>
                  <td>{u.email || ''}</td>
                  <td>{u.birthYear ? new Date(u.birthYear).toLocaleDateString() : ''}</td>
                  <td>{u.idNumber || ''}</td>
                  <td>{u.idIssuedDate ? new Date(u.idIssuedDate).toLocaleDateString() : ''}</td>
                  <td>{u.idIssuedPlace || ''}</td>
                  <td>{u.yearStarted ? new Date(u.yearStarted).toLocaleDateString() : ''}</td>
                  <td>{u.position || ''}</td>
                  <td>{u.note || ''}</td>
                  <td style={{ width: 72, position: 'sticky', right: 0, background: '#fff', zIndex: 3 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', padding: 8 }}>
                      <button title="Chi tiết / Sửa" onClick={() => handleEdit(u)} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#5bc0de', color: '#fff', cursor: 'pointer' }}>✎</button>
                      <button title="Xóa nhân viên" onClick={() => handleDelete(u.id)} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#ff6b6b', color: '#fff', cursor: 'pointer' }}>🗑</button>
                      <button title="Phân quyền" onClick={() => { setPermTarget(u); setShowPermModal(true); }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#8e44ad', color: '#fff', cursor: 'pointer' }}>🔐</button>
                      <button title="Phân quyền nhóm hàng" onClick={() => { setPermTarget(u); setShowGroupPermModal(true); }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer' }}>📦</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ color: '#555' }}>Tổng {filtered.length} người dùng</div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  ⏮
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  ◀
                </button>

                {(() => {
                  const pages = [];
                  const maxButtons = 5;
                  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                  let end = Math.min(totalPages, start + maxButtons - 1);
                  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);
                  for (let p = start; p <= end; p++) {
                    pages.push(
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{ padding: '6px 10px', border: '1px solid #ddd', background: currentPage === p ? '#1890ff' : '#fff', color: currentPage === p ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        {p}
                      </button>
                    );
                  }
                  return pages;
                })()}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  ▶
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                >
                  ⏭
                </button>
              </div>

              {/* Page size dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  style={{ padding: '6px 12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {itemsPerPage} / trang
                  <span style={{ fontSize: '12px' }}>▼</span>
                </button>
                {showPageSizeDropdown && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} onClick={() => setShowPageSizeDropdown(false)} />
                    <div style={{ position: 'fixed', transform: 'translateY(-100%)', marginBottom: '40px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10000, minWidth: '120px' }}>
                      {[10, 20, 50, 100, 500, 1000].map(size => (
                        <div key={size} onClick={() => { setItemsPerPage(size); setCurrentPage(1); setShowPageSizeDropdown(false); }} style={{ padding: '8px 16px', cursor: 'pointer', background: itemsPerPage === size ? '#f0f0f0' : '#fff', fontSize: '14px', borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.target.style.background = '#f5f5f5'} onMouseLeave={(e) => e.target.style.background = itemsPerPage === size ? '#f0f0f0' : '#fff'}>
                          {size} / trang
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal show={showModal} onClose={() => setShowModal(false)} onSave={handleSave} initialData={editing} />
      )}
      {showPermModal && (
        <PermissionModal
          show={showPermModal}
          onClose={() => setShowPermModal(false)}
          onSave={async () => { setShowPermModal(false); await loadUsers(); }}
          user={permTarget}
          isGroup={false}
        />
      )}
      {showGroupPermModal && (
        <GroupPermissionModal
          show={showGroupPermModal}
          onClose={() => setShowGroupPermModal(false)}
          onSave={async () => { setShowGroupPermModal(false); await loadUsers(); }}
          user={permTarget}
        />
      )}
    </div>
  );
}
