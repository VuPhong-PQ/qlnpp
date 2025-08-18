import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import './BusinessPage.css';
import './ImportGoods.css';
import { Table, Button, Space, Popconfirm, Input, Modal } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ImportGoods = () => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, record: null });

  // Xử lý chuột phải trên bảng
  const handleTableContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      record: null
    });
  };
  // Đóng menu khi click ngoài
  React.useEffect(() => {
    const handleClick = () => setContextMenu(c => ({ ...c, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);
  const [showModal, setShowModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-08-01');
  const [dateTo, setDateTo] = useState('2025-08-08');
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
    const matchesCode = !searchCode || importItem.importNumber.toLowerCase().includes(searchCode.toLowerCase());
    // Lọc theo khoảng ngày nhập (so sánh yyyy-mm-dd)
    let matchesDate = true;
    if (dateFrom && dateTo) {
      // importItem.createdDate dạng DD/MM/YYYY
      const [d, m, y] = importItem.createdDate.split('/');
      const importDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      matchesDate = importDate >= dateFrom && importDate <= dateTo;
    }
    return matchesSearch && matchesType && matchesEmployee && matchesCode && matchesDate;
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

  // Table row selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
      // Optional: select import in detail panel if only 1 row selected
      if (newSelectedRowKeys.length === 1) {
        const found = filteredImports.find(i => i.id === newSelectedRowKeys[0]);
        if (found) setSelectedImport(found);
      }
    },
  };

  // Modal tìm kiếm số phiếu
  const searchInputRef = useRef();

  const columns = [
    {
      title: '',
      dataIndex: 'checkbox',
      width: 40,
      render: (_, record) => null,
    },
    {
      title: <span>Số phiếu <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => setShowSearchModal(true)} /></span>,
      dataIndex: 'importNumber',
      key: 'importNumber',
      render: (text, record) => (
        <span style={{fontWeight: selectedImport?.id === record.id ? 600 : 400, cursor:'pointer'}} onClick={() => handleSelectImport(record)}>{text}</span>
      ),
      sorter: (a, b) => a.importNumber.localeCompare(b.importNumber),
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text) => text,
      sorter: (a, b) => a.createdDate.localeCompare(b.createdDate),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (_, record) => {
        // Tính tổng tiền từ items
        const total = (record.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
        return total.toLocaleString('vi-VN');
      },
      sorter: (a, b) => {
        const ta = (a.items||[]).reduce((sum, item) => sum + (item.total||0), 0);
        const tb = (b.items||[]).reduce((sum, item) => sum + (item.total||0), 0);
        return ta-tb;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={e => {e.stopPropagation();}} title="Sửa" />
          <Popconfirm title="Bạn có chắc chắn muốn xóa phiếu nhập này?" onConfirm={e => handleDelete(record.id, e)} okText="Có" cancelText="Không">
            <Button icon={<DeleteOutlined />} danger size="small" onClick={e => e.stopPropagation()} title="Xóa" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="import-goods-page">
      {/* Left Panel - Table Search */}
  <div className="search-panel">
        <div className="panel-header">
          <h2>TÌM KIẾM</h2>
        </div>
        <div className="search-panel-controls">
          <div className="search-panel-date-row">
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          </div>
          <select value={importType} onChange={e=>setImportType(e.target.value)}>
            <option value="">loại nhập</option>
            <option value="nhập thường">Nhập thường</option>
            <option value="nhập khẩn cấp">Nhập khẩn cấp</option>
            <option value="nhập trả hàng">Nhập trả hàng</option>
          </select>
          <select value={employee} onChange={e=>setEmployee(e.target.value)}>
            <option value="">nhân viên lập</option>
            <option value="admin 66">admin 66</option>
            <option value="user 01">user 01</option>
          </select>
          <Button type="primary">Tìm kiếm</Button>
        </div>
        <div className="search-panel-total">
          <span>Tổng {filteredImports.length}</span>
        </div>
        <div className="table-scroll-x" onContextMenu={handleTableContextMenu} style={{ position: 'relative' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredImports}
            rowSelection={{
              type: 'checkbox',
              ...rowSelection,
              columnTitle: '',
              columnWidth: 40,
            }}
            pagination={false}
            size="small"
            onRow={record => ({
              onClick: () => handleSelectImport(record)
            })}
            rowClassName={record => selectedImport?.id === record.id ? 'selected' : ''}
            style={{minWidth:600}}
          />
          {contextMenu.visible && (
            <Menu
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              onClick={() => setContextMenu(c => ({ ...c, visible: false }))}
            >
              <Menu.Item key="view">✔️ Xem chi tiết</Menu.Item>
              <Menu.Item key="delete">🗑️ Xóa</Menu.Item>
              <Menu.Item key="print">🖨️ In danh sách đã chọn</Menu.Item>
            </Menu>
          )}
        </div>
        {/* Modal tìm kiếm số phiếu */}
        <Modal
          open={showSearchModal}
          onCancel={()=>setShowSearchModal(false)}
          onOk={()=>setShowSearchModal(false)}
          title="Tìm kiếm theo số phiếu"
          footer={null}
        >
          <Input
            ref={searchInputRef}
            placeholder="Nhập mã phiếu..."
            value={searchCode}
            onChange={e=>setSearchCode(e.target.value)}
            allowClear
            style={{marginBottom:12}}
            onPressEnter={()=>setShowSearchModal(false)}
          />
          <div style={{maxHeight:180, overflowY:'auto'}}>
            {imports.filter(i=>i.importNumber.toLowerCase().includes(searchCode.toLowerCase())).map(i=>(
              <div key={i.id} style={{padding:'4px 0', cursor:'pointer', color:'#1677ff'}} onClick={()=>{setSearchCode(i.importNumber); setShowSearchModal(false);}}>{i.importNumber}</div>
            ))}
            {imports.filter(i=>i.importNumber.toLowerCase().includes(searchCode.toLowerCase())).length===0 && <div style={{color:'#bbb'}}>Không có số phiếu</div>}
          </div>
        </Modal>
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
