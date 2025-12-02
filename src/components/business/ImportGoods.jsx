import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import './BusinessPage.css';
import './ImportGoods.css';
import { Table, Button, Space, Popconfirm, Input, Modal } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { removeVietnameseTones } from '../../utils/searchUtils';

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

  // Column visibility & header filters for left table
  const IMPORT_LEFT_COLS_KEY = 'import_goods_left_cols_v1';
  const defaultLeftCols = ['checkbox','importNumber','createdDate','total','actions'];
  const [leftVisibleCols, setLeftVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(IMPORT_LEFT_COLS_KEY));
      if (Array.isArray(v)) return v;
    } catch {}
    return defaultLeftCols;
  });
  const [leftFilters, setLeftFilters] = useState({ importNumber: '', createdDate: '', total: '' });
  // modal-based column filters (lists of selected values)
  const [leftFilterLists, setLeftFilterLists] = useState({ importNumber: [], createdDate: [], total: [] });
  const [activeHeaderModalColumn, setActiveHeaderModalColumn] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSelections, setModalSelections] = useState([]);
  const [modalAvailableItems, setModalAvailableItems] = useState([]);
  const [leftPageSize, setLeftPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('import_left_page_size')||'10',10); return isNaN(v)?10:v; } catch { return 10; }
  });
  const [leftPage, setLeftPage] = useState(1);
  const [showLeftSettings, setShowLeftSettings] = useState(false);

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
    const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
    const normalizedNumber = removeVietnameseTones(importItem.importNumber.toLowerCase());
    const normalizedEmployee = removeVietnameseTones(importItem.employee.toLowerCase());
    const matchesSearch = normalizedNumber.includes(normalizedSearch) || normalizedEmployee.includes(normalizedSearch);
    
    const matchesType = !importType || importItem.importType === importType;
    const matchesEmployee = !employee || importItem.employee === employee;
    
    const normalizedCode = removeVietnameseTones(searchCode.toLowerCase());
    const matchesCode = !searchCode || normalizedNumber.includes(normalizedCode);
    
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

  // apply header filters for left table (modal-driven list filters)
  const filteredLeft = filteredImports.filter(i => {
    const importMatch = leftFilterLists.importNumber && leftFilterLists.importNumber.length > 0
      ? leftFilterLists.importNumber.includes(i.importNumber)
      : true;
    const dateMatch = leftFilterLists.createdDate && leftFilterLists.createdDate.length > 0
      ? leftFilterLists.createdDate.includes(i.createdDate)
      : true;
    const totalValue = String((i.items||[]).reduce((s,it)=>s+(it.total||0),0));
    const totalMatch = leftFilterLists.total && leftFilterLists.total.length > 0
      ? leftFilterLists.total.includes(totalValue)
      : true;
    return importMatch && dateMatch && totalMatch;
  });

  React.useEffect(() => {
    localStorage.setItem(IMPORT_LEFT_COLS_KEY, JSON.stringify(leftVisibleCols));
  }, [leftVisibleCols]);

  React.useEffect(() => {
    localStorage.setItem('import_left_page_size', String(leftPageSize));
    setLeftPage(1);
  }, [leftPageSize]);

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

  const openHeaderModal = (colKey) => {
    setActiveHeaderModalColumn(colKey);
    setModalSearchTerm('');
    setModalSelections(leftFilterLists[colKey] ? [...leftFilterLists[colKey]] : []);
    // prepare available values from current filteredImports
    let items = [];
    if (colKey === 'importNumber') items = Array.from(new Set(filteredImports.map(i => i.importNumber)));
    else if (colKey === 'createdDate') items = Array.from(new Set(filteredImports.map(i => i.createdDate)));
    else if (colKey === 'total') items = Array.from(new Set(filteredImports.map(i => String((i.items||[]).reduce((s,it)=>s+(it.total||0),0)))));
    setModalAvailableItems(items);
    setShowSearchModal(true);
  };

  const columns = [
    {
      title: '',
      dataIndex: 'checkbox',
      width: 40,
      render: (_, record) => null,
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Số phiếu</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('importNumber')} />
          {leftFilterLists.importNumber && leftFilterLists.importNumber.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.importNumber.length})</span>}
        </div>
      ),
      dataIndex: 'importNumber',
      key: 'importNumber',
      render: (text, record) => (
        <span style={{fontWeight: selectedImport?.id === record.id ? 600 : 400, cursor:'pointer'}} onClick={() => handleSelectImport(record)}>{text}</span>
      ),
      sorter: (a, b) => a.importNumber.localeCompare(b.importNumber),
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Ngày nhập</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('createdDate')} />
          {leftFilterLists.createdDate && leftFilterLists.createdDate.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.createdDate.length})</span>}
        </div>
      ),
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text) => text,
      sorter: (a, b) => a.createdDate.localeCompare(b.createdDate),
    },
    {
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Tổng tiền</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('total')} />
          {leftFilterLists.total && leftFilterLists.total.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.total.length})</span>}
        </div>
      ),
      dataIndex: 'total',
      key: 'total',
      render: (_, record) => {
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
          <div className="search-controls-grid">
            <div className="search-left">
              <div className="search-panel-date-row">
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
              </div>
              <div className="search-panel-select-row">
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
              </div>
            </div>
            <div className="search-panel-button">
              <Button type="primary" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Tìm kiếm</Button>
            </div>
          </div>
        </div>
        <div className="search-panel-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Tổng {filteredLeft.length}</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button style={{background:'transparent',border:'none',cursor:'pointer'}} title="Cài đặt bảng" onClick={()=>setShowLeftSettings(true)}>⚙</button>
          </div>
        </div>
        <div className="table-scroll-x" onContextMenu={handleTableContextMenu} style={{ position: 'relative' }}>
          <Table
            rowKey="id"
            columns={columns.filter(c => leftVisibleCols.includes(c.dataIndex || c.key || ''))}
            dataSource={filteredLeft}
            rowSelection={{
              type: 'checkbox',
              ...rowSelection,
              columnTitle: '',
              columnWidth: 40,
            }}
            pagination={{
              current: leftPage,
              pageSize: leftPageSize,
              total: filteredLeft.length,
              showSizeChanger: true,
              pageSizeOptions: ['10','20','50','100','200','500','1000'],
              onShowSizeChange: (page, size) => { setLeftPageSize(size); },
              onChange: (page, size) => { setLeftPage(page); setLeftPageSize(size); }
            }}
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
        {/* Modal for column header filters (reused for different columns) */}
        <Modal
          open={showSearchModal}
          onCancel={()=>setShowSearchModal(false)}
          onOk={()=>setShowSearchModal(false)}
          title={activeHeaderModalColumn === 'importNumber' ? 'Tìm kiếm theo số phiếu' : activeHeaderModalColumn === 'createdDate' ? 'Lọc theo ngày nhập' : activeHeaderModalColumn === 'total' ? 'Lọc theo tổng tiền' : 'Tìm kiếm'}
          footer={null}
        >
          <Input
            placeholder={activeHeaderModalColumn === 'importNumber' ? 'Tìm kiếm theo mã' : activeHeaderModalColumn === 'createdDate' ? 'Tìm ngày (DD/MM/YYYY)' : 'Tìm...'}
            value={modalSearchTerm}
            onChange={e=>setModalSearchTerm(e.target.value)}
            allowClear
            style={{marginBottom:12}}
            onPressEnter={()=>{}}
          />
          <div style={{maxHeight:240, overflowY:'auto', paddingRight:8}}>
            {modalAvailableItems.filter(v => {
              if (!modalSearchTerm) return true;
              return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(modalSearchTerm.toLowerCase()));
            }).map(v => (
              <div key={v} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
                <input type="checkbox" checked={modalSelections.includes(v)} onChange={() => {
                  setModalSelections(prev => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev, v]);
                }} />
                <div style={{flex:1, wordBreak:'break-word'}}>{v}</div>
              </div>
            ))}
            {modalAvailableItems.filter(v => {
              if (!modalSearchTerm) return true;
              return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(modalSearchTerm.toLowerCase()));
            }).length === 0 && <div style={{color:'#bbb'}}>Không có dữ liệu</div>}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
            <div>
              <button className="btn btn-link" onClick={()=>{ setModalSearchTerm(''); }}>Xem tất cả</button>
              <button className="btn btn-link" onClick={()=>{ setModalSelections([]); }}>Bỏ chọn</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-secondary" onClick={()=>{ setModalSelections([]); setLeftFilterLists(prev=>({ ...prev, [activeHeaderModalColumn]: [] })); setShowSearchModal(false); }}>Xóa bộ lọc</button>
              <button className="btn btn-primary" onClick={()=>{
                setLeftFilterLists(prev=>({ ...prev, [activeHeaderModalColumn]: modalSelections }));
                setShowSearchModal(false);
              }}>Tìm</button>
            </div>
          </div>
        </Modal>
        {/* Left table settings modal */}
        <Modal
          open={showLeftSettings}
          onCancel={()=>setShowLeftSettings(false)}
          title="Cài đặt hiển thị cột"
          footer={null}
        >
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {defaultLeftCols.map(colKey=>{
              const label = colKey==='checkbox'?'':(colKey==='importNumber'?'Số phiếu':colKey==='createdDate'?'Ngày nhập':colKey==='total'?'Tổng tiền':colKey==='actions'?'Thao tác':colKey);
              return (
                <label key={colKey} style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={leftVisibleCols.includes(colKey)} onChange={()=>{
                    setLeftVisibleCols(prev=> prev.includes(colKey)? prev.filter(k=>k!==colKey) : [...prev, colKey]);
                  }} />
                  <span>{label}</span>
                </label>
              );
            })}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button onClick={()=>{ setLeftVisibleCols(defaultLeftCols); }} className="btn btn-secondary">Làm lại</button>
              <button onClick={()=>setShowLeftSettings(false)} className="btn btn-primary">Đóng</button>
            </div>
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
              <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Top row: Ngày lập, Nhân viên, Loại nhập, Tổng số kg, Tổng số khối (each 20%) */}
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                    <input type="text" value={selectedImport.createdDate} readOnly style={{width:'100%'}} />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                    <select style={{width:'100%'}}>
                      <option value={selectedImport.employee}>{selectedImport.employee}</option>
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại nhập</label>
                    <select style={{width:'100%'}}>
                      <option value={selectedImport.importType}>{selectedImport.importType}</option>
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số kg</label>
                    <input type="number" value={selectedImport.totalWeight} readOnly style={{width:'100%'}} />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số khối</label>
                    <input type="number" value={selectedImport.totalVolume} readOnly style={{width:'100%'}} />
                  </div>
                </div>

                {/* Second row: Số phiếu (30%) and Ghi chú (70%) */}
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{flex:'0 0 30%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số phiếu</label>
                    <div className="input-with-status">
                      <input type="text" value={selectedImport.importNumber} readOnly style={{width:'100%'}} />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div style={{flex:'1 1 70%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú</label>
                    <input type="text" value={selectedImport.note} readOnly style={{width:'100%'}} />
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
