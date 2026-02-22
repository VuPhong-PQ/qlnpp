import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import '../setup/SetupPage.css';

const empty = {
  username: '',
  avatarUrl: '',
  password: '',
  name: '',
  email: '',
  phone: '',
  birthYear: '',
  idNumber: '',
  idIssuedDate: '',
  idIssuedPlace: '',
  yearStarted: '',
  position: '',
  note: '',
  isInactive: false
};

// Helper function to format date for display (dd/MM/yyyy)
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';
  try {
    // Handle dd/MM/yyyy format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;
    // Handle yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [y, m, d] = dateValue.split('-');
      return `${d}/${m}/${y}`;
    }
    // Handle old dd-MM-yyyy format (backward compat)
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      return dateValue.replace(/-/g, '/');
    }
    // Handle ISO format
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return '';
  }
};

// Helper function to convert dd/MM/yyyy to ISO for API
const parseDisplayDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle dd/MM/yyyy format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
  }
  // Handle old dd-MM-yyyy format (backward compat)
  const matchOld = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (matchOld) {
    const [, d, m, y] = matchOld;
    return new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
  }
  return null;
};

export default function UserModal({ show, onClose, onSave, initialData }) {
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPwDialog, setShowResetPwDialog] = useState(false);
  const [resetPwNewPassword, setResetPwNewPassword] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      // Format date fields properly for display (dd/MM/yyyy)
      setForm({
        ...empty,
        ...initialData,
        birthYear: formatDateForDisplay(initialData.birthYear),
        idIssuedDate: formatDateForDisplay(initialData.idIssuedDate),
        yearStarted: formatDateForDisplay(initialData.yearStarted),
      });
    } else {
      setForm(empty);
    }
  }, [initialData, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAvatarClick = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setForm(prev => ({ ...prev, avatarUrl: url }));
  };

  const handleResetPassword = async () => {
    // If editing existing user, show dialog to enter new password
    if (initialData && initialData.id) {
      setResetPwNewPassword('');
      setResetPwConfirm('');
      setResetPwError('');
      setShowResetPwDialog(true);
    } else {
      // For new user, just clear password field
      setForm(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmResetPassword = async () => {
    setResetPwError('');
    
    if (!resetPwNewPassword) {
      setResetPwError('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (resetPwNewPassword !== resetPwConfirm) {
      setResetPwError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setResetPwLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${initialData.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPwNewPassword }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Đã đặt lại mật khẩu cho người dùng "${initialData.username}" thành công!`);
        setShowResetPwDialog(false);
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

  const submit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.username?.trim()) {
      alert('Tên đăng nhập là bắt buộc!');
      return;
    }
    
    // Prepare data for API
    const submitData = {
      ...form,
      passwordHash: form.password, // Map password -> passwordHash
      // Convert dd/MM/yyyy date strings to ISO format for API
      birthYear: parseDisplayDate(form.birthYear),
      idIssuedDate: parseDisplayDate(form.idIssuedDate),
      yearStarted: parseDisplayDate(form.yearStarted)
    };
    
    // Remove password field since we mapped it to passwordHash
    delete submitData.password;
    
    onSave(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h3>{initialData ? 'Chỉnh sửa' : 'Thêm mới'} nhân viên</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit}>
          <div className="form-section">
            <h4>THÔNG TIN NHÂN VIÊN</h4>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div onClick={handleAvatarClick} style={{ width: 120, height: 120, border: '2px dashed #e9ecef', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 20 }}>📷</div>
                    <div>Chọn ảnh đại diện</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label><span className="required">*</span> Tên đăng nhập</label>
                <input name="username" value={form.username} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label><span className="required">*</span> Mật khẩu</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password || ''} onChange={handleChange} style={{ flex: 1 }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="btn btn-secondary" style={{ marginLeft: 8 }}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div className="form-group full-width">
                <label><span className="required">*</span> Tên nhân viên</label>
                <input name="name" value={form.name} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Năm sinh</label>
                <input name="birthYear" type="text" placeholder="dd/MM/yyyy" value={form.birthYear || ''} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Số CMND/CCCD</label>
                <input name="idNumber" value={form.idNumber} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Ngày cấp</label>
                <input name="idIssuedDate" type="text" placeholder="dd/MM/yyyy" value={form.idIssuedDate || ''} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Nơi cấp</label>
                <input name="idIssuedPlace" value={form.idIssuedPlace} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Năm vào làm</label>
                <input name="yearStarted" type="text" placeholder="dd/MM/yyyy" value={form.yearStarted || ''} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Chức vụ</label>
                <input name="position" value={form.position} onChange={handleChange} />
              </div>

              <div className="form-group full-width">
                <label>Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="isInactive" checked={form.isInactive || false} onChange={handleChange} />
                  Ngưng hoạt động
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>
              {initialData && initialData.id && (
                <button type="button" className="btn btn-success" onClick={handleResetPassword}>Đặt lại mật khẩu</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Lưu lại</button>
              <button type="button" className="btn btn-danger" onClick={onClose}>Đóng</button>
            </div>
          </div>
        </form>

        {/* Reset Password Dialog */}
        {showResetPwDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              width: 400,
              maxWidth: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: 16 }}>Đặt lại mật khẩu cho "{initialData?.username}"</h3>
              
              {resetPwError && (
                <div style={{ 
                  background: '#fff5f5', 
                  color: '#e53e3e', 
                  padding: 12, 
                  borderRadius: 6, 
                  marginBottom: 16,
                  fontSize: 14
                }}>
                  {resetPwError}
                </div>
              )}
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Mật khẩu mới</label>
                <input
                  type="password"
                  value={resetPwNewPassword}
                  onChange={(e) => setResetPwNewPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={resetPwConfirm}
                  onChange={(e) => setResetPwConfirm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmResetPassword(); }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowResetPwDialog(false)}
                  disabled={resetPwLoading}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleConfirmResetPassword}
                  disabled={resetPwLoading}
                >
                  {resetPwLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
