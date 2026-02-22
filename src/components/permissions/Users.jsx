import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../setup/SetupPage.css';
import UserModal from './UserModal';
import PermissionModal from './PermissionModal';
import GroupPermissionModal from './GroupPermissionModal';
import { API_ENDPOINTS, api, API_BASE_URL } from '../../config/api';
import { exportToExcel, importFromExcel } from '../../utils/excelUtils';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permTarget, setPermTarget] = useState(null);
  const [showGroupPermModal, setShowGroupPermModal] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchInputRef = React.useRef(null);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();
  // Phân trang (kế thừa theo mẫu các trang như Products)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  
  // Reset password modal
  const [showResetPwModal, setShowResetPwModal] = useState(false);
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  // Mobile: which user's action panel is open
  const [openActionsFor, setOpenActionsFor] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
  // File import ref
  const fileInputRef = React.useRef(null);
  // Selected rows for export
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // Delete all users in system
  const handleDeleteAll = async () => {
    const confirm = window.confirm('Xác nhận xóa TOÀN BỘ nhân viên trong hệ thống? Hành động này không thể hoàn tác.');
    if (!confirm) return;
    try {
      setLoading(true);
      // Use POST /delete-all as some servers disallow DELETE on collection
      const res = await fetch(`${API_ENDPOINTS.users}/delete-all`, { method: 'POST' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Xóa toàn bộ thất bại');
      }
      await loadUsers();
      alert('Đã xóa toàn bộ nhân viên');
    } catch (err) {
      console.error('Delete all failed', err);
      alert('Xóa toàn bộ thất bại: ' + (err.message || err));
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

  // Reset password handlers
  const openResetPwModal = (user) => {
    setResetPwUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetPwError('');
    setShowResetPwModal(true);
  };

  const handleResetPassword = async () => {
    setResetPwError('');
    
    if (!newPassword) {
      setResetPwError('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setResetPwError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setResetPwLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${resetPwUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Đã đặt lại mật khẩu cho người dùng "${resetPwUser.username}"`);
        setShowResetPwModal(false);
      } else {
        setResetPwError(data.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (err) {
      console.error('Reset password failed', err);
      setResetPwError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setResetPwLoading(false);
    }
  };

  const filtered = applyFilters(users, search, ['username', 'name', 'phone', 'email', 'idNumber']);

  const updateSuggestions = (value) => {
    if (!value || !users || users.length === 0) {
      setSuggestions([]);
      return;
    }

    const q = value.toString().toLowerCase();
    const matched = users.filter(u => {
      return (u.name || '').toString().toLowerCase().includes(q)
        || (u.username || '').toString().toLowerCase().includes(q)
        || (u.phone || '').toString().toLowerCase().includes(q)
        || (u.email || '').toString().toLowerCase().includes(q)
        || (u.idNumber || '').toString().toLowerCase().includes(q);
    }).slice(0, 8);

    setSuggestions(matched);
  };

  const renderActionButtons = (u) => (
    <>
      <button title="Chi tiết / Sửa" onClick={() => handleEdit(u)} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#5bc0de', color: '#fff', cursor: 'pointer' }}>✎</button>
      <button title="Đặt lại mật khẩu" onClick={() => openResetPwModal(u)} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#f39c12', color: '#fff', cursor: 'pointer' }}>🔓</button>
      <button title="Xóa nhân viên" onClick={() => handleDelete(u.id)} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#ff6b6b', color: '#fff', cursor: 'pointer' }}>🗑</button>
      <button title="Phân quyền" onClick={() => { setPermTarget(u); setShowPermModal(true); }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#8e44ad', color: '#fff', cursor: 'pointer' }}>🔐</button>
      <button title="Phân quyền nhóm hàng" onClick={() => { setPermTarget(u); setShowGroupPermModal(true); }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer' }}>📦</button>
    </>
  );

  // Phân trang: tính toán các giá trị
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  // Reset về trang 1 khi search hoặc column filters thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, columnFilters]);

  const handleExport = async () => {
    if (!users || users.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const source = (selectedIds && selectedIds.size > 0) ? users.filter(u => selectedIds.has(u.id || u.code)) : filtered;

    const data = source.map(u => ({
      'Tên đăng nhập': u.username || '',
      'Tên nhân viên': u.name || '',
      'Số điện thoại': u.phone || '',
      'Email': u.email || '',
      'Năm sinh': u.birthYear ? new Date(u.birthYear).toLocaleDateString('vi-VN') : '',
      'Số CMND/CCCD': u.idNumber || '',
      'Ngày cấp': u.idIssuedDate ? new Date(u.idIssuedDate).toLocaleDateString('vi-VN') : '',
      'Nơi cấp': u.idIssuedPlace || '',
      'Năm vào làm': u.yearStarted ? new Date(u.yearStarted).toLocaleDateString('vi-VN') : '',
      'Chức vụ': u.position || '',
      'Ghi chú': u.note || ''
    }));

    await exportToExcel(data, 'Danh_sach_nhan_vien', 'Nhân viên');
  };

  // Toggle select single row
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleRowContextMenu = (e, u) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, target: u });
  };

  useEffect(() => {
    const onClick = (e) => {
      if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, target: null });
    };
    const onKey = (e) => { if (e.key === 'Escape') setContextMenu({ visible: false, x: 0, y: 0, target: null }); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [contextMenu.visible]);

  // Select / deselect all visible (paginated) rows
  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      const allVisibleIds = paginated.map(u => u.id || u.code);
      const allSelected = allVisibleIds.every(id => s.has(id));
      if (allSelected) {
        allVisibleIds.forEach(id => s.delete(id));
      } else {
        allVisibleIds.forEach(id => s.add(id));
      }
      return s;
    });
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      importFromExcel(file, async (jsonData) => {
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let cancelled = false;
        const errors = [];

        const parseDate = (val) => {
          if (!val) return null;
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d.toISOString();
        };

        for (const row of jsonData) {
          try {
            const newUser = {
              username: (row['Tên đăng nhập'] || row['Username'] || '')?.toString().trim(),
              name: (row['Tên nhân viên'] || row['Name'] || '')?.toString().trim(),
              phone: (row['Số điện thoại'] || '')?.toString().trim(),
              email: (row['Email'] || '')?.toString().trim(),
              birthYear: parseDate(row['Năm sinh']),
              idNumber: (row['Số CMND/CCCD'] || '')?.toString().trim(),
              idIssuedDate: parseDate(row['Ngày cấp']),
              idIssuedPlace: (row['Nơi cấp'] || '')?.toString().trim(),
              yearStarted: parseDate(row['Năm vào làm']),
              position: (row['Chức vụ'] || '')?.toString().trim(),
              note: (row['Ghi chú'] || '')?.toString().trim()
            };

            if (!newUser.username || !newUser.name) {
              errors.push(`Dòng thiếu username hoặc tên: ${JSON.stringify(row)}`);
              errorCount++;
              continue;
            }

            // Check if user already exists in current system
            const existsInState = users && users.some(u => (u.username || '').toString().trim() === (newUser.username || '').toString().trim());
            if (existsInState) {
              const displayName = newUser.username || newUser.name || '';
              const proceed = window.confirm(`Nhân viên "${displayName}" đã có trong hệ thống. Nhấn OK để BỎ QUA và tiếp tục, hoặc Cancel để HỦY import.`);
              if (!proceed) {
                cancelled = true;
                break;
              }
              skippedCount++;
              continue;
            }

            await api.post(API_ENDPOINTS.users, newUser);
            successCount++;
          } catch (err) {
            console.error('Import row failed', err);
            errors.push(err.message || JSON.stringify(err));
            errorCount++;
          }
        }
        await loadUsers();

        let msg = cancelled ? 'Import bị hủy bởi người dùng.' : `Import hoàn tất. Thành công: ${successCount}, Lỗi: ${errorCount}, Bỏ qua: ${skippedCount}`;
        if (errors.length > 0) {
          msg += '\n\nChi tiết lỗi:\n' + errors.slice(0, 5).join('\n');
          if (errors.length > 5) msg += `\n... và ${errors.length - 5} lỗi khác`;
        }
        alert(msg);
      }, 0);
    } catch (err) {
      console.error('Import failed', err);
      alert('Lỗi khi import file: ' + (err.message || err));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Người dùng</h1>
        <p>Quản lý danh sách người dùng / nhân viên</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo Mã, Tên, SĐT, CMND..."
            className="search-box"
            value={search}
            ref={searchInputRef}
            onChange={e => { const v = e.target.value; setSearch(v); updateSuggestions(v); setShowSuggestions(true); }}
            onFocus={() => { updateSuggestions(search); setShowSuggestions(true); }}
            onKeyDown={(e) => {
              if (showSuggestions && suggestions.length > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion(i => Math.min(suggestions.length - 1, (i === -1 ? 0 : i + 1))); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion(i => Math.max(-1, (i === -1 ? suggestions.length - 1 : i - 1))); }
                else if (e.key === 'Enter') {
                  if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
                    const sel = suggestions[activeSuggestion];
                    setSearch(sel.name || sel.username || '');
                    setShowSuggestions(false);
                    setActiveSuggestion(-1);
                    setCurrentPage(1);
                    e.preventDefault();
                  }
                } else if (e.key === 'Escape') { setShowSuggestions(false); setActiveSuggestion(-1); }
              }
            }}
          />
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', marginTop: 6, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 2000, width: 360 }} onMouseDown={(e) => e.preventDefault()}>
              {suggestions.map((s, idx) => (
                <div
                  key={s.id || s.username || idx}
                  onClick={() => { setSearch(s.name || s.username || ''); setShowSuggestions(false); setActiveSuggestion(-1); setCurrentPage(1); }}
                  onMouseEnter={() => setActiveSuggestion(idx)}
                  style={{ padding: '8px 12px', cursor: 'pointer', background: activeSuggestion === idx ? '#f5f7fb' : '#fff', borderBottom: '1px solid #f0f0f0' }}
                >
                  <div style={{ fontWeight: 600 }}>{s.name || s.username}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.username || ''} {s.phone ? ' · ' + s.phone : ''} {s.email ? ' · ' + s.email : ''}</div>
                </div>
              ))}
            </div>
          )}
          </div>
          <div className="table-actions">
            <button className="btn btn-primary" onClick={handleAdd}>+ Thêm nhân viên</button>
            <button className="btn btn-success" onClick={handleExport} style={{ marginLeft: 8 }}>📤 Export Excel</button>
            <button className="btn btn-secondary" onClick={handleImportClick} style={{ marginLeft: 8 }}>📥 Import NV</button>
            <button className="btn btn-danger" onClick={handleDeleteAll} style={{ marginLeft: 8 }} disabled={loading}>🗑 Xóa toàn bộ NV</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls" onChange={handleFileChange} />
            {selectedIds && selectedIds.size > 0 && (
              <div style={{ display: 'inline-block', marginLeft: 12, color: '#555' }}>Đã chọn: {selectedIds.size}</div>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                                      <th style={{ width: 40, textAlign: 'center' }}>
                                        <input type="checkbox" onChange={toggleSelectAllVisible} checked={paginated.length > 0 && paginated.every(row => selectedIds.has(row.id || row.code))} />
                                      </th>
                      <th style={{ position: 'relative' }}>
                      Tên đăng nhập
                      <span onClick={() => setShowFilterPopup('username')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('username', 'Tên đăng nhập', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Tên nhân viên
                      <span onClick={() => setShowFilterPopup('name')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('name', 'Tên nhân viên', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Số điện thoại
                      <span onClick={() => setShowFilterPopup('phone')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('phone', 'Số điện thoại', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Email
                      <span onClick={() => setShowFilterPopup('email')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('email', 'Email', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Năm sinh
                      <span onClick={() => setShowFilterPopup('birthYear')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('birthYear', 'Năm sinh', true, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Số CMND/CCCD
                      <span onClick={() => setShowFilterPopup('idNumber')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idNumber', 'Số CMND/CCCD', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Ngày cấp
                      <span onClick={() => setShowFilterPopup('idIssuedDate')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idIssuedDate', 'Ngày cấp', true, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Nơi cấp
                      <span onClick={() => setShowFilterPopup('idIssuedPlace')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('idIssuedPlace', 'Nơi cấp', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Năm vào làm
                      <span onClick={() => setShowFilterPopup('yearStarted')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('yearStarted', 'Năm vào làm', true, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Chức vụ
                      <span onClick={() => setShowFilterPopup('position')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('position', 'Chức vụ', false, users)}
                    </th>
                    <th style={{ position: 'relative' }}>
                      Ghi chú
                      <span onClick={() => setShowFilterPopup('note')} style={{ marginLeft: 8, cursor: 'pointer' }}>🔍</span>
                      {renderFilterPopup('note', 'Ghi chú', false, users)}
                    </th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={13} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
              )}

              {!loading && paginated.map(u => (
                <tr key={u.id || u.code} onContextMenu={(e) => handleRowContextMenu(e, u)}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.has(u.id || u.code)} onChange={() => toggleSelect(u.id || u.code)} />
                  </td>
                  <td>{u.username || ''}</td>
                  <td>{u.name || ''}</td>
                  <td>{u.phone || ''}</td>
                  <td>{u.email || ''}</td>
                  <td>{u.birthYear ? new Date(u.birthYear).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{u.idNumber || ''}</td>
                  <td>{u.idIssuedDate ? new Date(u.idIssuedDate).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{u.idIssuedPlace || ''}</td>
                  <td>{u.yearStarted ? new Date(u.yearStarted).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{u.position || ''}</td>
                  <td>{u.note || ''}</td>
                  <td style={{ width: 64, position: 'sticky', right: 0, background: '#fff', zIndex: 3 }}>
                    <div style={{ position: 'relative', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Desktop / wide screens: show inline row */}
                      <div className="action-row" style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        {renderActionButtons(u)}
                      </div>

                      {/* Mobile toggle: visible on small screens via CSS below */}
                      <button className="action-toggle" onClick={(e) => { e.stopPropagation(); setOpenActionsFor(openActionsFor === u.id ? null : u.id); }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#3498db', color: '#fff', cursor: 'pointer', display: 'none' }} title="Mở hành động">▸</button>

                      {/* Mobile overlay panel */}
                      {openActionsFor === u.id && (
                        <>
                          <div onClick={() => setOpenActionsFor(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
                          <div style={{ position: 'fixed', right: 16, bottom: 90, zIndex: 1001, background: '#fff', border: '1px solid #ddd', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {renderActionButtons(u)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Responsive CSS placed here so it stays colocated with component */}
                    <style>{`
                      @media (max-width: 600px) {
                        .action-row { display: none !important; }
                        .action-toggle { display: inline-flex !important; }
                      }
                      @media (min-width: 601px) {
                        .action-toggle { display: none !important; }
                      }
                    `}</style>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contextMenu.visible && contextMenu.target && (
          <div onMouseDown={(e) => e.stopPropagation()} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 20000, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => { handleEdit(contextMenu.target); setContextMenu({ visible: false, x:0,y:0,target:null }); }}>✎ Xem chi tiết</div>
            <div style={{ padding: '8px 12px', cursor: 'pointer', color: '#c9302c' }} onClick={() => { handleDelete(contextMenu.target.id); setContextMenu({ visible: false, x:0,y:0,target:null }); }}>🗑 Xóa</div>
          </div>
        )}

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
                    <div style={{ position: 'absolute', right: 0, bottom: '44px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10000, minWidth: '120px' }}>
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

      {/* Reset Password Modal */}
      {showResetPwModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔓 Đặt lại mật khẩu
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', color: '#666' }}>
                Đặt lại mật khẩu cho người dùng: <strong>{resetPwUser?.username}</strong>
              </p>
              {resetPwUser?.name && (
                <p style={{ margin: 0, color: '#999', fontSize: 14 }}>
                  ({resetPwUser.name})
                </p>
              )}
            </div>

            {resetPwError && (
              <div style={{
                background: '#fff3f3',
                border: '1px solid #ffccc7',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 16,
                color: '#ff4d4f',
                fontSize: 14
              }}>
                {resetPwError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleResetPassword(); }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResetPwModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPwLoading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 6,
                  background: resetPwLoading ? '#ccc' : '#f39c12',
                  color: '#fff',
                  cursor: resetPwLoading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {resetPwLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
