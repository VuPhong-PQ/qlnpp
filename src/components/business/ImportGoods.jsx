import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import './BusinessPage.css';
import './ImportGoods.css';
import { Table, Button, Space, Popconfirm, Input, Modal, Popover, DatePicker, Select } from 'antd';
import ProductModal from '../common/ProductModal';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { removeVietnameseTones } from '../../utils/searchUtils';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');

const ImportGoods = () => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, record: null });
  const [isEditing, setIsEditing] = useState(false);
  const [treatNaiveIsoAsUtc, setTreatNaiveIsoAsUtc] = useState(true);
  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    category: '',
    barcode: '',
    productCode: '',
    productName: '',
    productNameVat: '',
    description: '',
    hsdMonths: 0,
    defaultUnit: '',
    priceImport: 0,
    priceRetail: 0,
    priceWholesale: 0,
    // unit variants
    unit1Name: '', unit1Conversion: 0, unit1Price: 0, unit1Discount: 0,
    unit2Name: '', unit2Conversion: 0, unit2Price: 0, unit2Discount: 0,
    unit3Name: '', unit3Conversion: 0, unit3Price: 0, unit3Discount: 0,
    unit4Name: '', unit4Conversion: 0, unit4Price: 0, unit4Discount: 0,
    weight: 0,
    volume: 0,
    warehouse: '',
    note: '',
    transportCost: 0,
    totalTransport: 0,
    noteDate: null
  });

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
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [dateDraft, setDateDraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-08-01');
  const [dateTo, setDateTo] = useState('2025-08-08');
  const [importType, setImportType] = useState('');
  const [employee, setEmployee] = useState('');

  // Column visibility & header filters for left table
  const IMPORT_LEFT_COLS_KEY = 'import_goods_left_cols_v1';
  const defaultLeftCols = ['checkbox','importNumber','createdDate','total','note','actions'];
  const [leftVisibleCols, setLeftVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(IMPORT_LEFT_COLS_KEY));
      if (Array.isArray(v)) return v;
    } catch {}
    return defaultLeftCols;
  });
  const [leftFilters, setLeftFilters] = useState({ importNumber: '', createdDate: '', note: '', total: '' });
  // modal-based column filters (lists of selected values)
  const [leftFilterLists, setLeftFilterLists] = useState({ importNumber: [], createdDate: [], note: [], total: [] });
  const [activeHeaderModalColumn, setActiveHeaderModalColumn] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSelections, setModalSelections] = useState([]);
  const [modalAvailableItems, setModalAvailableItems] = useState([]);
  const [leftPageSize, setLeftPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('import_left_page_size')||'10',10); return isNaN(v)?10:v; } catch { return 10; }
  });

  // Core data state
  const [imports, setImports] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [formData, setFormData] = useState({ importNumber: '', createdDate: new Date().toISOString().split('T')[0], employee: '', importType: '', totalWeight: 0, totalVolume: 0, note: '' });
  const [leftPage, setLeftPage] = useState(1);
  const [showLeftSettings, setShowLeftSettings] = useState(false);
  const [showRightSettings, setShowRightSettings] = useState(false);
  const itemsTableRef = useRef(null);
  const productSelectRefs = useRef({});
  const [headerRows, setHeaderRows] = useState(() => [{ id: Date.now(), values: {} }]);

  // Right-side columns & filters (for items table header filters)
  const RIGHT_COLS_KEY = 'import_goods_right_cols_v1';
  const defaultRightCols = ['barcode','productCode','productName','description','conversion','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','actions'];
  const [rightVisibleCols, setRightVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      if (Array.isArray(v)) return v;
    } catch {}
    return defaultRightCols;
  });

  const [rightFilters, setRightFilters] = useState({});
  const [rightFilterPopup, setRightFilterPopup] = useState({ column: null, term: '' });
  const [rightCurrentPage, setRightCurrentPage] = useState(1);
  const [rightItemsPerPage, setRightItemsPerPage] = useState(10);

  const renderHeaderFilterTH = (colKey, label, placeholder) => {
    // Check if this column should have product dropdown
    const productColumns = ['productCode', 'productName', 'barcode'];
    const warehouseColumns = ['warehouse'];
    const numericColumns = ['quantity', 'unitPrice', 'transportCost', 'total', 'totalTransport', 'weight', 'volume', 'conversion'];
    const textColumns = ['description'];
    const dateColumns = ['noteDate'];
    
    if (productColumns.includes(colKey)) {
      return renderProductDropdownTH(colKey, label);
    }
    
    if (warehouseColumns.includes(colKey)) {
      return renderWarehouseDropdownTH(colKey, label);
    }
    
    if (dateColumns.includes(colKey)) {
      return renderDatePickerTH(colKey, label);
    }
    
    if (numericColumns.includes(colKey)) {
      return renderNumericInputTH(colKey, label, placeholder);
    }
    
    if (textColumns.includes(colKey)) {
      return renderTextInputTH(colKey, label, placeholder);
    }
    
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>{label}</span>
          <Popover
            content={(
              <div style={{minWidth:240}}>
                <Input
                  placeholder={placeholder}
                  value={rightFilterPopup.column === colKey ? rightFilterPopup.term : (rightFilters[colKey] || '')}
                  onChange={e => setRightFilterPopup(p => ({ ...p, term: e.target.value }))}
                  onPressEnter={() => {
                    setRightFilters(prev => ({ ...prev, [colKey]: rightFilterPopup.term }));
                    setRightFilterPopup({ column: null, term: '' });
                  }}
                />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                  <button className="btn btn-link" onClick={() => { setRightFilterPopup({ column: colKey, term: '' }); setRightFilters(prev => ({ ...prev, [colKey]: '' })); }}>Xem tất cả</button>
                  <div>
                    <button className="btn btn-secondary" onClick={() => { setRightFilterPopup({ column: null, term: '' }); }}>Đóng</button>
                    <button className="btn btn-primary" onClick={() => { setRightFilters(prev => ({ ...prev, [colKey]: rightFilterPopup.term })); setRightFilterPopup({ column: null, term: '' }); }} style={{marginLeft:8}}>Tìm</button>
                  </div>
                </div>
              </div>
            )}
            title={null}
            trigger="click"
            visible={rightFilterPopup.column===colKey}
            onVisibleChange={vis => { if (!vis) setRightFilterPopup({column:null, term:''}); }}
            placement="bottomRight"
          >
            <SearchOutlined style={{color:'#888',cursor:'pointer'}} onClick={(e)=>{ e.stopPropagation(); setRightFilterPopup({column:colKey, term: rightFilters[colKey]||''}); }} />
          </Popover>
        </div>
      </th>
    );
  };

  // Render header with product dropdown
  const renderProductDropdownTH = (colKey, label) => {
    const getDisplayText = (product) => {
      switch(colKey) {
        case 'productCode': return product.code || 'N/A';
        case 'productName': return product.name || 'N/A';
        case 'barcode': return product.barcode || 'N/A';
        default: return product.name || 'N/A';
      }
    };
    
    const getSearchText = (product) => {
      return `${product.code || ''} - ${product.name || ''} - ${product.barcode || ''}`.toLowerCase();
    };
    
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span style={{fontWeight: 'bold', marginBottom: '4px'}}>{label}</span>
          <Select 
            ref={(el) => { productSelectRefs.current[colKey] = el; }}
            value={selectedProducts[colKey] || undefined} 
            onChange={(value) => handleProductSelect(colKey, value)}
            placeholder={`-- Chọn ${label.toLowerCase()} --`}
            style={{ 
              width: '100%',
              minWidth: '150px'
            }}
            size="small"
            showSearch
            allowClear
            filterOption={(input, option) => {
              const product = products.find(p => p.id.toString() === option.value);
              if (!product) return false;
              return getSearchText(product).includes(input.toLowerCase());
            }}
          >
            {products.map(product => (
              <Select.Option key={product.id} value={product.id}>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold' }}>{getDisplayText(product)}</div>
                  {colKey !== 'productName' && (
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      {product.name}
                    </div>
                  )}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      </th>
    );
  };

  // Handle product selection from dropdown
  const handleProductSelect = (colKey, productId) => {
    // Update all product-related dropdowns to show the same selected product
    if (productId) {
      setSelectedProducts(prev => ({ 
        ...prev, 
        productCode: productId,
        productName: productId, 
        barcode: productId 
      }));
    } else {
      setSelectedProducts(prev => ({ ...prev, [colKey]: productId }));
    }
    
    if (productId && selectedImport) {
      const selectedProduct = products.find(p => p.id.toString() === productId);
      if (selectedProduct) {
        // Work with the current right-side items (from selectedImport if present)
        const currentRightItems = (selectedImport && selectedImport.items) ? selectedImport.items : items;
        // Check if product already exists in items
        const existingItem = currentRightItems.find(item => 
          item.productCode === selectedProduct.code || 
          item.barcode === selectedProduct.barcode
        );

        if (existingItem) {
          // If product already exists, just increase quantity
          const updatedItems = currentRightItems.map(item => 
            item.id === existingItem.id 
              ? { ...item, quantity: ((item.quantity || 1) + 1), total: ((item.quantity || 1) + 1) * (item.unitPrice || 0) }
              : item
          );
          setItems(updatedItems);
          if (selectedImport) setSelectedImport(prev => ({ ...prev, items: updatedItems }));
        } else {
          // Add new item to the current import with complete product information
          const newItem = {
            id: Date.now() + Math.random(),
            barcode: selectedProduct.barcode || '',
            productCode: selectedProduct.code || '',
            productName: selectedProduct.name || '',
            description: selectedProduct.description || '',
            conversion: 1,
            quantity: 1,
            unitPrice: selectedProduct.importPrice || 0,
            transportCost: 0,
            noteDate: null,
            total: selectedProduct.importPrice || 0,
            totalTransport: 0,
            weight: selectedProduct.weight || 0,
            volume: selectedProduct.volume || 0,
            warehouse: '',
          };

          // Prepare an empty row so user can continue entering next item immediately
          const blankItem = {
            id: Date.now() + Math.random() + 1,
            barcode: '',
            productCode: '',
            productName: '',
            description: '',
            conversion: '',
            quantity: '',
            unitPrice: '',
            transportCost: '',
            noteDate: null,
            total: '',
            totalTransport: '',
            weight: '',
            volume: '',
            warehouse: '',
          };

          // Append product row + blank row, then move pagination to show the new rows
          const next = [...currentRightItems, newItem, blankItem];
          setItems(next);
          if (selectedImport) setSelectedImport(prev => ({ ...prev, items: next }));
          // Move to last page so the new blank row is visible
          setTimeout(() => {
            try {
              const lastPage = Math.max(1, Math.ceil(next.length / rightItemsPerPage));
              setRightCurrentPage(lastPage);
              // scroll the table container to end so new row is visible
              setTimeout(() => {
                try {
                  if (itemsTableRef && itemsTableRef.current) {
                    itemsTableRef.current.scrollLeft = itemsTableRef.current.scrollWidth;
                    itemsTableRef.current.scrollTop = itemsTableRef.current.scrollHeight;
                  }
                } catch (e) {}
              }, 120);
              // focus the barcode header select so user can pick next product
              setTimeout(() => {
                try {
                  const s = productSelectRefs.current && productSelectRefs.current['barcode'];
                  if (s && typeof s.focus === 'function') s.focus();
                } catch (e) {}
              }, 600);
            } catch (e) {}
          }, 80);
        }
        
        // Clear all product dropdowns after adding item
        setTimeout(() => {
          setSelectedProducts(prev => ({ 
            ...prev, 
            productCode: '',
            productName: '', 
            barcode: '' 
          }));
        }, 500);
      }
    }
  };

  // Render warehouse dropdown
  const renderWarehouseDropdownTH = (colKey, label) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Select 
            value={selectedProducts[colKey] || null}
            onChange={(value) => handleWarehouseSelect(colKey, value)}
            style={{ width: '100%', minWidth: '120px' }}
            size="small"
            placeholder="-- Chọn kho --"
            allowClear
          >
            {warehouses.map(warehouse => (
              <Select.Option key={warehouse.id} value={warehouse.id}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{warehouse.name}</span>
                  <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                    {warehouse.code}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      </th>
    );
  };

  // Handle product selection in a header input row (rowIndex). If selecting in the last row, append a new blank header row.
  const handleHeaderRowProductSelect = (rowIndex, colKey, productId) => {
    setHeaderRows(prev => {
      const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
      copy[rowIndex].values[colKey] = productId || '';
      // also keep product id mirrored to other product-related keys for that row
      if (productId) {
        copy[rowIndex].values['productCode'] = productId;
        copy[rowIndex].values['productName'] = productId;
        copy[rowIndex].values['barcode'] = productId;
      }
      // if selecting in last row and a productId was chosen, append blank row
      if (productId && rowIndex === copy.length - 1) {
        copy.push({ id: Date.now() + Math.random(), values: {} });
      }
      return copy;
    });
  };

  const handleHeaderRowChange = (rowIndex, colKey, value) => {
    setHeaderRows(prev => {
      const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
      copy[rowIndex].values[colKey] = value;
      return copy;
    });
  };

  // Handle warehouse selection
  const handleWarehouseSelect = (colKey, warehouseId) => {
    setSelectedProducts(prev => ({ ...prev, [colKey]: warehouseId }));
    
    if (warehouseId && selectedImport) {
      const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
      if (selectedWarehouse) {
        // Update the last item or create new item with warehouse
        const newItem = {
          id: Date.now() + Math.random(),
          barcode: '',
          productCode: '',
          productName: '',
          description: '',
          conversion: 1,
          quantity: 1,
          unitPrice: 0,
          transportCost: 0,
          noteDate: null,
          total: 0,
          totalTransport: 0,
          weight: 0,
          volume: 0,
          warehouse: selectedWarehouse.name,
        };
        
        setItems(prevItems => [...prevItems, newItem]);
        
        // Clear warehouse dropdown after selection
        setTimeout(() => {
          setSelectedProducts(prev => ({ ...prev, [colKey]: null }));
        }, 500);
      }
    }
  };

  // Reset header inputs (clear dropdowns/filters in header)
  const resetHeaderInputs = () => {
    setSelectedProducts({});
    setSelectedDates({});
    setRightFilters({});
    setRightFilterPopup({ column: null, term: '' });
    setModalSearchTerm('');
    setModalSelections([]);
  };

  // Render date picker for date fields
  const renderDatePickerTH = (colKey, label) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <DatePicker 
            value={selectedDates[colKey] ? dayjs(selectedDates[colKey]) : null}
            onChange={(date) => handleDateSelect(colKey, date)}
            style={{
              width: '100%',
              minWidth: '120px',
              fontSize: '12px'
            }}
            format="DD/MM/YYYY"
            placeholder="DD/MM/YYYY"
            allowClear={false}
            showToday={false}
            size="small"
            className="custom-date-picker"
            popupClassName="custom-date-picker-dropdown"
            renderExtraFooter={() => (
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 12px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <span 
                  onClick={() => {
                    setSelectedDates(prev => ({ ...prev, [colKey]: null }));
                  }} 
                  style={{
                    color: '#1677ff', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                >
                  Clear
                </span>
                <span 
                  onClick={() => {
                    const today = dayjs();
                    setSelectedDates(prev => ({ ...prev, [colKey]: today.format('YYYY-MM-DD') }));
                    handleDateSelect(colKey, today);
                  }} 
                  style={{
                    color: '#1677ff', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                >
                  Today
                </span>
              </div>
            )}
          />
        </div>
      </th>
    );
  };

  // Handle date selection
  const handleDateSelect = (colKey, date) => {
    setSelectedDates(prev => ({ 
      ...prev, 
      [colKey]: date ? date.format('YYYY-MM-DD') : null 
    }));
    
    if (date && selectedImport) {
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: '',
        conversion: 1,
        quantity: 1,
        unitPrice: 0,
        transportCost: 0,
        noteDate: date.format('YYYY-MM-DD'),
        total: 0,
        totalTransport: 0,
        weight: 0,
        volume: 0,
        warehouse: '',
      };
      
      // Add new item to the current import
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Render numeric input for editable fields
  const renderNumericInputTH = (colKey, label, placeholder) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Input
            placeholder={placeholder}
            size="small"
            style={{ width: '100%', minWidth: '100px' }}
            type={['quantity', 'weight', 'volume', 'conversion'].includes(colKey) ? 'number' : 'text'}
            onPressEnter={(e) => handleDirectInput(colKey, e.target.value)}
          />
        </div>
      </th>
    );
  };

  // Render text input for text fields  
  const renderTextInputTH = (colKey, label, placeholder) => {
    return (
      <th key={colKey}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
          <span>{label}</span>
          <Input
            placeholder={placeholder}
            size="small"
            style={{ width: '100%', minWidth: '120px' }}
            onPressEnter={(e) => handleTextInput(colKey, e.target.value)}
          />
        </div>
      </th>
    );
  };

  // Handle direct input for numeric fields
  const handleDirectInput = (colKey, value) => {
    if (value && selectedImport) {
      const numValue = parseFloat(value) || 0;
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: '',
        conversion: colKey === 'conversion' ? numValue : 1,
        quantity: colKey === 'quantity' ? numValue : 1,
        unitPrice: colKey === 'unitPrice' ? numValue : 0,
        transportCost: colKey === 'transportCost' ? numValue : 0,
        noteDate: null,
        total: colKey === 'total' ? numValue : 0,
        totalTransport: colKey === 'totalTransport' ? numValue : 0,
        weight: colKey === 'weight' ? numValue : 0,
        volume: colKey === 'volume' ? numValue : 0,
        warehouse: '',
      };
      
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Handle text input for text fields
  const handleTextInput = (colKey, value) => {
    if (value && selectedImport) {
      const newItem = {
        id: Date.now() + Math.random(),
        barcode: '',
        productCode: '',
        productName: '',
        description: colKey === 'description' ? value : '',
        conversion: 1,
        quantity: 1,
        unitPrice: 0,
        transportCost: 0,
        noteDate: null,
        total: 0,
        totalTransport: 0,
        weight: 0,
        volume: 0,
        warehouse: '',
      };
      
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Load imports, products and warehouses from backend on mount
  React.useEffect(() => {
    loadImports();
    loadProducts();
    loadWarehouses();
  }, []);

  React.useEffect(() => {
    if (imports.length > 0 && !selectedImport) {
      setSelectedImport(imports[0]);
    }
  }, [imports, selectedImport]);

  // reset right table paging when selected import changes
  React.useEffect(() => {
    setRightCurrentPage(1);
  }, [selectedImport]);

  React.useEffect(() => {
    try { localStorage.setItem(RIGHT_COLS_KEY, JSON.stringify(rightVisibleCols)); } catch {}
  }, [rightVisibleCols]);

  const rightPageSizeOptions = [10,20,50,100,200,500,1000,5000];
  // Prefer local `items` state when present (we update it when adding rows), otherwise use selectedImport items
  const itemsData = (items && items.length > 0) ? items : (selectedImport?.items || []);

  // apply per-column filters before pagination (ignore Vietnamese diacritics)
  const filteredRightItems = itemsData.filter(item => {
    return Object.entries(rightFilters).every(([k, v]) => {
      if (!v) return true;
      const raw = item[k];
      const s = raw === null || raw === undefined ? '' : String(raw);
      const sv = removeVietnameseTones(s.toLowerCase());
      const vv = removeVietnameseTones(String(v).toLowerCase());
      return sv.includes(vv);
    });
  });

  const rightTotal = filteredRightItems.length;
  const rightTotalPages = Math.max(1, Math.ceil(rightTotal / Math.max(1, rightItemsPerPage)));
  const rightStart = rightTotal === 0 ? 0 : (rightCurrentPage - 1) * rightItemsPerPage + 1;
  const rightEnd = Math.min(rightTotal, rightCurrentPage * rightItemsPerPage);
  const paginatedItems = filteredRightItems.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage);

  React.useEffect(() => {
    setRightCurrentPage(p => Math.min(p, rightTotalPages));
  }, [rightItemsPerPage, selectedImport, rightTotalPages]);

  const handleSelectImport = (importItem) => {
    if (!importItem) return;
    if (importItem.id) loadImportDetails(importItem.id);
    else setSelectedImport(importItem);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    try {
      const res = await fetch(`/api/Imports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      // reload list
      await loadImports();
      if (selectedImport && selectedImport.id === id) {
        setSelectedImport(imports.length > 0 ? imports[0] : null);
      }
    } catch (err) {
      console.error('Delete import error', err);
      alert('Xóa phiếu nhập thất bại');
    }
  };

  // Load imports list from backend
  const loadImports = async () => {
    try {
      const res = await fetch('/api/Imports');
      if (!res.ok) throw new Error('Failed to load imports');
      const data = await res.json();
      setImports(data || []);
      if (data && data.length > 0) {
        await loadImportDetails(data[0].id);
      } else {
        setSelectedImport(null);
      }
    } catch (err) {
      console.error('Load imports error', err);
      // fallback to existing sample data
      console.warn('Using local sample imports as fallback');
      // keep current `imports` state as fallback
    }
  };

  // Load products list from backend
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/Products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Load products error', err);
      // Keep empty array as fallback
      setProducts([]);
    }
  };

  // Load warehouses list from backend
  const loadWarehouses = async () => {
    try {
      const res = await fetch('/api/Warehouses');
      if (!res.ok) throw new Error('Failed to load warehouses');
      const data = await res.json();
      setWarehouses(data || []);
    } catch (err) {
      console.error('Load warehouses error', err);
      // Keep empty array as fallback
      setWarehouses([]);
    }
  };

  const loadImportDetails = async (id) => {
    try {
      const res = await fetch(`/api/Imports/${id}`);
      if (!res.ok) throw new Error('Failed to load import details');
      const data = await res.json();
      // normalize to frontend shape
      const detail = {
        ...data,
        items: (data.items || data.Items || []).map(it => ({ ...it }))
      };
      // if employee missing, keep current formData.employee
      setSelectedImport(detail);
      setFormData({
        importNumber: detail.importNumber || detail.ImportNumber || generateImportNumber(),
        createdDate: detail.date ? dayjs(detail.date).format('YYYY-MM-DD') : (detail.createdDate || new Date().toISOString().split('T')[0]),
        employee: detail.employee || detail.Employee || formData.employee,
        importType: detail.importType || detail.ImportType || '',
        totalWeight: detail.totalWeight || 0,
        totalVolume: detail.totalVolume || 0,
        note: detail.note || detail.Note || ''
      });
      setItems(detail.items || []);
      setIsEditing(false);
    } catch (err) {
      console.error('Load import details error', err);
      alert('Không thể tải chi tiết phiếu nhập');
    }
  };

  const createNewImport = async () => {
    try {
      const payload = {
        importNumber: generateImportNumber(),
        date: new Date().toISOString(),
        note: '',
        employee: formData.employee || '',
        total: 0,
        items: []
      };
      const res = await fetch('/api/Imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create import');
      }
      const created = await res.json();
      await loadImports();
      await loadImportDetails(created.id);
      setIsEditing(true);
    } catch (err) {
      console.error('Create import error', err);
      alert('Tạo phiếu nhập mới thất bại');
    }
  };

  const saveImport = async () => {
    try {
      const payload = {
        importNumber: formData.importNumber,
        date: formData.createdDate ? new Date(formData.createdDate).toISOString() : new Date().toISOString(),
        note: formData.note,
        employee: formData.employee,
        total: (items || []).reduce((s, it) => s + (Number(it.total) || 0), 0),
        items: (items || []).map(it => ({
          barcode: it.barcode,
          productCode: it.productCode,
          productName: it.productName,
          description: it.description,
          conversion: it.conversion,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          transportCost: it.transportCost || 0,
          noteDate: it.noteDate || null,
          total: it.total,
          totalTransport: it.totalTransport || 0,
          weight: it.weight,
          volume: it.volume,
          warehouse: it.warehouse,
          note: it.note
        }))
      };
      if (selectedImport && selectedImport.id) {
        const res = await fetch(`/api/Imports/${selectedImport.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedImport.id, ...payload })
        });
        if (!res.ok) throw new Error('Save failed');
      } else {
        const res = await fetch('/api/Imports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Create failed');
      }
      await loadImports();
      if (selectedImport && selectedImport.id) await loadImportDetails(selectedImport.id);
      setIsEditing(false);
      alert('Lưu phiếu nhập thành công');
    } catch (err) {
      console.error('Save import error', err);
      alert('Lưu phiếu nhập thất bại');
    }
  };

  // Item modal helpers
  const closeItemModal = () => setShowItemModal(false);

  const saveItemFromModal = () => {
    // basic validation: productName required
    if (!itemForm.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...itemForm };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...itemForm };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    setShowItemModal(false);
  };

  const saveItemAndCopy = () => {
    // Save current item but keep modal open with same values so user can tweak copy
    if (!itemForm.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...itemForm };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...itemForm };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    // keep modal open, but clear editing index so next save creates new item
    setEditingItemIndex(null);
  };

  // wrappers to accept data from ProductModal
  const handleSaveItemFromModal = (data) => {
    if (!data.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...data };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...data };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    setShowItemModal(false);
  };

  const handleSaveItemAndCopy = (data) => {
    if (!data.productName) {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      const copy = [...items];
      copy[editingItemIndex] = { ...copy[editingItemIndex], ...data };
      setItems(copy);
    } else {
      const newItem = { id: Date.now(), ...data };
      setItems(prev => [...prev, newItem]);
    }
    setIsEditing(true);
    // keep modal open for copy
    setEditingItemIndex(null);
    setShowItemModal(true);
  };

  const editItem = (idx) => {
    const it = items[idx];
    if (!it) return;
    setItemForm({ ...it });
    setEditingItemIndex(idx);
    setShowItemModal(true);
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
      // importItem may provide createdDate (DD/MM/YYYY) or date (ISO). Handle both safely.
      let importDate = null;
      if (importItem.createdDate && typeof importItem.createdDate === 'string' && importItem.createdDate.includes('/')) {
        const parts = importItem.createdDate.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          importDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      } else if (importItem.date) {
        try {
          importDate = dayjs(importItem.date).format('YYYY-MM-DD');
        } catch (e) {
          importDate = null;
        }
      }
      if (!importDate) {
        matchesDate = false;
      } else {
        matchesDate = importDate >= dateFrom && importDate <= dateTo;
      }
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
    // open item modal for creating a new item
    setItemForm({
      category: '', barcode: '', productCode: '', productName: '', productNameVat: '', description: '', hsdMonths: 0,
      defaultUnit: '', priceImport: 0, priceRetail: 0, priceWholesale: 0,
      unit1Name: '', unit1Conversion: 0, unit1Price: 0, unit1Discount: 0,
      unit2Name: '', unit2Conversion: 0, unit2Price: 0, unit2Discount: 0,
      unit3Name: '', unit3Conversion: 0, unit3Price: 0, unit3Discount: 0,
      unit4Name: '', unit4Conversion: 0, unit4Price: 0, unit4Discount: 0,
      weight: 0, volume: 0, warehouse: '', note: '', transportCost: 0, totalTransport: 0, noteDate: null
    });
    setEditingItemIndex(null);
    setShowItemModal(true);
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
    else if (colKey === 'note') items = Array.from(new Set(filteredImports.map(i => i.note || '')));
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
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>Ghi chú PN</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('note')} />
          {leftFilterLists.note && leftFilterLists.note.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.note.length})</span>}
        </div>
      ),
      dataIndex: 'note',
      key: 'note',
      render: (text) => (
        <span style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}} title={text}>{text}</span>
      ),
      sorter: (a, b) => (a.note || '').localeCompare(b.note || ''),
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
              const label = colKey==='checkbox'?'':(colKey==='importNumber'?'Số phiếu':colKey==='createdDate'?'Ngày nhập':colKey==='note'?'Ghi chú PN':colKey==='total'?'Tổng tiền':colKey==='actions'?'Thao tác':colKey);
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
                      <input
                        type="date"
                        value={formData.createdDate || (selectedImport?.createdDate ? dayjs(selectedImport.createdDate).format('YYYY-MM-DD') : '')}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData(fd => ({ ...fd, createdDate: v }));
                          setSelectedImport(si => si ? ({ ...si, createdDate: v }) : si);
                          setIsEditing(true);
                        }}
                        style={{width:'100%'}}
                      />
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

                {/* Date picker modal for Ngày lập */}
                <Modal
                  open={showDatePickerModal}
                  onCancel={() => setShowDatePickerModal(false)}
                  title={null}
                  width={280}
                  footer={null}
                  bodyStyle={{padding:0}}
                >
                  <div style={{padding:16}}>
                    <div style={{marginBottom:16}}>
                      <select 
                        value={dateDraft ? dateDraft.format('MMMM YYYY') : dayjs().format('MMMM YYYY')}
                        onChange={(e) => {
                          const [month, year] = e.target.value.split(' ');
                          const newDate = dayjs().month(dayjs().month(month)).year(parseInt(year));
                          setDateDraft(newDate);
                        }}
                        style={{width:'60%',border:'none',background:'transparent',fontWeight:'bold'}}
                      >
                        {Array.from({length:12}, (_, i) => {
                          const date = dayjs().month(i);
                          return (
                            <option key={i} value={date.format('MMMM YYYY')}>
                              {date.format('MMMM YYYY')}
                            </option>
                          );
                        })}
                      </select>
                      <div style={{float:'right'}}>
                        <button style={{border:'none',background:'transparent',cursor:'pointer',fontSize:18}} onClick={() => {
                          const prev = (dateDraft || dayjs()).subtract(1, 'month');
                          setDateDraft(prev);
                        }}>‹</button>
                        <button style={{border:'none',background:'transparent',cursor:'pointer',fontSize:18}} onClick={() => {
                          const next = (dateDraft || dayjs()).add(1, 'month');
                          setDateDraft(next);
                        }}>›</button>
                      </div>
                    </div>
                    
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,textAlign:'center',fontSize:12}}>
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
                        <div key={day} style={{padding:4,color:'#999',fontWeight:'bold'}}>{day}</div>
                      ))}
                      
                      {Array.from({length:42}, (_, i) => {
                        const startOfMonth = (dateDraft || dayjs()).startOf('month');
                        const startOfWeek = startOfMonth.startOf('week');
                        const date = startOfWeek.add(i, 'day');
                        const isCurrentMonth = date.month() === (dateDraft || dayjs()).month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = dateDraft && date.isSame(dateDraft, 'day');
                        
                        return (
                          <div
                            key={i}
                            onClick={() => setDateDraft(date)}
                            style={{
                              padding:'6px 4px',
                              cursor:'pointer',
                              color: isCurrentMonth ? '#000' : '#ccc',
                              background: isSelected ? '#1890ff' : isToday ? '#e6f7ff' : 'transparent',
                              color: isSelected ? '#fff' : isCurrentMonth ? '#000' : '#ccc',
                              borderRadius:2,
                              fontSize:13
                            }}
                          >
                            {date.date()}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:16,borderTop:'1px solid #f0f0f0',paddingTop:12}}>
                      <button 
                        style={{background:'transparent',border:'none',color:'#1890ff',cursor:'pointer'}} 
                        onClick={()=>{setDateDraft(null); setShowDatePickerModal(false);}}>
                        Clear
                      </button>
                      <button 
                        style={{background:'transparent',border:'none',color:'#1890ff',cursor:'pointer'}} 
                        onClick={()=>{setDateDraft(dayjs());}}>
                        Today
                      </button>
                    </div>
                    
                    {dateDraft && (
                      <div style={{textAlign:'center',marginTop:8}}>
                        <button 
                          className="btn btn-primary" 
                          style={{width:'100%'}}
                          onClick={()=>{
                            const iso = dateDraft.format('YYYY-MM-DD');
                            setSelectedImport(si => si ? ({ ...si, createdDate: iso }) : si);
                            setFormData(fd => ({ ...fd, createdDate: iso }));
                            setIsEditing(true);
                            setShowDatePickerModal(false);
                          }}>
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </Modal>

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
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú PN</label>
                    <input
                      type="text"
                      value={formData.note !== undefined ? formData.note : (selectedImport.note || '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, note: v }));
                        setSelectedImport(si => si ? ({ ...si, note: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                    />
                  </div>
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <span>Tổng {selectedImport.items?.length || 0}</span>
                  <div className="items-actions">
                    <button className="icon-btn create-btn" onClick={handleAddItem} title="Thêm hàng">
                      <span>+</span>
                    </button>
                    <button className="icon-btn settings-btn" onClick={()=>setShowRightSettings(true)} title="Cài đặt hiển thị cột">
                      <span>⚙</span>
                    </button>
                  </div>
                </div>

                <div className="items-table-container" ref={itemsTableRef}>
                  <div style={{margin: '12px 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14}}>
                    <div>{`Dòng ${rightStart}-${rightEnd} trên tổng ${rightTotal} dòng`}</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                      <span style={{fontWeight: 600}}>{rightCurrentPage}</span>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))}>{'>'}</button>
                      <select value={rightItemsPerPage} onChange={(e) => { setRightItemsPerPage(parseInt(e.target.value, 10)); setRightCurrentPage(1); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                        <option value={200}>200 / trang</option>
                        <option value={500}>500 / trang</option>
                        <option value={1000}>1000 / trang</option>
                        <option value={5000}>5000 / trang</option>
                      </select>
                    </div>
                  </div>

                  <table className="items-table" style={{minWidth:1300}}>
                    <thead>
                      <tr>
                        {renderHeaderFilterTH('barcode','Mã vạch','nhập mã vạch')}
                        {renderHeaderFilterTH('productCode','Mã hàng','nhập mã hàng')}
                        {renderHeaderFilterTH('productName','Hàng hóa','nhập tên hàng')}
                        {renderHeaderFilterTH('description','Mô tả','nhập mô tả')}
                        {renderHeaderFilterTH('conversion','Quy đổi','nhập quy đổi')}
                        {renderHeaderFilterTH('quantity','Số lượng','nhập số lượng')}
                        {renderHeaderFilterTH('unitPrice','Đơn giá','nhập đơn giá')}
                        {renderHeaderFilterTH('transportCost','Tiền vận chuyển','nhập tiền vận chuyển')}
                        {renderHeaderFilterTH('noteDate','Ghi chú (date)','nhập ghi chú (date)')}
                        {renderHeaderFilterTH('total','Thành tiền','nhập thành tiền')}
                        {renderHeaderFilterTH('totalTransport','Thành tiền vận chuyển','nhập thành tiền vận chuyển')}
                        {renderHeaderFilterTH('weight','Số kg','nhập số kg')}
                        {renderHeaderFilterTH('volume','Số khối','nhập số khối')}
                        {renderHeaderFilterTH('warehouse','Kho hàng','nhập kho hàng')}
                        {rightVisibleCols.includes('actions') && (
                          <th key="actions">
                            <div style={{display:'flex',alignItems:'center',gap:8,flexDirection:'column'}}>
                              <span>Thao tác</span>
                              <button
                                className="btn-reset-header"
                                onClick={() => resetHeaderInputs()}
                                style={{
                                  marginTop: 6,
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #e6edf3',
                                  background: '#fff',
                                  cursor: 'pointer',
                                  fontSize: 13
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </th>
                        )}
                      </tr>
                      {/* Additional header input rows inserted under the main header */}
                      {headerRows.map((row, rIdx) => (
                        <tr key={row.id} className="header-input-row">
                          {['barcode','productCode','productName','description','conversion','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','actions'].map(colKey => {
                            if (colKey === 'actions') {
                              if (!rightVisibleCols.includes('actions')) return null;
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    {rIdx < headerRows.length - 1 && (
                                      <button onClick={() => setHeaderRows(prev => prev.filter((_,i)=>i!==rIdx))} style={{padding:'4px 8px',fontSize:12}}>Xóa</button>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            // Product-related columns
                            if (['productCode','productName','barcode'].includes(colKey)) {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <Select
                                    value={row.values[colKey] || undefined}
                                    onChange={(val) => handleHeaderRowProductSelect(rIdx, colKey, val)}
                                    placeholder={`-- Chọn ${colKey} --`}
                                    size="small"
                                    showSearch
                                    allowClear
                                    style={{ width: '100%', minWidth: 120 }}
                                    filterOption={(input, option) => {
                                      const p = products.find(pp => pp.id.toString() === option.value);
                                      if (!p) return false;
                                      const txt = `${p.code||''} ${p.name||''} ${p.barcode||''}`.toLowerCase();
                                      return txt.includes((input||'').toLowerCase());
                                    }}
                                  >
                                    {products.map(p => (
                                      <Select.Option key={p.id} value={p.id.toString()}>
                                        {p.code} - {p.name}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </td>
                              );
                            }

                            if (colKey === 'warehouse') {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <Select
                                    value={row.values[colKey] || undefined}
                                    onChange={(val) => handleHeaderRowChange(rIdx, colKey, val)}
                                    placeholder="-- Chọn kho --"
                                    size="small"
                                    allowClear
                                    style={{ width: '100%', minWidth: 120 }}
                                  >
                                    {warehouses.map(w => (
                                      <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
                                    ))}
                                  </Select>
                                </td>
                              );
                            }

                            if (colKey === 'noteDate') {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <DatePicker
                                    value={row.values[colKey] ? dayjs(row.values[colKey]) : null}
                                    onChange={(d) => handleHeaderRowChange(rIdx, colKey, d ? d.format('YYYY-MM-DD') : null)}
                                    format="DD/MM/YYYY"
                                    size="small"
                                    style={{ width: '100%', minWidth: 120 }}
                                  />
                                </td>
                              );
                            }

                            // Default: text / numeric inputs
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                <Input
                                  value={row.values[colKey] || ''}
                                  onChange={(e) => handleHeaderRowChange(rIdx, colKey, e.target.value)}
                                  size="small"
                                  style={{ width: '100%', minWidth: 100 }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {paginatedItems?.length > 0 ? (
                        paginatedItems.map((item) => (
                          <tr key={item.id}>
                            {rightVisibleCols.includes('barcode') && <td>{item.barcode}</td>}
                            {rightVisibleCols.includes('productCode') && <td>{item.productCode}</td>}
                            {rightVisibleCols.includes('productName') && <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}} title={item.productName}>{item.productName}</td>}
                            {rightVisibleCols.includes('description') && <td style={{maxWidth:240,overflow:'hidden',textOverflow:'ellipsis'}} title={item.description}>{item.description}</td>}
                            {rightVisibleCols.includes('conversion') && <td>{item.conversion}</td>}
                            {rightVisibleCols.includes('quantity') && <td>{item.quantity}</td>}
                            {rightVisibleCols.includes('unitPrice') && <td>{(item.unitPrice||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('transportCost') && <td>{(item.transportCost||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('noteDate') && <td>{item.noteDate ? dayjs(item.noteDate).format('DD/MM/YYYY') : ''}</td>}
                            {rightVisibleCols.includes('total') && <td>{(item.total||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('totalTransport') && <td>{(item.totalTransport||0).toLocaleString('vi-VN')}</td>}
                            {rightVisibleCols.includes('weight') && <td>{item.weight}</td>}
                            {rightVisibleCols.includes('volume') && <td>{item.volume}</td>}
                            {rightVisibleCols.includes('warehouse') && <td>{item.warehouse}</td>}
                            {rightVisibleCols.includes('actions') && <td>
                              <div className="action-up-down" style={{display:'flex',gap:'4px',alignItems:'center'}}>
                                <button 
                                  onClick={() => editItem((paginatedItems.indexOf(item) + (rightCurrentPage-1)*rightItemsPerPage))} 
                                  style={{padding:'2px 8px',fontSize:'12px',backgroundColor:'#1677ff',color:'white',border:'none',borderRadius:'3px',cursor:'pointer'}}
                                >
                                  Sửa
                                </button>
                                <button 
                                  onClick={() => deleteItem(paginatedItems.indexOf(item))} 
                                  style={{padding:'2px 8px',fontSize:'12px',backgroundColor:'#ff4d4f',color:'white',border:'none',borderRadius:'3px',cursor:'pointer'}}
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={rightVisibleCols.length || 1} className="no-data">
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
                </div>
              </div>

              {/* Right-side column settings modal */}
              <Modal
                open={showRightSettings}
                onCancel={()=>setShowRightSettings(false)}
                title="Cài đặt cột bảng hàng hóa"
                footer={null}
              >
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {defaultRightCols.map(colKey=>{
                    const label = colKey==='barcode'?'Mã vạch':colKey==='productCode'?'Mã hàng':colKey==='productName'?'Hàng hóa':colKey==='description'?'Mô tả':colKey==='conversion'?'Quy đổi':colKey==='quantity'?'Số lượng':colKey==='unitPrice'?'Đơn giá':colKey==='transportCost'?'Tiền vận chuyển':colKey==='noteDate'?'Ghi chú (date)':colKey==='total'?'Thành tiền':colKey==='totalTransport'?'Thành tiền vận chuyển':colKey==='weight'?'Số kg':colKey==='volume'?'Số khối':colKey==='warehouse'?'Kho hàng':colKey==='actions'?'Thao tác':colKey;
                    return (
                      <label key={colKey} style={{display:'flex',alignItems:'center',gap:8}}>
                        <input type="checkbox" checked={rightVisibleCols.includes(colKey)} onChange={()=>{
                          setRightVisibleCols(prev=> prev.includes(colKey)? prev.filter(k=>k!==colKey) : [...prev, colKey]);
                        }} />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                    <button className="btn btn-secondary" onClick={()=>setRightVisibleCols(defaultRightCols)}>Làm lại</button>
                    <button className="btn btn-primary" onClick={()=>setShowRightSettings(false)}>Đóng</button>
                  </div>
                </div>
              </Modal>

              {/* Item add/edit modal uses shared ProductModal component */}
              <ProductModal
                open={showItemModal}
                onClose={closeItemModal}
                initialData={itemForm}
                onSave={handleSaveItemFromModal}
                onSaveCopy={handleSaveItemAndCopy}
              />

              <div className="detail-actions">
                  <button className="btn btn-info" onClick={saveImport} disabled={!isEditing}>
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
