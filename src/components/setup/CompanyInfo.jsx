import React, { useState, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';

const CompanyInfo = () => {
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState(null);
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

  // Load company info from API
  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.companyInfos);
      if (data && data.length > 0) {
        const company = data[0]; // Chỉ có 1 bản ghi company info
        setCompanyId(company.id);
        setFormData({
          companyName: company.companyName || '',
          businessCode: company.businessCode || '',
          representative: company.representative || '',
          position: company.position || '',
          address: company.address || '',
          email: company.email || '',
          phone: company.phone || '',
          bankName: company.bankName || '',
          accountNumber: company.accountNumber || '',
          transferNote: company.transferNote || ''
        });
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (companyId) {
        // Cập nhật thông tin hiện tại - gửi kèm Id trong body
        const dataWithId = { ...formData, id: companyId };
        await api.put(API_ENDPOINTS.companyInfos, companyId, dataWithId);
        alert('Thông tin doanh nghiệp đã được cập nhật thành công!');
      } else {
        // Tạo mới (lần đầu)
        const newCompany = await api.post(API_ENDPOINTS.companyInfos, formData);
        setCompanyId(newCompany.id);
        alert('Thông tin doanh nghiệp đã được lưu thành công!');
      }
      await loadCompanyInfo();
    } catch (error) {
      console.error('Error saving company info:', error);
      alert('Không thể lưu thông tin doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới form?')) {
      loadCompanyInfo(); // Load lại dữ liệu từ server
    }
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Thông tin doanh nghiệp</h1>
        <p>Cập nhật thông tin cơ bản của doanh nghiệp</p>
      </div>

      {loading && <div className="loading">Đang tải...</div>}

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
            <button type="button" onClick={handleReset} className="btn btn-secondary" disabled={loading}>
              Làm mới
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfo;
