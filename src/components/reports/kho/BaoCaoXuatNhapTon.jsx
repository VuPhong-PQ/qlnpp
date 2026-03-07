import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Button, Select, Input, Space, Popover, Checkbox, Tooltip, Spin, Modal } from 'antd';
import { SearchOutlined, SettingOutlined, FilterOutlined, ReloadOutlined, FileExcelOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import ExcelJS from 'exceljs';
import { API_ENDPOINTS, api } from '../../../config/api';
import { removeVietnameseTones } from '../../../utils/searchUtils';
import './BaoCaoXuatNhapTon.css';

dayjs.locale('vi');

// Parse date from dd/mm/yyyy format
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
};

// Format date to dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const BaoCaoXuatNhapTon = () => {
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [calendarBaseDate, setCalendarBaseDate] = useState(new Date());
  const [dateRangeText, setDateRangeText] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${formatDate(start)} - ${formatDate(end)}`;
  });
  const datePickerRef = useRef(null);

  // Filter states
  const [selectedWarehouse, setSelectedWarehouse] = useState('Kho NPP');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchText, setProductSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearchText, setCategorySearchText] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);

  // Data states
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactionContents, setTransactionContents] = useState([]);
  const [imports, setImports] = useState([]);
  const [exports, setExports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Table state
  const [pageSize, setPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('bcxnt_pageSize') || '10', 10); return isNaN(v) ? 10 : v; } catch { return 10; }
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Selected rows for checkbox
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Column settings
  const COL_SETTINGS_KEY = 'bcxnt_columns_v2';
  const defaultColumns = [
    { id: 'checkbox', label: '', width: 40, visible: true, align: 'center' },
    { id: 'category', label: 'Loại hàng', width: 120, visible: true, align: 'left' },
    { id: 'barcode', label: 'Mã vạch', width: 130, visible: true, align: 'left' },
    { id: 'productCode', label: 'Mã hàng', width: 100, visible: true, align: 'left' },
    { id: 'productName', label: 'Tên hàng', width: 200, visible: true, align: 'left' },
    { id: 'inventoryBoxes', label: 'Tồn thùng', width: 100, visible: true, align: 'right' },
    { id: 'saleValue', label: 'Giá trị bán', width: 120, visible: true, align: 'right' },
    { id: 'unit', label: 'Đơn vị tính', width: 90, visible: true, align: 'center' },
    { id: 'endingBalance', label: 'Cuối kỳ', width: 100, visible: true, align: 'right' },
    { id: 'exportQty', label: 'Xuất', width: 90, visible: true, align: 'right' },
    { id: 'exportBoxes', label: 'Xuất thùng', width: 100, visible: true, align: 'right' },
    { id: 'specification', label: 'Định lượng', width: 100, visible: true, align: 'right' },
    { id: 'salePrice', label: 'Giá bán', width: 110, visible: true, align: 'right' },
    { id: 'openingBalance', label: 'Đầu kỳ', width: 100, visible: true, align: 'right' },
    { id: 'importQty', label: 'Nhập', width: 90, visible: true, align: 'right' },
    { id: 'expiryDate', label: 'Hạn sử dụng', width: 110, visible: true, align: 'center' },
    { id: 'description', label: 'Mô tả', width: 180, visible: true, align: 'left' },
    { id: 'note', label: 'Ghi chú', width: 150, visible: true, align: 'left' },
    { id: 'transferOut', label: 'Chuyển đi', width: 100, visible: true, align: 'right' },
    { id: 'transferIn', label: 'Chuyển đến', width: 100, visible: true, align: 'right' },
    { id: 'adjustment', label: 'Điều chỉnh', width: 100, visible: true, align: 'right' },
    { id: 'weight', label: 'Số kg', width: 90, visible: true, align: 'right' },
    { id: 'volume', label: 'Số khối', width: 90, visible: true, align: 'right' },
    { id: 'costPrice', label: 'Giá vốn', width: 110, visible: true, align: 'right' },
    { id: 'costValue', label: 'Giá trị vốn', width: 120, visible: true, align: 'right' },
  ];

  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(COL_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : defaultColumns;
    } catch {
      return defaultColumns;
    }
  });

  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchColumn, setSearchColumn] = useState(null);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');

  // Context menu and modal detail state
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuRow, setContextMenuRow] = useState(null);

  const [showRowDetailModal, setShowRowDetailModal] = useState(false);
  const [modalProductCode, setModalProductCode] = useState(null);
  const [modalColumnFilters, setModalColumnFilters] = useState({});

  // Column drag-drop reordering
  const [dragColumn, setDragColumn] = useState(null);
  const [settingsDragItem, setSettingsDragItem] = useState(null);

  // Column resize
  const [resizingColumn, setResizingColumn] = useState(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save column settings
  useEffect(() => {
    localStorage.setItem(COL_SETTINGS_KEY, JSON.stringify(columns));
  }, [columns]);

  // Save page size
  useEffect(() => {
    localStorage.setItem('bcxnt_pageSize', String(pageSize));
  }, [pageSize]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [warehouseData, productData, categoryData, transactionData, customerData] = await Promise.all([
        api.get(API_ENDPOINTS.warehouses),
        api.get(API_ENDPOINTS.products),
        api.get(API_ENDPOINTS.productCategories),
        api.get(API_ENDPOINTS.transactionContents),
        api.get(API_ENDPOINTS.customers)
      ]);
      setWarehouses(warehouseData || []);
      setProducts(productData || []);
      setCategories(categoryData || []);
      setTransactionContents(transactionData || []);
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Search handler
  const handleSearch = async () => {
    setLoading(true);
    setDataLoaded(false);
    try {
      const [importData, exportData] = await Promise.all([
        api.get(API_ENDPOINTS.imports),
        api.get(API_ENDPOINTS.exports)
      ]);
      setImports(importData || []);
      setExports(exportData || []);
      setDataLoaded(true);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten import/export data into detail rows
  const flattenedData = useMemo(() => {
    if (!dataLoaded) return [];

    const rows = [];
    const startDate = selectedStartDate;
    const endDate = selectedEndDate;

    // Process imports
    (imports || []).forEach(imp => {
      const impDate = new Date(imp.date);
      if (startDate && impDate < startDate) return;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (impDate > endOfDay) return;
      }

      // Filter by transaction type (ImportType)
      if (selectedTransactionType && imp.importType !== selectedTransactionType) return;

      (imp.items || []).forEach(item => {
        // Filter by warehouse
        if (selectedWarehouse && item.warehouse !== selectedWarehouse) return;

        // Filter by product
        if (selectedProduct && item.productCode !== selectedProduct && item.productName !== selectedProduct) return;

        // Get product info for additional fields
        const product = products.find(p => p.productCode === item.productCode || p.name === item.productName);

        // Filter by category
        if (selectedCategory) {
          if (!product || product.category !== selectedCategory) return;
        }

        rows.push({
          key: `imp-${imp.id}-${item.id}`,
          type: 'import',
          soPhieu: imp.code || imp.id,
          date: imp.date ? dayjs(imp.date).format('DD/MM/YYYY') : '',
          customerName: imp.customerName || imp.customer || '',
          warehouse: item.warehouse || imp.warehouse || '',
          category: product?.category || '',
          barcode: item.barcode,
          productCode: item.productCode,
          productName: item.productName,
          inventoryBoxes: 0,
          saleValue: 0,
          unit: item.unit,
          endingBalance: 0,
          exportQty: 0,
          exportBoxes: 0,
          specification: item.conversion || product?.conversion || 0,
          salePrice: product?.priceRetail || 0,
          openingBalance: 0,
          importQty: item.quantity || 0,
          expiryDate: item.noteDate ? dayjs(item.noteDate).format('DD/MM/YYYY') : '',
          description: product?.description || item.description || '',
          note: item.note || '',
          transferOut: 0,
          transferIn: 0,
          adjustment: 0,
          weight: product?.weight || item.weight || 0,
          volume: product?.volume || item.volume || 0,
          costPrice: item.unitPrice || 0,
          costValue: item.total || 0,
          dateSort: impDate.getTime(),
        });
      });
    });

    // Process exports
    (exports || []).forEach(exp => {
      const expDate = new Date(exp.date);
      if (startDate && expDate < startDate) return;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (expDate > endOfDay) return;
      }

      // Filter by transaction type (ExportType)
      if (selectedTransactionType && exp.exportType !== selectedTransactionType) return;

      (exp.items || []).forEach(item => {
        // Filter by warehouse
        if (selectedWarehouse && item.warehouse !== selectedWarehouse) return;

        // Filter by product
        if (selectedProduct && item.productCode !== selectedProduct && item.productName !== selectedProduct) return;

        // Get product info for additional fields
        const product = products.find(p => p.productCode === item.productCode || p.name === item.productName);

        // Filter by category
        if (selectedCategory) {
          if (!product || product.category !== selectedCategory) return;
        }

        rows.push({
          key: `exp-${exp.id}-${item.id}`,
          type: 'export',
          soPhieu: exp.code || exp.id,
          date: exp.date ? dayjs(exp.date).format('DD/MM/YYYY') : '',
          customerName: exp.customerName || exp.customer || '',
          warehouse: item.warehouse || exp.warehouse || '',
          category: product?.category || '',
          barcode: item.barcode,
          productCode: item.productCode,
          productName: item.productName,
          inventoryBoxes: 0,
          saleValue: item.total || 0,
          unit: item.unit,
          endingBalance: 0,
          exportQty: item.quantity || 0,
          exportBoxes: 0,
          specification: item.conversion || product?.conversion || 0,
          salePrice: item.unitPrice || 0,
          openingBalance: 0,
          importQty: 0,
          expiryDate: item.noteDate ? dayjs(item.noteDate).format('DD/MM/YYYY') : '',
          description: product?.description || item.description || '',
          note: item.note || '',
          transferOut: 0,
          transferIn: 0,
          adjustment: 0,
          weight: product?.weight || item.weight || 0,
          volume: product?.volume || item.volume || 0,
          costPrice: item.unitPrice || 0,
          costValue: item.total || 0,
          dateSort: expDate.getTime(),
        });
      });
    });

    // Sort by date descending
    rows.sort((a, b) => b.dateSort - a.dateSort);

    return rows;
  }, [imports, exports, selectedStartDate, selectedEndDate, selectedWarehouse, selectedProduct, selectedCategory, selectedTransactionType, products, dataLoaded]);

  // Apply column filters
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return flattenedData;

    return flattenedData.filter(row => {
      for (const [colId, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal) continue;
        const cellValue = String(row[colId] || '').toLowerCase();
        const searchVal = removeVietnameseTones(filterVal.toLowerCase());
        const cellNormalized = removeVietnameseTones(cellValue);
        if (!cellNormalized.includes(searchVal)) return false;
      }
      return true;
    });
  }, [flattenedData, columnFilters]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      inventoryBoxes: acc.inventoryBoxes + (Number(row.inventoryBoxes) || 0),
      saleValue: acc.saleValue + (Number(row.saleValue) || 0),
      endingBalance: acc.endingBalance + (Number(row.endingBalance) || 0),
      exportQty: acc.exportQty + (Number(row.exportQty) || 0),
      exportBoxes: acc.exportBoxes + (Number(row.exportBoxes) || 0),
      specification: acc.specification + (Number(row.specification) || 0),
      salePrice: acc.salePrice + (Number(row.salePrice) || 0),
      openingBalance: acc.openingBalance + (Number(row.openingBalance) || 0),
      importQty: acc.importQty + (Number(row.importQty) || 0),
      transferOut: acc.transferOut + (Number(row.transferOut) || 0),
      transferIn: acc.transferIn + (Number(row.transferIn) || 0),
      adjustment: acc.adjustment + (Number(row.adjustment) || 0),
      weight: acc.weight + (Number(row.weight) || 0),
      volume: acc.volume + (Number(row.volume) || 0),
      costPrice: acc.costPrice + (Number(row.costPrice) || 0),
      costValue: acc.costValue + (Number(row.costValue) || 0),
    }), { inventoryBoxes: 0, saleValue: 0, endingBalance: 0, exportQty: 0, exportBoxes: 0, specification: 0, salePrice: 0, openingBalance: 0, importQty: 0, transferOut: 0, transferIn: 0, adjustment: 0, weight: 0, volume: 0, costPrice: 0, costValue: 0 });
  }, [filteredData]);

  // Product options with search
  const productOptions = useMemo(() => {
    const searchNormalized = removeVietnameseTones(productSearchText.toLowerCase());
    return products
      .filter(p => {
        if (!productSearchText) return true;
        const nameNormalized = removeVietnameseTones((p.name || '').toLowerCase());
        const descNormalized = removeVietnameseTones((p.description || '').toLowerCase());
        const codeNormalized = removeVietnameseTones((p.productCode || '').toLowerCase());
        return nameNormalized.includes(searchNormalized) || 
               descNormalized.includes(searchNormalized) || 
               codeNormalized.includes(searchNormalized);
      })
      .map(p => {
        const code = p.productCode || p.code || p.sku || p.id || '';
        const barcode = p.barcode || p.barcodeNumber || p.barcode1 || '';
        const salePrice = p.salePrice ?? p.retailPrice ?? p.price ?? p.unitPrice ?? '';
        const inventory = p.inventoryBoxes ?? p.stock ?? p.stockQuantity ?? p.quantity ?? p.onHand ?? '';
        const value = code || p.id || p.name || '';
        return ({
          value,
          label: (
            <div className="product-option">
              <div className="product-line1">
                <span className="product-code">{code}</span>
                {barcode ? <span className="product-barcode"> | {barcode}</span> : null}
                <span className="product-name"> - {p.name}</span>
              </div>
              <div className="product-meta product-desc">
                <span className="product-price">{salePrice !== '' ? new Intl.NumberFormat('vi-VN').format(salePrice) : ''}</span>
                <span className="product-inventory">{inventory !== '' ? ` • Tồn: ${inventory}` : ''}</span>
              </div>
            </div>
          ),
          searchText: `${p.name || ''} ${p.description || ''} ${code} ${barcode}`
        });
      });
  }, [products, productSearchText]);

  // Category options with search
  const categoryOptions = useMemo(() => {
    const searchNormalized = removeVietnameseTones(categorySearchText.toLowerCase());
    return categories
      .filter(c => {
        if (!categorySearchText) return true;
        const nameNormalized = removeVietnameseTones((c.name || '').toLowerCase());
        return nameNormalized.includes(searchNormalized);
      })
      .map(c => ({
        value: c.name,
        label: c.name
      }));
  }, [categories, categorySearchText]);

  // Transaction type options
  const transactionTypeOptions = useMemo(() => {
    return transactionContents.map(tc => ({
      value: tc.name,
      label: tc.name
    }));
  }, [transactionContents]);

  // Warehouse options
  const warehouseOptions = useMemo(() => {
    return warehouses.map(w => ({
      value: w.name,
      label: w.name
    }));
  }, [warehouses]);

  // Date picker handlers
  const handleDateRangeClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateRangeInputChange = (e) => {
    setDateRangeText(e.target.value);
    // Try to parse date range from input
    const parts = e.target.value.split(' - ');
    if (parts.length === 2) {
      const start = parseDate(parts[0].trim());
      const end = parseDate(parts[1].trim());
      if (start) setSelectedStartDate(start);
      if (end) setSelectedEndDate(end);
      if (start) setCalendarBaseDate(start);
    }
  };

  const handleDateSelect = (date, type) => {
    if (type === 'end') {
      setSelectedEndDate(date);
      // Update text input
      setDateRangeText(`${formatDate(selectedStartDate)} - ${formatDate(date)}`);
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  const renderCalendar = (baseDate, monthOffset = 0, showNav = false) => {
    const currentDate = new Date(baseDate);
    currentDate.setMonth(currentDate.getMonth() + monthOffset);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const monthNames = [
      'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
      'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const handleNavPrev = () => {
      const newDate = new Date(calendarBaseDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCalendarBaseDate(newDate);
    };

    const handleNavNext = () => {
      const newDate = new Date(calendarBaseDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCalendarBaseDate(newDate);
    };

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(current);
      const isCurrentMonth = dayDate.getMonth() === month;

      const dayTime = dayDate.setHours(0, 0, 0, 0);
      const startTime = selectedStartDate ? new Date(selectedStartDate).setHours(0, 0, 0, 0) : null;
      const endTime = selectedEndDate ? new Date(selectedEndDate).setHours(0, 0, 0, 0) : null;

      const isSelected = (
        (startTime && dayTime === startTime) ||
        (endTime && dayTime === endTime) ||
        (startTime && endTime && dayTime > startTime && dayTime < endTime)
      );

      const isStart = startTime && dayTime === startTime;
      const isEnd = endTime && dayTime === endTime;

      days.push(
        <div
          key={i}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''}`}
          onClick={() => {
            const clickedDate = new Date(dayDate);
            clickedDate.setHours(0, 0, 0, 0);
            if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
              setSelectedStartDate(clickedDate);
              setSelectedEndDate(null);
            } else {
              if (clickedDate >= selectedStartDate) {
                handleDateSelect(clickedDate, 'end');
              } else {
                setSelectedStartDate(clickedDate);
                setSelectedEndDate(selectedStartDate);
                setDateRangeText(`${formatDate(clickedDate)} - ${formatDate(selectedStartDate)}`);
              }
            }
          }}
        >
          {new Date(current).getDate()}
        </div>
      );

      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="calendar-month">
        <div className="calendar-header">
          {showNav && <button type="button" className="calendar-nav-btn" onClick={handleNavPrev}>◀</button>}
          <h4>{monthNames[month]} {year}</h4>
          {showNav && <button type="button" className="calendar-nav-btn" onClick={handleNavNext}>▶</button>}
        </div>
        <div className="calendar-weekdays">
          <div>CN</div>
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
        </div>
        <div className="calendar-days">
          {days}
        </div>
      </div>
    );
  };

  // Column toggle handler
  const toggleColumn = (colId) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  // Reset columns to default
  const resetColumns = () => {
    setColumns(defaultColumns);
  };

  // Column drag-drop handlers for table header
  const handleColumnDragStart = (e, id) => {
    setDragColumn(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, id) => {
    e.preventDefault();
    if (!dragColumn || dragColumn === id) return;
    setColumns(prev => {
      const arr = [...prev];
      const from = arr.findIndex(c => c.id === dragColumn);
      const to = arr.findIndex(c => c.id === id);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setDragColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDragColumn(null);
  };

  // Column drag-drop handlers for settings modal
  const handleSettingsDragStart = (e, index) => {
    setSettingsDragItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSettingsDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSettingsDrop = (e, index) => {
    e.preventDefault();
    setColumns(prev => {
      const arr = [...prev];
      const item = arr.splice(settingsDragItem, 1)[0];
      arr.splice(index, 0, item);
      return arr;
    });
    setSettingsDragItem(null);
  };

  const handleSettingsDragEnd = () => {
    setSettingsDragItem(null);
  };

  // Column resize handlers
  const handleResizeStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(id);
    startXRef.current = e.clientX;
    const col = columns.find(c => c.id === id);
    startWidthRef.current = col ? col.width : 100;

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startXRef.current;
      setColumns(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(50, startWidthRef.current + dx) } : c));
    };

    const onMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Column search modal handlers
  const openColumnSearch = (colId, label) => {
    setSearchColumn({ id: colId, label });
    setColumnSearchQuery(columnFilters[colId] || '');
    setShowSearchModal(true);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchColumn(null);
    setColumnSearchQuery('');
  };

  const applyColumnSearch = () => {
    if (columnSearchQuery.trim()) {
      setColumnFilters(prev => ({ ...prev, [searchColumn.id]: columnSearchQuery.trim() }));
    }
    closeSearchModal();
  };

  const clearColumnSearch = (colId) => {
    const newFilters = { ...columnFilters };
    delete newFilters[colId];
    setColumnFilters(newFilters);
  };

  // Get unique values for column search suggestions
  const getUniqueColumnValues = (col) => {
    if (!col) return [];
    const values = new Set();

    if (col.id === 'productName') {
      // Collect suggestions from both flattened rows and master products list
      flattenedData.forEach(row => {
        const product = products.find(p => (p.productCode && p.productCode === row.productCode) || (p.name && p.name === row.productName));
        const barcode = row.barcode || product?.barcode || product?.barcodeNumber || '';
        const code = row.productCode || product?.productCode || product?.code || '';
        const name = row.productName || product?.name || '';
        const salePrice = product?.salePrice ?? product?.retailPrice ?? product?.price ?? product?.unitPrice ?? '';
        const inventory = product?.inventoryBoxes ?? product?.stock ?? product?.stockQuantity ?? product?.quantity ?? product?.onHand ?? '';
        const priceText = salePrice !== '' ? new Intl.NumberFormat('vi-VN').format(salePrice) : '';
        let entry = '';
        if (barcode) entry += `${barcode} | `;
        if (code) entry += `${code} - `;
        entry += name;
        if (priceText) entry += ` • ${priceText}`;
        if (inventory !== '') entry += ` • Tồn: ${inventory}`;
        if (entry.trim()) values.add(entry);
      });

      (products || []).forEach(p => {
        const barcode = p.barcode || p.barcodeNumber || '';
        const code = p.productCode || p.code || p.sku || '';
        const name = p.name || '';
        const salePrice = p.salePrice ?? p.retailPrice ?? p.price ?? p.unitPrice ?? '';
        const inventory = p.inventoryBoxes ?? p.stock ?? p.stockQuantity ?? p.quantity ?? p.onHand ?? '';
        const priceText = salePrice !== '' ? new Intl.NumberFormat('vi-VN').format(salePrice) : '';
        let entry = '';
        if (barcode) entry += `${barcode} | `;
        if (code) entry += `${code} - `;
        entry += name;
        if (priceText) entry += ` • ${priceText}`;
        if (inventory !== '') entry += ` • Tồn: ${inventory}`;
        if (entry.trim()) values.add(entry);
      });
    } else {
      flattenedData.forEach(row => {
        const val = row[col.id];
        if (val !== null && val !== undefined && val !== '') {
          values.add(String(val));
        }
      });
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Checkbox handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(r => r.key)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (key) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Numeric columns for formatting
  const numericColumns = ['inventoryBoxes', 'saleValue', 'endingBalance', 'exportQty', 'exportBoxes', 'specification', 'salePrice', 'openingBalance', 'importQty', 'transferOut', 'transferIn', 'adjustment', 'weight', 'volume', 'costPrice', 'costValue'];

  // Get cell value for rendering
  const renderCell = (row, colId) => {
    if (colId === 'checkbox') {
      return (
        <Checkbox
          checked={selectedRows.has(row.key)}
          onChange={() => handleSelectRow(row.key)}
        />
      );
    }

    const value = row[colId];
    
    if (numericColumns.includes(colId)) {
      return (Number(value) || 0).toLocaleString('vi-VN');
    }
    
    return value || '';
  };

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Xuất nhập tồn');

    // Add headers (exclude checkbox column)
    const visibleCols = columns.filter(c => c.visible && c.id !== 'checkbox');
    worksheet.addRow(visibleCols.map(c => c.label));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    filteredData.forEach(row => {
      worksheet.addRow(visibleCols.map(c => {
        const value = row[c.id];
        if (numericColumns.includes(c.id)) {
          return Number(value) || 0;
        }
        return value || '';
      }));
    });

    // Add totals row
    worksheet.addRow(visibleCols.map(c => {
      if (c.id === 'category') return 'TỔNG CỘNG';
      if (numericColumns.includes(c.id)) {
        return totals[c.id] || 0;
      }
      return '';
    }));

    // Style totals row
    const totalsRow = worksheet.getRow(worksheet.rowCount);
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

    // Auto-size columns
    visibleCols.forEach((col, idx) => {
      worksheet.getColumn(idx + 1).width = Math.max(col.width / 8, 12);
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Xuat_nhap_ton_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Column settings popover content
  const columnSettingsContent = (
    <div className="column-settings-popover">
      <div className="column-settings-header">Tùy chọn cột hiển thị</div>
      <div className="column-settings-list">
        {columns.map((col, index) => (
          <div
            key={col.id}
            className={`column-settings-item ${settingsDragItem === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleSettingsDragStart(e, index)}
            onDragOver={handleSettingsDragOver}
            onDrop={(e) => handleSettingsDrop(e, index)}
            onDragEnd={handleSettingsDragEnd}
          >
            <span className="drag-handle">⋮⋮</span>
            <Checkbox checked={col.visible} onChange={() => toggleColumn(col.id)}>
              {col.label}
            </Checkbox>
          </div>
        ))}
      </div>
      <div className="column-settings-actions">
        <Button size="small" onClick={resetColumns}>Đặt lại mặc định</Button>
      </div>
    </div>
  );

  return (
    <div className="bao-cao-xuat-nhap-ton-page">
      <div className="page-header">
        <h1>THỐNG KÊ XUẤT NHẬP TỒN</h1>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-item date-range-container small" ref={datePickerRef}>
            <input
              type="text"
              value={dateRangeText}
              className="date-range-input"
              placeholder="DD/MM/YYYY - DD/MM/YYYY"
              onClick={handleDateRangeClick}
              readOnly
            />
            <span className="date-range-icon" onClick={handleDateRangeClick}>📅</span>

            {showDatePicker && (
              <div className="date-picker-popup">
                <div className="date-picker-header">
                  <input
                    type="text"
                    value={dateRangeText}
                    onChange={handleDateRangeInputChange}
                    className="date-range-display"
                    placeholder="dd/mm/yyyy - dd/mm/yyyy"
                  />
                </div>
                <div className="calendar-container">
                  {renderCalendar(calendarBaseDate, 0, true)}
                  {renderCalendar(calendarBaseDate, 1, false)}
                </div>
                <div className="date-picker-actions">
                  <button className="btn-cancel" onClick={() => setShowDatePicker(false)}>Hủy</button>
                  <button className="btn-apply" onClick={() => setShowDatePicker(false)}>Áp dụng</button>
                </div>
              </div>
            )}
          </div>

          <div className="filter-item small">
            <Select
              placeholder="Kho"
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              allowClear
              options={warehouseOptions}
              style={{ width: '100%' }}
            />
          </div>

          <div className="filter-item small">
            <Select
              placeholder="Loại hàng"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              showSearch
              filterOption={false}
              onSearch={setCategorySearchText}
              options={categoryOptions}
              style={{ width: '100%' }}
            />
          </div>

          <div className="filter-item product-wide">
            <Select
              placeholder="Tên hàng"
              value={selectedProduct}
              onChange={setSelectedProduct}
              allowClear
              showSearch
              filterOption={false}
              onSearch={setProductSearchText}
              options={productOptions}
              style={{ width: '100%' }}
              styles={{ popup: { root: { minWidth: 350 } } }}
              notFoundContent={productSearchText ? 'Không tìm thấy sản phẩm' : null}
            />
          </div>

          <div className="filter-item search-btn-container">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              className="search-btn"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <span className="total-count">Tổng {filteredData.length.toLocaleString('vi-VN')}</span>
        <div className="toolbar-actions">
          <Tooltip title="Xuất Excel">
            <Button icon={<FileExcelOutlined />} onClick={exportToExcel} disabled={filteredData.length === 0} className="excel-btn" />
          </Tooltip>
          <Tooltip title="Làm mới">
            <Button icon={<ReloadOutlined />} onClick={handleSearch} />
          </Tooltip>
          <Popover
            content={columnSettingsContent}
            trigger="click"
            open={showColumnSettings}
            onOpenChange={setShowColumnSettings}
            placement="bottomRight"
          >
            <Tooltip title="Tùy chọn cột">
              <Button icon={<SettingOutlined />} />
            </Tooltip>
          </Popover>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.filter(c => c.visible).map(col => (
                  <th
                    key={col.id}
                    style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                    className={`${columnFilters[col.id] ? 'filtered' : ''} ${resizingColumn === col.id ? 'resizing' : ''}`}
                    draggable={col.id !== 'checkbox'}
                    onDragStart={col.id !== 'checkbox' ? (e) => handleColumnDragStart(e, col.id) : undefined}
                    onDragOver={col.id !== 'checkbox' ? handleColumnDragOver : undefined}
                    onDrop={col.id !== 'checkbox' ? (e) => handleColumnDrop(e, col.id) : undefined}
                    onDragEnd={col.id !== 'checkbox' ? handleColumnDragEnd : undefined}
                  >
                    {col.id === 'checkbox' ? (
                      <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every(r => selectedRows.has(r.key))}
                        indeterminate={paginatedData.some(r => selectedRows.has(r.key)) && !paginatedData.every(r => selectedRows.has(r.key))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    ) : (
                      <div className="th-content">
                        <span className="th-label">{col.label}</span>
                        <div className="th-actions">
                          <Tooltip title="Tìm kiếm">
                            <button
                              className={`filter-btn ${columnFilters[col.id] ? 'active' : ''}`}
                              onClick={() => openColumnSearch(col.id, col.label)}
                            >
                              <SearchOutlined />
                            </button>
                          </Tooltip>
                          {columnFilters[col.id] && (
                            <Tooltip title="Xóa lọc">
                              <button className="clear-filter-btn" onClick={() => clearColumnSearch(col.id)}>
                                <CloseOutlined />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                        <div
                          className="resize-handle"
                          onMouseDown={(e) => handleResizeStart(e, col.id)}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length} className="loading-cell">
                    <Spin size="large" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length} className="empty-cell">
                    {dataLoaded ? 'Không có dữ liệu' : 'Nhấn "Tìm kiếm" để tải dữ liệu'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={row.type === 'import' ? 'import-row' : 'export-row'}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuVisible(true);
                      setContextMenuPos({ x: e.clientX, y: e.clientY });
                      setContextMenuRow(row);
                    }}
                  >
                    {columns.filter(c => c.visible).map(col => (
                      <td key={col.id} style={{ textAlign: col.align }}>
                        {renderCell(row, col.id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {paginatedData.length > 0 && (
              <tfoot>
                <tr className="totals-row">
                  {columns.filter(c => c.visible).map((col, idx) => (
                    <td key={col.id} style={{ textAlign: col.align }}>
                      {col.id === 'checkbox' ? '' : 
                        numericColumns.includes(col.id) 
                          ? (totals[col.id] || 0).toLocaleString('vi-VN')
                          : ''
                      }
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-row">
        <span className="pagination-info">
          Dòng {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredData.length)} trên tổng {filteredData.length.toLocaleString('vi-VN')} dòng
        </span>
        <div className="pagination-controls">
          <Button
            size="small"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            {'<<'}
          </Button>
          <Button
            size="small"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            {'<'}
          </Button>
          <span className="page-numbers">
            {Array.from({ length: Math.min(5, Math.ceil(filteredData.length / pageSize)) }, (_, i) => {
              const totalPages = Math.ceil(filteredData.length / pageSize);
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  size="small"
                  type={currentPage === pageNum ? 'primary' : 'default'}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {Math.ceil(filteredData.length / pageSize) > 5 && (
              <>
                <span>...</span>
                <Button
                  size="small"
                  type={currentPage === Math.ceil(filteredData.length / pageSize) ? 'primary' : 'default'}
                  onClick={() => setCurrentPage(Math.ceil(filteredData.length / pageSize))}
                >
                  {Math.ceil(filteredData.length / pageSize)}
                </Button>
              </>
            )}
          </span>
          <Button
            size="small"
            disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            {'>'}
          </Button>
          <Button
            size="small"
            disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
            onClick={() => setCurrentPage(Math.ceil(filteredData.length / pageSize))}
          >
            {'>>'}
          </Button>
          <Select
            size="small"
            value={pageSize}
            onChange={v => { setPageSize(v); setCurrentPage(1); }}
            options={[
              { value: 10, label: '10 / trang' },
              { value: 25, label: '25 / trang' },
              { value: 50, label: '50 / trang' },
              { value: 100, label: '100 / trang' },
            ]}
            style={{ width: 100 }}
          />
        </div>
      </div>

      {/* Context Menu for rows */}
      {contextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenuPos.y,
            left: contextMenuPos.x,
            background: '#fff',
            border: '1px solid #ccc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 2000,
          }}
          onMouseLeave={() => setContextMenuVisible(false)}
        >
          <div
            style={{ padding: '8px 12px', cursor: 'pointer' }}
            onClick={() => {
              setContextMenuVisible(false);
              if (contextMenuRow) {
                setModalProductCode(contextMenuRow.productCode || contextMenuRow.barcode || null);
                setModalColumnFilters({});
                setShowRowDetailModal(true);
              }
            }}
          >
            Xem chi tiết
          </div>
        </div>
      )}

      {/* Row Detail Modal */}
      <Modal
        title={contextMenuRow ? `Chi tiết: ${contextMenuRow.productName || contextMenuRow.productCode || contextMenuRow.barcode || ''}` : 'Chi tiết'}
        visible={showRowDetailModal}
        width={1000}
        onCancel={() => setShowRowDetailModal(false)}
        footer={null}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <table className="detail-modal-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  'Số phiếu','Ngày lập','Tên khách hàng','Mã hàng','Mã vạch','Tên hàng','ĐVT','Số lượng','Tồn cuối','Kho','Loại nghiệp vụ','Số lượng quy đổi','Mô tả','Tên nhân viên','Mã khách hàng','Quy đổi','Đơn giá','CK','Giá sau CK','Thành tiền sau CK','% giảm','Giá sau giảm','Thành tiền sau giảm','Số khối','Số Kg'
                ].map((h, i) => (
                  <th key={i} style={{ borderBottom: '1px solid #eee', padding: '8px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flattenedData.filter(r => {
                if (!modalProductCode) return false;
                return r.productCode === modalProductCode || r.barcode === modalProductCode;
              }).map(r => (
                <tr key={r.key}>
                  {[ 'soPhieu','date','customerName','productCode','barcode','productName','unit','importQty','endingBalance','warehouse','transactionType','specification','description','employeeName','customerCode','conversion','salePrice','discount','priceAfterDiscount','amountAfterDiscount','percentOff','priceAfterPercent','totalAfterPercent','volume','weight' ].map((c, idx) => (
                    <td key={idx} style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{r[c] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Column Search Modal */}
      {showSearchModal && searchColumn && (
        <div className="search-modal-overlay" onClick={closeSearchModal}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-header">
              <span>Tìm kiếm: {searchColumn.label}</span>
              <button className="close-btn" onClick={closeSearchModal}>×</button>
            </div>
            <div className="search-modal-body">
              <Input
                placeholder="Nhập giá trị tìm kiếm..."
                value={columnSearchQuery}
                onChange={e => setColumnSearchQuery(e.target.value)}
                onPressEnter={applyColumnSearch}
                autoFocus
              />
              <div className="search-suggestions">
                <div className="suggestions-header">Gợi ý giá trị:</div>
                <div className="suggestions-list">
                  {getUniqueColumnValues(searchColumn)
                    .filter(val => {
                      const q = (columnSearchQuery || '').trim().toLowerCase();
                      if (!q) return true;
                      const normalized = removeVietnameseTones(String(val).toLowerCase());
                      return normalized.includes(removeVietnameseTones(q));
                    })
                    .slice(0, 10)
                    .map((val, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => setColumnSearchQuery(val)}
                      >
                        {val}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div className="search-modal-footer">
              <Button onClick={() => { clearColumnSearch(searchColumn.id); closeSearchModal(); }}>Xóa lọc</Button>
              <Button type="primary" onClick={applyColumnSearch}>Áp dụng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaoCaoXuatNhapTon;
