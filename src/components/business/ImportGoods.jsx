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
  const handleTableContextMenu = (event, record) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      record: record
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
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
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
  const [transactionContents, setTransactionContents] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [formData, setFormData] = useState(() => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    
    return { 
      importNumber: `PN-${day}${month}${year}-${timestamp}`, 
      createdDate: new Date().toISOString().split('T')[0], 
      employee: 'admin 66', 
      importType: '', 
      totalWeight: 0, 
      totalVolume: 0, 
      note: '' 
    };
  });

  // Ref to temporarily suppress auto-selecting the first import when imports refresh
  const suppressAutoSelectRef = React.useRef(false);
  // Control whether right layout content is visible
  const [showRightContent, setShowRightContent] = useState(true);
  // Control edit mode - true: show full edit with products table, false: show basic info only
  const [isEditMode, setIsEditMode] = useState(false);
  const [leftPage, setLeftPage] = useState(1);
  const [showLeftSettings, setShowLeftSettings] = useState(false);
  const [showRightSettings, setShowRightSettings] = useState(false);
  const itemsTableRef = useRef(null);
  const productSelectRefs = useRef({});
  const [headerRows, setHeaderRows] = useState(() => [{ id: Date.now(), values: {} }]);

  // Debug logging helper (completely disabled for performance)
  const devLog = () => {
    // No-op for production performance - all logging disabled
  };



  // Helper function to calculate totals from items
  const calculateTotals = (itemsList) => {
    return itemsList.reduce((totals, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const weight = parseFloat(item.weight) || 0; 
      const volume = parseFloat(item.volume) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const transportCost = parseFloat(item.transportCost) || 0;
      
      return {
        totalWeight: Math.round((totals.totalWeight + weight) * 100) / 100, // Round to 2 decimal places
        totalVolume: Math.round((totals.totalVolume + volume) * 10000) / 10000, // Round to 4 decimal places
        totalAmount: totals.totalAmount + (quantity * unitPrice),
        totalTransport: totals.totalTransport + (transportCost * quantity)
      };
    }, { totalWeight: 0, totalVolume: 0, totalAmount: 0, totalTransport: 0 });
  };

  // Helper function to format currency (with comma separators)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '0';
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Helper function to format weight (2 decimal places)
  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === '') return '0.00';
    const num = Number(weight) || 0;
    return num.toFixed(2);
  };

  // Helper function to format volume (4 decimal places)
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined || volume === '') return '0.0000';
    const num = Number(volume) || 0;
    return num.toFixed(4);
  };

  // Helper function to format input value for display
  const formatInputDisplay = (value, type) => {
    if (!value || value === '') return '';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'weight':
        return formatWeight(value);
      case 'volume':
        return formatVolume(value);
      case 'number':
        return value.toString();
      default:
        return value;
    }
  };

  // Helper function to parse display value back to number
  const parseDisplayValue = (displayValue) => {
    if (!displayValue || displayValue === '') return '';
    // Remove commas and parse as number
    return displayValue.toString().replace(/,/g, '');
  };

  // Helper function to convert number to Vietnamese text
  const numberToVietnameseText = (num) => {
    if (!num || num === 0) return 'không đồng';
    
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];

    if (num < 0) return 'âm ' + numberToVietnameseText(-num);
    if (num === 0) return 'không';

    const convertHundreds = (n) => {
      let result = '';
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      
      if (hundreds > 0) {
        result += ones[hundreds] + ' trăm';
        if (remainder > 0) result += ' ';
      }
      
      if (remainder >= 20) {
        const tensDigit = Math.floor(remainder / 10);
        const onesDigit = remainder % 10;
        result += tens[tensDigit];
        if (onesDigit > 0) {
          result += ' ' + ones[onesDigit];
        }
      } else if (remainder >= 10) {
        if (remainder === 10) {
          result += 'mười';
        } else {
          result += 'mười ' + ones[remainder - 10];
        }
      } else if (remainder > 0) {
        if (hundreds > 0) {
          result += 'lẻ ' + ones[remainder];
        } else {
          result += ones[remainder];
        }
      }
      
      return result;
    };

    let result = '';
    let scaleIndex = 0;
    
    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkText = convertHundreds(chunk);
        if (scaleIndex > 0) {
          result = chunkText + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
        } else {
          result = chunkText;
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
    
    return result + ' đồng';
  };

  // Helper function to format product option labels
  const getProductOptionLabel = (product) => {
    const unit = product.defaultUnit || product.DefaultUnit || product.unit || product.baseUnit || '';
    const price = product.importPrice || product.price || product.priceRetail || 0;
    const priceText = Number(price).toLocaleString('vi-VN');
    return `${product.barcode || ''} - ${product.code || ''} - ${product.name || ''} - ${priceText} - ${unit}`;
  };

  // Helper function to get selected display value (for productName column, show only name)
  const getSelectedDisplayValue = (product, colKey) => {
    if (colKey === 'productName') {
      return product.name || '';
    }
    return getProductOptionLabel(product);
  };

  // Right-side columns & filters (for items table header filters)
  const RIGHT_COLS_KEY = 'import_goods_right_cols_v1';
  const defaultRightCols = ['barcode','productCode','productName','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','description','conversion','actions'];
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

  // Product selection modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalSearch, setProductModalSearch] = useState('');
  const [selectedModalProducts, setSelectedModalProducts] = useState([]);
  const [productModalColumn, setProductModalColumn] = useState(null);
  const [productModalRowIndex, setProductModalRowIndex] = useState(null);
  
  // Pagination state for product modal
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  // Memoized product filtering for product modal to avoid repeated expensive filters
  const memoizedFilteredProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!productModalSearch) return products;
    const terms = removeVietnameseTones(productModalSearch.toLowerCase()).split(/\s+/).filter(t => t);
    return products.filter(p => {
      const searchableText = [
        removeVietnameseTones((p.name || '').toLowerCase()),
        removeVietnameseTones((p.code || '').toLowerCase()),
        removeVietnameseTones((p.barcode || '').toLowerCase()),
        (p.importPrice || p.price || p.priceRetail || 0).toString(),
        (p.defaultUnit || p.DefaultUnit || p.unit || p.baseUnit || '').toLowerCase()
      ].join(' ');
      return terms.every(term => searchableText.includes(term));
    });
  }, [products, productModalSearch]);

  // Memoized header calculations to avoid repeated expensive filtering during renders
  const memoizedHeaderTotals = React.useMemo(() => {
    const validRows = headerRows.filter(row => row && row.values && (row.values.productName || row.values.productCode || row.values.barcode));
    const totalAmount = validRows.reduce((sum, row) => sum + (parseFloat(row.values.total) || 0), 0);
    const totalWeight = validRows.reduce((sum, row) => sum + (parseFloat(row.values.weight) || 0), 0);
    const totalVolume = validRows.reduce((sum, row) => sum + (parseFloat(row.values.volume) || 0), 0);
    return { validRows, totalAmount, totalWeight, totalVolume };
  }, [headerRows]);

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
          <Input
            placeholder={`nhập ${label.toLowerCase()}`}
            size="small"
            style={{ width: '100%', minWidth: '150px' }}
            readOnly
          />
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
            conversion: selectedProduct.conversion1 || 1,
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
    const selectedProduct = products.find(p => p.id.toString() === productId);
    
    setHeaderRows(prev => {
      const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
      
      if (selectedProduct) {
        // Store actual field values instead of productId
        copy[rowIndex].values['productCode'] = selectedProduct.code || '';
        copy[rowIndex].values['productName'] = selectedProduct.name || '';
        copy[rowIndex].values['barcode'] = selectedProduct.barcode || '';
        copy[rowIndex].values['description'] = selectedProduct.description || '';
        copy[rowIndex].values['conversion'] = selectedProduct.conversion1 || 1;
        copy[rowIndex].values['unitPrice'] = selectedProduct.importPrice || 0;
        copy[rowIndex].values['weight'] = selectedProduct.weight || 0;
        copy[rowIndex].values['volume'] = selectedProduct.volume || 0;
        
        // Auto-calculate initial totals
        const quantity = parseFloat(copy[rowIndex].values.quantity) || 1;
        const unitPrice = parseFloat(selectedProduct.importPrice) || 0;
        const transportCost = parseFloat(copy[rowIndex].values.transportCost) || 0;
        
        copy[rowIndex].values.total = (quantity * unitPrice).toString();
        copy[rowIndex].values.totalTransport = (quantity * transportCost).toString();
        
        // Also store the productId for the specific column clicked
        copy[rowIndex].values[colKey + '_id'] = productId;
      } else {
        copy[rowIndex].values[colKey] = productId || '';
      }
      
      // if selecting in last row and a productId was chosen, append blank row
      if (productId && rowIndex === copy.length - 1) {
        copy.push({ id: Date.now() + Math.random(), values: {} });
      }
      return copy;
    });
  };

  const handleHeaderRowChange = React.useCallback((rowIndex, colKey, value) => {
    setHeaderRows(prev => {
      const copy = [...prev];
      const targetRow = { ...copy[rowIndex], values: { ...copy[rowIndex].values } };
      targetRow.values[colKey] = value;
      copy[rowIndex] = targetRow;
      
      // Only auto-calculate when price/quantity related fields change
      const needsRecalc = ['quantity', 'unitPrice', 'transportCost'].includes(colKey);
      if (needsRecalc) {
        const row = targetRow.values;
        const quantity = parseFloat(row.quantity) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const transportCost = parseFloat(row.transportCost) || 0;
        
        // Calculate totals only when needed
        targetRow.values.total = (quantity * unitPrice).toString();
        targetRow.values.totalTransport = (quantity * transportCost).toString();
      }
      
      return copy;
    });
  }, []); // Empty dependency array since we only use prev state

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
            classNames={{ popup: { root: 'custom-date-picker-dropdown' } }}
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
    loadTransactionContents();
    loadEmployees();
  }, []);

  React.useEffect(() => {
    if (imports.length > 0 && !selectedImport) {
      if (suppressAutoSelectRef.current) {
        // skip this one-time auto-select, reset the flag for future updates
        suppressAutoSelectRef.current = false;
      } else {
        setSelectedImport(imports[0]);
      }
    }
  }, [imports, selectedImport]);

  // Cập nhật số phiếu sau khi imports được load (chỉ khi đang tạo mới)
  React.useEffect(() => {
    if (imports && imports.length > 0 && !selectedImport && formData.importNumber.includes('PN-')) {
      const newImportNumber = generateImportNumber();
      setFormData(prev => ({
        ...prev,
        importNumber: newImportNumber
      }));
    }
  }, [imports]);

  // reset right table paging when selected import changes
  React.useEffect(() => {
    setRightCurrentPage(1);
  }, [selectedImport]);

  React.useEffect(() => {
    try { localStorage.setItem(RIGHT_COLS_KEY, JSON.stringify(rightVisibleCols)); } catch {}
  }, [rightVisibleCols]);

  // Optimized debounced sync: update totals with minimal re-renders
  React.useEffect(() => {
    if (!selectedImport) return;
    let active = true;
    const t = setTimeout(() => {
      if (!active) return;

      let total = 0;
      if (isEditMode && headerRows.length > 0) {
        // Use memoized total from memoizedHeaderTotals
        total = memoizedHeaderTotals.totalAmount;
      } else {
        total = Number(selectedImport.totalAmount || 0) || 
                (selectedImport.items || []).reduce((s, it) => s + (Number(it.total) || 0), 0);
      }

      // Only update when changed to avoid extra renders
      setSelectedImport(prev => {
        if (!prev) return prev;
        const existing = Number(prev.totalAmount) || 0;
        if (existing === total) return prev;
        return { ...prev, totalAmount: total };
      });

      setImports(prev => {
        if (!prev || prev.length === 0) return prev;
        let changed = false;
        const next = prev.map(it => {
          if (!it) return it;
          if (it.id === selectedImport.id) {
            const existing = Number(it.totalAmount) || 0;
            if (existing === total) return it;
            changed = true;
            return { ...it, totalAmount: total };
          }
          return it;
        });
        return changed ? next : prev;
      });
    }, 100); // Reduced timeout for better responsiveness

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [selectedImport?.id, memoizedHeaderTotals.totalAmount, isEditMode]); // More specific dependencies

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

  // Calculate total based on edit mode to avoid double-counting
  const headerRowCount = headerRows.filter(row => row && row.values && (row.values.productName || row.values.productCode || row.values.barcode)).length;
  const rightTotal = isEditMode ? headerRowCount : filteredRightItems.length;
  const rightTotalPages = Math.max(1, Math.ceil(rightTotal / Math.max(1, rightItemsPerPage)));
  const rightStart = rightTotal === 0 ? 0 : (rightCurrentPage - 1) * rightItemsPerPage + 1;
  const rightEnd = Math.min(rightTotal, rightCurrentPage * rightItemsPerPage);
  const paginatedItems = filteredRightItems.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage);
  
  // Apply pagination to header rows for edit mode
  const paginatedHeaderRows = isEditMode 
    ? headerRows.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage)
    : headerRows;

  React.useEffect(() => {
    setRightCurrentPage(p => Math.min(p, rightTotalPages));
  }, [rightItemsPerPage, selectedImport, rightTotalPages]);

  const handleSelectImport = async (importItem) => {
    if (!importItem) return;

    // If this is a temporary client-side import (created via "Tạo mới"),
    // select it locally and open editor without server call.
    if (importItem.isTemp) {
      setSelectedImport(importItem);
      if (importItem.items && importItem.items.length > 0) {
        const productRows = importItem.items.map((item, index) => ({
          id: Date.now() + index,
          values: { ...item, warehouse: item.warehouse ? String(item.warehouse) : '' }
        }));
        productRows.push({ id: Date.now() + importItem.items.length, values: {} });
        setHeaderRows(productRows);
      } else {
        setHeaderRows([{ id: Date.now(), values: {} }]);
      }
      setShowRightContent(true);
      setIsEditMode(true);
      setIsEditing(true);
      return;
    }

    // For regular imports, open the full editor flow (same as clicking "Sửa")
    try {
      await editImport(importItem);
    } catch (err) {
      // fallback to minimal selection if edit flow fails
      setSelectedImport(importItem);
      setShowRightContent(true);
      setIsEditMode(false);
      setIsEditing(false);
      setHeaderRows([{ id: Date.now(), values: {} }]);
    }
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
  // if `autoSelectFirst` is true (default) load details of the first import automatically
  const loadImports = async (autoSelectFirst = true) => {
    try {
      const res = await fetch('/api/Imports');
      if (!res.ok) throw new Error('Failed to load imports');
      const data = await res.json();
      // normalize imports: ensure fields used by UI exist and compute totals
      const processed = (data || []).map(imp => {
        const items = imp.items || imp.Items || [];
        const total = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
        return {
          ...imp,
          importNumber: imp.importNumber || imp.receiptNumber || imp.importNumber || '',
          createdDate: imp.createdDate || (imp.date ? dayjs(imp.date).format('DD/MM/YYYY') : ''),
          date: imp.date || imp.createdDate || null,
          totalAmount: total,
          note: imp.note || imp.Note || '',
          employee: imp.employee || imp.Employee || '',
          importType: imp.importType || imp.ImportType || '',
          items: items
        };
      });
      setImports(processed);
      if (processed && processed.length > 0) {
        if (autoSelectFirst) await loadImportDetails(processed[0].id);
      } else {
        setSelectedImport(null);
      }

      // For imports that don't include totals/items in the list response,
      // fetch details for those with missing totals to compute totalAmount.
      // Limit to first 50 to avoid excessive requests.
      try {
        const idsToFetch = processed
          .filter(p => !p.totalAmount || Number(p.totalAmount) === 0)
          .slice(0, 50)
          .map(p => p.id);

        if (idsToFetch.length > 0) {
          await Promise.all(idsToFetch.map(async (id) => {
            try {
              const r = await fetch(`/api/Imports/${id}`);
              if (!r.ok) return;
              const d = await r.json();
              const items = d.items || d.Items || [];
              const total = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
              setImports(prev => (prev || []).map(it => it && it.id === id ? ({ ...it, totalAmount: total, items: items }) : it));
            } catch (e) {
              // ignore individual errors
            }
          }));
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // Silent error handling
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
      // Silent error handling
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
      // Silent error handling
      // Keep empty array as fallback
      setWarehouses([]);
    }
  };

  // Load transaction contents list from backend
  const loadTransactionContents = async () => {
    try {
      const res = await fetch('/api/TransactionContents');
      if (!res.ok) throw new Error('Failed to load transaction contents');
      const data = await res.json();
      // Filter only "Nhập" type
      const importTypes = data.filter(tc => tc.type === 'Nhập' && tc.status === 'active');
      setTransactionContents(importTypes || []);
    } catch (err) {
      // Silent error handling
      // Keep empty array as fallback
      setTransactionContents([]);
    }
  };

  // Load employees/users list from backend
  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/Users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      // map to simple name list
      const list = (data || []).map(u => ({ id: u.id || u.idUser || u.userId || u.Id, name: u.userName || u.username || u.name || u.fullName || u.displayName || u.nameDisplay || u.UserName || '' }));
      setEmployeesList(list);
    } catch (err) {
      // Silent error handling
      setEmployeesList([]);
    }
  };

  const loadImportDetails = async (id) => {
    try {
      // Simple cache buster for fresh data
      const res = await fetch(`/api/Imports/${id}?_=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load import details');
      const data = await res.json();
      // normalize to frontend shape
      const detail = {
        ...data,
        items: (data.items || data.Items || []).map(it => ({ ...it }))
      };
      // if employee missing, keep current formData.employee
      setSelectedImport(detail);
      // show right layout when loading details for edit/view
      setShowRightContent(true);
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

  // Wrapper to trigger edit (explicitly load details and show right content)
  const editImport = async (importItem) => {
    if (!importItem || !importItem.id) return;
    
    try {
      // Force fresh load from server to avoid stale data
      const res = await fetch(`/api/Imports/${importItem.id}?_=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load import details');
      const data = await res.json();
      
      // normalize to frontend shape
      const detail = {
        ...data,
        items: (data.items || data.Items || []).map(it => ({ ...it }))
      };
      
      // Update selectedImport immediately
      setSelectedImport(detail);
      
      // Update form data
      setFormData({
        importNumber: detail.importNumber || detail.ImportNumber || generateImportNumber(),
        createdDate: detail.date ? dayjs(detail.date).format('YYYY-MM-DD') : (detail.createdDate || new Date().toISOString().split('T')[0]),
        employee: detail.employee || detail.Employee || formData.employee,
        importType: detail.importType || detail.ImportType || '',
        totalWeight: detail.totalWeight || 0,
        totalVolume: detail.totalVolume || 0,
        note: detail.note || detail.Note || ''
      });
      
      // Reset pagination to first page
      setRightCurrentPage(1);
      
      // Load product data into header rows for editing using the fresh data
      if (detail.items && detail.items.length > 0) {
        const productRows = detail.items.map((item, index) => ({
        id: Date.now() + index,
        values: {
          barcode: item.barcode || '',
          productCode: item.productCode || '',
          productName: item.productName || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          conversion: item.conversion || 1,
          unitPrice: item.unitPrice || 0,
          transportCost: item.transportCost || 0,
          total: item.total || 0,
          totalTransport: item.totalTransport || 0,
          weight: item.weight || 0,
          volume: item.volume || 0,
          warehouse: item.warehouse ? String(item.warehouse) : '',
          noteDate: item.noteDate || null
        }
      }));
        
        // Add one empty row for new entries
        productRows.push({ id: Date.now() + detail.items.length, values: {} });
        
        setHeaderRows(productRows);
      } else {
        // No existing items, start with one empty row
        setHeaderRows([{ id: Date.now(), values: {} }]);
      }
      
      setItems(detail.items || []);
      setShowRightContent(true);
      setIsEditMode(true);
      setIsEditing(true);
    } catch (err) {
      console.error('Edit import error', err);
      alert('Không thể chỉnh sửa phiếu nhập');
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
      // Validation
      if (!formData.createdDate) {
        alert('Vui lòng chọn ngày lập');
        return;
      }
      if (!formData.employee) {
        alert('Vui lòng chọn nhân viên lập');
        return;
      }
      if (!formData.importType) {
        alert('Vui lòng chọn loại nhập');
        return;
      }

      // Validation
      if (!formData.createdDate) {
        alert('Vui lòng chọn ngày lập');
        return;
      }
      if (!formData.employee) {
        alert('Vui lòng chọn nhân viên lập');
        return;
      }
      if (!formData.importType) {
        alert('Vui lòng chọn loại nhập');
        return;
      }

      // In edit mode, use headerRows as the items (they are the edited items)
      // In view mode, use existing items 
      const headerRowsItems = headerRows.filter(row => {
        // Only include rows that have at least product name/code/barcode AND quantity > 0
        const hasProduct = row.values.productName?.trim() || row.values.productCode?.trim() || row.values.barcode?.trim();
        const hasQuantity = Number(row.values.quantity) > 0;
        return hasProduct && hasQuantity;
      }).map(row => ({
        barcode: row.values.barcode || '',
        productCode: row.values.productCode || '',
        productName: row.values.productName || '',
        description: row.values.description || '',
        conversion: Number(row.values.conversion) || 1,
        quantity: Number(row.values.quantity) || 1,
        unitPrice: Number(row.values.unitPrice) || 0,
        transportCost: Number(row.values.transportCost) || 0,
        noteDate: row.values.noteDate || null,
        total: Number(row.values.total) || 0,
        totalTransport: Number(row.values.totalTransport) || 0,
        weight: Number(row.values.weight) || 0,
        volume: Number(row.values.volume) || 0,
        warehouse: row.values.warehouse ? String(row.values.warehouse) : '',
        note: row.values.note || ''
      }));

      // Only use headerRows items to avoid duplication
      const allItems = headerRowsItems;

      // Validate có ít nhất 1 sản phẩm
      if (allItems.length === 0) {
        alert('Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập');
        return;
      }
      const totalAmount = allItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
      const totalWeight = allItems.reduce((s, it) => s + (Number(it.weight) || 0), 0);
      const totalVolume = allItems.reduce((s, it) => s + (Number(it.volume) || 0), 0);

      // HARDCODE HOÀN TOÀN để test - không dùng bất kỳ function nào
      let totalText = 'hai mươi nghìn đồng'; // Fixed value để test
      
      // Freeze object để không ai có thể modify
      Object.freeze(totalText);

      const payload = {
        importNumber: formData.importNumber || generateImportNumber(),
        date: formData.createdDate ? new Date(formData.createdDate).toISOString() : new Date().toISOString(),
        note: formData.note || '',
        employee: formData.employee || 'admin 66',
        importType: formData.importType,
        supplier: formData.supplier || '',
        invoice: formData.invoice || '',
        invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : new Date().toISOString(),
        total: totalAmount,
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalText: totalText,
        TotalText: totalText, // Try with capital T
        items: allItems
      };

      // Final validation only

      // VALIDATION CUỐI CÙNG
      if (totalText === null || totalText === undefined || totalText === '') {
        console.error('CRITICAL: totalText is still null/undefined/empty!');
        alert('Lỗi: Không thể tạo totalText. Vui lòng báo cáo lỗi này.');
        return;
      }

      // Check if this is an update (has existing import with ID) or create new
      const isUpdate = selectedImport && selectedImport.id && selectedImport.id > 0 && !selectedImport.isTemp;

      if (isUpdate) {
        // Ensure we have the most current data by refetching before update
        let currentImport;
        try {
          const currentRes = await fetch(`/api/Imports/${selectedImport.id}`);
          if (currentRes.ok) {
            currentImport = await currentRes.json();
          }
        } catch (e) {
          console.error('Failed to fetch current import:', e);
        }

        const res = await fetch(`/api/Imports/${selectedImport.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: selectedImport.id, 
            // Include any version/timestamp fields if they exist
            ...(currentImport || {}),
            ...payload 
          })
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('PUT Error:', errorText);
          
          // Check if it's a concurrency exception
          if (errorText.includes('DbUpdateConcurrencyException') || errorText.includes('concurrency')) {
            alert('Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang và thử lại.');
            // Refresh the page to get latest data
            window.location.reload();
            return;
          }
          
          throw new Error(`Save failed: ${errorText}`);
        }
        // Fetch updated import and update local imports list so it appears on left
        try {
          const updatedRes = await fetch(`/api/Imports/${selectedImport.id}`);
          if (updatedRes.ok) {
            const updatedImport = await updatedRes.json();
            // suppress auto-select before mutating imports state
            suppressAutoSelectRef.current = true;
            setImports(prev => (prev || []).map(i => i.id === updatedImport.id ? updatedImport : i));
          } else {
            // fallback: refresh list without auto-select
            suppressAutoSelectRef.current = true;
            await loadImports(false);
          }
        } catch (e) {
          suppressAutoSelectRef.current = true;
          await loadImports(false);
        }

        // Reset filters to ensure consistent view
        setSearchTerm('');
        setSearchCode('');
        setImportType('');
        setEmployee('');

        // Reset form to a new import state (clear right layout)
        resetFormForNewImport();

        alert('Lưu phiếu nhập thành công! Phiếu đã được cập nhật.');
      } else {
        const res = await fetch('/api/Imports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('POST Error Response:', errorText);
          
          // Parse error để xem chi tiết
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Parsed error:', errorJson);
          } catch (e) {
            console.error('Raw error text:', errorText);
          }
          
          throw new Error(`Create failed: ${errorText}`);
        }
        const newImport = await res.json();

        // Remove temporary import and add the real saved import
        suppressAutoSelectRef.current = true;
        setImports(prev => {
          try {
            // Remove temporary import if exists
            const withoutTemp = (prev || []).filter(i => !i.isTemp || i.id !== selectedImport?.id);
            // Add new saved import
            const exists = withoutTemp.some(i => i.id === newImport.id);
            if (exists) return withoutTemp;
            return [newImport, ...withoutTemp];
          } catch (e) { return [newImport]; }
        });

        // After successful save, refresh the imports list from server but do NOT auto-select
        await loadImports(false);

        // Reset filters to ensure new import is visible
        setSearchTerm('');
        setSearchCode('');
        setImportType('');
        setEmployee('');
        // Update date range to include today
        const today = new Date().toISOString().split('T')[0];
        setDateFrom('2025-01-01'); // Set broader range
        setDateTo(today);

        // Reset form to create a new import
        resetFormForNewImport();

        alert('Lưu phiếu nhập thành công! Phiếu đã được thêm vào danh sách bên trái.');
      }
    } catch (err) {
      console.error('Save import error', err);
      alert(`Lưu phiếu nhập thất bại: ${err.message}`);
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

  const deleteItem = (idx) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hàng hóa này?')) return;
    const updatedItems = items.filter((_, index) => index !== idx);
    setItems(updatedItems);
    if (selectedImport) setSelectedImport(prev => ({ ...prev, items: updatedItems }));
    setIsEditing(true);
  };

  const filteredImports = imports.filter(importItem => {
    const normalizedSearch = removeVietnameseTones((searchTerm || '').toLowerCase());
    const normalizedNumber = removeVietnameseTones((importItem.importNumber || importItem.receiptNumber || '').toLowerCase());
    const normalizedEmployee = removeVietnameseTones(((importItem.employee || importItem.Employee) || '').toLowerCase());
    const normalizedNote = removeVietnameseTones(((importItem.note || importItem.notePN || '')).toLowerCase());

    // matches search text against number, employee or note
    const matchesSearch = normalizedNumber.includes(normalizedSearch)
      || normalizedEmployee.includes(normalizedSearch)
      || normalizedNote.includes(normalizedSearch);

    // filter by exact selection of import type / employee (from dropdowns)
    const matchesType = !importType || (importItem.importType || '') === importType;
    const matchesEmployee = !employee || (importItem.employee || '') === employee;

    // support searchCode (same as before) against number
    const normalizedCode = removeVietnameseTones((searchCode || '').toLowerCase());
    const matchesCode = !searchCode || normalizedNumber.includes(normalizedCode);

    // Lọc theo khoảng ngày nhập (so sánh yyyy-mm-dd)
    let matchesDate = true;
    if (dateFrom && dateTo) {
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

  const handleAddItem = (event) => {
    // Check if Ctrl key is pressed
    if (event && (event.ctrlKey || event.metaKey)) {
      // Open in new tab
      window.open('/setup/products?openModal=true', '_blank');
    } else {
      // Navigate in current tab
      window.location.href = '/setup/products?openModal=true';
    }
  };

  const handleViewHistory = () => {
    alert('Chức năng xem lịch sử nhập hàng đang được phát triển');
  };

  const resetFormForNewImport = () => {
    const newImportNumber = generateImportNumber();
    
    // Create a temporary new import for the left list
    const newTempImport = {
      id: `temp_${Date.now()}`,
      receiptNumber: newImportNumber,
      importNumber: newImportNumber,
      importDate: dayjs().format('YYYY-MM-DD'),
      createdDate: dayjs().format('DD/MM/YYYY'),
      date: dayjs().format('YYYY-MM-DD'),
      totalAmount: 0,
      supplierName: 'Chưa chọn',
      employee: 'admin 66',
      importType: '',
      note: '',
      isTemp: true, // Mark as temporary
      items: []
    };
    
    const newFormData = {
      createdDate: dayjs().format('YYYY-MM-DD'),
      employee: 'admin 66',
      importType: '',
      importNumber: newImportNumber,
      supplier: '',
      invoice: '',
      invoiceDate: new Date().toISOString(),
      totalWeight: 0,
      totalVolume: 0,
      note: ''
    };
    

    
    // Add to imports list at the top
    setImports(prev => [newTempImport, ...prev]);
    
    // Auto-select this new import and enter edit mode
    setSelectedImport(newTempImport);
    setFormData(newFormData);
    setItems([]);
    setHeaderRows([{ id: Date.now(), values: {} }]);
    setIsEditing(true);
    setShowRightContent(true);
    setIsEditMode(true); // Auto enter edit mode for new import
    
    // Reset filters để đảm bảo có thể thấy phiếu mới
    setSearchTerm('');
    setSearchCode('');
    setImportType('');
    setEmployee('');
    

  };

  // Function này không còn sử dụng vì đã thay đổi cơ chế
  // const handleCreateNewImport = async () => { ... }

  const generateImportNumber = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    
    // Sử dụng timestamp + random để đảm bảo unique
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = timestamp + random.slice(-1); // 4 digits unique
    
    return `PN-${day}${month}${year}-${uniqueId}`;
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
        <span 
          style={{
            fontWeight: selectedImport?.id === record.id ? 600 : 400, 
            cursor:'pointer',
            fontStyle: record.isTemp ? 'italic' : 'normal',
            color: record.isTemp ? '#1677ff' : 'inherit'
          }} 
          onClick={() => handleSelectImport(record)}
        >
          {text}
          {record.isTemp && <span style={{fontSize: '11px', marginLeft: '4px'}}>(Mới)</span>}
        </span>
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
        const total = (record.totalAmount !== undefined && record.totalAmount !== null)
          ? Number(record.totalAmount)
          : (record.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        return (Number(total) || 0).toLocaleString('vi-VN');
      },
      sorter: (a, b) => {
        const ta = Number(a.totalAmount !== undefined && a.totalAmount !== null ? a.totalAmount : (a.items||[]).reduce((s,it)=>s+(Number(it.total)||0),0)) || 0;
        const tb = Number(b.totalAmount !== undefined && b.totalAmount !== null ? b.totalAmount : (b.items||[]).reduce((s,it)=>s+(Number(it.total)||0),0)) || 0;
        return ta - tb;
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
          <Button icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); editImport(record); }} title="Sửa" />
          {!record.isTemp && (
            <Popconfirm title="Bạn có chắc chắn muốn xóa phiếu nhập này?" onConfirm={e => handleDelete(record.id, e)} okText="Có" cancelText="Không">
              <Button icon={<DeleteOutlined />} danger size="small" onClick={e => e.stopPropagation()} title="Xóa" />
            </Popconfirm>
          )}
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
                  <option value="">tất cả</option>
                  {transactionContents.map(tc => (
                    <option key={tc.id} value={tc.name}>{tc.name}</option>
                  ))}
                </select>
                <select value={employee} onChange={e=>setEmployee(e.target.value)}>
                  <option value="">tất cả</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              {/* removed manual Total / Note filters - not required */}
            </div>
            <div className="search-panel-button">
              <Button type="primary" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Tìm kiếm</Button>
            </div>
          </div>
        </div>
        <div className="search-panel-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Tổng {filteredLeft.length} phiếu</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button style={{background:'transparent',border:'none',cursor:'pointer'}} title="Cài đặt bảng" onClick={()=>setShowLeftSettings(true)}>⚙</button>
          </div>
        </div>
        <div className="table-scroll-x" style={{ position: 'relative' }}>
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
            onRow={(record) => ({
              onClick: () => handleSelectImport(record),
              onContextMenu: (event) => handleTableContextMenu(event, record),
            })}
            size="small"
            rowClassName={record => {
              let className = selectedImport?.id === record.id ? 'selected' : '';
              if (record.isTemp) className += ' temp-import';
              return className;
            }}
            style={{minWidth:600}}
          />
          {contextMenu.visible && (
            <Menu
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              onClick={(info) => {
                if (info.key === 'view') {
                  if (contextMenu.record) {
                    editImport(contextMenu.record);
                  }
                } else if (info.key === 'delete') {
                  if (contextMenu.record && !contextMenu.record.isTemp) {
                    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) {
                      handleDelete(contextMenu.record.id);
                    }
                  }
                }
                setContextMenu(c => ({ ...c, visible: false }));
              }}
            >
              <Menu.Item key="view" icon={<EditOutlined />}>Xem chi tiết</Menu.Item>
              {contextMenu.record && !contextMenu.record.isTemp && (
                <Menu.Item key="delete" icon={<DeleteOutlined />} style={{ color: '#ff4d4f' }}>Xóa</Menu.Item>
              )}
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
        <div className="detail-header">
          <h2>THÔNG TIN NHẬP HÀNG</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={resetFormForNewImport}>
              + Tạo mới
            </button>
            <button className="btn btn-success" onClick={handleAddItem} title="Click để thêm hàng hóa | Ctrl+Click để mở tab mới">
              📦 Thêm hàng hóa
            </button>
            <button className="btn btn-info" onClick={handleViewHistory}>
              📋 Xem lịch sử nhập hàng
            </button>
          </div>
        </div>
        {selectedImport && showRightContent ? (
          <>

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
                          if (!isEditMode) return;
                          const v = e.target.value;
                          setFormData(fd => ({ ...fd, createdDate: v }));
                          setSelectedImport(si => si ? ({ ...si, createdDate: v }) : si);
                          setIsEditing(true);
                        }}
                        style={{width:'100%'}}
                        readOnly={!isEditMode}
                      />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                    <select style={{width:'100%'}} value={formData.employee || selectedImport.employee || ''} onChange={(e)=>{
                      if (!isEditMode) return;
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, employee: v }));
                      setSelectedImport(si => si ? ({ ...si, employee: v }) : si);
                      setIsEditing(true);
                    }} disabled={!isEditMode}>
                      <option value="">-- Chọn nhân viên --</option>
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại nhập</label>
                    <select 
                      value={formData.importType || selectedImport.importType || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, importType: v }));
                        setSelectedImport(si => si ? ({ ...si, importType: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      disabled={!isEditMode}
                    >
                      <option value="">Chọn loại nhập</option>
                      {transactionContents.map(tc => (
                        <option key={tc.id} value={tc.name}>{tc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số kg</label>
                    <input 
                      type="text" 
                      value={(() => {
                        // Get totals from current items
                        const currentItems = (items && items.length > 0) ? items : (selectedImport?.items || []);
                        const itemsTotals = calculateTotals(currentItems);
                        
                        // Use memoized header totals
                        const totalWeight = Math.round((itemsTotals.totalWeight + memoizedHeaderTotals.totalWeight) * 100) / 100;
                        return formatWeight(totalWeight);
                      })()} 
                      readOnly 
                      style={{width:'100%', background: '#f5f5f5'}} 
                    />
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số khối</label>
                    <input 
                      type="text" 
                      value={(() => {
                        // Get totals from current items
                        const currentItems = (items && items.length > 0) ? items : (selectedImport?.items || []);
                        const itemsTotals = calculateTotals(currentItems);
                        
                        // Use memoized header totals
                        const totalVolume = Math.round((itemsTotals.totalVolume + memoizedHeaderTotals.totalVolume) * 10000) / 10000;
                        return formatVolume(totalVolume);
                      })()} 
                      readOnly 
                      style={{width:'100%', background: '#f5f5f5'}} 
                    />
                  </div>
                </div>

                {/* Date picker modal for Ngày lập */}
                <Modal
                  open={showDatePickerModal}
                  onCancel={() => setShowDatePickerModal(false)}
                  title={null}
                  width={280}
                  footer={null}
                  styles={{ body: { padding: 0 } }}
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
                      <input
                        type="text"
                        value={formData.importNumber || generateImportNumber()}
                        onChange={(e) => {
                          if (!isEditMode) return;
                          setFormData(fd => ({ ...fd, importNumber: e.target.value }));
                        }}
                        style={{width:'100%'}}
                        placeholder="Tự động tạo"
                        readOnly={!isEditMode}
                      />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div style={{flex:'1 1 70%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú PN</label>
                    <input
                      type="text"
                      value={formData.note || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, note: v }));
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      placeholder="Nhập ghi chú cho phiếu nhập"
                      readOnly={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              {isEditMode && (
                <div className="items-section">

                  <div className="items-table-container" ref={itemsTableRef}>
                  <div style={{margin: '8px 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14}}>
                    <span>Tổng {rightTotal} mặt hàng ({rightStart}-{rightEnd})</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <button className="icon-btn settings-btn" onClick={()=>setShowRightSettings(true)} title="Cài đặt hiển thị cột" style={{border: 'none', background: '#333', color: 'white', borderRadius: 4, width: 28, height: 28, fontWeight: 'bold'}}>
                        <span>⚙</span>
                      </button>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                      <span style={{fontWeight: 600}}>{rightCurrentPage}</span>
                      <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))}>{'>'}</button>
                      <select value={rightItemsPerPage} onChange={(e) => { const size = parseInt(e.target.value, 10); setRightItemsPerPage(size); const newMaxPage = Math.max(1, Math.ceil(rightTotal / size)); setRightCurrentPage(p => Math.min(p, newMaxPage)); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
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
                        {rightVisibleCols.includes('barcode') && <th key="barcode" style={{textAlign: 'center'}}><span>Mã vạch</span></th>}
                        {rightVisibleCols.includes('productCode') && <th key="productCode" style={{textAlign: 'center'}}><span>Mã hàng</span></th>}
                        {rightVisibleCols.includes('productName') && <th key="productName" style={{textAlign: 'center'}}><span>Hàng hóa</span></th>}
                        {rightVisibleCols.includes('quantity') && <th key="quantity" style={{textAlign: 'center'}}><span>Số lượng</span></th>}
                        {rightVisibleCols.includes('unitPrice') && <th key="unitPrice" style={{textAlign: 'center'}}><span>Đơn giá</span></th>}
                        {rightVisibleCols.includes('transportCost') && <th key="transportCost" style={{textAlign: 'center'}}><span>Tiền vận chuyển</span></th>}
                        {rightVisibleCols.includes('noteDate') && <th key="noteDate" style={{textAlign: 'center'}}><span>Ghi chú date PN</span></th>}
                        {rightVisibleCols.includes('total') && <th key="total" style={{textAlign: 'center'}}><span>Thành tiền</span></th>}
                        {rightVisibleCols.includes('totalTransport') && <th key="totalTransport" style={{textAlign: 'center'}}><span>TT vận chuyển</span></th>}
                        {rightVisibleCols.includes('weight') && <th key="weight" style={{textAlign: 'center'}}><span>Số kg</span></th>}
                        {rightVisibleCols.includes('volume') && <th key="volume" style={{textAlign: 'center'}}><span>Số khối</span></th>}
                        {rightVisibleCols.includes('warehouse') && <th key="warehouse" style={{textAlign: 'center'}}><span>Kho hàng</span></th>}
                        {rightVisibleCols.includes('description') && <th key="description" style={{textAlign: 'center'}}><span>Mô tả</span></th>}
                        {rightVisibleCols.includes('conversion') && <th key="conversion" style={{textAlign: 'center'}}><span>Quy đổi</span></th>}
                        {rightVisibleCols.includes('actions') && (
                          <th key="actions">
                            <span>Thao tác</span>
                          </th>
                        )}
                      </tr>
                      {/* Additional header input rows inserted under the main header */}
                      {paginatedHeaderRows.map((row, rIdx) => (
                        <tr key={row.id} className="header-input-row">
                          {['barcode','productCode','productName','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','description','conversion','actions'].map(colKey => {
                            if (colKey === 'actions') {
                              if (!rightVisibleCols.includes('actions')) return null;
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                                    <button 
                                      onClick={() => {
                                        // Clear all data in this header row
                                        setHeaderRows(prev => {
                                          const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
                                          if (copy[rIdx]) {
                                            copy[rIdx].values = {}; // Clear all values
                                          }
                                          return copy;
                                        });
                                      }}
                                      style={{
                                        padding:'4px 8px',
                                        fontSize:12,
                                        backgroundColor:'#ff4d4f',
                                        color:'white',
                                        border:'none',
                                        borderRadius:'3px',
                                        cursor:'pointer'
                                      }}
                                    >
                                      Reset
                                    </button>
                                    {/* Show Xóa button for rows that have product data */}
                                    {(row.values.productName || row.values.productCode || row.values.barcode) && (
                                      <button 
                                        onClick={() => setHeaderRows(prev => prev.filter((_,i)=>i!==rIdx))} 
                                        style={{
                                          padding:'4px 8px',
                                          fontSize:12,
                                          backgroundColor:'#6c757d',
                                          color:'white',
                                          border:'none',
                                          borderRadius:'3px',
                                          cursor:'pointer'
                                        }}
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            // Product-related columns
                            if (['productCode','productName','barcode'].includes(colKey)) {
                              if (!rightVisibleCols.includes(colKey)) return null;
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  {colKey === 'productName' ? (
                                        <button
                                      onClick={() => {

                                        setProductModalColumn(colKey);
                                        setProductModalRowIndex(rIdx);  // This is key - set the row index
                                        setProductModalSearch('');
                                        setModalCurrentPage(1);
                                        setSelectedModalProducts(row.values[colKey] ? [row.values[colKey]] : []);
                                        setShowProductModal(true);
                                      }}
                                      style={{
                                        width: '100%',
                                        minWidth: 120,
                                        padding: '4px 8px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        background: '#fff',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      {row.values[colKey] || `-- Chọn ${colKey} --`}
                                    </button>
                                  ) : (
                                    <Select
                                      value={row.values[colKey] || undefined}
                                      onChange={(val) => handleHeaderRowProductSelect(rIdx, colKey, val)}
                                      placeholder={`-- Chọn ${colKey} --`}
                                      size="small"
                                      showSearch
                                      allowClear
                                      style={{ width: '100%', minWidth: 200 }}
                                      popupStyle={{ 
                                        maxHeight: 400, 
                                        overflow: 'auto',
                                        zIndex: 9999
                                      }}
                                      popupMatchSelectWidth={false}
                                      classNames={{ popup: { root: 'product-select-dropdown' } }}
                                      optionLabelProp={colKey === 'productName' ? 'children' : 'label'}
                                      filterOption={(input, option) => {
                                        const p = products.find(pp => pp.id.toString() === option.value);
                                        if (!p) return false;
                                        const txt = `${p.code||''} ${p.name||''} ${p.barcode||''}`.toLowerCase();
                                        return txt.includes((input||'').toLowerCase());
                                      }}
                                    >
                                      {products.map(p => (
                                        <Select.Option 
                                          key={p.id} 
                                          value={p.id.toString()}
                                          label={colKey === 'productName' ? p.name : getProductOptionLabel(p)}
                                        >
                                          {colKey === 'productName' ? (
                                            <div style={{fontSize:12, fontWeight:600}}>{getProductOptionLabel(p)}</div>
                                          ) : (
                                            <div style={{fontSize:12, fontWeight:600}}>{getProductOptionLabel(p)}</div>
                                          )}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  )}
                                </td>
                              );
                            }

                            if (colKey === 'warehouse') {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  <Select
                                      value={row.values[colKey] ? String(row.values[colKey]) : undefined}
                                      onChange={(val) => handleHeaderRowChange(rIdx, colKey, val ? String(val) : null)}
                                      placeholder="-- Chọn kho --"
                                      size="small"
                                      allowClear
                                      style={{ width: '100%', minWidth: 120 }}
                                    >
                                      {warehouses.map(w => (
                                        <Select.Option key={w.id} value={String(w.id)}>{w.name}</Select.Option>
                                      ))}
                                    </Select>
                                </td>
                              );
                            }

                            if (colKey === 'noteDate') {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  <DatePicker
                                    value={row.values[colKey] ? dayjs(row.values[colKey]) : null}
                                    onChange={(d) => handleHeaderRowChange(rIdx, colKey, d ? d.format('YYYY-MM-DD') : null)}
                                    format="DD/MM/YYYY"
                                    placeholder="Chọn ngày"
                                    size="small"
                                    style={{ width: '100%', minWidth: 180 }}
                                    showToday={true}
                                    allowClear={true}
                                    picker="date"
                                    changeOnBlur={false}
                                    open={undefined}
                                    inputReadOnly={false}
                                    classNames={{ popup: { root: 'calendar-dropdown' } }}
                                  />
                                </td>
                              );
                            }

                            // Default: text / numeric inputs
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <Input
                                  value={(() => {
                                    const rawValue = row.values[colKey] || '';
                                    if (rawValue === '') return '';
                                    
                                    // For currency fields - show formatted only when not editing
                                    if (['unitPrice', 'transportCost'].includes(colKey)) {
                                      // For user input fields, show with minimal formatting to allow easy editing
                                      const numValue = parseFloat(rawValue) || 0;
                                      return numValue === 0 ? '' : formatCurrency(numValue);
                                    }
                                    // For calculated fields (total, totalTransport) - always show formatted
                                    if (['total', 'totalTransport'].includes(colKey)) {
                                      return formatInputDisplay(rawValue, 'currency');
                                    }
                                    // Format weight fields  
                                    if (colKey === 'weight') {
                                      return formatInputDisplay(rawValue, 'weight');
                                    }
                                    // Format volume fields
                                    if (colKey === 'volume') {
                                      return formatInputDisplay(rawValue, 'volume');
                                    }
                                    // Default - return as is
                                    return rawValue;
                                  })()}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    
                                    // For currency fields, allow user to type freely but parse for calculation
                                    if (['unitPrice', 'transportCost', 'total', 'totalTransport'].includes(colKey)) {
                                      // Allow only digits and comma
                                      const sanitizedValue = inputValue.replace(/[^0-9,]/g, '');
                                      // Store the raw value (without formatting) for calculation
                                      const rawValue = sanitizedValue.replace(/,/g, '');
                                      handleHeaderRowChange(rIdx, colKey, rawValue);
                                    } else {
                                      handleHeaderRowChange(rIdx, colKey, inputValue);
                                    }
                                  }}
                                  size="small"
                                  style={{ width: '100%', minWidth: 100 }}
                                  readOnly={['total', 'totalTransport'].includes(colKey)}
                                  placeholder={['total', 'totalTransport'].includes(colKey) ? 'Tự động tính' : ''}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </thead>
                    {(() => {
                      const hasHeaderProducts = headerRows.some(r => r && r.values && (r.values.productName || r.values.productCode || r.values.barcode));
                      const hasItems = (items && items.length > 0) || ((selectedImport && selectedImport.items && selectedImport.items.length > 0));
                      if (!hasHeaderProducts && !hasItems) {
                        return (
                          <tbody>
                            <tr>
                              <td colSpan={rightVisibleCols.length || 1} className="no-data">
                                <div className="empty-state">
                                  <div className="empty-icon">📋</div>
                                  <div>Nhập sản phẩm ở các ô phía trên</div>
                                  <div style={{fontSize: 12, color: '#666', marginTop: 4}}>Sử dụng các dropdown và input để thêm/sửa sản phẩm</div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        );
                      }
                      return null;
                    })()}
                  </table>
                </div>

                <div className="table-summary">
                  <span>Tổng tiền: <strong>{(() => {
                    if (isEditMode) {
                      // In edit mode, use memoized header totals
                      return formatCurrency(memoizedHeaderTotals.totalAmount);
                    } else {
                      // In view mode, only count existing items
                      const currentItems = (items && items.length > 0) ? items : (selectedImport?.items || []);
                      const itemsTotal = currentItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
                      return formatCurrency(itemsTotal);
                    }
                  })()}</strong> ({(() => {
                    if (isEditMode) {
                      return numberToVietnameseText(memoizedHeaderTotals.totalAmount);
                    } else {
                      const currentItems = (items && items.length > 0) ? items : (selectedImport?.items || []);
                      const itemsTotal = currentItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
                      return numberToVietnameseText(itemsTotal);
                    }
                  })()})</span>
                </div>
                </div>
              )}

              {/* Right-side column settings modal */}
              <Modal
                open={showRightSettings}
                onCancel={()=>setShowRightSettings(false)}
                title="Cài đặt cột bảng hàng hóa"
                footer={null}
              >
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {defaultRightCols.map(colKey=>{
                    const label = colKey==='barcode'?'Mã vạch':colKey==='productCode'?'Mã hàng':colKey==='productName'?'Hàng hóa':colKey==='description'?'Mô tả':colKey==='conversion'?'Quy đổi':colKey==='quantity'?'Số lượng':colKey==='unitPrice'?'Đơn giá':colKey==='transportCost'?'Tiền vận chuyển':colKey==='noteDate'?'Ghi chú date PN':colKey==='total'?'Thành tiền':colKey==='totalTransport'?'Thành tiền vận chuyển':colKey==='weight'?'Số kg':colKey==='volume'?'Số khối':colKey==='warehouse'?'Kho hàng':colKey==='actions'?'Thao tác':colKey;
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
                {isEditMode && (
                  <button className="btn btn-info" onClick={saveImport} disabled={!isEditing}>
                    📁 Lưu lại
                  </button>
                )}
                <button className="btn btn-purple" onClick={handlePrint}>
                  🖨 In A4
                </button>
                <button className="btn btn-success" onClick={handleExport}>
                  📤 Xuất Excel
                </button>
              </div>
            </div>
          </>
        ) : selectedImport && !showRightContent ? (
          <div style={{padding:20, color:'#777'}}>Chọn phiếu bên trái rồi bấm <strong>Sửa</strong> để xem hoặc chỉnh sửa chi tiết ở bên phải.</div>
        ) : (
          // Default view for new import - show form and table
          <div className="detail-content">
            <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Top row: Ngày lập, Nhân viên, Loại nhập, Tổng số kg, Tổng số khối (each 20%) */}
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                    <input
                      type="date"
                      value={formData.createdDate || dayjs().format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData(fd => ({ ...fd, createdDate: v }));
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                    />
                </div>
                <div style={{flex:'0 0 20%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Nhân viên lập</label>
                  <select 
                    value={formData.employee || 'admin 66'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, employee: v }));
                      setIsEditing(true);
                    }}
                    style={{width:'100%'}}
                  >
                    <option value="admin 66">admin 66</option>
                    <option value="user 01">user 01</option>
                  </select>
                </div>
                <div style={{flex:'0 0 20%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại nhập</label>
                  <select 
                    value={formData.importType || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, importType: v }));
                      setIsEditing(true);
                    }}
                    style={{width:'100%'}}
                  >
                    <option value="">Chọn loại nhập</option>
                    {transactionContents.map(tc => (
                      <option key={tc.id} value={tc.name}>{tc.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{flex:'0 0 20%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số kg</label>
                  <input 
                    type="text" 
                    value={(() => {
                      const headerTotals = headerRows.filter(row => row.values.productName || row.values.productCode || row.values.barcode)
                        .reduce((sum, row) => {
                          const weight = parseFloat(row.values.weight) || 0;
                          return Math.round((sum + weight) * 100) / 100;
                        }, 0);
                      return formatWeight(headerTotals);
                    })()} 
                    readOnly 
                    style={{width:'100%', background: '#f5f5f5'}} 
                  />
                </div>
                <div style={{flex:'0 0 20%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}>Tổng số khối</label>
                  <input 
                    type="text" 
                    value={(() => {
                      const headerTotals = headerRows.filter(row => row.values.productName || row.values.productCode || row.values.barcode)
                        .reduce((sum, row) => {
                          const volume = parseFloat(row.values.volume) || 0;
                          return Math.round((sum + volume) * 10000) / 10000;
                        }, 0);
                      return formatVolume(headerTotals);
                    })()} 
                    readOnly 
                    style={{width:'100%', background: '#f5f5f5'}} 
                  />
                </div>
              </div>

              {/* Second row: Số phiếu (30%) and Ghi chú (70%) */}
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{flex:'0 0 30%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số phiếu</label>
                  <div className="input-with-status">
                    <input
                      type="text"
                      value={formData.importNumber || generateImportNumber()}
                      onChange={(e) => setFormData(fd => ({ ...fd, importNumber: e.target.value }))}
                      style={{width:'100%'}}
                      placeholder="Tự động tạo" 
                    />
                    <span className="status-icon">✓</span>
                  </div>
                </div>
                <div style={{flex:'1 1 70%'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú PN</label>
                  <input
                    type="text"
                    value={formData.note || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(fd => ({ ...fd, note: v }));
                      setIsEditing(true);
                    }}
                    style={{width:'100%'}}
                    placeholder="Nhập ghi chú cho phiếu nhập"
                  />
                </div>
              </div>
            </div>

            <div className="items-section">
              <div className="items-table-container" ref={itemsTableRef}>
                <div style={{margin: '8px 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14}}>
                  <span>Tổng {rightTotal} mặt hàng ({rightStart}-{rightEnd})</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <button className="icon-btn settings-btn" onClick={()=>setShowRightSettings(true)} title="Cài đặt hiển thị cột" style={{border: 'none', background: '#333', color: 'white', borderRadius: 4, width: 28, height: 28, fontWeight: 'bold'}}>
                      <span>⚙</span>
                    </button>
                    <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                    <span style={{fontWeight: 600}}>{rightCurrentPage}</span>
                    <button style={{border: 'none', background: '#f0f0f0', borderRadius: 4, width: 28, height: 28}} onClick={() => setRightCurrentPage(p => Math.min(rightTotalPages, p + 1))}>{'>'}</button>
                    <select value={rightItemsPerPage} onChange={(e) => { const size = parseInt(e.target.value, 10); setRightItemsPerPage(size); const newMaxPage = Math.max(1, Math.ceil(rightTotal / size)); setRightCurrentPage(p => Math.min(p, newMaxPage)); }} style={{marginLeft: 8, borderRadius: 4, border: '1px solid #e5e7eb', padding: '2px 8px'}}>
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
                      {rightVisibleCols.includes('barcode') && <th key="barcode" style={{textAlign: 'center'}}><span>Mã vạch</span></th>}
                      {rightVisibleCols.includes('productCode') && <th key="productCode" style={{textAlign: 'center'}}><span>Mã hàng</span></th>}
                      {rightVisibleCols.includes('productName') && <th key="productName" style={{textAlign: 'center'}}><span>Hàng hóa</span></th>}
                      {rightVisibleCols.includes('quantity') && <th key="quantity" style={{textAlign: 'center'}}><span>Số lượng</span></th>}
                      {rightVisibleCols.includes('unitPrice') && <th key="unitPrice" style={{textAlign: 'center'}}><span>Đơn giá</span></th>}
                      {rightVisibleCols.includes('transportCost') && <th key="transportCost" style={{textAlign: 'center'}}><span>Tiền vận chuyển</span></th>}
                      {rightVisibleCols.includes('noteDate') && <th key="noteDate" style={{textAlign: 'center'}}><span>Ghi chú date PN</span></th>}
                      {rightVisibleCols.includes('total') && <th key="total" style={{textAlign: 'center'}}><span>Thành tiền</span></th>}
                      {rightVisibleCols.includes('totalTransport') && <th key="totalTransport" style={{textAlign: 'center'}}><span>TT vận chuyển</span></th>}
                      {rightVisibleCols.includes('weight') && <th key="weight" style={{textAlign: 'center'}}><span>Số kg</span></th>}
                      {rightVisibleCols.includes('volume') && <th key="volume" style={{textAlign: 'center'}}><span>Số khối</span></th>}
                      {rightVisibleCols.includes('warehouse') && <th key="warehouse" style={{textAlign: 'center'}}><span>Kho hàng</span></th>}
                      {rightVisibleCols.includes('description') && <th key="description" style={{textAlign: 'center'}}><span>Mô tả</span></th>}
                      {rightVisibleCols.includes('conversion') && <th key="conversion" style={{textAlign: 'center'}}><span>Quy đổi</span></th>}
                      {rightVisibleCols.includes('actions') && (
                        <th key="actions">
                          <span>Thao tác</span>
                        </th>
                      )}
                    </tr>
                    {/* Header input rows for new entries */}
                    {paginatedHeaderRows.map((row, rIdx) => (
                      <tr key={row.id} className="header-input-row">
                        {['barcode','productCode','productName','quantity','unitPrice','transportCost','noteDate','total','totalTransport','weight','volume','warehouse','description','conversion','actions'].map(colKey => {
                          if (colKey === 'actions') {
                            if (!rightVisibleCols.includes('actions')) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                                  <button 
                                    onClick={() => {
                                      setHeaderRows(prev => {
                                        const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
                                        if (copy[rIdx]) {
                                          copy[rIdx].values = {};
                                        }
                                        return copy;
                                      });
                                    }}
                                    style={{
                                      padding:'4px 8px',
                                      fontSize:12,
                                      backgroundColor:'#ff4d4f',
                                      color:'white',
                                      border:'none',
                                      borderRadius:'3px',
                                      cursor:'pointer'
                                    }}
                                  >
                                    Reset
                                  </button>
                                  {/* Show Xóa button for rows that have product data */}
                                  {(row.values.productName || row.values.productCode || row.values.barcode) && (
                                    <button 
                                      onClick={() => setHeaderRows(prev => prev.filter((_,i)=>i!==rIdx))} 
                                      style={{
                                        padding:'4px 8px',
                                        fontSize:12,
                                        backgroundColor:'#6c757d',
                                        color:'white',
                                        border:'none',
                                        borderRadius:'3px',
                                        cursor:'pointer'
                                      }}
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          if (['productCode','productName','barcode'].includes(colKey)) {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                {colKey === 'productName' ? (
                                  <button
                                    onClick={() => {
                                      setProductModalColumn(colKey);
                                      setProductModalRowIndex(rIdx);
                                      setProductModalSearch('');
                                      setModalCurrentPage(1);
                                      setSelectedModalProducts(row.values[colKey] ? [row.values[colKey]] : []);
                                      setShowProductModal(true);
                                    }}
                                    style={{
                                      width: '100%',
                                      minWidth: 120,
                                      padding: '4px 8px',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '4px',
                                      background: '#fff',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    {row.values[colKey] || `-- Chọn ${colKey} --`}
                                  </button>
                                ) : (
                                  <Select
                                    value={row.values[colKey] || undefined}
                                    onChange={(val) => handleHeaderRowProductSelect(rIdx, colKey, val)}
                                    placeholder={`-- Chọn ${colKey} --`}
                                    size="small"
                                    showSearch
                                    allowClear
                                    style={{ width: '100%', minWidth: 200 }}
                                    popupStyle={{ 
                                      maxHeight: 400, 
                                      overflow: 'auto',
                                      zIndex: 9999
                                    }}
                                    popupMatchSelectWidth={false}
                                    classNames={{ popup: { root: 'product-select-dropdown' } }}
                                    optionLabelProp={colKey === 'productName' ? 'children' : 'label'}
                                    filterOption={(input, option) => {
                                      const p = products.find(pp => pp.id.toString() === option.value);
                                      if (!p) return false;
                                      const txt = `${p.code||''} ${p.name||''} ${p.barcode||''}`.toLowerCase();
                                      return txt.includes((input||'').toLowerCase());
                                    }}
                                  >
                                    {products.map(p => (
                                      <Select.Option 
                                        key={p.id} 
                                        value={p.id.toString()}
                                        label={colKey === 'productName' ? p.name : getProductOptionLabel(p)}
                                      >
                                        {colKey === 'productName' ? (
                                          <div style={{fontSize:12, fontWeight:600}}>{getProductOptionLabel(p)}</div>
                                        ) : (
                                          <div style={{fontSize:12, fontWeight:600}}>{getProductOptionLabel(p)}</div>
                                        )}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                )}
                              </td>
                            );
                          }

                          if (colKey === 'warehouse') {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <Select
                                  value={row.values[colKey] ? String(row.values[colKey]) : undefined}
                                  onChange={(val) => handleHeaderRowChange(rIdx, colKey, val ? String(val) : null)}
                                  placeholder="-- Chọn kho --"
                                  size="small"
                                  allowClear
                                  style={{ width: '100%', minWidth: 120 }}
                                >
                                  {warehouses.map(w => (
                                    <Select.Option key={w.id} value={String(w.id)}>{w.name}</Select.Option>
                                  ))}
                                </Select>
                              </td>
                            );
                          }

                          if (colKey === 'noteDate') {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <DatePicker
                                  value={row.values[colKey] ? dayjs(row.values[colKey]) : null}
                                  onChange={(d) => handleHeaderRowChange(rIdx, colKey, d ? d.format('YYYY-MM-DD') : null)}
                                  format="DD/MM/YYYY"
                                  placeholder="Chọn ngày"
                                  size="small"
                                  style={{ width: '100%', minWidth: 180 }}
                                  showToday={true}
                                  allowClear={true}
                                  picker="date"
                                />
                              </td>
                            );
                          }

                          if (!rightVisibleCols.includes(colKey)) return null;
                          return (
                            <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                              <Input
                                value={(() => {
                                  const rawValue = row.values[colKey] || '';
                                  if (rawValue === '') return '';
                                  
                                  if (['unitPrice', 'transportCost'].includes(colKey)) {
                                    const numValue = parseFloat(rawValue) || 0;
                                    return numValue === 0 ? '' : formatCurrency(numValue);
                                  }
                                  if (['total', 'totalTransport'].includes(colKey)) {
                                    return formatInputDisplay(rawValue, 'currency');
                                  }
                                  if (colKey === 'weight') {
                                    return formatInputDisplay(rawValue, 'weight');
                                  }
                                  if (colKey === 'volume') {
                                    return formatInputDisplay(rawValue, 'volume');
                                  }
                                  return rawValue;
                                })()}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  
                                  // For currency fields, allow user to type freely but parse for calculation
                                  if (['unitPrice', 'transportCost', 'total', 'totalTransport'].includes(colKey)) {
                                    // Allow only digits and comma
                                    const sanitizedValue = inputValue.replace(/[^0-9,]/g, '');
                                    // Store the raw value (without formatting) for calculation
                                    const rawValue = sanitizedValue.replace(/,/g, '');
                                    handleHeaderRowChange(rIdx, colKey, rawValue);
                                  } else {
                                    handleHeaderRowChange(rIdx, colKey, inputValue);
                                  }
                                }}
                                size="small"
                                style={{ width: '100%', minWidth: 100 }}
                                readOnly={['total', 'totalTransport'].includes(colKey)}
                                placeholder={['total', 'totalTransport'].includes(colKey) ? 'Tự động tính' : ''}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  {(() => {
                    const hasHeaderProducts = headerRows.some(r => r && r.values && (r.values.productName || r.values.productCode || r.values.barcode));
                    const hasItems = (items && items.length > 0) || ((selectedImport && selectedImport.items && selectedImport.items.length > 0));
                    if (!hasHeaderProducts && !hasItems) {
                      return (
                        <tbody>
                          <tr>
                            <td colSpan={rightVisibleCols.length || 1} className="no-data">
                              <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div>Chưa có hàng hóa nào</div>
                                <div style={{fontSize: 12, color: '#666', marginTop: 4}}>Nhấn "Thêm hàng hóa" hoặc chọn sản phẩm từ các ô input phía trên</div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      );
                    }
                    return null;
                  })()}
                </table>
              </div>

              <div className="table-summary">
                <span>Tổng tiền: <strong>{formatCurrency(memoizedHeaderTotals.totalAmount)}</strong> ({numberToVietnameseText(memoizedHeaderTotals.totalAmount)})</span>
              </div>
            </div>

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
              <div style={{marginBottom: 16}}>
                <strong>Thông tin phiếu nhập:</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px'}}>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Số phiếu
                    </label>
                    <input
                      type="text"
                      value={formData.importNumber || generateImportNumber()}
                      onChange={(e) => setFormData(prev => ({...prev, importNumber: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Ngày lập
                    </label>
                    <input
                      type="date"
                      value={formData.createdDate}
                      onChange={(e) => setFormData(prev => ({...prev, createdDate: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Nhân viên lập
                    </label>
                    <select
                      value={formData.employee}
                      onChange={(e) => setFormData(prev => ({...prev, employee: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      <option value="admin 66">admin 66</option>
                      <option value="user 01">user 01</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>
                      <span style={{color: 'red', marginRight: 4}}>*</span>Loại nhập
                    </label>
                    <select
                      value={formData.importType}
                      onChange={(e) => setFormData(prev => ({...prev, importType: e.target.value}))}
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    >
                      <option value="">-- Chọn loại nhập --</option>
                      {transactionContents.map(tc => (
                        <option key={tc.id} value={tc.name}>{tc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{gridColumn: '1 / 3'}}>
                    <label style={{display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4}}>Ghi chú</label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))}
                      placeholder="Nhập ghi chú cho phiếu nhập"
                      style={{width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{marginBottom: 16}}>
                <strong>Sản phẩm đã chọn:</strong>
                <div style={{maxHeight: 200, overflowY: 'auto'}}>
                  {memoizedHeaderTotals.validRows.map((row, idx) => {
                    const total = parseFloat(row.values.total) || 0;
                    return (
                      <div key={idx} style={{padding: '8px 0', borderBottom: '1px solid #eee'}}>
                        <div>{row.values.productName || row.values.productCode || row.values.barcode}</div>
                        <div style={{fontSize: 12, color: '#666'}}>
                          Số lượng: {row.values.quantity || 1} | 
                          Đơn giá: {formatCurrency(row.values.unitPrice || 0)} | 
                          Thành tiền: {formatCurrency(total)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div style={{marginBottom: 16}}>
                <strong>Tổng tiền: {formatCurrency(memoizedHeaderTotals.totalAmount)} VNĐ ({numberToVietnameseText(memoizedHeaderTotals.totalAmount)})</strong>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Hủy
              </button>
              <button onClick={handleCreateNewImport} className="btn btn-primary">
                Tạo phiếu nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      <Modal
        open={showProductModal}
        onCancel={() => setShowProductModal(false)}
        title="Chọn hàng hóa"
        width={800}
        footer={[
          <button key="clear" onClick={() => {
            setSelectedModalProducts([]);
            setProductModalSearch('');
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Bỏ chọn tất cả</button>,
          <button key="all" onClick={() => {
            const filteredProducts = memoizedFilteredProducts;
            const startIndex = (modalCurrentPage - 1) * modalPageSize;
            const currentPageProducts = filteredProducts.slice(startIndex, startIndex + modalPageSize);

            setSelectedModalProducts(prev => {
              const currentIds = currentPageProducts.map(p => p.id.toString());
              const merged = new Set([...(prev || []), ...currentIds]);
              return Array.from(merged);
            });
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Chọn tất cả</button>,
          <button key="ok" onClick={() => {
            if (selectedModalProducts.length > 0) {
              // Handle multiple product selection
              if (productModalRowIndex !== null && productModalRowIndex >= 0) {
                // For header input rows - update with multiple products
                setHeaderRows(prev => {
                  const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
                  
                  // Update the current row with first selected product
                  const firstProductId = selectedModalProducts[0];
                  const firstProduct = products.find(p => p.id.toString() === firstProductId);
                  
                  if (copy[productModalRowIndex] && firstProduct) {
                    copy[productModalRowIndex].values[productModalColumn] = firstProduct?.name || '';
                    copy[productModalRowIndex].values['productCode'] = firstProduct.code || '';
                    copy[productModalRowIndex].values['productName'] = firstProduct.name || '';
                    copy[productModalRowIndex].values['barcode'] = firstProduct.barcode || '';
                    copy[productModalRowIndex].values['description'] = firstProduct.description || '';
                    copy[productModalRowIndex].values['conversion'] = firstProduct.conversion1 || 1;
                    copy[productModalRowIndex].values['unitPrice'] = firstProduct.importPrice || 0;
                    copy[productModalRowIndex].values['weight'] = firstProduct.weight || 0;
                    copy[productModalRowIndex].values['volume'] = firstProduct.volume || 0;
                    
                    // Auto-calculate initial totals
                    const quantity = parseFloat(copy[productModalRowIndex].values.quantity) || 1;
                    const unitPrice = parseFloat(firstProduct.importPrice) || 0;
                    const transportCost = parseFloat(copy[productModalRowIndex].values.transportCost) || 0;
                    
                    copy[productModalRowIndex].values.total = (quantity * unitPrice).toString();
                    copy[productModalRowIndex].values.totalTransport = (quantity * transportCost).toString();
                  }
                  
                  // Add new rows for remaining selected products
                  selectedModalProducts.slice(1).forEach(productId => {
                    const product = products.find(p => p.id.toString() === productId);
                    if (product) {
                      const newRow = { id: Date.now() + Math.random(), values: {} };
                      newRow.values[productModalColumn] = product.name || '';
                      newRow.values['productCode'] = product.code || '';
                      newRow.values['productName'] = product.name || '';
                      newRow.values['barcode'] = product.barcode || '';
                      newRow.values['description'] = product.description || '';
                      newRow.values['conversion'] = product.conversion1 || 1;
                      newRow.values['unitPrice'] = product.importPrice || 0;
                      newRow.values['weight'] = product.weight || 0;
                      newRow.values['volume'] = product.volume || 0;
                      newRow.values['quantity'] = 1;
                      
                      // Auto-calculate initial totals
                      const quantity = 1;
                      const unitPrice = parseFloat(product.importPrice) || 0;
                      const transportCost = 0;
                      
                      newRow.values.total = (quantity * unitPrice).toString();
                      newRow.values.totalTransport = (quantity * transportCost).toString();
                      
                      copy.push(newRow);
                    }
                  });
                  
                  // Always add one more blank row at the end
                  copy.push({ id: Date.now() + Math.random(), values: {} });
                  
                  return copy;
                });
              } else {
                // For main header dropdown - trigger the full product selection logic for first product only
                const firstProductId = selectedModalProducts[0];
                handleProductSelect(productModalColumn, firstProductId);
              }
            }
            setShowProductModal(false);
          }} style={{padding: '6px 16px', border: 'none', borderRadius: '4px', background: '#1677ff', color: '#fff'}}>Thêm vào PN</button>
        ]}
      >
        
        <div style={{marginBottom: 16}}>
          <Input
            placeholder="Tìm tên hàng hóa"
            value={productModalSearch}
            onChange={(e) => {
              setProductModalSearch(e.target.value);
              setModalCurrentPage(1); // Reset to page 1 when searching
            }}
            style={{width: '100%'}}
          />
        </div>
        
        {/* Pagination controls */}
        <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{fontSize: 13}}>Hiển thị:</span>
            <Select
              value={modalPageSize}
              onChange={(value) => {
                setModalPageSize(value);
                setModalCurrentPage(1);
              }}
              size="small"
              style={{width: 80}}
            >
              {[10, 20, 50, 100, 200, 500, 1000, 2000, 5000].map(size => (
                <Select.Option key={size} value={size}>{size}</Select.Option>
              ))}
            </Select>
          </div>
          
          
          
          <div style={{display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#f0f8ff', borderRadius: '4px', border: '1px solid #d1ecf1'}}>
            <span style={{fontSize: 13, color: '#0c5460', fontWeight: 500}}>
              Bạn đã chọn: <strong>{selectedModalProducts.length}</strong> sản phẩm
            </span>
          </div>
        </div>
        
        <div style={{maxHeight: 400, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px'}}>
          {(() => {
            const filteredProducts = memoizedFilteredProducts;
            const startIndex = (modalCurrentPage - 1) * modalPageSize;
            const currentPageProducts = filteredProducts.slice(startIndex, startIndex + modalPageSize);
            
            return currentPageProducts.map(product => (
              <div key={product.id} style={{padding: '8px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8}}>
                <input
                  type="checkbox"
                  checked={selectedModalProducts.includes(product.id.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedModalProducts(prev => [...prev, product.id.toString()]); // Allow multiple selection
                    } else {
                      setSelectedModalProducts(prev => prev.filter(id => id !== product.id.toString()));
                    }
                  }}
                />
                <span style={{fontSize: 13}}>{getProductOptionLabel(product)}</span>
              </div>
            ))
          })()
          }
        </div>
        
        {/* Pagination navigation */}
        {(() => {
          const filteredProducts = memoizedFilteredProducts;
          const totalPages = Math.ceil(filteredProducts.length / modalPageSize);

          if (totalPages <= 1) return null;

          return (
            <div style={{marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8}}>
              <button
                onClick={() => {
                  setModalCurrentPage(prev => Math.max(1, prev - 1));
                }}
                disabled={modalCurrentPage === 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: modalCurrentPage === 1 ? '#f5f5f5' : '#fff',
                  cursor: modalCurrentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Trước
              </button>
              
              <span style={{fontSize: 13}}>Trang {modalCurrentPage} / {totalPages}</span>
              
              <button
                onClick={() => {
                  setModalCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                disabled={modalCurrentPage === totalPages}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: modalCurrentPage === totalPages ? '#f5f5f5' : '#fff',
                  cursor: modalCurrentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau
              </button>
              
              <span style={{fontSize: 12, color: '#666', marginLeft: 8}}>({filteredProducts.length} sản phẩm)</span>
            </div>
          );
        })()
        }
      </Modal>
    </div>
  );
};

export default ImportGoods;
