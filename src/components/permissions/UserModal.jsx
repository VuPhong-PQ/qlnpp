import React, { useState, useEffect, useRef } from 'react';
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

export default function UserModal({ show, onClose, onSave, initialData }) {
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initialData) setForm({ ...empty, ...initialData });
    else setForm(empty);
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

  const handleResetPassword = () => {
    setForm(prev => ({ ...prev, password: '' }));
    alert('Mật khẩu đã được đặt lại tạm thời. (Thực hiện backend để gửi mật khẩu mới.)');
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
      // Convert date strings to proper format if needed
      birthYear: form.birthYear ? new Date(form.birthYear).toISOString() : null,
      idIssuedDate: form.idIssuedDate ? new Date(form.idIssuedDate).toISOString() : null,
      yearStarted: form.yearStarted ? new Date(form.yearStarted).toISOString() : null
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
                <input name="birthYear" type="date" value={form.birthYear} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Số CMND/CCCD</label>
                <input name="idNumber" value={form.idNumber} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Ngày cấp</label>
                <input name="idIssuedDate" type="date" value={form.idIssuedDate} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Nơi cấp</label>
                <input name="idIssuedPlace" value={form.idIssuedPlace} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Năm vào làm</label>
                <input name="yearStarted" type="date" value={form.yearStarted} onChange={handleChange} />
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
              <button type="button" className="btn btn-success" onClick={handleResetPassword}>Đặt lại mật khẩu</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Lưu lại</button>
              <button type="button" className="btn btn-danger" onClick={onClose}>Đóng</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
