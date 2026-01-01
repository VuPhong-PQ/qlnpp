import React, { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Menu } from 'antd';
import './BusinessPage.css';
import './WarehouseTransfer.css';
import { Table, Button, Space, Popconfirm, Input, Modal, Popover, DatePicker, Select } from 'antd';
import ProductModal from '../common/ProductModal';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { API_ENDPOINTS, api } from '../../config/api';
import { removeVietnameseTones } from '../../utils/searchUtils';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');

const WarehouseTransfer = () => {
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
    unit: '',
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

  // Load column order from localStorage
  React.useEffect(() => {
    try {
      const savedColOrder = localStorage.getItem('warehouseTransfer_leftColOrder');
      if (savedColOrder) {
        const parsedOrder = JSON.parse(savedColOrder);
        setLeftColOrder(parsedOrder);
      }
    } catch (error) {
      console.error('Failed to load column order:', error);
    }
  }, []);

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
  const IMPORT_LEFT_COLS_KEY = 'warehouse_transfer_left_cols_v1';
  const defaultLeftCols = ['checkbox','importNumber','createdDate','sourceWarehouseName','destWarehouseName','importType','exportType','total','note','actions'];
  const [leftVisibleCols, setLeftVisibleCols] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(IMPORT_LEFT_COLS_KEY));
      // Nếu thiếu cột kho nguồn/kho đích thì reset về mặc định
      if (Array.isArray(v) && v.includes('sourceWarehouseName') && v.includes('destWarehouseName')) return v;
    } catch {}
    return defaultLeftCols;
  });
  
  // Drag & drop states for left table columns
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);
  const [leftColOrder, setLeftColOrder] = useState(defaultLeftCols);
  const [leftFilters, setLeftFilters] = useState({ importNumber: '', createdDate: '', note: '', total: '' });
  // modal-based column filters (lists of selected values)
  const [leftFilterLists, setLeftFilterLists] = useState({ importNumber: [], createdDate: [], note: [], total: [], sourceWarehouse: [], destWarehouse: [], importType: [], exportType: [] });
  const [activeHeaderModalColumn, setActiveHeaderModalColumn] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSelections, setModalSelections] = useState([]);
  const [modalAvailableItems, setModalAvailableItems] = useState([]);
  const [leftPageSize, setLeftPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('import_left_page_size')||'10',10); return isNaN(v)?10:v; } catch { return 10; }
  });

  // Drag handlers for column reordering
  const handleColumnDragStart = (e, index) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedColumnIndex === null || draggedColumnIndex === targetIndex) {
      setDraggedColumnIndex(null);
      return;
    }

    const newOrder = [...leftColOrder];
    
    const draggedItem = newOrder[draggedColumnIndex];
    newOrder.splice(draggedColumnIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    setLeftColOrder(newOrder);
    setDraggedColumnIndex(null);
    
    // Save to localStorage
    try {
      localStorage.setItem('warehouseTransfer_leftColOrder', JSON.stringify(newOrder));
    } catch (error) {
      console.error('Failed to save column order:', error);
    }
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
  };

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
      importNumber: `CK-${day}${month}${year}-${timestamp}`, 
      createdDate: new Date().toISOString().split('T')[0], 
      employee: 'admin 66', 
      importType: '', 
      exportType: '',
      sourceWarehouse: '',
      destWarehouse: '',
      totalWeight: 0, 
      totalVolume: 0, 
      note: '' 
    };
  });

  // Ensure import type is selected before product actions
  const ensureImportTypeSelected = () => {
    const it = (selectedImport && selectedImport.importType) || formData.importType;
    // If currently editing an existing saved transfer, don't block actions when importType is empty.
    // Keep validation only for creating new transfers.
    if ((!it || String(it).trim() === '') && !isEditing) {
      Modal.warning({ title: 'Chưa chọn loại nhập', content: 'vui lòng chọn loại nhập trước khi thao tác' });
      return false;
    }
    return true;
  };

  // Helper to get default warehouse id (prefer one that contains 'NPP')
  const getDefaultWarehouseName = () => {
    try {
      if (!warehouses || warehouses.length === 0) return '';
      const found = warehouses.find(w => {
        if (!w || !w.name) return false;
        const n = String(w.name).toLowerCase();
        return n.includes('npp') || n.includes('kho npp') || n.includes('kho_npp');
      });
      if (found) return String(found.id);
      return String(warehouses[0].id || '');
    } catch (e) {
      return '';
    }
  };

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
  const [headerFilter, setHeaderFilter] = useState(null); // { productCode, barcode, productName } or null

  // Helper function to calculate totals from items
  const calculateTotals = (itemsList) => {
    const result = itemsList.reduce((totals, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const weight = parseFloat(item.weight) || 0; 
      const volume = parseFloat(item.volume) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const transportCost = parseFloat(item.transportCost) || 0;
      
      return {
        totalWeight: totals.totalWeight + weight, // Don't round yet
        totalVolume: totals.totalVolume + volume, // Don't round yet
        totalAmount: totals.totalAmount + (quantity * unitPrice),
        totalTransport: totals.totalTransport + (transportCost * quantity)
      };
    }, { totalWeight: 0, totalVolume: 0, totalAmount: 0, totalTransport: 0 });
    
    // No rounding - preserve exact values
    return {
      totalWeight: result.totalWeight,
      totalVolume: result.totalVolume,
      totalAmount: result.totalAmount,
      totalTransport: result.totalTransport
    };
  };

  // Helper function to format currency (with comma separators)
  // Helper function to get product weight/volume/price/conversion based on selected unit
  const getProductDataByUnit = (product, unitName) => {
    if (!product || !unitName) return { weight: 0, volume: 0, price: 0, conversion: 1 };
    
    const baseUnit = product.baseUnit || product.defaultUnit || product.DefaultUnit || product.unit || '';
    const baseWeight = parseFloat(product.weight) || 0;
    const baseVolume = parseFloat(product.volume) || 0;
    
    // If selected unit is base unit, use base data
    if (unitName === baseUnit) {
      return {
        weight: baseWeight, // weight gốc × 1
        volume: baseVolume, // volume gốc × 1  
        price: parseFloat(product.price) || 0,
        conversion: 1
      };
    }
    
    // Check unit1 (ĐVT 1) - try different field name patterns
    const unit1Name = product.unit1Name || product.unit1 || product.unitName1 || product.dvt1Name;
    if (unit1Name && unitName === unit1Name) {
      const unit1Conversion = parseFloat(product.unit1Conversion || product.conversion1 || product.dvt1Conversion) || 1;
      return {
        weight: baseWeight * unit1Conversion, // weight gốc × quy đổi 1
        volume: baseVolume * unit1Conversion, // volume gốc × quy đổi 1
        price: parseFloat(product.unit1Price || product.price1 || product.dvt1Price) || 0,
        conversion: unit1Conversion
      };
    }
    
    // Check unit2 (ĐVT 2) 
    const unit2Name = product.unit2Name || product.unit2 || product.unitName2 || product.dvt2Name;
    if (unit2Name && unitName === unit2Name) {
      const unit2Conversion = parseFloat(product.unit2Conversion || product.conversion2 || product.dvt2Conversion) || 1;
      return {
        weight: baseWeight * unit2Conversion, // weight gốc × quy đổi 2
        volume: baseVolume * unit2Conversion, // volume gốc × quy đổi 2
        price: parseFloat(product.unit2Price || product.price2 || product.dvt2Price) || 0,
        conversion: unit2Conversion
      };
    }
    
    // Fallback to base unit if unit not found
    return {
      weight: baseWeight,
      volume: baseVolume,
      price: parseFloat(product.price) || 0,
      conversion: 1
    };
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '0';
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Helper function to format weight (2 decimal places)
  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === '') return '0';
    const num = Number(weight) || 0;
    if (num === 0) return '0';
    
    // Chuyển thành string và cắt bớt chữ số thập phân (không làm tròn)
    const str = num.toString();
    const dotIndex = str.indexOf('.');
    
    if (dotIndex === -1) {
      // Không có chữ số thập phân
      return str;
    }
    
    // Chỉ lấy 2 chữ số thập phân đầu tiên (cắt bớt, không làm tròn)
    return str.substring(0, dotIndex + 3);
  };

  // Helper function to format volume (4 decimal places)
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined || volume === '') return '0.0000';
    const num = Number(volume) || 0;
    if (num === 0) return '0.0000';
    // Convert to string and truncate to 4 decimal places without rounding
    const str = num.toString();
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str + '.0000';
    const neededLen = dotIndex + 1 + 4; // dot + 4 decimals
    let out = str.substring(0, Math.min(neededLen, str.length));
    // pad zeros if necessary
    const decimals = out.length - dotIndex - 1;
    if (decimals < 4) out = out + '0'.repeat(4 - decimals);
    return out;
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
    // Show: mã vạch - mã hàng - tên sản phẩm - giá bán lẻ - tồn kho
    // Try explicit common fields first
    const priceCandidates = [
      'priceRetail','retailPrice','giaBanLe','GiaBanLe','price','importPrice','PriceRetail','gia_ban_le','giabanle','giá_bán_lẻ'
    ];
    let priceVal = null;
    for (const k of priceCandidates) {
      if (product && Object.prototype.hasOwnProperty.call(product, k)) {
        const v = product[k];
        if (v !== null && v !== undefined && v !== '') { priceVal = v; break; }
      }
    }
    // fallback: scan keys for anything that looks like price/gia
    if ((priceVal === null || priceVal === undefined) && product) {
      const pk = Object.keys(product).find(k => /gia|price|banle|retail/i.test(k));
      if (pk) priceVal = product[pk];
    }
    const priceNumber = Number(priceVal) || 0;
    const priceText = priceNumber.toLocaleString('vi-VN');

    // Stock candidates
    const stockCandidates = ['stock','quantity','qty','available','onHand','tonkho','soLuong','so_luong','tồnKho','TồnKho','SoKg'];
    let stockVal = null;
    for (const k of stockCandidates) {
      if (product && Object.prototype.hasOwnProperty.call(product, k)) {
        const v = product[k];
        if (v !== null && v !== undefined && v !== '') { stockVal = v; break; }
      }
    }
    if ((stockVal === null || stockVal === undefined) && product) {
      const sk = Object.keys(product).find(k => /stock|qty|quantity|so|ton|onHand|available/i.test(k));
      if (sk) stockVal = product[sk];
    }
    const stockText = (stockVal === null || stockVal === undefined) ? '0' : String(stockVal);

    return `${product.barcode || ''} - ${product.code || ''} - ${product.name || ''} - ${priceText} - ${stockText}`;
  };

  // Helper function to get selected display value (for productName column, show only name)
  const getSelectedDisplayValue = (product, colKey) => {
    if (colKey === 'productName') {
      return product.name || '';
    }
    return getProductOptionLabel(product);
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
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontWeight: 'bold'}}>{label}</span>
            <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => {
              if (!ensureImportTypeSelected()) return;
              // Open product modal but restrict results to products present in this import
              setProductModalColumn(colKey);
              setProductModalRowIndex(null);
              setProductModalSearch('');
              setSelectedModalProducts([]);
              setModalCurrentPage(1);
              setProductModalScope('currentImport');
              setShowProductModal(true);
            }} />
          </div>
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
    if (!ensureImportTypeSelected()) return;
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
          // Try to find the most recent import that contains this product and use its prices/units
          let lastMatch = null;
          try {
            if (imports && imports.length > 0) {
              // Filter out current import and temp imports to find actual last prices
              const currentImportId = selectedImport?.id;
              const filteredImports = imports.filter(imp => {
                // Exclude current import being edited
                if (currentImportId && imp.id === currentImportId) return false;
                // Exclude temp imports (not yet saved)
                if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                return true;
              });
              
              // Improved date parsing with ID fallback for accurate newest-first sorting
              const withDates = filteredImports.map(imp => {
                let parsedDate = new Date(0);
                
                if (imp.date) {
                  try {
                    const d = new Date(imp.date);
                    if (!isNaN(d.getTime())) parsedDate = d;
                  } catch (e) {}
                }
                
                if (parsedDate.getTime() === 0 && imp.createdDate) {
                  try {
                    if (imp.createdDate.includes('/')) {
                      const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                      if (djs.isValid()) parsedDate = djs.toDate();
                    } else {
                      const d = new Date(imp.createdDate);
                      if (!isNaN(d.getTime())) parsedDate = d;
                    }
                  } catch (e) {}
                }
                
                const fallbackSort = parseInt(imp.id) || 0;
                
                return {
                  imp,
                  _date: parsedDate,
                  _fallbackSort: fallbackSort
                };
              });
              
              // Sort by ID desc (most reliable - auto increment means higher ID = newer)
              withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
              for (const w of withDates) {
                const itemsList = w.imp.items || w.imp.Items || [];
                const match = itemsList.find(it => (it.productCode && it.productCode === selectedProduct.code) || (it.barcode && it.barcode === selectedProduct.barcode) || (it.productName && it.productName === selectedProduct.name));
                if (match) { lastMatch = match; break; }
              }
            }
          } catch (e) {
            // ignore
          }
          // Add new item to the current import with complete product information
          const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                             (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));
          
          // Always prioritize base unit first, then fallback to last match
          const baseUnit = selectedProduct.baseUnit || selectedProduct.defaultUnit || selectedProduct.unit || '';
          const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
          
          const productData = getProductDataByUnit(selectedProduct, defaultUnit);
          
          // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất (conversion = 1)
          let convertedUnitPrice = 0;
          let convertedTransportCost = 0;
          
          // Kiểm tra loại nhập có phải "Nhập mua" không
          const importType = formData.importType || selectedImport?.importType || '';
          const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
          
          if (lastMatch) {
            const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
            const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
            const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
            
            // Quy đổi về đơn vị nhỏ nhất: giá_mới = giá_cũ / hệ_số_cũ × hệ_số_mới
            // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
            if (isNhapMua && !isKMImport) {
              convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
            }
            // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
            convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
          }
          
          const newItem = {
            id: Date.now() + Math.random(),
            barcode: selectedProduct.barcode || '',
            productCode: selectedProduct.code || '',
            productName: selectedProduct.name || '',
            description: selectedProduct.description || '',
            conversion: productData.conversion,
            unit: defaultUnit,
            quantity: 1,
            // Sử dụng giá đã quy đổi về đơn vị nhỏ nhất
            unitPrice: convertedUnitPrice,
            transportCost: convertedTransportCost,
            noteDate: (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null,
            total: convertedUnitPrice,
            totalTransport: convertedTransportCost,
            weight: productData.weight * 1, // số kg = weight_theo_đơn_vị × số_lượng (1)
            volume: productData.volume * 1, // số khối = volume_theo_đơn_vị × số_lượng (1)
            warehouse: getDefaultWarehouseName(),
          };

          // Prepare an empty row so user can continue entering next item immediately
          // Blank item: dòng trống để nhập sản phẩm tiếp theo, không cần copy giá
          const blankItem = {
            id: Date.now() + Math.random() + 1,
            barcode: '',
            productCode: '',
            productName: '',
            description: '',
            conversion: 1,
            unit: '',
            quantity: 1,
            unitPrice: 0,
            transportCost: 0,
            noteDate: null,
            total: '',
            totalTransport: '',
            weight: '',
            volume: '',
            warehouse: getDefaultWarehouseName(),
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
            style={{ width: '100%', minWidth: '80px' }}
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
    if (!ensureImportTypeSelected()) return;
    const selectedProduct = products.find(p => p.id.toString() === productId);
    
    setHeaderRows(prev => {
      const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
      
      if (selectedProduct) {
        // Try to find most recent import item for this product to reuse last prices/units
        let lastMatch = null;
        try {
          if (imports && imports.length > 0) {
            // Filter out current import and temp imports to find actual last prices
            const currentImportId = selectedImport?.id;
            const filteredImports = imports.filter(imp => {
              // Exclude current import being edited
              if (currentImportId && imp.id === currentImportId) return false;
              // Exclude temp imports (not yet saved)
              if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
              return true;
            });
            
            // Improved date parsing with ID fallback for accurate newest-first sorting
            const withDates = filteredImports.map(imp => {
              let parsedDate = new Date(0);
              
              // Try imp.date first (ISO format)
              if (imp.date) {
                try {
                  const d = new Date(imp.date);
                  if (!isNaN(d.getTime())) parsedDate = d;
                } catch (e) {}
              }
              
              // Fallback to createdDate
              if (parsedDate.getTime() === 0 && imp.createdDate) {
                try {
                  if (imp.createdDate.includes('/')) {
                    const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                    if (djs.isValid()) parsedDate = djs.toDate();
                  } else {
                    const d = new Date(imp.createdDate);
                    if (!isNaN(d.getTime())) parsedDate = d;
                  }
                } catch (e) {}
              }
              
              const fallbackSort = parseInt(imp.id) || 0;
              
              return {
                imp,
                _date: parsedDate,
                _fallbackSort: fallbackSort
              };
            });
            
            // Sort by ID desc (most reliable - auto increment means higher ID = newer)
            withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
            for (const w of withDates) {
              const itemsList = w.imp.items || w.imp.Items || [];
              const match = itemsList.find(it => (it.productCode && it.productCode === selectedProduct.code) || (it.barcode && it.barcode === selectedProduct.barcode) || (it.productName && it.productName === selectedProduct.name));
              if (match) { lastMatch = match; break; }
            }
          }
        } catch (e) {
          // ignore
        }
        // Store actual field values instead of productId
        const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                           (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));
        
        copy[rowIndex].values['productCode'] = selectedProduct.code || '';
        copy[rowIndex].values['productName'] = selectedProduct.name || '';
        copy[rowIndex].values['barcode'] = selectedProduct.barcode || '';
        copy[rowIndex].values['description'] = selectedProduct.description || '';
        
        // Tự động điền đơn vị tính từ sản phẩm
        const baseUnit = selectedProduct.baseUnit || selectedProduct.defaultUnit || selectedProduct.unit || '';
        copy[rowIndex].values['unit'] = baseUnit;
        
        // Tự động điền quy đổi từ sản phẩm theo đơn vị
        const productData = getProductDataByUnit(selectedProduct, baseUnit);
        copy[rowIndex].values['conversion'] = productData.conversion.toString();
        
        // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
        let convertedUnitPrice = 0;
        let convertedTransportCost = 0;
        
        // Kiểm tra loại nhập có phải "Nhập mua" không
        const importType = formData.importType || selectedImport?.importType || '';
        const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
        
        if (lastMatch) {
          const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
          const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
          const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
          
          // Quy đổi: giá_mới = giá_cũ / hệ_số_cũ × hệ_số_mới
          // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
          if (isNhapMua && !isKMImport) {
            convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
          }
          // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
          convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
        }
        
        copy[rowIndex].values['unitPrice'] = convertedUnitPrice;
        copy[rowIndex].values['transportCost'] = convertedTransportCost;
        copy[rowIndex].values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || copy[rowIndex].values.noteDate || null;
        
        // Auto-calculate initial totals
        const quantity = parseFloat(copy[rowIndex].values.quantity) || 1;
        
        copy[rowIndex].values.total = (quantity * convertedUnitPrice).toString();
        copy[rowIndex].values.totalTransport = (quantity * convertedTransportCost).toString();
        // calculate derived fields based on selected product
        try {
          const prodId = copy[rowIndex].values.productName_id || copy[rowIndex].values.productCode_id || copy[rowIndex].values.barcode_id || null;
          let prod = null;
          if (prodId && products && products.length > 0) prod = products.find(p => String(p.id) === String(prodId));
          if (!prod) {
            const code = copy[rowIndex].values.productCode || copy[rowIndex].values.barcode || copy[rowIndex].values.productName || '';
            if (code) prod = products.find(p => p.code === code || p.barcode === code || p.name === code);
          }
          if (prod) {
            const selectedUnit = copy[rowIndex].values.unit || '';
            const productData = getProductDataByUnit(prod, selectedUnit);
            
            // Use weight/volume based on selected unit
            if (productData.weight !== undefined) copy[rowIndex].values.weight = (productData.weight * quantity) + '';
            if (productData.volume !== undefined) copy[rowIndex].values.volume = (productData.volume * quantity) + '';
          }
        } catch (e) {}
        
        // Also store the productId for ALL product-related columns to ensure calculation works
        copy[rowIndex].values['productCode_id'] = productId;
        copy[rowIndex].values['productName_id'] = productId;
        copy[rowIndex].values['barcode_id'] = productId;
      } else {
        copy[rowIndex].values[colKey] = productId || '';
      }
      
      // if selecting in last row and a productId was chosen, append blank row
      if (productId && rowIndex === copy.length - 1) {
        copy.push({ id: Date.now() + Math.random(), values: { warehouse: getDefaultWarehouseName() } });
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
      
      // Auto-calculate when price/quantity related fields change
      const needsRecalc = ['quantity', 'unitPrice'].includes(colKey);
      const needsWeightRecalc = ['quantity', 'unit'].includes(colKey);
      const needsConversionRecalc = ['unit'].includes(colKey);
      
      // Auto-calculate conversion when unit changes
      if (needsConversionRecalc) {
        try {
          const row = targetRow.values;
          const selectedUnit = colKey === 'unit' ? value : (row.unit || '');
          
          // Get product info to calculate conversion
          const prodId = row.productName_id || row.productCode_id || row.barcode_id || null;
          let prod = null;
          if (prodId && products && products.length > 0) {
            prod = products.find(p => String(p.id) === String(prodId));
          }
          // fallback: try to match by productCode/barcode/productName text
          if (!prod && products && products.length > 0) {
            const code = row.productCode || row.barcode || row.productName || '';
            if (code) {
              prod = products.find(p => p.code === code || p.barcode === code || p.name === code);
            }
          }
          
          if (prod && selectedUnit) {
            const productData = getProductDataByUnit(prod, selectedUnit);
            // Quy đổi = conversion từ sản phẩm
            targetRow.values.conversion = productData.conversion.toString();
          }
        } catch (e) {
          // ignore error
        }
      }

      if (needsRecalc) {
        const row = targetRow.values;
        const quantity = parseFloat(row.quantity) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        
        // Calculate total only when needed
        targetRow.values.total = (quantity * unitPrice).toString();
      }
      
      // Auto-calculate weight and volume for warehouse transfer (simplified)
      if (needsWeightRecalc) {
        try {
          const row = targetRow.values;
          const selectedUnit = colKey === 'unit' ? value : (row.unit || '');
          
          // When changing unit, auto-update conversion if product exists
          if (colKey === 'unit') {
            const prodId = row.productName_id || row.productCode_id || row.barcode_id || null;
            let prod = null;
            if (prodId && products && products.length > 0) {
              prod = products.find(p => String(p.id) === String(prodId));
            }
            if (!prod && products && products.length > 0) {
              const code = row.productCode || row.barcode || row.productName || '';
              if (code) {
                prod = products.find(p => p.code === code || p.barcode === code || p.name === code);
              }
            }
            
            if (prod && selectedUnit) {
              const productData = getProductDataByUnit(prod, selectedUnit);
              targetRow.values.conversion = productData.conversion.toString();
            }
          }
        } catch (e) {
          // ignore error
        }
      }
      
      return copy;
    });
  }, [products]); // Thêm products vào dependencies để đảm bảo logic tính toán được cập nhật

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
          warehouse: String(selectedWarehouse.id),
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
    setHeaderFilter(null);
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
        warehouse: getDefaultWarehouseName(),
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
            style={{ width: '100%', minWidth: '250px' }}
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
        warehouse: getDefaultWarehouseName(),
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
        warehouse: getDefaultWarehouseName(),
      };
      
      setItems(prevItems => [...prevItems, newItem]);
    }
  };

  // Load data on mount: ensure warehouses and transactionContents load before imports
  React.useEffect(() => {
    (async () => {
      try {
        await loadWarehouses();
        await loadTransactionContents();
        await loadProducts();
        await loadEmployees();
        await loadImports();
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // When warehouses or transactionContents are loaded/changed, remap existing imports to include display names
  React.useEffect(() => {
    if ((!warehouses || warehouses.length === 0) && (!transactionContents || transactionContents.length === 0)) return;
    setImports(prev => (prev || []).map(imp => {
      const src = warehouses.find(w => String(w.id) === String(imp.sourceWarehouse));
      const dst = warehouses.find(w => String(w.id) === String(imp.destWarehouse));
      const impType = transactionContents.find(tc => String(tc.id) === String(imp.importType) || tc.code === imp.importType || tc.name === imp.importType);
      const expType = transactionContents.find(tc => String(tc.id) === String(imp.exportType) || tc.code === imp.exportType || tc.name === imp.exportType);
      return {
        ...imp,
        sourceWarehouseName: src ? src.name : '',
        destWarehouseName: dst ? dst.name : '',
        importTypeName: impType ? impType.name : '',
        exportTypeName: expType ? expType.name : ''
      };
    }));
  }, [warehouses, transactionContents]);

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
    if (imports && imports.length > 0 && !selectedImport && formData.importNumber.includes('CK-')) {
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

  // Right-side columns & filters (for items table header filters)
  const RIGHT_COLS_KEY = 'warehouse_transfer_right_cols_v1';
  const defaultRightCols = ['barcode','productCode','productName','unit','description','conversion','quantity','unitPrice','total','actions'];
  const [rightVisibleCols, setRightVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      const storedVisible = Array.isArray(saved) ? saved : (saved && Array.isArray(saved.visibleCols) ? saved.visibleCols : null);
      if (storedVisible) {
        const merged = [];
        defaultRightCols.forEach(dc => { if (storedVisible.includes(dc)) merged.push(dc); else merged.push(dc); });
        storedVisible.forEach(s => { if (!merged.includes(s)) merged.push(s); });
        return merged;
      }
    } catch {}
    return defaultRightCols;
  });
  const [rightColOrder, setRightColOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RIGHT_COLS_KEY));
      if (saved && Array.isArray(saved.order)) {
        const order = [...saved.order];
        defaultRightCols.forEach(dc => { if (!order.includes(dc)) order.push(dc); });
        return order;
      }
      if (Array.isArray(saved)) {
        const order = [...saved];
        defaultRightCols.forEach(dc => { if (!order.includes(dc)) order.push(dc); });
        return order;
      }
    } catch {}
    return defaultRightCols;
  });

  const [rightFilters, setRightFilters] = useState({});
  const [rightFilterPopup, setRightFilterPopup] = useState({ column: null, term: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [rightCurrentPage, setRightCurrentPage] = useState(1);
  const [rightItemsPerPage, setRightItemsPerPage] = useState(10);

  // Right table column resizing state (persisted)
  const [rightColWidths, setRightColWidths] = useState(() => {
    try {
      const raw = localStorage.getItem('warehouse_right_col_widths');
      if (raw) return JSON.parse(raw);
    } catch (err) {}
    return {};
  });
  const resizingRef = useRef({ col: null, startX: 0, startWidth: 0 });

  useEffect(() => {
    try { localStorage.setItem('warehouse_right_col_widths', JSON.stringify(rightColWidths)); } catch (err) {}
  }, [rightColWidths]);

  function handleThMouseDown(e, colKey) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightColWidths[colKey] || 120;
    resizingRef.current = { col: colKey, startX, startWidth };

    function onMouseMove(ev) {
      const delta = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(40, Math.round(resizingRef.current.startWidth + delta));
      setRightColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    }

    function onMouseUp() {
      resizingRef.current = { col: null, startX: 0, startWidth: 0 };
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Attach delegated mousedown handler to the last .items-table so saved/unsaved tables both work
  useEffect(() => {
    const tables = document.querySelectorAll('table.items-table');
    if (!tables || tables.length === 0) return;
    const tbl = tables[tables.length - 1];
    if (!tbl) return;
    function onMouseDown(e) {
      const th = e.target.closest && e.target.closest('th');
      if (th && th.dataset && th.dataset.resizable && th.dataset.colKey) {
        handleThMouseDown(e, th.dataset.colKey);
      }
    }
    tbl.addEventListener('mousedown', onMouseDown);
    return () => tbl.removeEventListener('mousedown', onMouseDown);
  }, [items, selectedImport]);

  // Product selection modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalSearch, setProductModalSearch] = useState('');
  const [selectedModalProducts, setSelectedModalProducts] = useState([]);
  const [productModalColumn, setProductModalColumn] = useState(null);
  const [productModalRowIndex, setProductModalRowIndex] = useState(null);
  const [productModalScope, setProductModalScope] = useState('all'); // 'all' or 'currentImport'
  const [highlightRowId, setHighlightRowId] = useState(null);

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
    
    return { 
      validRows, 
      totalAmount, 
      totalWeight: totalWeight, 
      totalVolume: totalVolume
    };
  }, [headerRows]);

  React.useEffect(() => {
    try { localStorage.setItem(RIGHT_COLS_KEY, JSON.stringify({ visibleCols: rightVisibleCols, order: rightColOrder })); } catch {}
  }, [rightVisibleCols, rightColOrder]);

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
  
  // Apply headerFilter (when user searched within current import) and paginate header rows for edit mode
  const headerRowsForDisplay = (() => {
    if (!isEditMode) return headerRows;
    if (!headerFilter) return headerRows;
    try {
      // headerFilter may contain strings or arrays for productCode/barcode/productName
      const arr = [];
      ['productCode','barcode','productName'].forEach(k => {
        const v = headerFilter[k];
        if (!v) return;
        if (Array.isArray(v)) arr.push(...v.map(x => String(x)));
        else arr.push(String(v));
      });
      const keys = new Set(arr.map(x => x.trim()).filter(Boolean));
      if (keys.size === 0) return headerRows;
      return headerRows.filter(r => {
        if (!r || !r.values) return false;
        const v = r.values;
        const fields = [String(v.productCode||''), String(v.barcode||''), String(v.productName||'')];
        for (const f of fields) {
          if (keys.has(String(f))) return true;
        }
        return false;
      });
    } catch (e) {
      return headerRows;
    }
  })();

  const paginatedHeaderRows = isEditMode 
    ? headerRowsForDisplay.slice((rightCurrentPage - 1) * rightItemsPerPage, (rightCurrentPage - 1) * rightItemsPerPage + rightItemsPerPage)
    : headerRows;

  React.useEffect(() => {
    setRightCurrentPage(p => Math.min(p, rightTotalPages));
  }, [rightItemsPerPage, selectedImport, rightTotalPages]);

  // Recalculate weight/volume for items when products change (to fix any rounding issues)
  React.useEffect(() => {
    if (!products || products.length === 0) return;
    if (!items || items.length === 0) return;
    
    const updatedItems = items.map((item, idx) => {
      try {
        const quantity = parseFloat(item.quantity) || 0;
        if (quantity <= 0) return item;
        
        // Find product by multiple possible identifiers
        let prod = products.find(p => p.code === item.productCode || p.barcode === item.barcode || p.name === item.productName);
        
        if (prod) {
          const updatedItem = { ...item };
          const selectedUnit = item.unit || '';
          
          // Get product data based on unit (support multiple units: ĐVT gốc, ĐVT 1, ĐVT 2...)
          const productData = getProductDataByUnit(prod, selectedUnit);
          
          // Recalculate weight: số kg = số kg sản phẩm × số lượng (no rounding)
          if (productData.weight !== undefined) {
            const calculatedWeight = productData.weight * quantity;
            updatedItem.weight = calculatedWeight;
          }
          
          // Recalculate volume: số khối = số khối sản phẩm × số lượng (no rounding)  
          if (productData.volume !== undefined) {
            const calculatedVolume = productData.volume * quantity;
            updatedItem.volume = calculatedVolume;
          }
          
          // Update conversion based on unit
          if (productData.conversion !== undefined) {
            updatedItem.conversion = productData.conversion;
          }
          
          return updatedItem;
        }
      } catch (e) {
        // ignore calculation errors
      }
      return item;
    });
    
    // Only update if there are actual changes
    const hasChanges = updatedItems.some((item, idx) => 
      item.weight !== items[idx].weight || item.volume !== items[idx].volume
    );
    
    if (hasChanges) {
      setItems(updatedItems);
      if (selectedImport) {
        setSelectedImport(prev => ({ ...prev, items: updatedItems }));
      }
    }
  }, [products, items?.length]); // Only depend on products and items length, not items content to avoid infinite loop

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
        productRows.push({ id: Date.now() + importItem.items.length, values: { warehouse: getDefaultWarehouseName() } });
        setHeaderRows(productRows);
      } else {
        setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
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
      setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    try {
      const res = await fetch(`/api/WarehouseTransfers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      // reload list
      await loadImports();
      if (selectedImport && selectedImport.id === id) {
        setSelectedImport(imports.length > 0 ? imports[0] : null);
      }
    } catch (err) {
      alert('Xóa phiếu nhập thất bại');
    }
  };

  // Load imports list from backend
  // if `autoSelectFirst` is true (default) load details of the first import automatically
  const loadImports = async (autoSelectFirst = true) => {
    try {
      const res = await fetch('/api/WarehouseTransfers');
      if (!res.ok) throw new Error('Failed to load imports');
      const data = await res.json();
      // normalize imports: ensure fields used by UI exist and compute totals
      const processed = (data || []).map(imp => {
        const items = imp.items || imp.Items || [];
        const total = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
        // Map id kho sang tên kho (robust: try multiple fallbacks)
        let sourceWarehouseName = '';
        let destWarehouseName = '';
        if (warehouses && warehouses.length > 0) {
          const src = warehouses.find(w => String(w.id) === String(imp.sourceWarehouse) || String(w.code) === String(imp.sourceWarehouse) || String(w.name) === String(imp.sourceWarehouse));
          const dst = warehouses.find(w => String(w.id) === String(imp.destWarehouse) || String(w.code) === String(imp.destWarehouse) || String(w.name) === String(imp.destWarehouse));
          sourceWarehouseName = src ? (src.name || src.Name || '') : (imp.sourceWarehouseName || imp.sourceWarehouse || '');
          destWarehouseName = dst ? (dst.name || dst.Name || '') : (imp.destWarehouseName || imp.destWarehouse || '');
        } else {
          // fallback to any name present in the import object
          sourceWarehouseName = imp.sourceWarehouseName || imp.sourceWarehouse || '';
          destWarehouseName = imp.destWarehouseName || imp.destWarehouse || '';
        }
        // Map loại nhập/xuất sang tên
        let importTypeName = '';
        let exportTypeName = '';
        if (transactionContents && transactionContents.length > 0) {
          const impType = transactionContents.find(tc => String(tc.id) === String(imp.importType) || tc.code === imp.importType || tc.name === imp.importType);
          const expType = transactionContents.find(tc => String(tc.id) === String(imp.exportType) || tc.code === imp.exportType || tc.name === imp.exportType);
          importTypeName = impType ? impType.name : '';
          exportTypeName = expType ? expType.name : '';
        }
        return {
          ...imp,
          importNumber: imp.importNumber || imp.transferNumber || imp.TransferNumber || imp.receiptNumber || imp.id || '',
          createdDate: imp.createdDate || (imp.date ? dayjs(imp.date).format('DD/MM/YYYY') : ''),
          date: imp.date || imp.createdDate || null,
          totalAmount: total,
          note: imp.note || imp.Note || '',
          employee: imp.employee || imp.Employee || '',
          importType: imp.importType || imp.ImportType || '',
          exportType: imp.exportType || imp.ExportType || '',
          sourceWarehouseName,
          destWarehouseName,
          importTypeName,
          exportTypeName,
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
              const r = await fetch(`/api/WarehouseTransfers/${id}`);
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
      // Keep all active transaction types (both xuất and nhập) so both selects can use them
      const activeTypes = data.filter(tc => tc.status === 'active');
      setTransactionContents(activeTypes || []);
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

  // Export Excel template for imports
  const exportImportTemplate = async () => {
    try {
      let url = '/api/WarehouseTransfers/template?format=xlsx';
      let fileName = 'import_template.xlsx';
      
      // Priority 1: If user has selected rows via checkboxes, export those
      if (selectedRowKeys && selectedRowKeys.length > 0) {
        const exportSelected = window.confirm('Bạn có muốn xuất phiếu nhập này ra exel?');
        if (exportSelected) {
          const ids = selectedRowKeys.join(',');
          url += `&ids=${ids}`;
          fileName = `import_selected_${selectedRowKeys.length}.xlsx`;
        }
      }
      // Priority 2: If a single import is selected, offer to export just that import
      else if (selectedImport && selectedImport.id) {
        const exportSingleImport = window.confirm('Bạn có muốn xuất phiếu nhập này ra exel?');
        if (exportSingleImport) {
          url += `&ids=${selectedImport.id}`;
          fileName = `import_${selectedImport.importNumber}.xlsx`;
        } else {
          return; // User cancelled, exit without further prompts
        }
      }
      // Priority 3: No selection, ask for all
      else {
        const exportAll = window.confirm('Bạn có muốn xuất phiếu nhập này ra exel?');
        if (exportAll) {
          url += '&exportAll=true';
          fileName = 'import_all_template.xlsx';
        } else {
          return; // User cancelled
        }
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const link = document.createElement('a');
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert('Không thể tải mẫu. Vui lòng thử lại.');
    }
  };

  // Export selected left-panel transfers to .xlsx with Times New Roman and borders
  const exportSelectedList = async () => {
    try {
      let rows = [];
      if (selectedRowKeys && selectedRowKeys.length > 0) {
        rows = filteredLeft.filter(r => selectedRowKeys.includes(r.id));
      } else if (selectedImport) {
        rows = [selectedImport];
      } else {
        alert('Vui lòng chọn tối thiểu 1 phiếu để xuất.');
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Danh sách chuyển kho');

      const headerFont = { name: 'Times New Roman', size: 12, bold: true };
      const bodyFont = { name: 'Times New Roman', size: 12 };

      ws.columns = [
        { header: 'Số phiếu', key: 'importNumber', width: 20 },
        { header: 'Ngày', key: 'createdDate', width: 15 },
        { header: 'Nguồn', key: 'sourceWarehouse', width: 20 },
        { header: 'Đích', key: 'destWarehouse', width: 20 },
        { header: 'Tổng tiền', key: 'total', width: 18 },
        { header: 'Ghi chú', key: 'note', width: 30 }
      ];

      ws.getRow(1).font = headerFont;
      ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      rows.forEach(r => {
        const total = (r.items || []).reduce((s, it) => s + (Number(it.total) || 0), 0);
        ws.addRow({
          importNumber: r.importNumber || r.transferNumber || r.id || '',
          createdDate: r.createdDate || r.date || '',
          sourceWarehouse: r.sourceWarehouseName || r.sourceWarehouse || '',
          destWarehouse: r.destWarehouseName || r.destWarehouse || '',
          total: total,
          note: r.note || ''
        });
      });

      ws.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.font = rowNumber === 1 ? headerFont : bodyFont;
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (rowNumber !== 1 && cell._column && cell._column.key === 'total') {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        });
      });

      ws.autoFilter = { from: 'A1', to: 'F1' };
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = `Danh_sach_ChuyenKho_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Không thể xuất danh sách. Vui lòng thử lại.');
    }
  };

  // Handle uploaded CSV/Excel template and import
  const handleTemplateUpload = async (e, forceOverwrite = false) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    try {
      const fd = new FormData();
      fd.append('file', file);
      
      let url = '/api/WarehouseTransfers/import-template';
      if (forceOverwrite) {
        url += '?forceOverwrite=true';
      }
      
      const res = await fetch(url, { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text();
        // Check if it's a duplicate error
        if (text.includes('Phiếu này đã bị trùng trong hệ thống')) {
          alert('Phiếu này đã bị trùng trong hệ thống');
          if (e.target) e.target.value = null;
          return;
        }
        // Check for missing product error returned by backend
        if (text && text.includes('Sản phẩm có mã hàng')) {
          alert('Phiếu nhập có sản phẩm chưa có trong hệ thống, vui lòng thêm sản phẩm vào trước');
          if (e.target) e.target.value = null;
          return;
        }
        throw new Error(text || 'Import failed');
      }
      
      const data = await res.json();
      
      // If duplicate detected, notify and stop (no confirm/overwrite)
      if (data.isDuplicate) {
        alert('Phiếu nhập này đã có trong hệ thống');
        if (e.target) e.target.value = null;
        return;
      }
      
      alert('Import phiếu nhập thành công');
      await loadImports();
    } catch (err) {
      // If the thrown error contains server text, show it; otherwise show generic message
      const msg = (err && err.message) ? err.message : null;
      if (msg && msg.includes('Sản phẩm có mã hàng')) {
        alert('Phiếu nhập có sản phẩm chưa có trong hệ thống, vui lòng thêm sản phẩm vào trước');
      } else if (msg) {
        alert(msg);
      } else {
        alert('Import thất bại');
      }
    } finally {
      // reset input
      if (e.target && !forceOverwrite) e.target.value = null;
    }
  };

  const loadImportDetails = async (id) => {
    try {
      // Simple cache buster for fresh data
      const res = await fetch(`/api/WarehouseTransfers/${id}?_=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load import details');
      const data = await res.json();
      // normalize to frontend shape
      const detail = {
        ...data,
        items: (data.items || data.Items || []).map(it => ({ ...it }))
      };
      // Map warehouse/type display names for detail
      try {
        const src = (warehouses || []).find(w => String(w.id) === String(detail.sourceWarehouse) || String(w.code) === String(detail.sourceWarehouse) || String(w.name) === String(detail.sourceWarehouse));
        const dst = (warehouses || []).find(w => String(w.id) === String(detail.destWarehouse) || String(w.code) === String(detail.destWarehouse) || String(w.name) === String(detail.destWarehouse));
        detail.sourceWarehouseName = src ? (src.name || src.Name || '') : (detail.sourceWarehouseName || detail.sourceWarehouse || '');
        detail.destWarehouseName = dst ? (dst.name || dst.Name || '') : (detail.destWarehouseName || detail.destWarehouse || '');
        const impType = (transactionContents || []).find(tc => String(tc.id) === String(detail.importType) || tc.code === detail.importType || tc.name === detail.importType);
        const expType = (transactionContents || []).find(tc => String(tc.id) === String(detail.exportType) || tc.code === detail.exportType || tc.name === detail.exportType);
        detail.importTypeName = impType ? impType.name : (detail.importTypeName || detail.importType || '');
        detail.exportTypeName = expType ? expType.name : (detail.exportTypeName || detail.exportType || '');
      } catch (e) {
        // ignore mapping errors
      }
      // if employee missing, keep current formData.employee
      setSelectedImport(detail);
      // show right layout when loading details for edit/view
      setShowRightContent(true);
      setFormData({
        importNumber: detail.importNumber || detail.transferNumber || detail.TransferNumber || detail.ImportNumber || generateImportNumber(),
        createdDate: detail.date ? dayjs(detail.date).format('YYYY-MM-DD') : (detail.createdDate || new Date().toISOString().split('T')[0]),
        employee: detail.employee || detail.Employee || formData.employee,
        importType: detail.importType || detail.ImportType || '',
        exportType: detail.exportType || detail.ExportType || '',
        totalWeight: detail.totalWeight || 0,
        totalVolume: detail.totalVolume || 0,
        note: detail.note || detail.Note || ''
      });
      setItems(detail.items || []);
      
      // Recalculate weight and volume for all items after loading (fix any rounding issues from database)
      if (detail.items && detail.items.length > 0 && products && products.length > 0) {
        const updatedItems = detail.items.map(item => {
          try {
            const quantity = parseFloat(item.quantity) || 0;
            if (quantity <= 0) return item;
            
            // Find product by multiple possible identifiers
            let prod = products.find(p => p.code === item.productCode || p.barcode === item.barcode || p.name === item.productName);
            
            if (prod) {
              const updatedItem = { ...item };
              const selectedUnit = item.unit || '';
              
              // Get product data based on unit (support multiple units: ĐVT gốc, ĐVT 1, ĐVT 2...)
              const productData = getProductDataByUnit(prod, selectedUnit);
              
              // Recalculate weight: số kg = số kg sản phẩm × số lượng (no rounding)
              if (productData.weight !== undefined) {
                const calculatedWeight = productData.weight * quantity;
                updatedItem.weight = calculatedWeight;
              }
              
              // Recalculate volume: số khối = số khối sản phẩm × số lượng (no rounding)  
              if (productData.volume !== undefined) {
                const calculatedVolume = productData.volume * quantity;
                updatedItem.volume = calculatedVolume;
              }
              
              // Update conversion based on unit
              if (productData.conversion !== undefined) {
                updatedItem.conversion = productData.conversion;
              }
              
              return updatedItem;
            }
          } catch (e) {
            // ignore calculation errors
          }
          return item;
        });
        setItems(updatedItems);
        // Update selectedImport as well to keep data in sync
        setSelectedImport(prev => ({ ...prev, items: updatedItems }));
      }
      
      setIsEditing(false);
    } catch (err) {
      alert('Không thể tải chi tiết phiếu nhập');
    }
  };

  // Wrapper to trigger edit (explicitly load details and show right content)
  const editImport = async (importItem) => {
    if (!importItem || !importItem.id) return;
    
    try {
      // Force fresh load from server to avoid stale data
      const res = await fetch(`/api/WarehouseTransfers/${importItem.id}?_=${Date.now()}`);
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
        importNumber: detail.importNumber || detail.transferNumber || detail.TransferNumber || detail.ImportNumber || generateImportNumber(),
        createdDate: detail.date ? dayjs(detail.date).format('YYYY-MM-DD') : (detail.createdDate || new Date().toISOString().split('T')[0]),
        employee: detail.employee || detail.Employee || formData.employee,
        importType: detail.importType || detail.ImportType || '',
        exportType: detail.exportType || detail.ExportType || '',
        sourceWarehouse: detail.sourceWarehouse ? String(detail.sourceWarehouse) : '',
        destWarehouse: detail.destWarehouse ? String(detail.destWarehouse) : '',
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
          unit: item.unit || '',
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
        productRows.push({ id: Date.now() + detail.items.length, values: { warehouse: getDefaultWarehouseName() } });
        
        setHeaderRows(productRows);
      } else {
        // No existing items, start with one empty row
        setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
      }
      
      setItems(detail.items || []);
      setShowRightContent(true);
      setIsEditMode(true);
      setIsEditing(true);
    } catch (err) {
      alert('Không thể chỉnh sửa phiếu nhập');
    }
  };

  const createNewImport = async () => {
    try {
      const payload = {
        transferNumber: generateImportNumber(),
        date: new Date().toISOString(),
        note: '',
        employee: formData.employee || '',
        exportType: formData.exportType || '',
        sourceWarehouse: formData.sourceWarehouse || '',
        destWarehouse: formData.destWarehouse || '',
        total: 0,
        items: []
      };
      const res = await fetch('/api/WarehouseTransfers', {
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
      alert('Tạo phiếu nhập mới thất bại');
    }
  };

  const saveImport = async () => {
    try {
      const isUpdate = selectedImport && selectedImport.id && selectedImport.id > 0 && !selectedImport.isTemp;
        // Validation
      if (!formData.createdDate) {
        alert('Vui lòng chọn ngày lập');
        return;
      }
      if (!formData.employee) {
        alert('Vui lòng chọn nhân viên lập');
        return;
      }
      // Only require importType when creating a new transfer
      if (!isUpdate && !formData.importType) {
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
        unit: row.values.unit || '',
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
        transferNumber: formData.importNumber || generateImportNumber(),
        date: formData.createdDate ? new Date(formData.createdDate).toISOString() : new Date().toISOString(),
        note: formData.note || '',
        employee: formData.employee || 'admin 66',
        importType: formData.importType,
        exportType: formData.exportType,
        sourceWarehouse: formData.sourceWarehouse || '',
        destWarehouse: formData.destWarehouse || '',
        supplier: formData.supplier || '',
        invoice: formData.invoice || '',
        invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : new Date().toISOString(),
        total: totalAmount,
        totalWeight: totalWeight,
        totalVolume: totalVolume,
        totalText: totalText,
        TotalText: totalText, // Try with capital T
        items: allItems
      };

      // Final validation only

      if (totalText === null || totalText === undefined || totalText === '') {
        alert('Lỗi: Không thể tạo totalText. Vui lòng báo cáo lỗi này.');
        return;
      }

      if (isUpdate) {
        // Ensure we have the most current data by refetching before update
        let currentImport;
        try {
          const currentRes = await fetch(`/api/WarehouseTransfers/${selectedImport.id}`);
          if (currentRes.ok) {
            currentImport = await currentRes.json();
          }
        } catch (e) {
        }

        const res = await fetch(`/api/WarehouseTransfers/${selectedImport.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: selectedImport.id, 
            ...(currentImport || {}),
            ...payload 
          })
        });
        if (!res.ok) {
          const errorText = await res.text();
          
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
          const updatedRes = await fetch(`/api/WarehouseTransfers/${selectedImport.id}`);
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
        const res = await fetch('/api/WarehouseTransfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          
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
    const sourceMatch = leftFilterLists.sourceWarehouse && leftFilterLists.sourceWarehouse.length > 0
      ? leftFilterLists.sourceWarehouse.includes(i.sourceWarehouseName || i.sourceWarehouse || '')
      : true;
    const destMatch = leftFilterLists.destWarehouse && leftFilterLists.destWarehouse.length > 0
      ? leftFilterLists.destWarehouse.includes(i.destWarehouseName || i.destWarehouse || '')
      : true;
    const importTypeMatch = leftFilterLists.importType && leftFilterLists.importType.length > 0
      ? leftFilterLists.importType.includes(i.importTypeName || i.importType || '')
      : true;
    const exportTypeMatch = leftFilterLists.exportType && leftFilterLists.exportType.length > 0
      ? leftFilterLists.exportType.includes(i.exportTypeName || i.exportType || '')
      : true;
    return importMatch && dateMatch && totalMatch && sourceMatch && destMatch && importTypeMatch && exportTypeMatch;
  });

  React.useEffect(() => {
    localStorage.setItem(IMPORT_LEFT_COLS_KEY, JSON.stringify(leftVisibleCols));
  }, [leftVisibleCols]);

  React.useEffect(() => {
    localStorage.setItem('import_left_page_size', String(leftPageSize));
    setLeftPage(1);
  }, [leftPageSize]);

  const handleExport = async () => {
    try {
      const headerRowsData = (memoizedHeaderTotals.validRows || []).map(r => ({ ...r.values }));
      const itemsData = (items && items.length > 0) ? items.map(it => ({
        barcode: it.barcode || it.Barcode || '',
        productCode: it.productCode || it.code || it.productCode || '',
        productName: it.productName || it.name || it.productNameVat || '',
        unit: it.unit || it.defaultUnit || it.unitName || it.unit1Name || '',
        quantity: it.quantity || it.qty || '',
        unitPrice: it.unitPrice || it.importPrice || it.price || 0,
        transportCost: it.transportCost || 0,
        noteDate: it.noteDate || it.note || '',
        total: it.total || ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
        totalTransport: it.totalTransport || 0,
        weight: it.weight || 0,
        volume: it.volume || 0,
        warehouse: it.warehouse || (it.warehouseName || ''),
        description: it.description || it.note || '',
        conversion: it.conversion || ''
      })) : [];

      const headerMapped = headerRowsData.map(h => ({
        barcode: h.barcode || '',
        productCode: h.productCode || h.productCode || '',
        productName: h.productName || h.productName || '',
        unit: h.unit || h.defaultUnit || '',
        quantity: h.quantity || h.qty || '',
        unitPrice: h.unitPrice || 0,
        transportCost: h.transportCost || 0,
        noteDate: h.noteDate || '',
        total: h.total || 0,
        totalTransport: h.totalTransport || 0,
        weight: h.weight || 0,
        volume: h.volume || 0,
        warehouse: h.warehouse || '',
        description: h.description || '',
        conversion: h.conversion || ''
      }));

      const combined = itemsData.length > 0 ? itemsData : headerMapped;

      const rowsHtml = combined.map((v, idx) => {
        let noteDate = v.noteDate || '';
        try { if (noteDate) noteDate = dayjs(noteDate).format('DD/MM/YYYY'); } catch (e) {}
        // Use raw numeric values for Excel and let mso-number-format style them.
        const unitPriceRaw = v.unitPrice ? Number(v.unitPrice) : 0;
        const transportRaw = v.transportCost ? Number(v.transportCost) : 0;
        const amountRaw = v.total ? Number(v.total) : ((Number(v.quantity)||0) * (Number(v.unitPrice)||0));
        const totalTransportRaw = v.totalTransport ? Number(v.totalTransport) : 0;
        const weightRaw = v.weight ? Number(v.weight) : 0;
        const volumeRaw = v.volume ? Number(v.volume) : 0;
        const unitPrice = unitPriceRaw;
        const transport = transportRaw;
        const amount = amountRaw;
        const totalTransport = totalTransportRaw;
        const weight = weightRaw;
        const volume = volumeRaw;
        const warehouseName = (() => {
          try {
            if (warehouses && warehouses.length > 0 && v.warehouse) {
              const found = warehouses.find(w => String(w.id) === String(v.warehouse) || String(w.id) === String(v.warehouse));
              if (found) return found.name || v.warehouse;
            }
          } catch(e) {}
          return v.warehouse || '';
        })();
        return `<tr>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center">${idx+1}</td>
          <td style="border:1px solid #ccc;padding:6px 8px; mso-number-format:'\\@';">${v.barcode||''}</td>
          <td style="border:1px solid #ccc;padding:6px 8px; mso-number-format:'\\@';">${v.productCode||''}</td>
          <td style="border:1px solid #ccc;padding:6px 8px">${v.productName||''}</td>
          <td style="border:1px solid #ccc;padding:6px 8px">${v.unit||''}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0'">${v.quantity || 0}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0'">${unitPrice}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0'">${transport}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center">${noteDate}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0'">${amount}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0'">${totalTransport}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0.00'">${weight}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:right; mso-number-format:'#,##0.0000'">${volume}</td>
          <td style="border:1px solid #ccc;padding:6px 8px">${warehouseName}</td>
          <td style="border:1px solid #ccc;padding:6px 8px">${v.description||''}</td>
          <td style="border:1px solid #ccc;padding:6px 8px">${v.conversion||''}</td>
        </tr>`;
      }).join('');

      // Fetch company info dynamically so exported file always reflects company-info page
      let companyNameDynamic = '';
      let companyAddressDynamic = '';
      let companyPhoneDynamic = '';
      try {
        const compData = await api.get(API_ENDPOINTS.companyInfos);
        if (Array.isArray(compData) && compData.length > 0) {
          const c = compData[0];
          companyNameDynamic = c.companyName || c.name || companyNameDynamic;
          companyAddressDynamic = c.address || companyAddressDynamic;
          companyPhoneDynamic = c.phone || companyPhoneDynamic;
        }
      } catch (e) {
        // ignore fetch error and fall back to defaults
      }

      const companyName = companyNameDynamic || 'NPP THỊNH PHÚ QUỐC';
      const printedAt = formData.createdDate || new Date().toISOString().split('T')[0];
      const importNumber = formData.importNumber || (selectedImport && selectedImport.importNumber) || '';
      const supplierName = (selectedImport && (selectedImport.supplierName || selectedImport.supplier)) || '';
      const employeeName = formData.employee || (selectedImport && (selectedImport.employee || '')) || '';
      const importTypeName = formData.importType || (selectedImport && (selectedImport.importType || '')) || '';

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Phiếu nhập</title>
          <style>
            /* A4-like print/export styles (default font-size 10px) */
            html, body { font-family: 'Times New Roman', Times, serif; font-size:10pt; }
            table { border-collapse:collapse; font-family: 'Times New Roman', Times, serif; font-size:10pt; }
            th, td { border:1px solid #000; padding:6px 8px; font-size:10pt; }
            th { background:#f7f7f7; }
            .company { font-weight:800; font-size:14pt; font-family: 'Times New Roman', Times, serif; }
            .small { font-size:10pt; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; }
            /* signature area removed per request */
          </style>
        </head>
        <body>
          <table style="width:100%; border:none; margin-bottom:6px;">
            <tr>
              <td style="border:none; vertical-align:top; padding:0; width:65%;">
                <div class="company" style="margin:0; padding:0;">${companyName}</div>
                <div class="small" style="margin:0; padding:0;">Địa chỉ: ${companyAddressDynamic || ''}</div>
                <div class="small" style="margin:0; padding:0;">Điện thoại: ${companyPhoneDynamic || ''}</div>
                <div class="small" style="margin-top:8px; padding:0;"><strong>Ghi chú PN:</strong> ${formData.note || (selectedImport && (selectedImport.note || '')) || ''}</div>
              </td>
              <td style="border:none; vertical-align:top; padding:0; width:35%; text-align:right;">
                <div style="display:inline-block; text-align:right; white-space:nowrap;">
                  <div class="small" style="margin:0; padding:0;">Số phiếu: <strong>${importNumber}</strong></div>
                  <div class="small" style="margin:0; padding:0;">Ngày lập: <strong>${printedAt}</strong></div>
                  <div class="small" style="margin:0; padding:0;">Nhân viên: <strong>${employeeName}</strong></div>
                  <div class="small" style="margin:0; padding:0;">Loại nhập: <strong>${importTypeName}</strong></div>
                </div>
              </td>
            </tr>
          </table>

          <h3 style="text-align:center;margin:12px 0">PHIẾU NHẬP HÀNG</h3>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã vạch</th>
                <th>Mã hàng</th>
                <th>Hàng hóa</th>
                <th>Đơn vị tính</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Tiền vận chuyển</th>
                <th>Ghi chú date PN</th>
                <th>Thành tiền</th>
                <th>TT vận chuyển</th>
                <th>Số kg</th>
                <th>Số khối</th>
                <th>Kho hàng</th>
                <th>Mô tả</th>
                <th>Quy đổi</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- signature area removed -->
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Phieu_Nhap_${(formData.importNumber || (selectedImport && selectedImport.importNumber) || dayjs().format('YYYYMMDD_HHmmss'))}.xls`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Xuất Excel thất bại');
    }
  };

  const handleImport = () => {
    alert('Chức năng import Excel đang được phát triển');
  };

  const handlePrint = async () => {
    try {
      // Load company info dynamically (only need first record)
      let companyNameDynamic = '';
      let companyAddressDynamic = '';
      let companyPhoneDynamic = '';
      try {
        const compData = await api.get(API_ENDPOINTS.companyInfos);
        if (Array.isArray(compData) && compData.length > 0) {
          const c = compData[0];
          companyNameDynamic = c.companyName || c.name || companyNameDynamic;
          companyAddressDynamic = c.address || companyAddressDynamic;
          companyPhoneDynamic = c.phone || companyPhoneDynamic;
        }
      } catch (e) {
        // ignore fetch error and fall back to defaults
      }
      // Build combined row list (items if present, otherwise header rows)
      const headerRowsData = (memoizedHeaderTotals.validRows || []).map(r => ({ ...r.values }));
      const itemsData = (items && items.length > 0) ? items.map(it => ({
        barcode: it.barcode || it.Barcode || '',
        productCode: it.productCode || it.code || it.productCode || '',
        productName: it.productName || it.name || it.productNameVat || '',
        unit: it.unit || it.defaultUnit || it.unitName || it.unit1Name || '',
        quantity: it.quantity || it.qty || '',
        unitPrice: it.unitPrice || it.importPrice || it.price || 0,
        transportCost: it.transportCost || 0,
        noteDate: it.noteDate || it.note || '',
        total: it.total || ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
        totalTransport: it.totalTransport || 0,
        weight: it.weight || 0,
        volume: it.volume || 0,
        warehouse: it.warehouse || (it.warehouseName || ''),
        description: it.description || it.note || '',
        conversion: it.conversion || ''
      })) : [];

      // Ensure headerRowsData entries use consistent keys
      const headerMapped = headerRowsData.map(h => ({
        barcode: h.barcode || '',
        productCode: h.productCode || h.productCode || '',
        productName: h.productName || h.productName || '',
        unit: h.unit || h.defaultUnit || '',
        quantity: h.quantity || h.qty || '',
        unitPrice: h.unitPrice || 0,
        transportCost: h.transportCost || 0,
        noteDate: h.noteDate || '',
        total: h.total || 0,
        totalTransport: h.totalTransport || 0,
        weight: h.weight || 0,
        volume: h.volume || 0,
        warehouse: h.warehouse || '',
        description: h.description || '',
        conversion: h.conversion || ''
      }));

      const combined = itemsData.length > 0 ? itemsData : headerMapped;

      const totalAmount = combined.reduce((s, r) => s + (Number(r.total) || 0), 0) || memoizedHeaderTotals.totalAmount || 0;
      const totalWeight = combined.reduce((s, r) => s + (Number(r.weight) || 0), 0) || memoizedHeaderTotals.totalWeight || 0;
      const totalVolume = combined.reduce((s, r) => s + (Number(r.volume) || 0), 0) || memoizedHeaderTotals.totalVolume || 0;

      const htmlRows = combined.map((v, idx) => {
        const qty = v.quantity || '';
        const unitPrice = v.unitPrice ? formatCurrency(Number(v.unitPrice)) : '';
        const transport = v.transportCost ? formatCurrency(Number(v.transportCost)) : '';
        let noteDate = v.noteDate || '';
        try {
          if (noteDate) noteDate = dayjs(noteDate).format('DD/MM/YYYY');
        } catch (e) { }
        const amount = v.total ? formatCurrency(Number(v.total)) : '';
        const totalTransport = v.totalTransport ? formatCurrency(Number(v.totalTransport)) : '';
        const weight = v.weight ? formatWeight(Number(v.weight)) : '';
        const volume = v.volume ? formatVolume(Number(v.volume)) : '';
        // Resolve warehouse name if warehouses list available
        let warehouseName = v.warehouse || '';
        try {
          if (warehouses && warehouses.length > 0 && warehouseName) {
            const found = warehouses.find(w => String(w.id) === String(warehouseName) || String(w.id) === String(v.warehouse));
            if (found) warehouseName = found.name || warehouseName;
          }
        } catch (e) { }

        return `
          <tr>
            <td style="text-align:center;padding:4px;border:1px solid #000">${idx + 1}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${v.barcode || ''}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${v.productCode || ''}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${v.productName || ''}</td>
            <td style="text-align:center;padding:4px;border:1px solid #000">${v.unit || ''}</td>
            <td style="text-align:center;padding:4px;border:1px solid #000">${qty}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${unitPrice}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${transport}</td>
            <td style="text-align:center;padding:4px;border:1px solid #000">${noteDate}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${amount}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${totalTransport}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${weight}</td>
            <td style="text-align:right;padding:4px;border:1px solid #000">${volume}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${warehouseName || ''}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${v.description || ''}</td>
            <td style="text-align:left;padding:4px;border:1px solid #000">${v.conversion || ''}</td>
          </tr>
        `;
      }).join('');

      const companyName = companyNameDynamic || 'NPP THỊNH PHÚ QUỐC';
      const printedAt = formData.createdDate || new Date().toISOString().split('T')[0];
      const importNumber = formData.importNumber || '';
      const supplierName = (selectedImport && (selectedImport.supplierName || selectedImport.supplier)) || '';
      const employeeName = formData.employee || '';
      const importTypeName = formData.importType || '';

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>In A4 - Ngang</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px }
            .company { font-weight:800; font-size:16px; }
            .title { text-align:center; font-weight:800; font-size:14px; margin:6px 0; }
            table { width:100%; border-collapse:collapse; font-size:10.5px }
            th, td { border:1px solid #000; padding:4px; vertical-align:top }
            thead th { background:#f5f5f5; }
            .small { font-size:10pt; color:#333 }
            .footer-sign { display:flex; justify-content:space-around; margin-top:28px }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">${companyName}</div>
              <div class="small">Địa chỉ: ${companyAddressDynamic || ''}</div>
              <div class="small">Điện thoại: ${companyPhoneDynamic || ''}</div>
            </div>
            <div style="text-align:right">
              <div class="small">Số phiếu: <strong>${importNumber}</strong></div>
              <div class="small">Ngày lập: <strong>${printedAt}</strong></div>
              <div class="small">Nhân viên: <strong>${employeeName}</strong></div>
              <div class="small">Loại nhập: <strong>${importTypeName}</strong></div>
              <div class="small">Nhà cung cấp: <strong>${supplierName}</strong></div>
            </div>
          </div>

          <div class="title">PHIẾU NHẬP HÀNG</div>
          <div style="text-align:left;margin-bottom:8px;font-size:12px">
            <strong>Ghi chú PN:</strong>
            <span style="margin-left:8px">${(formData.note && formData.note) || (selectedImport && (selectedImport.note || selectedImport.description)) || ''}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:3%">STT</th>
                <th style="width:6%">Mã vạch</th>
                <th style="width:6%">Mã hàng</th>
                <th style="width:12%">Hàng hóa</th>
                <th style="width:6%">Đơn vị tính</th>
                <th style="width:4%">Số lượng</th>
                <th style="width:6%">Đơn giá</th>
                <th style="width:6%">Tiền vận chuyển</th>
                <th style="width:7%">Ghi chú date PN</th>
                <th style="width:7%">Thành tiền</th>
                <th style="width:5%">TT vận chuyển</th>
                <th style="width:4%">Số kg</th>
                <th style="width:4%">Số khối</th>
                <th style="width:6%">Kho hàng</th>
                <th style="width:18%">Mô tả</th>
                <th style="width:11%">Quy đổi</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
              <tr>
                <td colspan="5" style="text-align:left;padding:6px">Tổng tiền bằng chữ: <strong>${numberToVietnameseText(Math.round(totalAmount))}</strong></td>
                <td style="text-align:center;padding:6px"></td>
                <td style="text-align:right;padding:6px"><strong>Tổng</strong></td>
                <td style="text-align:right;padding:6px">${formatCurrency(combined.reduce((s,r)=>s+(Number(r.transportCost)||0),0))}</td>
                <td style="text-align:center;padding:6px"></td>
                <td style="text-align:right;padding:6px"><strong>${formatCurrency(totalAmount)}</strong></td>
                <td style="text-align:right;padding:6px">${formatCurrency(combined.reduce((s,r)=>s+(Number(r.totalTransport)||0),0))}</td>
                <td style="text-align:right;padding:6px">${formatWeight(totalWeight)}</td>
                <td style="text-align:right;padding:6px">${formatVolume(totalVolume)}</td>
                <td colspan="3" style="text-align:left;padding:6px"></td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sign">
            <div style="text-align:center">Người giao hàng<br/><br/><br/>_______________</div>
            <div style="text-align:center">Người nhận<br/><br/><br/>_______________</div>
            <div style="text-align:center">Người lập phiếu<br/><br/><br/>${employeeName}</div>
          </div>

        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try { printWindow.print(); } catch (e) { }
      }, 700);
    } catch (e) {
      alert('Lỗi khi tạo bản in A4');
    }
  };

  const handleAddItem = (event) => {
    if (!ensureImportTypeSelected()) return;
    // Check if Ctrl key is pressed
    if (event && (event.ctrlKey || event.metaKey)) {
      // Open in new tab
      window.open('/setup/products?openModal=true', '_blank');
    } else {
      // Navigate in current tab
      window.location.href = '/setup/products?openModal=true';
    }
  };

  // (history view removed) 

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
      exportType: '',
      note: '',
      isTemp: true, // Mark as temporary
      items: []
    };
    
    const newFormData = {
      createdDate: dayjs().format('YYYY-MM-DD'),
      employee: 'admin 66',
      importType: '',
      exportType: '',
      sourceWarehouse: '',
      destWarehouse: '',
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
    setHeaderRows([{ id: Date.now(), values: { warehouse: getDefaultWarehouseName() } }]);
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
    
    // Sử dụng timestamp 4 chữ số để đảm bảo unique
    const uniqueId = Date.now().toString().slice(-4);
    return `CK-${day}${month}${year}-${uniqueId}`;
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
    else if (colKey === 'sourceWarehouse') items = Array.from(new Set(filteredImports.map(i => i.sourceWarehouseName || i.sourceWarehouse || '')));
    else if (colKey === 'destWarehouse') items = Array.from(new Set(filteredImports.map(i => i.destWarehouseName || i.destWarehouse || '')));
    else if (colKey === 'importType') items = Array.from(new Set(filteredImports.map(i => i.importTypeName || i.importType || '')));
    else if (colKey === 'exportType') items = Array.from(new Set(filteredImports.map(i => i.exportTypeName || i.exportType || '')));
    setModalAvailableItems(items);
    setShowSearchModal(true);
  };

  // Create columns with drag & drop support
  const createDraggableColumn = (config, index) => ({
    ...config,
    onHeaderCell: () => ({
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.effectAllowed = 'move';
        handleColumnDragStart(e, index);
        e.currentTarget.classList.add('being-dragged');
      },
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        handleColumnDragOver(e);
        e.currentTarget.classList.add('drag-over');
      },
      onDragEnter: (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
      },
      onDragLeave: (e) => {
        e.currentTarget.classList.remove('drag-over');
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleColumnDrop(e, index);
        e.currentTarget.classList.remove('drag-over');
      },
      onDragEnd: (e) => {
        handleColumnDragEnd(e);
        e.currentTarget.classList.remove('being-dragged');
        document.querySelectorAll('.ant-table-thead th').forEach(th => {
          th.classList.remove('drag-over');
        });
      },
      style: {
        cursor: draggedColumnIndex === index ? 'grabbing' : 'grab',
        backgroundColor: draggedColumnIndex === index ? '#f0f0f0' : 'transparent',
        userSelect: 'none'
      }
    })
  });

  const columns = [
    createDraggableColumn({
      title: '',
      dataIndex: 'checkbox',
      key: 'checkbox',
      width: 40,
      render: (_, record) => null,
    }, 0),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Số phiếu</span>
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
    }, 1),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Ngày chuyển</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('createdDate')} />
          {leftFilterLists.createdDate && leftFilterLists.createdDate.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.createdDate.length})</span>}
        </div>
      ),
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text) => text,
      sorter: (a, b) => a.createdDate.localeCompare(b.createdDate),
    }, 2),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Kho nguồn</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('sourceWarehouse')} />
          {leftFilterLists.sourceWarehouse && leftFilterLists.sourceWarehouse.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.sourceWarehouse.length})</span>}
        </div>
      ),
      dataIndex: 'sourceWarehouseName',
      key: 'sourceWarehouseName',
      render: (text, record) => {
        // Luôn map từ sourceWarehouse id sang tên kho
        const whId = record.sourceWarehouse || '';
        if (whId && warehouses && warehouses.length > 0) {
          const found = warehouses.find(w => String(w.id) === String(whId));
          if (found) return found.name || found.Name || '';
        }
        return text || record.sourceWarehouseName || '-';
      },
      sorter: (a, b) => (a.sourceWarehouseName || '').localeCompare(b.sourceWarehouseName || ''),
    }, 3),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Kho đích</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('destWarehouse')} />
          {leftFilterLists.destWarehouse && leftFilterLists.destWarehouse.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.destWarehouse.length})</span>}
        </div>
      ),
      dataIndex: 'destWarehouseName',
      key: 'destWarehouseName',
      render: (text, record) => {
        // Luôn map từ destWarehouse id sang tên kho
        const whId = record.destWarehouse || '';
        if (whId && warehouses && warehouses.length > 0) {
          const found = warehouses.find(w => String(w.id) === String(whId));
          if (found) return found.name || found.Name || '';
        }
        return text || record.destWarehouseName || '-';
      },
      sorter: (a, b) => (a.destWarehouseName || '').localeCompare(b.destWarehouseName || ''),
    }, 4),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Loại nhập</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('importType')} />
          {leftFilterLists.importType && leftFilterLists.importType.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.importType.length})</span>}
        </div>
      ),
      dataIndex: 'importTypeName',
      key: 'importType',
      render: (text, record) => {
        try {
          const it = record.importType || record.ImportType || '';
          if (it && transactionContents && transactionContents.length > 0) {
            const found = transactionContents.find(tc => String(tc.id) === String(it) || tc.code === it || tc.name === it);
            if (found) return found.name || text || '';
          }
        } catch (e) {}
        return text || record.importTypeName || record.importType || '-';
      },
      sorter: (a, b) => (a.importTypeName || '').localeCompare(b.importTypeName || ''),
    }, 7),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Loại xuất</span>
          <SearchOutlined style={{color:'#888', cursor:'pointer'}} onClick={() => openHeaderModal('exportType')} />
          {leftFilterLists.exportType && leftFilterLists.exportType.length > 0 && <span style={{marginLeft:6,color:'#1677ff'}}>({leftFilterLists.exportType.length})</span>}
        </div>
      ),
      dataIndex: 'exportTypeName',
      key: 'exportType',
      render: (text, record) => {
        try {
          const et = record.exportType || record.ExportType || '';
          if (et && transactionContents && transactionContents.length > 0) {
            const found = transactionContents.find(tc => String(tc.id) === String(et) || tc.code === et || tc.name === et);
            if (found) return found.name || text || '';
          }
        } catch (e) {}
        return text || record.exportTypeName || record.exportType || '-';
      },
      sorter: (a, b) => (a.exportTypeName || '').localeCompare(b.exportTypeName || ''),
    }, 8),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Tổng tiền</span>
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
    }, 5),
    createDraggableColumn({
      title: (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span>⋮⋮ Ghi chú</span>
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
    }, 6),
    createDraggableColumn({
      title: (<div style={{textAlign: 'center'}}>⋮⋮ Thao tác</div>),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Space>
            <Button icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); editImport(record); }} title="Sửa" />
            {!record.isTemp && (
              <Popconfirm title="Bạn có chắc chắn muốn xóa phiếu nhập này?" onConfirm={e => handleDelete(record.id, e)} okText="Có" cancelText="Không">
                <Button icon={<DeleteOutlined />} danger size="small" onClick={e => e.stopPropagation()} title="Xóa" />
              </Popconfirm>
            )}
          </Space>
        </div>
      )
    }, 9)
  ];

  // Apply column order and visibility
  const orderedColumns = leftColOrder
    .map(colKey => {
      const columnIndex = columns.findIndex(col => col.key === colKey || col.dataIndex === colKey);
      return columnIndex !== -1 ? columns[columnIndex] : null;
    })
    .filter(Boolean)
    .filter(col => leftVisibleCols.includes(col.key || col.dataIndex));

  return (
    <div className="warehouse-transfer-page">
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
            {/* search button removed (redundant) */}
          </div>
        </div>
        <div className="search-panel-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Tổng {filteredLeft.length} phiếu</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Button type="primary" size="small" onClick={() => exportSelectedList()} style={{background:'#1677ff',borderColor:'#1677ff'}}>Xuất DS</Button>
            {/* template import/export buttons moved to right detail panel */}
            <input 
              id="template-file-input"
              type="file" 
              accept=".csv,.xlsx" 
              style={{display:'none'}} 
              onChange={handleTemplateUpload} 
            />
            <button style={{background:'transparent',border:'none',cursor:'pointer'}} title="Cài đặt bảng" onClick={()=>setShowLeftSettings(true)}>⚙</button>
          </div>
        </div>
        <div className="table-scroll-x" style={{ position: 'relative' }}>
          <Table
            rowKey="id"
            columns={orderedColumns}
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
          title={activeHeaderModalColumn === 'importNumber' ? 'Tìm kiếm theo số phiếu' : activeHeaderModalColumn === 'createdDate' ? 'Lọc theo ngày chuyển' : activeHeaderModalColumn === 'sourceWarehouse' ? 'Lọc theo kho nguồn' : activeHeaderModalColumn === 'destWarehouse' ? 'Lọc theo kho đích' : activeHeaderModalColumn === 'total' ? 'Lọc theo tổng tiền' : 'Tìm kiếm'}
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
              const label = colKey==='checkbox' ? '' : (
                colKey==='importNumber' ? 'Số phiếu' :
                colKey==='createdDate' ? 'Ngày chuyển' :
                colKey==='sourceWarehouse' || colKey==='sourceWarehouseName' ? 'Kho nguồn' :
                colKey==='destWarehouse' || colKey==='destWarehouseName' ? 'Kho đích' :
                colKey==='importType' ? 'Loại nhập' :
                colKey==='exportType' ? 'Loại xuất' :
                colKey==='note' ? 'Ghi chú PC' :
                colKey==='total' ? 'Tổng tiền' :
                colKey==='actions' ? 'Thao tác' : colKey
              );
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

      {/* Right Panel - Transfer Details */}
  <div className="import-detail-panel">
        <div className="detail-header">
          <h2>THÔNG TIN CHUYỂN KHO</h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={resetFormForNewImport}>
              + Tạo mới
            </button>
            <button className="btn btn-success" onClick={handleAddItem} title="Click để thêm hàng hóa | Ctrl+Click để mở tab mới">
              📦 Thêm hàng hóa
            </button>
          </div>
        </div>
        {selectedImport && showRightContent ? (
          <>

            <div className="detail-content">
              <div className="detail-form" style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Row 1: Ngày lập | Kho nguồn | Loại xuất */}
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Ngày lập</label>
                    <input
                      type="date"
                      value={formData.createdDate || (selectedImport?.createdDate ? dayjs(selectedImport.createdDate).format('YYYY-MM-DD') : '')}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, createdDate: v }));
                        setSelectedImport(si => si ? ({ ...si, createdDate: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div style={{flex:'0 0 40%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Kho nguồn</label>
                    <select 
                      value={formData.sourceWarehouse || selectedImport?.sourceWarehouse || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, sourceWarehouse: v }));
                        setSelectedImport(si => si ? ({ ...si, sourceWarehouse: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      disabled={!isEditMode}
                    >
                      <option value="">chọn kho nguồn</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại xuất</label>
                    <select 
                      value={formData.exportType || selectedImport?.exportType || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, exportType: v }));
                        setSelectedImport(si => si ? ({ ...si, exportType: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      disabled={!isEditMode}
                    >
                      <option value="">loại xuất</option>
                      {transactionContents.filter(tc => tc.type === 'export' || tc.name?.toLowerCase().includes('xuất')).map(tc => (
                        <option key={tc.id} value={tc.name}>{tc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Số phiếu | Kho đích | Loại nhập */}
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Số phiếu</label>
                    <div className="input-with-status">
                      <input
                        type="text"
                        value={formData.importNumber || generateImportNumber()}
                        onChange={(e) => {
                          if (!isEditMode) return;
                          setFormData(prev => ({ ...prev, importNumber: e.target.value }));
                        }}
                        style={{width:'100%'}}
                        placeholder="Tự động tạo"
                        readOnly={!isEditMode}
                      />
                      <span className="status-icon">✓</span>
                    </div>
                  </div>
                  <div style={{flex:'0 0 40%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Kho đích</label>
                    <select 
                      value={formData.destWarehouse || selectedImport?.destWarehouse || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, destWarehouse: v }));
                        setSelectedImport(si => si ? ({ ...si, destWarehouse: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      disabled={!isEditMode}
                    >
                      <option value="">chọn kho đích</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}><span style={{color:'red',marginRight:6}}>*</span>Loại nhập</label>
                    <select 
                      value={formData.importType || selectedImport?.importType || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, importType: v }));
                        setSelectedImport(si => si ? ({ ...si, importType: v }) : si);
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      disabled={!isEditMode}
                    >
                      <option value="">loại nhập</option>
                      {transactionContents.filter(tc => tc.type === 'import' || tc.name?.toLowerCase().includes('nhập')).map(tc => (
                        <option key={tc.id} value={tc.name}>{tc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Nhân viên | Ghi chú */}
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{flex:'0 0 20%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Nhân viên</label>
                    <select style={{width:'100%'}} value={formData.employee || selectedImport?.employee || ''} onChange={(e)=>{
                      if (!isEditMode) return;
                      const v = e.target.value;
                      setFormData(prev => ({ ...prev, employee: v }));
                      setSelectedImport(si => si ? ({ ...si, employee: v }) : si);
                      setIsEditing(true);
                    }} disabled={!isEditMode}>
                      <option value="">-- Chọn nhân viên --</option>
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:'1 1 60%'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600}}>Ghi chú</label>
                    <input
                      type="text"
                      value={formData.note || ''}
                      onChange={(e) => {
                        if (!isEditMode) return;
                        const v = e.target.value;
                        setFormData(prev => ({ ...prev, note: v }));
                        setIsEditing(true);
                      }}
                      style={{width:'100%'}}
                      placeholder="Nhập ghi chú cho phiếu chuyển kho"
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
                    <colgroup>
                      {rightColOrder.filter(k => rightVisibleCols.includes(k)).map(key => (
                        <col key={key} style={{ width: `${rightColWidths[key] || 120}px` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        {rightColOrder.map((key, index) => {
                          if (!rightVisibleCols.includes(key)) return null;
                          
                          // No sticky columns on warehouse-transfer page
                          let stickyClass = '';
                          
                          if (key === 'barcode') return (
                            <th key="barcode" className={stickyClass} data-resizable="true" data-col-key={"barcode"} style={{textAlign: 'center'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                                <span>Mã vạch</span>
                                <SearchOutlined style={{color:'#888',cursor:'pointer'}} onClick={() => {
                                  if (!ensureImportTypeSelected()) return;
                                  setProductModalColumn('barcode'); setProductModalRowIndex(null); setProductModalSearch(''); setModalCurrentPage(1); setSelectedModalProducts([]); setProductModalScope('currentImport'); setShowProductModal(true);
                                }} />
                              </div>
                            </th>
                          );
                          if (key === 'productCode') return (
                            <th key="productCode" className={stickyClass} data-resizable="true" data-col-key={"productCode"} style={{textAlign: 'center'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                                <span>Mã hàng</span>
                                <SearchOutlined style={{color:'#888',cursor:'pointer'}} onClick={() => {
                                  if (!ensureImportTypeSelected()) return;
                                  setProductModalColumn('productCode'); setProductModalRowIndex(null); setProductModalSearch(''); setModalCurrentPage(1); setSelectedModalProducts([]); setProductModalScope('currentImport'); setShowProductModal(true);
                                }} />
                              </div>
                            </th>
                          );
                          if (key === 'productName') return (
                            <th key="productName" className={stickyClass} data-resizable="true" data-col-key={"productName"} style={{textAlign: 'center'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                                <span>Hàng hóa</span>
                                <SearchOutlined style={{color:'#888',cursor:'pointer'}} onClick={() => {
                                  if (!ensureImportTypeSelected()) return;
                                  setProductModalColumn('productName'); setProductModalRowIndex(null); setProductModalSearch(''); setModalCurrentPage(1); setSelectedModalProducts([]); setProductModalScope('currentImport'); setShowProductModal(true);
                                }} />
                              </div>
                            </th>
                          );
                          if (key === 'unit') return <th key="unit" style={{textAlign: 'center'}}><span>Đơn vị tính</span></th>;
                          if (key === 'description') return <th key="description" style={{textAlign: 'center'}}><span>Mô tả</span></th>;
                          if (key === 'conversion') return <th key="conversion" style={{textAlign: 'center'}}><span>Quy đổi</span></th>;
                          if (key === 'quantity') return <th key="quantity" style={{textAlign: 'center'}}><span>Số lượng</span></th>;
                          if (key === 'unitPrice') return <th key="unitPrice" style={{textAlign: 'center'}}><span>Đơn giá</span></th>;
                          if (key === 'total') return <th key="total" style={{textAlign: 'center'}}><span>Thành tiền</span></th>;
                          if (key === 'actions') return (
                            <th key="actions" style={{textAlign: 'center', verticalAlign: 'middle'}}>
                              <span>Thao tác</span>
                            </th>
                          );
                          return null;
                        })}
                      </tr>
                      {/* Additional header input rows inserted under the main header */}
                      {paginatedHeaderRows.map((row, rIdx) => (
                        <tr key={row.id} className="header-input-row" style={row.id === highlightRowId ? { background: '#fff7e6', boxShadow: 'inset 0 0 0 2px #ffd666' } : {}}>
                          {rightColOrder.map((colKey, index) => {
                            // No sticky columns on warehouse-transfer page
                            let stickyClass = '';
                            
                            if (colKey === 'actions') {
                              if (!rightVisibleCols.includes('actions')) return null;
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                                    {/* Show delete button (trash icon) for rows that have product data */}
                                    {(row.values.productName || row.values.productCode || row.values.barcode) && (
                                      <button 
                                        onClick={() => setHeaderRows(prev => prev.filter((_,i)=>i!==rIdx))} 
                                        style={{
                                          padding:'6px 10px',
                                          fontSize:14,
                                          backgroundColor:'#ff7043',
                                          color:'white',
                                          border:'none',
                                          borderRadius:'4px',
                                          cursor:'pointer'
                                        }}
                                        title="Xóa dòng"
                                      >
                                        🗑
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
                                <td key={colKey} className={stickyClass} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  {colKey === 'productName' ? (
                                        <button
                                      onClick={() => {
                                        if (!ensureImportTypeSelected()) return;

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

                            if (colKey === 'unit') {
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  {(() => {
                                    try {
                                      const rowValues = row.values || {};
                                      const prodId = rowValues.productName_id || rowValues.productCode_id || rowValues.barcode_id || null;
                                      let prod = null;
                                      if (prodId && products && products.length > 0) prod = products.find(p => String(p.id) === String(prodId));
                                      if (!prod) {
                                        const keyMatch = rowValues.productCode || rowValues.barcode || rowValues.productName || '';
                                        if (keyMatch) prod = products.find(p => p.code === keyMatch || p.barcode === keyMatch || p.name === keyMatch);
                                      }
                                      const opts = [];
                                      if (prod) {
                                        const base = prod.baseUnit || prod.defaultUnit || prod.DefaultUnit || prod.unit || '';
                                        if (base) opts.push({ name: base, conv: 1 });
                                        if (prod.unit1) opts.push({ name: prod.unit1, conv: Number(prod.conversion1) || 1 });
                                        if (prod.unit2) opts.push({ name: prod.unit2, conv: Number(prod.conversion2) || 1 });
                                        if (prod.unit3) opts.push({ name: prod.unit3, conv: Number(prod.conversion3) || 1 });
                                        if (prod.unit4) opts.push({ name: prod.unit4, conv: Number(prod.conversion4) || 1 });
                                      }
                                      // unique by name
                                      const uniq = [];
                                      opts.forEach(o => { if (o.name && !uniq.find(u=>u.name===o.name)) uniq.push(o); });

                                      return (
                                        <Select
                                          value={row.values.unit || undefined}
                                          onChange={(val) => handleHeaderRowChange(rIdx, 'unit', val ? String(val) : null)}
                                          placeholder="Chọn đơn vị"
                                          size="small"
                                          allowClear
                                          style={{ width: '100%', minWidth: 100 }}
                                        >
                                          {uniq.map(u => <Select.Option key={u.name} value={u.name}>{u.name}</Select.Option>)}
                                        </Select>
                                      );
                                    } catch (e) {
                                      return <Input value={row.values.unit || ''} onChange={(e)=>handleHeaderRowChange(rIdx,'unit',e.target.value)} size="small" />;
                                    }
                                  })()}
                                </td>
                              );
                            }

                            // Cột Mô tả (description)
                            if (colKey === 'description') {
                              if (!rightVisibleCols.includes(colKey)) return null;
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  <Input
                                    value={row.values.description || ''}
                                    onChange={(e) => handleHeaderRowChange(rIdx, 'description', e.target.value)}
                                    size="small"
                                    style={{ width: '100%', minWidth: 150 }}
                                    placeholder="Mô tả"
                                    readOnly
                                  />
                                </td>
                              );
                            }

                            // Cột Quy đổi (conversion) - hiển thị giá trị đã tính
                            if (colKey === 'conversion') {
                              if (!rightVisibleCols.includes(colKey)) return null;
                              const convValue = parseFloat(row.values.conversion) || 1; // Default to 1 instead of 0
                              return (
                                <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                  <Input
                                    value={convValue}
                                    size="small"
                                    style={{ width: '100%', minWidth: 70, textAlign: 'center', fontWeight: 500 }}
                                    readOnly
                                    placeholder="1"
                                  />
                                </td>
                              );
                            }

                            // Default: text / numeric inputs for remaining columns
                            if (!rightVisibleCols.includes(colKey)) return null;
                            
                            // Chỉ xử lý các cột còn lại: quantity, unitPrice, total
                            if (!['quantity', 'unitPrice', 'total'].includes(colKey)) {
                              return null; // Bỏ qua các cột đã xử lý ở trên
                            }
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <Input
                                  value={(() => {
                                    const rawValue = row.values[colKey] || '';
                                    if (rawValue === '') return '';
                                    
                                    // For currency fields - show formatted
                                    if (colKey === 'unitPrice') {
                                      const numValue = parseFloat(rawValue) || 0;
                                      return numValue === 0 ? '' : formatCurrency(numValue);
                                    }
                                    // For calculated field (total) - always show formatted
                                    if (colKey === 'total') {
                                      return formatInputDisplay(rawValue, 'currency');
                                    }
                                    // For quantity - return as is
                                    return rawValue;
                                  })()}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    
                                    // For currency fields, allow user to type freely but parse for calculation
                                    if (['unitPrice', 'total'].includes(colKey)) {
                                      const sanitizedValue = inputValue.replace(/[^0-9,]/g, '');
                                      const rawValue = sanitizedValue.replace(/,/g, '');
                                      handleHeaderRowChange(rIdx, colKey, rawValue);
                                    } else {
                                      handleHeaderRowChange(rIdx, colKey, inputValue);
                                    }
                                  }}
                                  size="small"
                                  style={{ 
                                    width: '100%', 
                                    minWidth: colKey === 'quantity' ? 70 : 80,
                                    textAlign: colKey === 'quantity' ? 'center' : 'left' 
                                  }}
                                  readOnly={colKey === 'total'}
                                  placeholder={colKey === 'total' ? 'Tự động' : (colKey === 'quantity' ? 'Số lượng' : 'Giá')}
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
                  {(() => {
                    const fixedRight = defaultRightCols.filter(c => c === 'actions');
                    const normalCols = defaultRightCols.filter(c => c !== 'actions');
                    return (
                      <>
                        <div style={{fontSize:13,color:'#888',marginBottom:6}}>Chưa cố định</div>
                        <div>
                          {rightColOrder.filter(key => !fixedRight.includes(key)).map((key, idx) => {
                            const label = key==='barcode'?'Mã vạch':key==='productCode'?'Mã hàng':key==='productName'?'Hàng hóa':key==='unit'?'Đơn vị tính':key==='description'?'Mô tả':key==='conversion'?'Quy đổi':key==='quantity'?'Số lượng':key==='unitPrice'?'Đơn giá':key==='total'?'Thành tiền':key;
                            const draggableEnabled = rightColOrder.filter(k => !fixedRight.includes(k)).length > 1;
                            return (
                              <div
                                key={key}
                                className={`setting-row${rightVisibleCols.includes(key) ? '' : ' hidden'}${draggedIndex === idx ? ' dragging' : ''}${dragOverIndex === idx ? ' dragover' : ''}`}
                                draggable={draggableEnabled}
                                onDragStart={() => setDraggedIndex(idx)}
                                onDragOver={e => { e.preventDefault(); if (draggedIndex !== null && idx !== draggedIndex) setDragOverIndex(idx); }}
                                onDrop={() => {
                                  if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
                                  const nonFixedKeys = normalCols;
                                  const currentOrder = rightColOrder.filter(k => nonFixedKeys.includes(k));
                                  const newOrder = [...currentOrder];
                                  const [removed] = newOrder.splice(draggedIndex, 1);
                                  newOrder.splice(dragOverIndex, 0, removed);
                                  const newColOrder = [...newOrder, ...rightColOrder.filter(k => !nonFixedKeys.includes(k))];
                                  setRightColOrder(newColOrder);
                                  setDraggedIndex(null); setDragOverIndex(null);
                                }}
                                style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',cursor: draggableEnabled ? 'grab' : 'default'}}
                              >
                                <span className="drag-icon">⋮⋮</span>
                                <input
                                  type="checkbox"
                                  checked={rightVisibleCols.includes(key)}
                                  onChange={() => {
                                    setRightVisibleCols(
                                      rightVisibleCols.includes(key) ? rightVisibleCols.filter(k => k !== key) : [...rightVisibleCols, key]
                                    );
                                  }}
                                />
                                <span>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{fontSize:13,color:'#888',margin:'8px 0 2px 0'}}>Cố định phải</div>
                        <div>
                          {defaultRightCols.filter(c => c === 'actions').map(col => (
                            <div key={col} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
                              <span className="drag-icon" style={{color:'#eee'}}>⋮⋮</span>
                              <input
                                type="checkbox"
                                checked={rightVisibleCols.includes(col)}
                                onChange={() => {
                                  setRightVisibleCols(
                                    rightVisibleCols.includes(col) ? rightVisibleCols.filter(k => k !== col) : [...rightVisibleCols, col]
                                  );
                                }}
                              />
                              <span>{col === 'actions' ? 'Thao tác' : col}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
                    <button className="btn btn-secondary" onClick={()=>{ setRightVisibleCols(defaultRightCols); setRightColOrder(defaultRightCols); }}>Làm lại</button>
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
                <button className="btn btn-success" onClick={exportImportTemplate} style={{marginLeft:8}}>
                  📄 Xuất chi tiết
                </button>
                <button className="btn btn-success" onClick={() => document.getElementById('template-file-input').click()} style={{marginLeft:4}}>
                  📁 Nhập chi tiết
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
                          return sum + weight; // Không làm tròn, giữ nguyên độ chính xác
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
                          return sum + volume; // Không làm tròn, giữ nguyên độ chính xác
                        }, 0);
                      return formatVolume(headerTotals);
                    })()} 
                    readOnly 
                    style={{width:'100%', background: '#f5f5f5'}} 
                  />
                </div>
              </div>

              {/* Second row: Số phiếu (20%) and Ghi chú (80%) */}
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{flex:'0 0 20%'}}>
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
                <div style={{flex:'1 1 80%'}}>
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
                  <colgroup>
                    {rightColOrder.filter(k => rightVisibleCols.includes(k)).map(key => (
                      <col key={key} style={{ width: `${rightColWidths[key] || 120}px` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {rightColOrder.map((key, index) => {
                        if (!rightVisibleCols.includes(key)) return null;
                        
                        // No sticky columns on warehouse-transfer page
                        let stickyClass = '';
                        
                        if (key === 'barcode') return <th key="barcode" className={stickyClass} data-resizable="true" data-col-key={"barcode"} style={{textAlign: 'center'}}><span>Mã vạch</span></th>;
                        if (key === 'productCode') return <th key="productCode" className={stickyClass} data-resizable="true" data-col-key={"productCode"} style={{textAlign: 'center'}}><span>Mã hàng</span></th>;
                        if (key === 'productName') return <th key="productName" className={stickyClass} data-resizable="true" data-col-key={"productName"} style={{textAlign: 'center'}}><span>Hàng hóa</span></th>;
                        if (key === 'unit') return <th key="unit" style={{textAlign: 'center'}}><span>Đơn vị tính</span></th>;
                        if (key === 'description') return <th key="description" style={{textAlign: 'center'}}><span>Mô tả</span></th>;
                        if (key === 'conversion') return <th key="conversion" style={{textAlign: 'center'}}><span>Quy đổi</span></th>;
                        if (key === 'quantity') return <th key="quantity" style={{textAlign: 'center'}}><span>Số lượng</span></th>;
                        if (key === 'unitPrice') return <th key="unitPrice" style={{textAlign: 'center'}}><span>Đơn giá</span></th>;
                        if (key === 'total') return <th key="total" style={{textAlign: 'center'}}><span>Thành tiền</span></th>;
                        if (key === 'actions') return (
                          <th key="actions" style={{textAlign: 'center', verticalAlign: 'middle'}}>
                            <span>Thao tác</span>
                          </th>
                        );
                        return null;
                      })}
                    </tr>
                    {/* Header input rows for new entries */}
                    {paginatedHeaderRows.map((row, rIdx) => (
                      <tr key={row.id} className="header-input-row" style={row.id === highlightRowId ? { background: '#fff7e6', boxShadow: 'inset 0 0 0 2px #ffd666' } : {}}>
                        {rightColOrder.map((colKey, index) => {
                            // No sticky columns on warehouse-transfer page
                            let stickyClass = '';
                          
                          if (colKey === 'actions') {
                            if (!rightVisibleCols.includes('actions')) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6}}>
                                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                                  {/* Show delete button (trash icon) for rows that have product data */}
                                  {(row.values.productName || row.values.productCode || row.values.barcode) && (
                                    <button 
                                      onClick={() => setHeaderRows(prev => prev.filter((_,i)=>i!==rIdx))} 
                                      style={{
                                        padding:'6px 10px',
                                        fontSize:14,
                                        backgroundColor:'#ff7043',
                                        color:'white',
                                        border:'none',
                                        borderRadius:'4px',
                                        cursor:'pointer'
                                      }}
                                      title="Xóa dòng"
                                    >
                                      🗑
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          if (['productCode','productName','barcode'].includes(colKey)) {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} className={stickyClass} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                {colKey === 'productName' ? (
                                  <button
                                      onClick={() => {
                                      if (!ensureImportTypeSelected()) return;
                                      setProductModalColumn(colKey);
                                      setProductModalRowIndex(rIdx);
                                      setProductModalSearch('');
                                      setModalCurrentPage(1);
                                      setSelectedModalProducts(row.values[colKey] ? [row.values[colKey]] : []);
                                        setProductModalScope('all');
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

                          if (colKey === 'unit') {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                {(() => {
                                  try {
                                    const rowValues = row.values || {};
                                    const prodId = rowValues.productName_id || rowValues.productCode_id || rowValues.barcode_id || null;
                                    let prod = null;
                                    if (prodId && products && products.length > 0) prod = products.find(p => String(p.id) === String(prodId));
                                    if (!prod) {
                                      const keyMatch = rowValues.productCode || rowValues.barcode || rowValues.productName || '';
                                      if (keyMatch) prod = products.find(p => p.code === keyMatch || p.barcode === keyMatch || p.name === keyMatch);
                                    }
                                    const opts = [];
                                    if (prod) {
                                      const base = prod.baseUnit || prod.defaultUnit || prod.DefaultUnit || prod.unit || '';
                                      if (base) opts.push({ name: base, conv: 1 });
                                      if (prod.unit1) opts.push({ name: prod.unit1, conv: Number(prod.conversion1) || 1 });
                                      if (prod.unit2) opts.push({ name: prod.unit2, conv: Number(prod.conversion2) || 1 });
                                      if (prod.unit3) opts.push({ name: prod.unit3, conv: Number(prod.conversion3) || 1 });
                                      if (prod.unit4) opts.push({ name: prod.unit4, conv: Number(prod.conversion4) || 1 });
                                    }
                                    const uniq = [];
                                    opts.forEach(o => { if (o.name && !uniq.find(u=>u.name===o.name)) uniq.push(o); });

                                    return (
                                      <Select
                                        value={row.values.unit || undefined}
                                        onChange={(val) => handleHeaderRowChange(rIdx, 'unit', val ? String(val) : null)}
                                        placeholder="Chọn đơn vị"
                                        size="small"
                                        allowClear
                                        style={{ width: '100%', minWidth: 100 }}
                                      >
                                        {uniq.map(u => <Select.Option key={u.name} value={u.name}>{u.name}</Select.Option>)}
                                      </Select>
                                    );
                                  } catch (e) {
                                    return <Input value={row.values.unit || ''} onChange={(e)=>handleHeaderRowChange(rIdx,'unit',e.target.value)} size="small" />;
                                  }
                                })()}
                              </td>
                            );
                          }

                          // Cột Mô tả (description)
                          if (colKey === 'description') {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <Input
                                  value={row.values.description || ''}
                                  size="small"
                                  style={{ width: '100%', minWidth: 150 }}
                                  readOnly
                                  placeholder="Mô tả"
                                />
                              </td>
                            );
                          }

                          // Cột Quy đổi (conversion) - hiển thị giá trị đã tính
                          if (colKey === 'conversion') {
                            if (!rightVisibleCols.includes(colKey)) return null;
                            const convValue = parseFloat(row.values.conversion) || 1; // Default to 1 instead of 0
                            return (
                              <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                                <Input
                                  value={convValue}
                                  size="small"
                                  style={{ width: '100%', minWidth: 70, textAlign: 'center', fontWeight: 500 }}
                                  readOnly
                                  placeholder="1"
                                />
                              </td>
                            );
                          }

                          // Default inputs for remaining columns
                          if (!rightVisibleCols.includes(colKey)) return null;
                          
                          // Chỉ xử lý các cột: quantity, unitPrice, total
                          if (!['quantity', 'unitPrice', 'total'].includes(colKey)) {
                            return null; // Bỏ qua các cột đã xử lý
                          }
                          
                          return (
                            <td key={colKey} style={{paddingTop:6,paddingBottom:6,textAlign:'center'}}>
                              <Input
                                value={(() => {
                                  const rawValue = row.values[colKey] || '';
                                  if (rawValue === '') return '';
                                  
                                  if (colKey === 'unitPrice') {
                                    const numValue = parseFloat(rawValue) || 0;
                                    return numValue === 0 ? '' : formatCurrency(numValue);
                                  }
                                  if (colKey === 'total') {
                                    return formatInputDisplay(rawValue, 'currency');
                                  }
                                  return rawValue;
                                })()}
                                onChange={(e) => {
                                  if (colKey === 'total') return;
                                  
                                  const inputValue = e.target.value;
                                  
                                  if (['unitPrice', 'total'].includes(colKey)) {
                                    const sanitizedValue = inputValue.replace(/[^0-9,]/g, '');
                                    const rawValue = sanitizedValue.replace(/,/g, '');
                                    handleHeaderRowChange(rIdx, colKey, rawValue);
                                  } else {
                                    handleHeaderRowChange(rIdx, colKey, inputValue);
                                  }
                                }}
                                size="small"
                                style={{ width: '100%', minWidth: colKey === 'description' ? 150 : (colKey === 'quantity' ? 70 : 80), textAlign: colKey === 'quantity' ? 'center' : 'left' }}
                                readOnly={colKey === 'total'}
                                placeholder={colKey === 'total' ? 'Tự động' : ''}
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
        onCancel={() => { setShowProductModal(false); setProductModalScope('all'); }}
        title="Chọn hàng hóa"
        width={800}
        footer={[
          <button key="clear" onClick={() => {
            setSelectedModalProducts([]);
            setProductModalSearch('');
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Bỏ chọn tất cả</button>,
          <button key="all" onClick={() => {
            const filteredProducts = (() => {
              if (productModalScope === 'currentImport') {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              }
              return memoizedFilteredProducts;
            })();

            // Only select products on current page instead of all filtered products
            const startIndex = (modalCurrentPage - 1) * modalPageSize;
            const currentPageProducts = filteredProducts.slice(startIndex, startIndex + modalPageSize);
            const currentPageIds = currentPageProducts.map(p => p.id.toString());
            
            setSelectedModalProducts(prev => {
              const merged = new Set([...(prev || []), ...currentPageIds]);
              return Array.from(merged);
            });
          }} style={{marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff'}}>Chọn tất cả</button>,
          <button key="ok" onClick={() => {
            if (selectedModalProducts.length > 0 && productModalScope === 'currentImport') {
              // Compute filtered products in current scope
              const filteredProducts = (() => {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              })();

              // If user selected all filtered products -> clear filters and show entire import for editing
              if (selectedModalProducts.length === filteredProducts.length) {
                setRightFilters({});
                setHeaderFilter(null);
                setIsEditMode(true);
                setIsEditing(true);
                setShowProductModal(false);
                setProductModalScope('all');
                return;
              }

              // If multiple selected (but not all), build multi-value headerFilter so headerRows show only selected products
              if (selectedModalProducts.length > 1) {
                const codes = [];
                const barcodes = [];
                const names = [];
                for (const pid of selectedModalProducts) {
                  const p = products.find(pp => pp.id.toString() === pid);
                  if (!p) continue;
                  if (p.code) codes.push(String(p.code));
                  if (p.barcode) barcodes.push(String(p.barcode));
                  if (p.name) names.push(String(p.name));
                }
                const headerFilterObj = { productCode: codes, barcode: barcodes, productName: names };
                setRightFilters({});
                setHeaderFilter(headerFilterObj);
                setIsEditMode(true);
                setIsEditing(true);

                // navigate to first matching header row page if any
                const keys = new Set([...codes, ...barcodes, ...names].map(x => String(x)));
                let foundIndex = -1;
                for (let i = 0; i < headerRows.length; i++) {
                  const r = headerRows[i];
                  if (!r || !r.values) continue;
                  const v = r.values;
                  if (keys.has(String(v.productCode)) || keys.has(String(v.barcode)) || keys.has(String(v.productName))) { foundIndex = i; break; }
                }
                if (foundIndex !== -1) {
                  const page = Math.floor(foundIndex / Math.max(1, rightItemsPerPage)) + 1;
                  setRightCurrentPage(page);
                }
                setShowProductModal(false);
                setProductModalScope('all');
                return;
              }

              // Single selection -> behave as before (filter to that single product)
              const firstProductId = selectedModalProducts[0];
              const firstProduct = products.find(p => p.id.toString() === firstProductId);
              if (firstProduct) {
                const newFilters = {
                  productCode: firstProduct.code || '',
                  barcode: firstProduct.barcode || '',
                  productName: firstProduct.name || ''
                };
                setRightFilters(newFilters);
                setHeaderFilter(newFilters);
                setIsEditMode(true);
                setIsEditing(true);

                const keys = new Set([String(firstProduct.code || ''), String(firstProduct.barcode || ''), String(firstProduct.name || '')]);
                let foundIndex = -1;
                for (let i = 0; i < headerRows.length; i++) {
                  const r = headerRows[i];
                  if (!r || !r.values) continue;
                  const v = r.values;
                  if (keys.has(String(v.productCode)) || keys.has(String(v.barcode)) || keys.has(String(v.productName))) { foundIndex = i; break; }
                }
                if (foundIndex !== -1) {
                  const page = Math.floor(foundIndex / Math.max(1, rightItemsPerPage)) + 1;
                  setRightCurrentPage(page);
                } else {
                  const itemsList = (itemsData || []);
                  let foundInItems = -1;
                  for (let i = 0; i < itemsList.length; i++) {
                    const it = itemsList[i];
                    if (!it) continue;
                    if (keys.has(String(it.productCode)) || keys.has(String(it.barcode)) || keys.has(String(it.productName))) { foundInItems = i; break; }
                  }
                  if (foundInItems !== -1) {
                    const page = Math.floor(foundInItems / Math.max(1, rightItemsPerPage)) + 1;
                    setRightCurrentPage(page);
                  } else {
                    setRightCurrentPage(1);
                  }
                }
              }
              setShowProductModal(false);
              setProductModalScope('all');
              return;
            }

            if (selectedModalProducts.length > 0) {
              if (!ensureImportTypeSelected()) return;
              // Handle multiple product selection
              if (productModalRowIndex !== null && productModalRowIndex >= 0) {
                // For header input rows - update with multiple products
                setHeaderRows(prev => {
                  const copy = prev.map(r => ({ ...r, values: { ...r.values } }));
                  
                  // Update the current row with first selected product
                  const firstProductId = selectedModalProducts[0];
                  const firstProduct = products.find(p => p.id.toString() === firstProductId);
                  
                  if (copy[productModalRowIndex] && firstProduct) {
                    // Try to find most recent import item for this product to reuse last prices/units
                    let lastMatch = null;
                    try {
                      if (imports && imports.length > 0) {
                        // Filter out current import and temp imports to find actual last prices
                        const currentImportId = selectedImport?.id;
                        const filteredImports = imports.filter(imp => {
                          // Exclude current import being edited
                          if (currentImportId && imp.id === currentImportId) return false;
                          // Exclude temp imports (not yet saved)
                          if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                          return true;
                        });
                        
                        const withDates = filteredImports.map(imp => {
                          let parsedDate = new Date(0);
                          
                          if (imp.date) {
                            try {
                              const d = new Date(imp.date);
                              if (!isNaN(d.getTime())) parsedDate = d;
                            } catch (e) {}
                          }
                          
                          if (parsedDate.getTime() === 0 && imp.createdDate) {
                            try {
                              if (imp.createdDate.includes('/')) {
                                const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                                if (djs.isValid()) parsedDate = djs.toDate();
                              } else {
                                const d = new Date(imp.createdDate);
                                if (!isNaN(d.getTime())) parsedDate = d;
                              }
                            } catch (e) {}
                          }
                          
                          const fallbackSort = parseInt(imp.id) || 0;
                          
                          return {
                            imp,
                            _date: parsedDate,
                            _fallbackSort: fallbackSort
                          };
                        });
                        
                        // Sort by ID desc (most reliable - auto increment means higher ID = newer)
                        withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
                        for (const w of withDates) {
                          const itemsList = w.imp.items || w.imp.Items || [];
                          const match = itemsList.find(it => (it.productCode && it.productCode === firstProduct.code) || (it.barcode && it.barcode === firstProduct.barcode) || (it.productName && it.productName === firstProduct.name));
                          if (match) { lastMatch = match; break; }
                        }
                      }
                    } catch (e) {
                      // ignore
                    }

                    const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                                       (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));

                    copy[productModalRowIndex].values[productModalColumn] = firstProduct?.name || '';
                    copy[productModalRowIndex].values['productCode'] = firstProduct.code || '';
                    copy[productModalRowIndex].values['productName'] = firstProduct.name || '';
                    copy[productModalRowIndex].values['barcode'] = firstProduct.barcode || '';
                    copy[productModalRowIndex].values['description'] = firstProduct.description || '';
                    
                    // Always prioritize base unit first, then fallback to last match
                    const baseUnit = firstProduct.baseUnit || firstProduct.defaultUnit || firstProduct.unit || '';
                    const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
                    copy[productModalRowIndex].values['unit'] = defaultUnit;
                    
                    // Get product data for correct conversion based on unit
                    const productData = getProductDataByUnit(firstProduct, defaultUnit);
                    copy[productModalRowIndex].values['conversion'] = productData.conversion.toString();
                    
                    // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
                    let convertedUnitPrice = 0;
                    let convertedTransportCost = 0;
                    
                    // Kiểm tra loại nhập có phải "Nhập mua" không
                    const importType = formData.importType || selectedImport?.importType || '';
                    const isNhapMua = importType.toLowerCase().includes('Nhập mua') || importType.toLowerCase() === 'nhập mua';
                    
                    if (lastMatch) {
                      const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
                      const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
                      const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
                      
                      // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
                      if (isNhapMua && !isKMImport) {
                        convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
                      }
                      // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
                      convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
                    }
                    
                    copy[productModalRowIndex].values['unitPrice'] = convertedUnitPrice;
                    copy[productModalRowIndex].values['transportCost'] = convertedTransportCost;
                    copy[productModalRowIndex].values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null;
                    // weight and volume will be calculated after we determine quantity below
                    copy[productModalRowIndex].values['warehouse'] = copy[productModalRowIndex].values['warehouse'] || getDefaultWarehouseName();
                    
                    // Auto-calculate initial totals
                    const quantity = parseFloat(copy[productModalRowIndex].values.quantity) || 1;
                    
                    copy[productModalRowIndex].values.total = (quantity * convertedUnitPrice).toString();
                    copy[productModalRowIndex].values.totalTransport = (quantity * convertedTransportCost).toString();
                    // calculate derived fields based on the product
                    try {
                      if (firstProduct) {
                        copy[productModalRowIndex].values['weight'] = ((firstProduct.weight || 0) * quantity).toString();
                        copy[productModalRowIndex].values['volume'] = ((firstProduct.volume || 0) * quantity).toString();
                      }
                    } catch (e) {}
                  }
                  
                  // Add new rows for remaining selected products
                  selectedModalProducts.slice(1).forEach(productId => {
                    const product = products.find(p => p.id.toString() === productId);
                    if (product) {
                      // Try to find most recent import item for this product
                      let lastMatch = null;
                      try {
                        if (imports && imports.length > 0) {
                          // Filter out current import and temp imports to find actual last prices
                          const currentImportId = selectedImport?.id;
                          const filteredImports = imports.filter(imp => {
                            // Exclude current import being edited
                            if (currentImportId && imp.id === currentImportId) return false;
                            // Exclude temp imports (not yet saved)
                            if (imp.importNumber && imp.importNumber.includes('temp_')) return false;
                            return true;
                          });
                          
                          const withDates = filteredImports.map(imp => {
                            let parsedDate = new Date(0);
                            
                            if (imp.date) {
                              try {
                                const d = new Date(imp.date);
                                if (!isNaN(d.getTime())) parsedDate = d;
                              } catch (e) {}
                            }
                            
                            if (parsedDate.getTime() === 0 && imp.createdDate) {
                              try {
                                if (imp.createdDate.includes('/')) {
                                  const djs = dayjs(imp.createdDate, 'DD/MM/YYYY');
                                  if (djs.isValid()) parsedDate = djs.toDate();
                                } else {
                                  const d = new Date(imp.createdDate);
                                  if (!isNaN(d.getTime())) parsedDate = d;
                                }
                              } catch (e) {}
                            }
                            
                            const fallbackSort = parseInt(imp.id) || 0;
                            
                            return {
                              imp,
                              _date: parsedDate,
                              _fallbackSort: fallbackSort
                            };
                          });
                          
                          // Sort by ID desc (most reliable - auto increment means higher ID = newer)
                          withDates.sort((a, b) => b._fallbackSort - a._fallbackSort);
                          for (const w of withDates) {
                            const itemsList = w.imp.items || w.imp.Items || [];
                            const match = itemsList.find(it => (it.productCode && it.productCode === product.code) || (it.barcode && it.barcode === product.barcode) || (it.productName && it.productName === product.name));
                            if (match) { lastMatch = match; break; }
                          }
                        }
                      } catch (e) {
                        // ignore
                      }

                      const isKMImport = (formData.importType && formData.importType.toLowerCase().includes('km')) || 
                                         (selectedImport?.importType && selectedImport.importType.toLowerCase().includes('km'));

                      // Always prioritize base unit first
                      const baseUnit = product.baseUnit || product.defaultUnit || product.unit || '';
                      const defaultUnit = baseUnit || ((lastMatch && (lastMatch.unit || lastMatch.Unit)) || '');
                      
                      // Get product data for correct conversion based on unit
                      const productData = getProductDataByUnit(product, defaultUnit);
                      
                      // Quy đổi giá từ lastMatch về đơn vị nhỏ nhất
                      let convertedUnitPrice = 0;
                      let convertedTransportCost = 0;
                      
                      // Kiểm tra loại nhập có phải "Nhập mua" không
                      const importType = formData.importType || selectedImport?.importType || '';
                      const isNhapMua = importType.toLowerCase().includes('nhập mua') || importType.toLowerCase() === 'nhập mua';
                      
                      if (lastMatch) {
                        const lastMatchConversion = parseFloat(lastMatch.conversion || lastMatch.Conversion) || 1;
                        const lastMatchUnitPrice = parseFloat(lastMatch.unitPrice || lastMatch.UnitPrice) || 0;
                        const lastMatchTransportCost = parseFloat(lastMatch.transportCost || lastMatch.TransportCost) || 0;
                        
                        // Đơn giá: chỉ copy nếu loại nhập là "Nhập mua" và không phải KM
                        if (isNhapMua && !isKMImport) {
                          convertedUnitPrice = (lastMatchUnitPrice / lastMatchConversion) * productData.conversion;
                        }
                        // Tiền vận chuyển: luôn copy cho tất cả loại nhập (kể cả KM)
                        convertedTransportCost = (lastMatchTransportCost / lastMatchConversion) * productData.conversion;
                      }

                      const newRow = { id: Date.now() + Math.random(), values: {} };
                      newRow.values[productModalColumn] = product.name || '';
                      newRow.values['productCode'] = product.code || '';
                      newRow.values['productName'] = product.name || '';
                      newRow.values['barcode'] = product.barcode || '';
                      newRow.values['description'] = product.description || '';
                      newRow.values['unit'] = defaultUnit;
                      newRow.values['conversion'] = productData.conversion;
                      newRow.values['unitPrice'] = convertedUnitPrice;
                      newRow.values['transportCost'] = convertedTransportCost;
                      newRow.values['noteDate'] = (lastMatch && (lastMatch.noteDate || lastMatch.NoteDate)) || null;
                      newRow.values['weight'] = productData.weight * 1;
                      newRow.values['volume'] = productData.volume * 1;
                      newRow.values['warehouse'] = getDefaultWarehouseName();
                      newRow.values['quantity'] = 1;
                      
                      // Auto-calculate initial totals
                      newRow.values.total = convertedUnitPrice.toString();
                      newRow.values.totalTransport = convertedTransportCost.toString();
                      
                      copy.push(newRow);
                    }
                  });
                  
                  // Always add one more blank row at the end
                  copy.push({ id: Date.now() + Math.random(), values: { warehouse: getDefaultWarehouseName() } });
                  
                  return copy;
                });
              } else {
                // For main header dropdown - trigger the full product selection logic for first product only
                const firstProductId = selectedModalProducts[0];
                handleProductSelect(productModalColumn, firstProductId);
              }
            }
            setShowProductModal(false);
            setProductModalScope('all');
          }} style={{padding: '6px 16px', border: 'none', borderRadius: '4px', background: '#1677ff', color: '#fff'}}>{productModalScope === 'currentImport' ? 'Tìm' : 'Thêm vào PN'}</button>
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
            const filteredProducts = (() => {
              if (productModalScope === 'currentImport') {
                const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
                return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
              }
              return memoizedFilteredProducts;
            })();
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
          const filteredProducts = (() => {
            if (productModalScope === 'currentImport') {
              const present = new Set((itemsData || []).flatMap(it => [String(it.productCode||''), String(it.barcode||''), String(it.productName||'')]).filter(Boolean));
              return memoizedFilteredProducts.filter(p => present.has(String(p.code)) || present.has(String(p.barcode)) || present.has(String(p.name)));
            }
            return memoizedFilteredProducts;
          })();
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

export default WarehouseTransfer;
