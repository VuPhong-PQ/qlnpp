import React, { useState } from 'react';
import './BusinessPage.css';

const ImportGoods = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('01/08/2025');
  const [dateTo, setDateTo] = useState('02/08/2025');
  const [importType, setImportType] = useState('');
  const [employee, setEmployee] = useState('');

  const [imports, setImports] = useState([
    {
      id: 1,
      importNumber: 'PN250802-000401',
      createdDate: '02/08/2025',
      employee: 'admin 66',
      importType: 'nhập thường',
      totalWeight: 0,
      totalVolume: 0,
      note: 'Nhập hàng từ NCC A',
      items: [
        {
          id: 1,
          barcode: '8936049123456',
          productCode: 'SP001',
          productName: 'Coca Cola 330ml',
          productType: 'Nước giải khát',
          unit: 'Thùng',
          manufactureDate: '01/08/2025',
          expiryMonths: 12,
          expiryDate: '01/08/2026',
          description: 'Coca Cola lon 330ml',
          specification: '24 lon/thùng',
          conversion: 24,
          quantity: 10,
          unitPrice: 240000,
          transportFee: 5000,
          transportTotal: 50000,
          weight: 100,
          volume: 2,
          warehouse: 'Kho chính',
          total: 2450000
        }
      ]
    },
    {
      id: 2,
      importNumber: 'PN250801-000046',
      createdDate: '01/08/2025',
      employee: 'admin 66',
      importType: 'nhập thường',
      totalWeight: 0,
      totalVolume: 0,
      note: 'Nhập hàng từ NCC B',
      items: []
    }
  ]);

  const [formData, setFormData] = useState({
    importNumber: '',
    createdDate: new Date().toISOString().split('T')[0],
    employee: 'admin 66',
    importType: '',
    totalWeight: 0,
    totalVolume: 0,
    note: ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      barcode: '',
      productCode: '',
      productName: '',
      productType: '',
      unit: '',
      manufactureDate: '',
      expiryMonths: '',
      expiryDate: '',
      description: '',
      specification: '',
      conversion: '',
      quantity: '',
      unitPrice: '',
      transportFee: '',
      transportTotal: '',
      weight: '',
      volume: '',
      warehouse: '',
      total: 0
    }
  ]);

  // Set selected import on component mount
  React.useEffect(() => {
    if (imports.length > 0 && !selectedImport) {
      setSelectedImport(imports[0]);
    }
  }, [imports, selectedImport]);

  const handleSelectImport = (importItem) => {
    setSelectedImport(importItem);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) {
      const newImports = imports.filter(item => item.id !== id);
      setImports(newImports);
      if (selectedImport && selectedImport.id === id) {
        setSelectedImport(newImports.length > 0 ? newImports[0] : null);
      }
    }
  };

  const filteredImports = imports.filter(importItem => {
    const matchesSearch = importItem.importNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         importItem.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !importType || importItem.importType === importType;
    const matchesEmployee = !employee || importItem.employee === employee;
    
    return matchesSearch && matchesType && matchesEmployee;
  });

  const handleExport = () => {
    alert('Chức năng xuất Excel đang được phát triển');
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  const handlePrint = () => {
    alert('Chức năng in A4 đang được phát triển');
  };

  const handleAddItem = () => {
    alert('Chức năng thêm hàng hóa đang được phát triển');
  };

  const handleViewHistory = () => {
    alert('Chức năng xem lịch sử nhập hàng đang được phát triển');
  };

  const openModal = () => {
    setShowModal(true);
  };

  const generateImportNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const count = imports.length + 1;
    return `PN${year}${month}${day}-${count.toString().padStart(6, '0')}`;
  };

  return (
    <div className="import-goods-page">
      {/* Left Panel - Search */}
      <div className="search-panel">
        <div className="panel-header">
          <h2>TÌM KIẾM</h2>
        </div>
        
        <div className="search-content">
          <div className="search-section">
            <div className="date-range-section">
              <div className="form-group">
                <input 
                  type="date" 
                  value={dateFrom.split('/').reverse().join('-')}
                  onChange={(e) => setDateFrom(e.target.value.split('-').reverse().join('/'))}
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <input 
                  type="date" 
                  value={dateTo.split('/').reverse().join('-')}
                  onChange={(e) => setDateTo(e.target.value.split('-').reverse().join('/'))}
                  className="date-input"
                />
              </div>
            </div>

            <div className="form-group">
              <select 
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="select-input"
              >
                <option value="">Loại nhập</option>
                <option value="nhập thường">Nhập thường</option>
                <option value="nhập khẩn cấp">Nhập khẩn cấp</option>
                <option value="nhập trả hàng">Nhập trả hàng</option>
              </select>
            </div>

            <div className="form-group">
              <select 
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="select-input"
              >
                <option value="">Nhân viên lập</option>
                <option value="admin 66">admin 66</option>
                <option value="user 01">user 01</option>
              </select>
            </div>

            <button className="btn btn-primary search-btn">
              Tìm kiếm
            </button>
          </div>

          <div className="search-stats">
            <span>Tổng {filteredImports.length}</span>
          </div>

          <div className="search-results">
            <div className="results-header">
              <div className="col-header">Số phiếu</div>
              <div className="col-header">Thao tác</div>
            </div>
            
            {filteredImports.map((importItem) => (
              <div 
                key={importItem.id}
                className={`result-item ${selectedImport?.id === importItem.id ? 'selected' : ''}`}
                onClick={() => handleSelectImport(importItem)}
              >
                <div className="result-number">{importItem.importNumber}</div>
                <div className="result-actions">
                  <button className="btn-icon btn-edit" title="Sửa">✏️</button>
                  <button className="btn-icon btn-delete" onClick={(e) => handleDelete(importItem.id, e)} title="Xóa">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className="search-pagination">
            <button>‹</button>
            <span>Dòng 1-{filteredImports.length} trên tổng {filteredImports.length} dòng</span>
            <button>›</button>
            <div className="pagination-controls">
              <span>1</span>
              <select>
                <option>10 / trang</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Import Details */}
      <div className="import-detail-panel">
        {selectedImport ? (
          <>
            <div className="detail-header">
              <h2>THÔNG TIN NHẬP HÀNG</h2>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={openModal}>
                  + Tạo mới
                </button>
                <button className="btn btn-success" onClick={handleAddItem}>
                  📦 Thêm hàng hóa
                </button>
                <button className="btn btn-info" onClick={handleViewHistory}>
                  📋 Xem lịch sử nhập hàng
                </button>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày lập</label>
                    <input 
                      type="text" 
                      value={selectedImport.createdDate}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Nhân viên lập</label>
                    <select>
                      <option value={selectedImport.employee}>{selectedImport.employee}</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại nhập</label>
                    <select>
                      <option value={selectedImport.importType}>{selectedImport.importType}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tổng số kg</label>
                    <input 
                      type="number" 
                      value={selectedImport.totalWeight}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Tổng số khối</label>
                    <input 
                      type="number" 
                      value={selectedImport.totalVolume}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số phiếu</label>
                    <div className="input-with-status">
                      <input 
                        type="text" 
                        value={selectedImport.importNumber}
                        readOnly 
                      />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <input 
                      type="text" 
                      value={selectedImport.note}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <span>Tổng {selectedImport.items?.length || 0}</span>
                  <span className="summary-text">Không động</span>
                  <div className="items-actions">
                    <button className="icon-btn create-btn" onClick={handleAddItem}>
                      <span>+</span>
                    </button>
                    <button className="icon-btn print-btn" onClick={handlePrint}>
                      <span>🖨</span>
                    </button>
                    <button className="icon-btn import-btn" onClick={handleImport}>
                      <span>📥</span>
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
                        <th>Mã vạch</th>
                        <th>Mã hàng</th>
                        <th>Hàng hóa</th>
                        <th>Loại hàng</th>
                        <th>Đơn vị tính</th>
                        <th>Ngày sản xuất</th>
                        <th>Hạn sử dụng</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedImport.items?.length > 0 ? (
                        selectedImport.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.barcode}</td>
                            <td>{item.productCode}</td>
                            <td>{item.productName}</td>
                            <td>{item.productType}</td>
                            <td>{item.unit}</td>
                            <td>{item.manufactureDate}</td>
                            <td>{item.expiryDate}</td>
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
                          <td colSpan="8" className="no-data">
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

                <div className="table-summary">
                  <span>Tổng tiền: <strong>0</strong></span>
                  <span>Không động</span>
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
            <h3>Chọn một phiếu nhập để xem chi tiết</h3>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo mới phiếu nhập</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Chức năng tạo phiếu nhập đang được phát triển...</p>
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

export default ImportGoods;
