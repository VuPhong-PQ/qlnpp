import React, { useState, useRef, useEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import useColumnFilter from '../../hooks/useColumnFilter.jsx';
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { ExcelButtons } from '../common/ExcelButtons.jsx';

const AccountsFunds = () => {
  const [activeTab, setActiveTab] = useState('funds');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Column filter hook
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters } = useColumnFilter();

  // --- Kéo-thả, hiển thị, lưu cấu hình cột bảng quỹ tiền ---
  const fundTableRef = useRef(null);
  const defaultFundColumns = [
    { key: 'code', label: 'Mã quỹ' },
    { key: 'name', label: 'Tên quỹ' },
    { key: 'accountHolder', label: 'Chủ tài khoản' },
    { key: 'accountNumber', label: 'Số tài khoản' },
    { key: 'bank', label: 'Ngân hàng' },
    { key: 'branch', label: 'Chi nhánh' },
    { key: 'initialBalance', label: 'Số dư ban đầu' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Ngưng hoạt động' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultFundWidths = [90, 120, 120, 120, 120, 120, 110, 110, 100, 90];
  const [fundColumns, setFundColumns] = useState(() => {
    const saved = localStorage.getItem('fundColumns');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // Map lại label/fixed nếu có update code
        return arr.map(col => {
          const def = defaultFundColumns.find(d => d.key === col.key);
          return def ? { ...def, ...col } : col;
        });
      } catch {
        return defaultFundColumns;
      }
    }
    return defaultFundColumns;
  });
  const [fundColWidths, setFundColWidths] = useState(() => {
    const saved = localStorage.getItem('fundColWidths');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === defaultFundWidths.length) return arr;
      } catch {}
    }
    return defaultFundWidths;
  });
  const defaultFundVisible = defaultFundColumns.map(col => col.key);
  const [fundVisibleCols, setFundVisibleCols] = useState(() => {
    const saved = localStorage.getItem('fundVisibleCols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return defaultFundVisible;
  });
  const [showFundColSetting, setShowFundColSetting] = useState(false);
  const fundColSettingRef = useRef(null);
  // Drag state
  const [dragColIdx, setDragColIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Lưu cấu hình cột vào localStorage
  useEffect(() => {
    localStorage.setItem('fundColumns', JSON.stringify(fundColumns));
  }, [fundColumns]);
  useEffect(() => {
    localStorage.setItem('fundColWidths', JSON.stringify(fundColWidths));
  }, [fundColWidths]);
  useEffect(() => {
    localStorage.setItem('fundVisibleCols', JSON.stringify(fundVisibleCols));
  }, [fundVisibleCols]);

  // Độ rộng mặc định cho bảng khoản vay
  const defaultLoanWidths = [120, 140, 110, 110, 110, 100, 120, 120, 90, 90, 90];
  const [loanColWidths, setLoanColWidths] = useState(defaultLoanWidths);
  const loanTableRef = useRef(null);

  // Cột hiển thị cho bảng khoản vay
  const loanColumns = [
    { key: 'accountNumber', label: 'Số tài khoản' },
    { key: 'loanName', label: 'Tên khoản nợ NH' },
    { key: 'loanDate', label: 'Ngày vay' },
    { key: 'dueDate', label: 'Ngày đáo hạn' },
    { key: 'interestPeriod', label: 'Kỳ trả lãi' },
    { key: 'interestCost', label: 'CP lãi' },
    { key: 'principalPayment', label: 'Trả gốc hàng kỳ' },
    { key: 'principalAmount', label: 'Tiền trả gốc' },
    { key: 'note', label: 'Ghi chú (%)' },
    { key: 'status', label: 'Tình trạng' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultLoanVisible = loanColumns.map(col => col.key);
  const [loanVisibleCols, setLoanVisibleCols] = useState(defaultLoanVisible);
  const [showLoanColSetting, setShowLoanColSetting] = useState(false);
  const loanColSettingRef = useRef(null);

  // Đóng popup + tự động lưu khi click ra ngoài cho popup cài đặt cột quỹ tiền
  useEffect(() => {
    if (!showFundColSetting) return;
    const handleClickOutside = (e) => {
      if (fundColSettingRef.current && !fundColSettingRef.current.contains(e.target)) {
        setShowFundColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFundColSetting]);

  // Đóng popup khi click ra ngoài cho popup cài đặt cột khoản vay
  React.useEffect(() => {
    if (!showLoanColSetting) return;
    const handleClickOutside = (e) => {
      if (loanColSettingRef.current && !loanColSettingRef.current.contains(e.target)) {
        setShowLoanColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLoanColSetting]);

  // Hàm xử lý kéo cột cho bảng quỹ tiền (kéo mép trái/phải)
  const handleFundMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...fundColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setFundColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right' && index < widths.length - 1) {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
          newWidths[index + 1] = Math.max(50, startWidths[index + 1] - delta);
        } else if (edge === 'left' && index > 0) {
          newWidths[index] = Math.max(50, startWidths[index] - delta);
          newWidths[index - 1] = Math.max(50, startWidths[index - 1] + delta);
        }
        return newWidths;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Hàm xử lý kéo cột cho bảng khoản vay (kéo mép trái/phải)
  const handleLoanMouseDown = (index, e, edge) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...loanColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setLoanColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right' && index < widths.length - 1) {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
          newWidths[index + 1] = Math.max(50, startWidths[index + 1] - delta);
        } else if (edge === 'left' && index > 0) {
          newWidths[index] = Math.max(50, startWidths[index] - delta);
          newWidths[index - 1] = Math.max(50, startWidths[index - 1] + delta);
        }
        return newWidths;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  const [funds, setFunds] = useState([]);

  // Load funds from API
  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.accountFunds);
      setFunds(data);
    } catch (error) {
      console.error('Error loading funds:', error);
      alert('Không thể tải danh sách quỹ tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const [bankLoans, setBankLoans] = useState([]);

  // Load bank loans from API
  useEffect(() => {
    loadBankLoans();
  }, []);

  const loadBankLoans = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.bankLoans);
      setBankLoans(data);
    } catch (error) {
      console.error('Error loading bank loans:', error);
      alert('Không thể tải danh sách nợ ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  // Excel Import/Export hook for AccountFunds
  const { handleExportExcel, handleImportExcel, handleFileChange, fileInputRef } = useExcelImportExport({
    data: funds,
    entityName: 'AccountFund',
    columnMapping: [
      { header: 'Mã quỹ', field: 'code' },
      { header: 'Tên quỹ', field: 'name' },
      { header: 'Chủ tài khoản', field: 'accountHolder' },
      { header: 'Số tài khoản', field: 'accountNumber' },
      { header: 'Ngân hàng', field: 'bank' },
      { header: 'Chi nhánh', field: 'branch' },
      { header: 'Số dư ban đầu', field: 'initialBalance' },
      { header: 'Ghi chú', field: 'note' },
      { header: 'Trạng thái', field: 'status' }
    ],
    apiEndpoint: API_ENDPOINTS.accountFunds,
    fetchData: loadFunds,
    transformDataForExport: (item) => ({
      'Mã quỹ': item.code || '',
      'Tên quỹ': item.name || '',
      'Chủ tài khoản': item.accountHolder || '',
      'Số tài khoản': item.accountNumber || '',
      'Ngân hàng': item.bank || '',
      'Chi nhánh': item.branch || '',
      'Số dư ban đầu': item.initialBalance || 0,
      'Ghi chú': item.note || '',
      'Trạng thái': item.status ? 'Ngưng' : 'Hoạt động'
    }),
    transformDataForImport: (row) => ({
      code: row['Mã quỹ']?.toString().trim() || '',
      name: row['Tên quỹ']?.toString().trim() || '',
      accountHolder: row['Chủ tài khoản']?.toString().trim() || '',
      accountNumber: row['Số tài khoản']?.toString().trim() || '',
      bank: row['Ngân hàng']?.toString().trim() || '',
      branch: row['Chi nhánh']?.toString().trim() || '',
      initialBalance: parseFloat(row['Số dư ban đầu']) || 0,
      note: row['Ghi chú']?.toString().trim() || '',
      status: row['Trạng thái']?.toString().toLowerCase().includes('ngưng') ? true : false
    })
  });

  // Excel Import/Export hook for BankLoans
  const { 
    handleExportExcel: handleExportExcelLoans, 
    handleImportExcel: handleImportExcelLoans, 
    handleFileChange: handleFileChangeLoans, 
    fileInputRef: fileInputRefLoans 
  } = useExcelImportExport({
    data: bankLoans,
    entityName: 'BankLoan',
    columnMapping: [
      { header: 'Số tài khoản', field: 'accountNumber' },
      { header: 'Tên khoản nợ NH', field: 'loanName' },
      { header: 'Ngày vay', field: 'loanDate' },
      { header: 'Ngày đáo hạn', field: 'dueDate' },
      { header: 'Kỳ trả lãi', field: 'interestPeriod' },
      { header: 'CP lãi', field: 'interestCost' },
      { header: 'Trả gốc hàng kỳ', field: 'principalPayment' },
      { header: 'Tiền trả gốc', field: 'principalAmount' },
      { header: 'Ghi chú (%)', field: 'note' },
      { header: 'Tình trạng', field: 'status' }
    ],
    apiEndpoint: API_ENDPOINTS.bankLoans,
    fetchData: loadBankLoans,
    transformDataForExport: (item) => ({
      'Số tài khoản': item.accountNumber || '',
      'Tên khoản nợ NH': item.loanName || '',
      'Ngày vay': item.loanDate || '',
      'Ngày đáo hạn': item.dueDate || '',
      'Kỳ trả lãi': item.interestPeriod || '',
      'CP lãi': item.interestCost || 0,
      'Trả gốc hàng kỳ': item.principalPayment || 0,
      'Tiền trả gốc': item.principalAmount || 0,
      'Ghi chú (%)': item.note || '',
      'Tình trạng': item.status || ''
    }),
    transformDataForImport: (row) => ({
      accountNumber: row['Số tài khoản']?.toString().trim() || '',
      loanName: row['Tên khoản nợ NH']?.toString().trim() || '',
      loanDate: row['Ngày vay']?.toString().trim() || '',
      dueDate: row['Ngày đáo hạn']?.toString().trim() || '',
      interestPeriod: row['Kỳ trả lãi']?.toString().trim() || '',
      interestCost: parseFloat(row['CP lãi']) || 0,
      principalPayment: parseFloat(row['Trả gốc hàng kỳ']) || 0,
      principalAmount: parseFloat(row['Tiền trả gốc']) || 0,
      note: row['Ghi chú (%)']?.toString().trim() || '',
      status: row['Tình trạng']?.toString().trim() || ''
    })
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    accountHolder: '',
    accountNumber: '',
    bank: '',
    branch: '',
    initialBalance: 0,
    note: '',
    status: 'active',
    // For bank loans
    loanName: '',
    loanDate: '',
    dueDate: '',
    interestPeriod: '',
    interestCost: 0,
    principalPayment: 0,
    principalAmount: 0
  });

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
      if (activeTab === 'funds') {
        if (editingItem) {
          const dataWithId = { ...formData, id: editingItem.id };
          await api.put(API_ENDPOINTS.accountFunds, editingItem.id, dataWithId);
        } else {
          await api.post(API_ENDPOINTS.accountFunds, formData);
        }
        await loadFunds();
      } else {
        // Bank loans
        if (editingItem) {
          const dataWithId = { ...formData, id: editingItem.id };
          await api.put(API_ENDPOINTS.bankLoans, editingItem.id, dataWithId);
        } else {
          await api.post(API_ENDPOINTS.bankLoans, formData);
        }
        await loadBankLoans();
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Không thể lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      accountHolder: '',
      accountNumber: '',
      bank: '',
      branch: '',
      initialBalance: 0,
      note: '',
      status: 'active',
      loanName: '',
      loanDate: '',
      dueDate: '',
      interestPeriod: '',
      interestCost: 0,
      principalPayment: 0,
      principalAmount: 0
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
      try {
        setLoading(true);
        if (activeTab === 'funds') {
          await api.delete(API_ENDPOINTS.accountFunds, id);
          await loadFunds();
        } else {
          await api.delete(API_ENDPOINTS.bankLoans, id);
          await loadBankLoans();
        }
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Không thể xóa dữ liệu');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredFunds = applyFilters(funds, searchTerm, ['name', 'code', 'accountHolder', 'accountNumber', 'bank', 'branch', 'note']);

  const filteredBankLoans = applyFilters(bankLoans, searchTerm, ['loanName', 'accountNumber', 'loanDate', 'dueDate', 'interestPeriod', 'note']);

  // Định dạng số tiền: chỉ có dấu phẩy, không có chữ "đ", luôn dùng dấu phẩy ngăn cách
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return amount;
    // Đảm bảo luôn là dấu phẩy, thay dấu chấm nếu có
    return amount.toLocaleString('vi-VN').replace(/\./g, ',');
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Tài khoản quỹ & Nợ ngân hàng</h1>
        <p>Quản lý danh sách quỹ tài khoản và tài khoản nợ ngân hàng</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'funds' ? 'active' : ''}`}
          onClick={() => setActiveTab('funds')}
        >
          Danh sách quỹ - Tài khoản
        </button>
        <button 
          className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          Danh sách tài khoản nợ ngân hàng
        </button>
      </div>

      {/* Funds Tab */}
      {activeTab === 'funds' && (
        <div className="data-table-container">
      <div className="table-header" style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mã quỹ..."
          className="search-box"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="table-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
              setEditingItem(null);
            }}
          >
            + Thêm quỹ
          </button>
          <ExcelButtons 
            onExport={handleExportExcel}
            onImport={handleImportExcel}
            onFileChange={handleFileChange}
            fileInputRef={fileInputRef}
            disabled={loading}
          />
          <button
            className="btn btn-settings"
            style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
            title="Cài đặt cột hiển thị"
            onClick={() => setShowFundColSetting(v => !v)}
          >
            <span role="img" aria-label="settings">⚙️</span>
          </button>
        </div>

        {/* Popup chọn cột hiển thị */}
        {showFundColSetting && (
          <div
            ref={fundColSettingRef}
            style={{
              position: 'fixed',
              top: '80px',
              right: '40px',
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 8,
              boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
              zIndex: 9999,
              minWidth: 240,
              padding: 14
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={fundVisibleCols.length === fundColumns.length}
                onChange={e => setFundVisibleCols(e.target.checked ? defaultFundVisible : [])}
                style={{ marginRight: 6 }}
              />
              <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
              <button
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                onClick={() => {
                  setFundVisibleCols(defaultFundVisible);
                  setFundColumns(defaultFundColumns);
                  setFundColWidths(defaultFundWidths);
                }}
              >Làm lại</button>
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
            {fundColumns.filter(col => !col.fixed).map((col, idx) => (
              <div
                key={col.key}
                style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: dragOverIdx === idx ? '#f0f7ff' : undefined }}
                draggable
                onDragStart={() => setDragColIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                onDrop={() => {
                  if (dragColIdx === null || dragColIdx === idx) return;
                  const newCols = [...fundColumns];
                  const [moved] = newCols.splice(dragColIdx, 1);
                  newCols.splice(idx, 0, moved);
                  setFundColumns(newCols);
                  // Cập nhật width theo thứ tự mới
                  const newWidths = [...fundColWidths];
                  const [w] = newWidths.splice(dragColIdx, 1);
                  newWidths.splice(idx, 0, w);
                  setFundColWidths(newWidths);
                  setDragColIdx(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => { setDragColIdx(null); setDragOverIdx(null); }}
              >
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                <input
                  type="checkbox"
                  checked={fundVisibleCols.includes(col.key)}
                  onChange={e => {
                    if (e.target.checked) setFundVisibleCols(cols => [...cols, col.key]);
                    else setFundVisibleCols(cols => cols.filter(k => k !== col.key));
                  }}
                  style={{ marginRight: 6 }}
                />
                <span>{col.label}</span>
              </div>
            ))}
            <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
            <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
              <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
              <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
              <span>Thao tác</span>
            </div>
          </div>
        )}
      </div>

          <table className="data-table" ref={fundTableRef}>
            <colgroup>
              {fundColumns.map((col, i) => (
                fundVisibleCols.includes(col.key) ? <col key={col.key} style={{ width: fundColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {fundColumns.map((col, idx, arr) => (
                  fundVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && fundVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleFundMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      {col.label}
                      {/* Filter icon */}
                      {col.key !== 'actions' && (
                        <span
                          onClick={() => setShowFilterPopup(col.key)}
                          style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '14px' }}
                        >
                          🔍
                        </span>
                      )}
                      {/* Filter popup */}
                      {renderFilterPopup(col.key, col.label, false)}
                      {/* Mép phải */}
                      {idx < arr.length - 1 && fundVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleFundMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFunds.map((fund) => (
                <tr key={fund.id}>
                  {fundColumns.map((col, idx) => {
                    if (!fundVisibleCols.includes(col.key)) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${fund.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {fund.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'initialBalance') {
                      return <td key={col.key}>{formatCurrency(fund.initialBalance)}</td>;
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => handleEdit(fund)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(fund.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{fund[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bank Loans Tab */}
      {activeTab === 'loans' && (
        <div className="data-table-container">
          <div className="table-header" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khoản vay hoặc số tài khoản..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="table-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                  setEditingItem(null);
                }}
              >
                + Thêm khoản vay
              </button>
              <ExcelButtons 
                onExport={handleExportExcelLoans}
                onImport={handleImportExcelLoans}
                onFileChange={handleFileChangeLoans}
                fileInputRef={fileInputRefLoans}
                disabled={loading}
              />
              <button
                className="btn btn-settings"
                style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
                title="Cài đặt cột hiển thị"
                onClick={() => setShowLoanColSetting(v => !v)}
              >
                <span role="img" aria-label="settings">⚙️</span>
              </button>
            </div>

            {/* Popup chọn cột hiển thị */}
            {showLoanColSetting && (
              <div
                ref={loanColSettingRef}
                style={{
                  position: 'fixed',
                  top: '120px', // điều chỉnh phù hợp với header
                  right: '40px',
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                  zIndex: 9999,
                  minWidth: 240,
                  padding: 14
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={loanVisibleCols.length === loanColumns.length}
                    onChange={e => setLoanVisibleCols(e.target.checked ? defaultLoanVisible : [])}
                    style={{ marginRight: 6 }}
                  />
                  <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                  <button
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => setLoanVisibleCols(defaultLoanVisible)}
                  >Làm lại</button>
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
                {loanColumns.filter(col => !col.fixed).map(col => (
                  <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                    <input
                      type="checkbox"
                      checked={loanVisibleCols.includes(col.key)}
                      onChange={e => {
                        if (e.target.checked) setLoanVisibleCols(cols => [...cols, col.key]);
                        else setLoanVisibleCols(cols => cols.filter(k => k !== col.key));
                      }}
                      style={{ marginRight: 6 }}
                    />
                    <span>{col.label}</span>
                  </div>
                ))}
                <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
                <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                  <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                  <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                  <span>Thao tác</span>
                </div>
              </div>
            )}
          </div>

          <table className="data-table" ref={loanTableRef}>
            <colgroup>
              {loanColWidths.map((w, i) => (
                loanVisibleCols.includes(loanColumns[i].key) ? <col key={i} style={{ width: w }} /> : null
              ))}
            </colgroup>
            <thead>
              <tr>
                {loanColumns.map((col, idx, arr) => (
                  loanVisibleCols.includes(col.key) ? (
                    <th key={col.key} style={{ position: 'relative' }}>
                      {/* Mép trái */}
                      {idx > 0 && loanVisibleCols.includes(arr[idx - 1].key) && (
                        <span
                          className="col-resizer left"
                          onMouseDown={e => handleLoanMouseDown(idx, e, 'left')}
                          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span>{col.label}</span>
                        {col.key !== 'actions' && (
                          <span 
                            onClick={() => setShowFilterPopup(col.key)}
                            style={{ 
                              cursor: 'pointer', 
                              fontSize: '14px'
                            }}
                          >
                            🔍
                          </span>
                        )}
                      </div>
                      
                      {/* Filter Popup */}
                      {renderFilterPopup(col.key, col.label, col.key === 'loanDate' || col.key === 'dueDate')}
                      
                      {/* Mép phải */}
                      {idx < arr.length - 1 && loanVisibleCols.includes(arr[idx + 1].key) && (
                        <span
                          className="col-resizer right"
                          onMouseDown={e => handleLoanMouseDown(idx, e, 'right')}
                          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                        />
                      )}
                    </th>
                  ) : null
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBankLoans.map((loan) => (
                <tr key={loan.id}>
                  {loanColumns.map((col, idx) => {
                    if (!loanVisibleCols.includes(col.key)) return null;
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${loan.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {loan.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === 'interestCost' || col.key === 'principalPayment' || col.key === 'principalAmount') {
                      return <td key={col.key}>{formatCurrency(loan[col.key])}</td>;
                    }
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => handleEdit(loan)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(loan.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key}>{loan[col.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 'funds' ? 'quỹ tài khoản' : 'khoản vay'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'funds' ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mã quỹ <span className="required">*</span></label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên quỹ <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Chủ tài khoản</label>
                    <input
                      type="text"
                      name="accountHolder"
                      value={formData.accountHolder}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số tài khoản</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngân hàng</label>
                    <input
                      type="text"
                      name="bank"
                      value={formData.bank}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chi nhánh</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số dư đầu</label>
                    <input
                      type="number"
                      name="initialBalance"
                      value={formData.initialBalance}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Số tài khoản <span className="required">*</span></label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên khoản nợ NH <span className="required">*</span></label>
                    <input
                      type="text"
                      name="loanName"
                      value={formData.loanName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày vay</label>
                    <input
                      type="date"
                      name="loanDate"
                      value={formData.loanDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày đáo hạn</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kỳ trả lãi</label>
                    <select
                      name="interestPeriod"
                      value={formData.interestPeriod}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn kỳ trả lãi</option>
                      <option value="Hàng tháng">Hàng tháng</option>
                      <option value="Hàng quý">Hàng quý</option>
                      <option value="6 tháng">6 tháng</option>
                      <option value="Hàng năm">Hàng năm</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>CP lãi</label>
                    <input
                      type="number"
                      name="interestCost"
                      value={formData.interestCost}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trả gốc hàng kỳ</label>
                    <input
                      type="number"
                      name="principalPayment"
                      value={formData.principalPayment}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiền trả gốc</label>
                    <input
                      type="number"
                      name="principalAmount"
                      value={formData.principalAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú (%)</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Nhập phần trăm lãi suất..."
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsFunds;
