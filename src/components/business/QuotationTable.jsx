import React, { useState } from 'react';
import './BusinessPage.css';

const QuotationTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [quotations, setQuotations] = useState([
    {
      id: 1,
      quotationNumber: 'PBG250802-000029',
      createdDate: '01/08/2025',
      quotationType: 'retail',
      note: 'Báo giá cho khách hàng lẻ',
      creator: 'admin 66',
      items: [
        {
          id: 1,
          productType: 'Nước giải khát',
          barcode: '8936049123456',
          productCode: 'SP001',
          productName: 'Coca Cola 330ml',
          baseUnit: 'Thùng',
          basePrice: 240000,
          description: 'Coca Cola 330ml'
        }
      ]
    },
    {
      id: 2,
      quotationNumber: 'PBG250717-000030',
      createdDate: '17/07/2025',
      quotationType: 'wholesale',
      note: 'Báo giá cho đại lý',
      creator: 'admin 66',
      items: [
        {
          id: 1,
          productType: 'Bánh kẹo',
          barcode: '8936049654321',
          productCode: 'SP002',
          productName: 'Bánh quy Oreo',
          baseUnit: 'Thùng',
          basePrice: 180000,
          description: 'Bánh quy Oreo'
        }
      ]
    }
  ]);

  // Set selected quotation on component mount
  React.useEffect(() => {
    if (quotations.length > 0 && !selectedQuotation) {
      setSelectedQuotation(quotations[0]);
    }
  }, [quotations, selectedQuotation]);

  const handleSelectQuotation = (quotation) => {
    setSelectedQuotation(quotation);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa báo giá này?')) {
      const newQuotations = quotations.filter(item => item.id !== id);
      setQuotations(newQuotations);
      if (selectedQuotation && selectedQuotation.id === id) {
        setSelectedQuotation(newQuotations.length > 0 ? newQuotations[0] : null);
      }
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    return quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           quotation.creator.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExport = () => {
    alert('Chức năng xuất Excel đang được phát triển');
  };

  const handlePrint = () => {
    alert('Chức năng in A4 đang được phát triển');
  };

  const openModal = () => {
    setShowModal(true);
  };

  return (
    <div className="quotation-page">
      {/* Left Panel - Quotation List */}
      <div className="quotation-list-panel">
        <div className="panel-header">
          <h2>DANH SÁCH BÁO GIÁ</h2>
          <div className="panel-actions">
            <button className="icon-btn create-btn" onClick={openModal}>
              <span>+</span>
            </button>
            <button className="icon-btn export-btn" onClick={handleExport}>
              <span>⚙</span>
            </button>
          </div>
        </div>
        
        <div className="panel-stats">
          <span>Tổng {filteredQuotations.length}</span>
        </div>

        <div className="search-section">
          <div className="search-row">
            <label>Ngày báo giá</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
            />
            <label>Số báo giá</label>
          </div>
        </div>

        <div className="quotation-list">
          {filteredQuotations.map((quotation) => (
            <div 
              key={quotation.id}
              className={`quotation-item ${selectedQuotation?.id === quotation.id ? 'selected' : ''}`}
              onClick={() => handleSelectQuotation(quotation)}
            >
              <div className="quotation-date">{quotation.createdDate} 07:51</div>
              <div className="quotation-number">{quotation.quotationNumber}</div>
              <button 
                className="delete-btn"
                onClick={(e) => handleDelete(quotation.id, e)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button>‹</button>
          <span>Dòng 1-2 trên tổng 2 dòng</span>
          <button>›</button>
          <div className="pagination-controls">
            <span>1</span>
            <select>
              <option>10 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Right Panel - Quotation Details */}
      <div className="quotation-detail-panel">
        {selectedQuotation ? (
          <>
            <div className="detail-header">
              <h2>THÔNG TIN BÁO GIÁ</h2>
              <button className="btn btn-primary" onClick={openModal}>
                + Tạo mới
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Số báo giá</label>
                    <div className="input-with-status">
                      <input 
                        type="text" 
                        value={selectedQuotation.quotationNumber}
                        readOnly 
                      />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <input 
                      type="text" 
                      value={selectedQuotation.note}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày lập</label>
                    <input 
                      type="text" 
                      value={selectedQuotation.createdDate}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại báo giá</label>
                    <div className="input-with-status">
                      <input 
                        type="text" 
                        value={selectedQuotation.quotationType === 'retail' ? 'Giá lẻ' : 'Giá sỉ'}
                        readOnly
                      />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Chọn hàng hóa báo giá</label>
                    <div className="radio-group">
                      <label>
                        <input type="radio" defaultChecked readOnly />
                        Tất cả hàng hóa
                      </label>
                      <label>
                        <input type="radio" readOnly />
                        Chọn từng hàng hóa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Người lập</label>
                    <input 
                      type="text" 
                      value={selectedQuotation.creator}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <span>Tổng {selectedQuotation.items?.length || 0}</span>
                  <div className="items-actions">
                    <button className="icon-btn create-btn">
                      <span>+</span>
                    </button>
                    <button className="icon-btn print-btn" onClick={handlePrint}>
                      <span>🖨</span>
                    </button>
                    <button className="icon-btn settings-btn">
                      <span>⚙</span>
                    </button>
                  </div>
                </div>

                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Loại hàng</th>
                        <th>Mã vạch</th>
                        <th>Mã hàng</th>
                        <th>Tên hàng</th>
                        <th>Mô tả</th>
                        <th>Đvt</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.items?.length > 0 ? (
                        selectedQuotation.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.productType}</td>
                            <td>{item.barcode}</td>
                            <td>{item.productCode}</td>
                            <td>{item.productName}</td>
                            <td>{item.description}</td>
                            <td>{item.baseUnit}</td>
                            <td>
                              <div className="action-up-down">
                                <button>▲</button>
                                <button>▼</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="no-data">
                            <div className="empty-state">
                              <div className="empty-icon">📋</div>
                              <div>Trống</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-info" onClick={() => alert('Lưu lại')}>
                  📁 Lưu lại
                </button>
                <button className="btn btn-purple" onClick={handlePrint}>
                  🖨 In A4
                </button>
                <button className="btn btn-success" onClick={handleExport}>
                  📤 Xuất Excel
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <h3>Chọn một báo giá để xem chi tiết</h3>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo mới báo giá</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Chức năng tạo báo giá đang được phát triển...</p>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationTable;
