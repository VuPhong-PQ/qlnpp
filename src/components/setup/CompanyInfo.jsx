import React, { useState } from 'react';
import './SetupPage.css';

const CompanyInfo = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessCode: '',
    representative: '',
    position: '',
    address: '',
    email: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    transferNote: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Company Info Data:', formData);
    // Xử lý lưu dữ liệu
    alert('Thông tin doanh nghiệp đã được lưu thành công!');
  };

  const handleReset = () => {
    setFormData({
      companyName: '',
      businessCode: '',
      representative: '',
      position: '',
      address: '',
      email: '',
      phone: '',
      bankName: '',
      accountNumber: '',
      transferNote: ''
    });
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Thông tin doanh nghiệp</h1>
        <p>Cập nhật thông tin cơ bản của doanh nghiệp</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-section">
            <h3>Thông tin cơ bản</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="companyName">Tên doanh nghiệp <span className="required">*</span></label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên doanh nghiệp"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessCode">Mã số doanh nghiệp <span className="required">*</span></label>
                <input
                  type="text"
                  id="businessCode"
                  name="businessCode"
                  value={formData.businessCode}
                  onChange={handleInputChange}
                  placeholder="Nhập mã số doanh nghiệp"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="representative">Người đại diện <span className="required">*</span></label>
                <input
                  type="text"
                  id="representative"
                  name="representative"
                  value={formData.representative}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người đại diện"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="position">Chức vụ</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Nhập chức vụ"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Địa chỉ <span className="required">*</span></label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ doanh nghiệp"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Thông tin liên hệ</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Thông tin ngân hàng</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bankName">Tên ngân hàng</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên ngân hàng"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số tài khoản"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="transferNote">Lưu ý chuyển khoản</label>
              <textarea
                id="transferNote"
                name="transferNote"
                value={formData.transferNote}
                onChange={handleInputChange}
                placeholder="Nhập lưu ý chuyển khoản (sẽ hiển thị trên hóa đơn)"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              Làm mới
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfo;
