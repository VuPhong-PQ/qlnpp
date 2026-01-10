import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../BusinessPage.css';
import { API_ENDPOINTS, api } from '../../../config/api';

const CreateOrderForm = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const addDaysSkippingSunday = (date, daysToAdd) => {
    const d = new Date(date);
    let added = 0;
    while (added < daysToAdd) {
      d.setDate(d.getDate() + 1);
      // Skip if it's Sunday (getDay() === 0)
      if (d.getDay() === 0) continue;
      added += 1;
    }
    return d;
  };

  const toInputDate = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // default date: today + 2 days skipping Sundays
  const defaultOrderDate = toInputDate(addDaysSkippingSunday(new Date(), 2));

  const [orderForm, setOrderForm] = useState({
    orderDate: defaultOrderDate,
    orderNumber: `PX${new Date().toISOString().slice(0,10).replace(/-/g,'')}-001001`,
    customer: '',
    customerName: '',
    phone: '',
    createdBy: 'admin 66',
    address: '',
    vehicle: '',
    customerGroup: '',
    salesSchedule: '',
    printOrder: 0,
    deliveryVehicle: '',
    priceType: 'retail', // retail or wholesale
    activeTab: 'products', // products or promotions
    discountPercent: 0,
    discountAmount: 0,
    discountNote: '',
    totalKg: 0,
    totalM3: 0,
    payment: 0,
    accountFund: '',
    notes: ''
  });

  const [orderItems, setOrderItems] = useState([
    { id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', total: 0, weight: 0, volume: 0, exportType: '', stock: 0 }
  ]);

  const [positions, setPositions] = useState([]);
  const initialColWidths = [120, 120, 220, 120, 80, 90, 110, 80, 120, 120, 120, 100, 180, 100, 140, 90, 90, 100, 100, 120];
  const [colWidths, setColWidths] = useState(initialColWidths);
  const resizerState = useRef({ isResizing: false, startX: 0, colIndex: null, startWidth: 0 });
  
  // Column configuration (key must match renderCell switch cases)
  const defaultColumns = [
    { key: 'barcode', label: 'Mã vạch', visible: true },
    { key: 'productCode', label: 'Mã hàng', visible: true },
    { key: 'productName', label: 'Tên hàng', visible: true },
    { key: 'warehouse', label: 'Kho hàng', visible: true },
    { key: 'unit', label: 'ĐVT', visible: true },
    { key: 'quantity', label: 'Số lượng', visible: true },
    { key: 'unitPrice', label: 'Đơn giá', visible: true },
    { key: 'discountPercent', label: '% CK', visible: true },
    { key: 'priceAfterCK', label: 'Giá sau CK', visible: true },
    { key: 'totalAfterCK', label: 'Ttien sau CK', visible: true },
    { key: 'totalAfterDiscount', label: 'Ttien sau giảm %', visible: true },
    { key: 'nvSales', label: 'Mô tả', visible: true },
    { key: 'description', label: 'Quy đổi', visible: true },
    { key: 'conversion', label: 'Thành tiền', visible: true },
    { key: 'weight', label: 'Số kg', visible: true },
    { key: 'volume', label: 'Số khối', visible: true },
    { key: 'exportType', label: 'Loại xuất', visible: true },
    { key: 'stock', label: 'Tồn kho', visible: true },
    { key: 'actions', label: 'Thao tác', visible: true }
  ];
  const [columns, setColumns] = useState(defaultColumns);
  const [showColumnsSettings, setShowColumnsSettings] = useState(false);

  // Drag state for column reordering
  const onDragStartCol = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    e.currentTarget.classList.add('dragging');
  };
  const onDragOverCol = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropCol = (e, dropIdx) => {
    e.preventDefault();
    const src = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(src)) return;
    setColumns(prev => {
      if (src === dropIdx) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(src, 1);
      copy.splice(dropIdx, 0, moved);
      return copy;
    });
    const els = document.querySelectorAll('.columns-settings-row.dragging');
    els.forEach(el => el.classList.remove('dragging'));
  };
  const onDragEndCol = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleOrderFormChange = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderItemChange = (index, field, value) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate total after discount
      const item = updated[index];
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discountPercent) || 0;
      const priceAfter = price * (1 - disc / 100);
      const totalAfter = qty * priceAfter;
      item.priceAfterCK = Number(priceAfter.toFixed(2));
      item.totalAfterCK = Number(totalAfter.toFixed(2));
      item.totalAfterDiscount = item.totalAfterCK;
      item.total = item.totalAfterCK;
      return updated;
    });
  };

  const addOrderItem = () => {
    setOrderItems(prev => [...prev, {
      id: prev.length + 1,
      productCode: '',
      barcode: '',
      productName: '',
      warehouse: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      discountPercent: 0,
      priceAfterCK: 0,
      totalAfterCK: 0,
      totalAfterDiscount: 0,
      nvSales: '',
      description: '',
      conversion: '',
      total: 0,
      weight: 0,
      volume: 0,
      exportType: '',
      stock: 0
    }]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalAfterDiscount, 0);
    return subtotal;
  };

  const handleSaveOrder = () => {
    console.log('Saving order:', orderForm, orderItems);
    // Add save logic here
    alert('Đơn hàng đã được lưu!');
  };

  const handleCreateNew = () => {
    setOrderForm({
      orderDate: defaultOrderDate,
      orderNumber: `PX${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      customer: '',
      customerName: '',
      phone: '',
      createdBy: 'admin 66',
      address: '',
      vehicle: '',
      customerGroup: '',
      salesSchedule: '',
      printOrder: 0,
      deliveryVehicle: '',
      priceType: 'retail',
      activeTab: 'products',
      discountPercent: 0,
      discountAmount: 0,
      discountNote: '',
      totalKg: 0,
      totalM3: 0,
      payment: 0,
      accountFund: '',
      notes: ''
    });
    setOrderItems([{ id: 1, productCode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, totalAfterDiscount: 0 }]);
  };

  const handleGoBack = () => {
    navigate('/business/sales/create-order');
  };

  // Use same simple approach as CreateOrder page - no measurement needed

  useEffect(() => {
    // Load customers and extract unique position values for 'Vị trí' dropdown
    let mounted = true;
    api.get(API_ENDPOINTS.customers)
      .then(data => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          const pos = Array.from(new Set(data.map(c => (c.Position || c.position || '').toString().trim()).filter(Boolean)));
          setPositions(pos);
        }
      })
      .catch(err => console.warn('Failed to load customers for positions', err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startResize = (e) => {
    // If settings modal is open, disable resizing from the background table
    if (showColumnsSettings) return;
    e.preventDefault();
    const resizer = e.currentTarget;
    const th = resizer.parentElement;
    const tr = th.parentElement;
    const index = Array.prototype.indexOf.call(tr.children, th);
    const startWidth = colWidths[index] || th.getBoundingClientRect().width || 100;
    resizerState.current = { isResizing: true, startX: e.clientX, colIndex: index, startWidth };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!resizerState.current.isResizing) return;
    const { startX, colIndex, startWidth } = resizerState.current;
    const delta = e.clientX - startX;
    const newWidth = Math.max(40, startWidth + delta);
    setColWidths(prev => {
      const copy = [...prev];
      copy[colIndex] = newWidth;
      return copy;
    });
  };

  const onMouseUp = () => {
    if (!resizerState.current.isResizing) return;
    resizerState.current.isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const toggleColumnVisibility = (key) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const moveColumn = (key, dir) => {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.key === key);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      // Keep colWidths in sync with moved column
      setColWidths(prevW => {
        const w = [...prevW];
        const [movedW] = w.splice(idx, 1);
        w.splice(newIdx, 0, movedW === undefined ? 120 : movedW);
        return w;
      });
      return copy;
    });
  };

  // Header drag handlers for inline table column reordering
  const onDragStartHeader = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    e.currentTarget.classList.add('dragging');
  };
  const onDragOverHeader = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropHeader = (e, dropIdx) => {
    e.preventDefault();
    const src = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(src) || src === dropIdx) return;
    setColumns(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(src, 1);
      copy.splice(dropIdx, 0, moved);
      return copy;
    });
    setColWidths(prevW => {
      const w = [...prevW];
      const [movedW] = w.splice(src, 1);
      w.splice(dropIdx, 0, movedW === undefined ? 120 : movedW);
      return w;
    });
    const els = document.querySelectorAll('.order-items-table th.dragging');
    els.forEach(el => el.classList.remove('dragging'));
  };
  const onDragEndHeader = (e) => {
    e.currentTarget.classList.remove('dragging');
  };



  return (
    <div className="create-order-form-page" ref={containerRef}>
      {/* Header */}
      <div className="order-form-header">
        <h2>THÔNG TIN ĐƠN HÀNG</h2>
        <button className="btn-create-new" onClick={handleCreateNew}>
          + Tạo mới
        </button>
      </div>

      {/* Form Body */}
      <div className="order-form-body">
        <div className="order-form-top">
        {/* Row 1: Ngày lập, Khách hàng */}
        <div className="order-form-row">
          <div className="order-form-group">
            <label className="required">Ngày lập</label>
            <input
              type="date"
              value={orderForm.orderDate}
              onChange={(e) => handleOrderFormChange('orderDate', e.target.value)}
              className="order-form-input"
            />
          </div>
          <div className="order-form-group">
            <label className="required">Khách hàng</label>
            <select
              value={orderForm.customer}
              onChange={(e) => handleOrderFormChange('customer', e.target.value)}
              className="order-form-select"
            >
              <option value="">Chọn khách hàng</option>
              <option value="KH001">Nguyễn Văn A</option>
              <option value="KH002">Công ty ABC</option>
              <option value="KH003">Trần Thị B</option>
            </select>
          </div>
        </div>

        {/* Row 2: Số phiếu, Tên khách, Số điện thoại */}
        <div className="order-form-row three-cols">
          <div className="order-form-group">
            <label className="required">Số phiếu</label>
            <div className="input-with-icon">
              <input
                type="text"
                value={orderForm.orderNumber}
                onChange={(e) => handleOrderFormChange('orderNumber', e.target.value)}
                className="order-form-input"
              />
              <span className="input-icon success">✓</span>
            </div>
          </div>
          <div className="order-form-group">
            <label>Tên khách</label>
            <input
              type="text"
              value={orderForm.customerName}
              onChange={(e) => handleOrderFormChange('customerName', e.target.value)}
              className="order-form-input"
              placeholder=""
            />
          </div>
          <div className="order-form-group">
            <label>Số điện thoại</label>
            <input
              type="text"
              value={orderForm.phone}
              onChange={(e) => handleOrderFormChange('phone', e.target.value)}
              className="order-form-input"
              placeholder=""
            />
          </div>
        </div>
        </div>

        {/* Row 3: Nhân viên lập, Địa chỉ, Xe */}
        <div className="order-form-row three-cols">
          <div className="order-form-group">
            <label className="required">Nhân viên lập</label>
            <div className="input-with-icon">
              <select
                value={orderForm.createdBy}
                onChange={(e) => handleOrderFormChange('createdBy', e.target.value)}
                className="order-form-select"
              >
                <option value="admin 66">admin 66</option>
                <option value="admin 01">admin 01</option>
              </select>
              <span className="input-icon success">✓</span>
            </div>
          </div>
          <div className="order-form-group wide">
            <label>Địa chỉ</label>
            <input
              type="text"
              value={orderForm.address}
              onChange={(e) => handleOrderFormChange('address', e.target.value)}
              className="order-form-input"
              placeholder=""
            />
          </div>
          <div className="order-form-group">
            <label>Vị trí</label>
            <select
              value={orderForm.vehicle}
              onChange={(e) => handleOrderFormChange('vehicle', e.target.value)}
              className="order-form-select"
            >
              <option value="">Chọn vị trí</option>
              {positions.length === 0 && (
                <>
                  <option value="">(Không có vị trí)</option>
                </>
              )}
              {positions.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Nhóm khách hàng, Lịch bán hàng, STT in, Xe giao hàng */}
        <div className="order-form-row four-cols">
          <div className="order-form-group">
            <label>Nhóm khách hàng</label>
            <select
              value={orderForm.customerGroup}
              onChange={(e) => handleOrderFormChange('customerGroup', e.target.value)}
              className="order-form-select"
            >
              <option value="">Chọn nhóm khách hàng</option>
              <option value="retail">Khách lẻ</option>
              <option value="wholesale">Khách sỉ</option>
              <option value="vip">Khách VIP</option>
            </select>
          </div>
          <div className="order-form-group">
            <label>Lịch bán hàng</label>
            <input
              type="text"
              value={orderForm.salesSchedule}
              onChange={(e) => handleOrderFormChange('salesSchedule', e.target.value)}
              className="order-form-input"
              placeholder=""
            />
          </div>
          <div className="order-form-group small">
            <label>STT in</label>
            <input
              type="number"
              value={orderForm.printOrder}
              onChange={(e) => handleOrderFormChange('printOrder', e.target.value)}
              className="order-form-input highlight-red"
              placeholder="0"
            />
          </div>
          <div className="order-form-group">
            <label>Trạng thái bán hàng</label>
            <select
              value={orderForm.deliveryVehicle}
              onChange={(e) => handleOrderFormChange('deliveryVehicle', e.target.value)}
              className="order-form-select"
            >
              <option value="">Chọn trạng thái bán hàng</option>
              <option value="pending">Chưa bán</option>
              <option value="in_progress">Đang bán</option>
              <option value="completed">Đã bán</option>
            </select>
          </div>
        </div>

        {/* Price Type Toggle removed per request */}

        {/* Tabs: Hàng bán / Hàng khuyến mãi */}
        <div className="order-tabs">
          <button
            className={`tab-btn ${orderForm.activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleOrderFormChange('activeTab', 'products')}
          >
            🛒 Hàng bán
          </button>
          <button
            className={`tab-btn ${orderForm.activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => handleOrderFormChange('activeTab', 'promotions')}
          >
            🔊 Hàng khuyến mãi
          </button>
        </div>

        {/* Products Table */}
        <div className="order-items-section">
            <div className="order-items-header">
            <span className="items-total">Tổng {orderItems.length}</span>
            <div className="items-actions">
              <button className="item-action-btn blue" onClick={addOrderItem} title="Thêm">➕</button>
              <button className="item-action-btn green" title="Làm mới">🔄</button>
              <button className="item-action-btn red" title="Import">📥</button>
              <button className="item-action-btn gray" title="Cài đặt" onClick={() => setShowColumnsSettings(true)}>⚙️</button>
            </div>
          </div>

          {showColumnsSettings && (
            <div className="columns-settings-modal">
              <div className="columns-settings-panel">
                <div className="columns-settings-header">
                  <strong>Cài đặt cột</strong>
                  <button onClick={() => setShowColumnsSettings(false)}>Đóng</button>
                </div>
                <div className="columns-settings-list">
                  {columns.map((c, i) => (
                    <div
                      key={c.key}
                      className="columns-settings-row"
                      draggable
                      onDragStart={(e) => onDragStartCol(e, i)}
                      onDragOver={onDragOverCol}
                      onDrop={(e) => onDropCol(e, i)}
                      onDragEnd={onDragEndCol}
                    >
                      <div className="col-handle">≡</div>
                      <label className="col-label">
                        <input type="checkbox" checked={c.visible} onChange={() => toggleColumnVisibility(c.key)} /> {c.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="order-items-table-container">
            <table className="order-items-table">
              <colgroup>
                {columns.map((c, i) => (
                  <col key={c.key} style={{ width: (colWidths[i] || 120) + 'px', display: c.visible ? undefined : 'none' }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((c, i) => c.visible && (
                    <th key={c.key}
                        draggable
                        onDragStart={(e) => onDragStartHeader(e, i)}
                        onDragOver={onDragOverHeader}
                        onDrop={(e) => onDropHeader(e, i)}
                        onDragEnd={onDragEndHeader}
                    >
                      {c.label} {c.key === 'barcode' || c.key === 'productCode' || c.key === 'productName' ? <i className="sort-icon">🔍</i> : null}
                      <div className="col-resizer" onMouseDown={startResize} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, rowIndex) => (
                  <tr key={item.id}>
                    {columns.map((c, colIndex) => c.visible && (
                      <td key={c.key} className={['priceAfterCK','totalAfterCK','totalAfterDiscount','stock'].includes(c.key) ? 'total-cell' : ''}>
                        {(() => {
                          switch (c.key) {
                            case 'barcode':
                              return (
                                <select value={item.barcode} onChange={(e) => handleOrderItemChange(rowIndex, 'barcode', e.target.value)} className="item-select">
                                  <option value="">mã vạch</option>
                                </select>
                              );
                            case 'productCode':
                              return (
                                <select value={item.productCode} onChange={(e) => handleOrderItemChange(rowIndex, 'productCode', e.target.value)} className="item-select">
                                  <option value="">nhập mã hàng</option>
                                </select>
                              );
                            case 'productName':
                              return (
                                <select value={item.productName} onChange={(e) => handleOrderItemChange(rowIndex, 'productName', e.target.value)} className="item-select">
                                  <option value="">nhập tên hàng</option>
                                </select>
                              );
                            case 'warehouse':
                              return <input type="text" value={item.warehouse} onChange={(e) => handleOrderItemChange(rowIndex, 'warehouse', e.target.value)} className="item-input" placeholder="kho hàng" />;
                            case 'unit':
                              return (
                                <select value={item.unit} onChange={(e) => handleOrderItemChange(rowIndex, 'unit', e.target.value)} className="item-select small">
                                  <option value="">Chọn đvt</option>
                                  <option value="Cái">Cái</option>
                                  <option value="Thùng">Thùng</option>
                                  <option value="Kg">Kg</option>
                                </select>
                              );
                            case 'quantity':
                              return <input type="number" value={item.quantity} onChange={(e) => handleOrderItemChange(rowIndex, 'quantity', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'unitPrice':
                              return <input type="number" value={item.unitPrice} onChange={(e) => handleOrderItemChange(rowIndex, 'unitPrice', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'discountPercent':
                              return <input type="number" value={item.discountPercent} onChange={(e) => handleOrderItemChange(rowIndex, 'discountPercent', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'priceAfterCK':
                              return (item.priceAfterCK || 0).toLocaleString();
                            case 'totalAfterCK':
                              return (item.totalAfterCK || 0).toLocaleString();
                            case 'totalAfterDiscount':
                              return (item.totalAfterDiscount || 0).toLocaleString();
                            case 'nvSales':
                              return <input type="text" value={item.nvSales} onChange={(e) => handleOrderItemChange(rowIndex, 'nvSales', e.target.value)} className="item-input" />;
                            case 'description':
                              return <input type="text" value={item.description} onChange={(e) => handleOrderItemChange(rowIndex, 'description', e.target.value)} className="item-input" />;
                            case 'conversion':
                              return <input type="text" value={item.conversion} onChange={(e) => handleOrderItemChange(rowIndex, 'conversion', e.target.value)} className="item-input" />;
                            // 'total' column removed from defaults; keep logic elsewhere if needed
                            case 'weight':
                              return <input type="number" value={item.weight} onChange={(e) => handleOrderItemChange(rowIndex, 'weight', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'volume':
                              return <input type="number" value={item.volume} onChange={(e) => handleOrderItemChange(rowIndex, 'volume', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'exportType':
                              return <input type="text" value={item.exportType} onChange={(e) => handleOrderItemChange(rowIndex, 'exportType', e.target.value)} className="item-input" />;
                            case 'stock':
                              return (item.stock || 0).toLocaleString();
                            case 'actions':
                              return (
                                <div className="item-actions">
                                  <button className="item-btn delete" onClick={() => removeOrderItem(rowIndex)}>🗑️</button>
                                  <button className="item-btn add" onClick={addOrderItem}>➕</button>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="items-pagination">
            <span>Dòng 1-{orderItems.length} trên tổng {orderItems.length} dòng</span>
            <div className="items-page-controls">
              <button className="page-btn">‹</button>
              <span className="page-number">1</span>
              <button className="page-btn">›</button>
              <select className="page-size-select">
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="order-summary-section">
          <div className="summary-row">
            <div className="summary-group">
              <label>Tổng tiền: <strong>{calculateTotals().toLocaleString()}</strong></label>
              <span className="summary-note">Không đồng</span>
            </div>
          </div>

          <div className="summary-row five-cols">
            <div className="summary-field">
              <label>Giảm %</label>
              <input
                type="number"
                value={orderForm.discountPercent}
                onChange={(e) => handleOrderFormChange('discountPercent', e.target.value)}
                className="summary-input"
              />
            </div>
            <div className="summary-field">
              <label>Tiền</label>
              <input
                type="number"
                value={orderForm.discountAmount}
                onChange={(e) => handleOrderFormChange('discountAmount', e.target.value)}
                className="summary-input"
              />
            </div>
            <div className="summary-field wide">
              <label>Ghi chú giảm</label>
              <input
                type="text"
                value={orderForm.discountNote}
                onChange={(e) => handleOrderFormChange('discountNote', e.target.value)}
                className="summary-input"
              />
            </div>
            <div className="summary-field">
              <label>Tổng số kg</label>
              <input
                type="number"
                value={orderForm.totalKg}
                onChange={(e) => handleOrderFormChange('totalKg', e.target.value)}
                className="summary-input highlight-red"
              />
            </div>
            <div className="summary-field">
              <label>Tổng số khối</label>
              <input
                type="number"
                value={orderForm.totalM3}
                onChange={(e) => handleOrderFormChange('totalM3', e.target.value)}
                className="summary-input highlight-red"
              />
            </div>
          </div>

          {/* Payment and account fund removed per request */}

          <div className="summary-row">
            <div className="summary-field full">
              <label>Ghi chú bán hàng</label>
              <textarea
                value={orderForm.notes}
                onChange={(e) => handleOrderFormChange('notes', e.target.value)}
                className="summary-textarea"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="order-form-footer">
        <button className="modal-btn back" onClick={handleGoBack}>
          ← Quay lại
        </button>
        <button className="modal-btn save" onClick={handleSaveOrder}>
          💾 Lưu lại
        </button>
        <button className="modal-btn excel">
          📊 Xuất Excel
        </button>
        <button className="modal-btn copy">
          📋 Copy
        </button>
        <button className="modal-btn cancel">
          🚫 Hủy
        </button>
        <button className="modal-btn approve">
          ✓ Duyệt
        </button>
      </div>
    </div>
  );
};

export default CreateOrderForm;
