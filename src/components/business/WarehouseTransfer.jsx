import React, { useState, useEffect } from 'react';
import './BusinessPage.css';

const WarehouseTransfer = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFromDate, setSearchFromDate] = useState('');
  const [searchToDate, setSearchToDate] = useState('');

  const [transfers, setTransfers] = useState([
    {
      id: 1,
      transferNumber: 'PCK250802-000001',
      transferDate: '02/08/2025',
      sourceWarehouse: 'Kho chính',
      targetWarehouse: 'Kho phụ',
      exportType: 'Chuyển kho nội bộ',
      importType: 'Nhập từ kho khác',
      employee: 'admin 66',
      note: 'Chuyển hàng từ kho chính sang kho phụ',
      totalAmount: 450000,
      items: [
        {
          id: 1,
          barcode: '8936049123456',
          productCode: 'SP001',
          productName: 'Coca Cola 330ml',
          unit: 'Thùng',
          description: 'Nước giải khát có ga',
          specification: '24 lon/thùng',
          conversion: 24,
          quantity: 2,
          unitPrice: 240000,
          totalPrice: 480000
        }
      ]
    },
    {
      id: 2,
      transferNumber: 'PCK250801-000002',
      transferDate: '01/08/2025',
      sourceWarehouse: 'Kho phụ',
      targetWarehouse: 'Kho chính',
      exportType: 'Chuyển kho nội bộ',
      importType: 'Nhập từ kho khác',
      employee: 'admin 66',
      note: 'Chuyển hàng ngược lại',
      totalAmount: 180000,
      items: [
        {
          id: 1,
          barcode: '8936049654321',
          productCode: 'SP002',
          productName: 'Bánh quy Oreo',
          unit: 'Thùng',
          description: 'Bánh quy nhân kem',
          specification: '12 gói/thùng',
          conversion: 12,
          quantity: 1,
          unitPrice: 180000,
          totalPrice: 180000
        }
      ]
    }
  ]);

  // Set selected transfer on component mount
  useEffect(() => {
    if (transfers.length > 0 && !selectedTransfer) {
      setSelectedTransfer(transfers[0]);
    }
  }, [transfers, selectedTransfer]);

  const handleSelectTransfer = (transfer) => {
    setSelectedTransfer(transfer);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu chuyển kho này?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      if (selectedTransfer && selectedTransfer.id === id) {
        setSelectedTransfer(transfers.length > 1 ? transfers.find(t => t.id !== id) : null);
      }
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.employee.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (searchFromDate || searchToDate) {
      const transferDate = new Date(transfer.transferDate.split('/').reverse().join('-'));
      if (searchFromDate) {
        const fromDate = new Date(searchFromDate);
        matchesDate = matchesDate && transferDate >= fromDate;
      }
      if (searchToDate) {
        const toDate = new Date(searchToDate);
        matchesDate = matchesDate && transferDate <= toDate;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    console.log('Export to Excel');
  };

  const handlePrint = () => {
    window.print();
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleAddItem = () => {
    console.log('Add new item');
  };

  const handleEditItem = (itemId) => {
    console.log('Edit item:', itemId);
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      console.log('Delete item:', itemId);
    }
  };

  const handleImportExcel = () => {
    console.log('Import from Excel');
  };

  const handleExportExcel = () => {
    console.log('Export to Excel');
  };

  const calculateTotalAmount = () => {
    if (!selectedTransfer || !selectedTransfer.items) return 0;
    return selectedTransfer.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  return (
    <div className="transfer-page">
      {/* Search Panel */}
      <div className="search-panel">
        <div className="panel-header">
          <h2>TÌM KIẾM</h2>
        </div>
        
        <div className="search-content">
          <div className="search-section">
            <div className="date-range-section">
              <input
                type="date"
                className="date-input"
                value={searchFromDate}
                onChange={(e) => setSearchFromDate(e.target.value)}
                placeholder="Từ ngày"
              />
              <input
                type="date"
                className="date-input"
                value={searchToDate}
                onChange={(e) => setSearchToDate(e.target.value)}
                placeholder="Đến ngày"
              />
            </div>
            
            <button className="btn btn-primary search-btn">
              <i className="fas fa-search"></i> Tìm kiếm
            </button>
          </div>

          <div className="search-stats">
            Tổng: {filteredTransfers.length}
          </div>

          <div className="search-results">
            <div className="results-header">
              <span>Ngày chuyển</span>
              <span>Thao tác</span>
            </div>
            
            {filteredTransfers.map(transfer => (
              <div 
                key={transfer.id}
                className={`result-item ${selectedTransfer?.id === transfer.id ? 'selected' : ''}`}
                onClick={() => handleSelectTransfer(transfer)}
              >
                <div>
                  <div className="result-number">{transfer.transferNumber}</div>
                  <div className="result-date">{transfer.transferDate}</div>
                  <div className="result-amount">
                    Tổng tiền: {transfer.totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="result-actions">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTransfer(transfer);
                    }}
                    title="Sửa"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    onClick={(e) => handleDelete(transfer.id, e)}
                    title="Xóa"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {filteredTransfers.length === 0 && (
              <div className="no-data">
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <div>Không tìm thấy phiếu chuyển kho</div>
                </div>
              </div>
            )}
          </div>

          <div className="search-pagination">
            <span>Dòng 1-{filteredTransfers.length} trên tổng {filteredTransfers.length} dòng</span>
            <div>
              <button>‹</button>
              <button>1</button>
              <button>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Detail Panel */}
      <div className="transfer-detail-panel">
        <div className="detail-header">
          <h2>THÔNG TIN CHUYỂN KHO</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={openModal}>
              <i className="fas fa-plus"></i> Tạo mới
            </button>
            <button className="btn btn-success import-btn">
              <i className="fas fa-plus-circle"></i> Thêm hàng hóa
            </button>
            <button className="btn btn-info">
              <i className="fas fa-history"></i> Xem lịch sử chuyển kho
            </button>
          </div>
        </div>

        {selectedTransfer ? (
          <div className="detail-content">
            <div className="detail-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày lập <span className="required">*</span></label>
                  <input 
                    type="date" 
                    value={selectedTransfer.transferDate.split('/').reverse().join('-')}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Số phiếu <span className="required">*</span></label>
                  <div className="input-with-status">
                    <input 
                      type="text" 
                      value={selectedTransfer.transferNumber}
                      readOnly
                    />
                    <span className="status-icon">✓</span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kho nguồn <span className="required">*</span></label>
                  <select value={selectedTransfer.sourceWarehouse}>
                    <option>Kho chính</option>
                    <option>Kho phụ</option>
                    <option>Kho thành phẩm</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kho đích <span className="required">*</span></label>
                  <select value={selectedTransfer.targetWarehouse}>
                    <option>Kho chính</option>
                    <option>Kho phụ</option>
                    <option>Kho thành phẩm</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại xuất <span className="required">*</span></label>
                  <select value={selectedTransfer.exportType}>
                    <option>Chuyển kho nội bộ</option>
                    <option>Xuất bán</option>
                    <option>Xuất hủy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Loại nhập <span className="required">*</span></label>
                  <select value={selectedTransfer.importType}>
                    <option>Nhập từ kho khác</option>
                    <option>Nhập từ nhà cung cấp</option>
                    <option>Nhập khác</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nhân viên</label>
                  <select value={selectedTransfer.employee}>
                    <option>admin 66</option>
                    <option>Nhân viên A</option>
                    <option>Nhân viên B</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <input 
                    type="text" 
                    value={selectedTransfer.note}
                    placeholder="Nhập ghi chú..."
                  />
                </div>
              </div>
            </div>

            <div className="items-section">
              <div className="items-header">
                <span>Tổng: {selectedTransfer.items?.length || 0}</span>
                <div className="items-actions">
                  <button className="icon-btn create-btn" onClick={handleAddItem} title="Thêm">
                    <i className="fas fa-plus"></i>
                  </button>
                  <button className="icon-btn import-btn" onClick={handleImportExcel} title="Import Excel">
                    <i className="fas fa-file-import"></i>
                  </button>
                  <button className="icon-btn export-btn" onClick={handleExportExcel} title="Export Excel">
                    <i className="fas fa-file-export"></i>
                  </button>
                  <button className="icon-btn print-btn" onClick={handlePrint} title="In A4">
                    <i className="fas fa-print"></i>
                  </button>
                  <button className="icon-btn settings-btn" title="Cài đặt">
                    <i className="fas fa-cog"></i>
                  </button>
                </div>
              </div>

              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Mã vạch</th>
                      <th>Mã hàng</th>
                      <th>Hàng hóa</th>
                      <th>Đơn vị tính</th>
                      <th>Mô tả</th>
                      <th>Quy cách</th>
                      <th>Quy đổi</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransfer.items && selectedTransfer.items.length > 0 ? (
                      selectedTransfer.items.map(item => (
                        <tr key={item.id}>
                          <td>{item.barcode}</td>
                          <td>{item.productCode}</td>
                          <td>{item.productName}</td>
                          <td>{item.unit}</td>
                          <td>{item.description}</td>
                          <td>{item.specification}</td>
                          <td>{item.conversion}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unitPrice.toLocaleString('vi-VN')}</td>
                          <td>{item.totalPrice.toLocaleString('vi-VN')}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-small btn-secondary"
                                onClick={() => handleEditItem(item.id)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="no-data">
                          <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <div>Chưa có sản phẩm nào</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-summary">
                <div>
                  <span>Tổng tiền: <strong>{calculateTotalAmount().toLocaleString('vi-VN')} đ</strong></span>
                </div>
                <div>Không đồng</div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-save"></i> Lưu lại
                </button>
                <button className="btn btn-purple" onClick={handlePrint}>
                  <i className="fas fa-print"></i> In A4
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div>Chọn một phiếu chuyển kho để xem chi tiết</div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating new transfer */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo phiếu chuyển kho mới</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <h4>Thông tin chung</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ngày lập <span className="required">*</span></label>
                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label>Số phiếu <span className="required">*</span></label>
                    <input type="text" placeholder="Tự động tạo" readOnly />
                  </div>
                  <div className="form-group">
                    <label>Kho nguồn <span className="required">*</span></label>
                    <select>
                      <option value="">Chọn kho nguồn</option>
                      <option>Kho chính</option>
                      <option>Kho phụ</option>
                      <option>Kho thành phẩm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kho đích <span className="required">*</span></label>
                    <select>
                      <option value="">Chọn kho đích</option>
                      <option>Kho chính</option>
                      <option>Kho phụ</option>
                      <option>Kho thành phẩm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Loại xuất <span className="required">*</span></label>
                    <select>
                      <option>Chuyển kho nội bộ</option>
                      <option>Xuất bán</option>
                      <option>Xuất hủy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Loại nhập <span className="required">*</span></label>
                    <select>
                      <option>Nhập từ kho khác</option>
                      <option>Nhập từ nhà cung cấp</option>
                      <option>Nhập khác</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhân viên</label>
                    <select>
                      <option>admin 66</option>
                      <option>Nhân viên A</option>
                      <option>Nhân viên B</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú</label>
                    <textarea rows="3" placeholder="Nhập ghi chú..."></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Hủy</button>
              <button className="btn btn-primary">Tạo phiếu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseTransfer;
