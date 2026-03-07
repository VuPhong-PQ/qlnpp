import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Select, Input, Checkbox, Tooltip, Popover, Spin } from 'antd';
import { SearchOutlined, SettingOutlined, ReloadOutlined, FileExcelOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import ExcelJS from 'exceljs';
import { API_ENDPOINTS, api } from '../../../config/api';
import { removeVietnameseTones } from '../../../utils/searchUtils';
import './BcTheoLoaiHang.css';

dayjs.locale('vi');

// Parse date from dd/mm/yyyy
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

const BcTheoLoaiHang = () => {
  // ============ Date picker states (inherited from FilterSales) ============
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date());
  const [calendarBaseDate, setCalendarBaseDate] = useState(new Date());
  const [dateRangeText, setDateRangeText] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${formatDate(start)} - ${formatDate(now)}`;
  });
  const datePickerRef = useRef(null);

  // Sales person filter
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [salesPeople, setSalesPeople] = useState([]);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Table state
  const [pageSize, setPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('bclh_pageSize') || '10', 10); return isNaN(v) ? 10 : v; } catch { return 10; }
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Selected row (radio-style single select for detail)
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  // ============ Detail table state ============
  const [detailPageSize, setDetailPageSize] = useState(() => {
    try { const v = parseInt(localStorage.getItem('bclh_detail_pageSize') || '10', 10); return isNaN(v) ? 10 : v; } catch { return 10; }
  });
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailColumnFilters, setDetailColumnFilters] = useState({});
  const [detailShowSearchModal, setDetailShowSearchModal] = useState(false);
  const [detailSearchColumn, setDetailSearchColumn] = useState(null);
  const [detailColumnSearchQuery, setDetailColumnSearchQuery] = useState('');
  // Detail numeric search modal state
  const [detailSearchOperator, setDetailSearchOperator] = useState('=');
  const [detailSearchValue, setDetailSearchValue] = useState('');
  const [detailSearchValue2, setDetailSearchValue2] = useState('');
  // Detail popover checkbox-search state for barcode / productCode
  const [openDetailPopoverColumn, setOpenDetailPopoverColumn] = useState(null);
  const [detailPopoverSearchQuery, setDetailPopoverSearchQuery] = useState('');
  const [detailPopoverSelectedValues, setDetailPopoverSelectedValues] = useState([]);
  const [detailShowColumnSettings, setDetailShowColumnSettings] = useState(false);
  const [detailDragColumn, setDetailDragColumn] = useState(null);
  const [detailSettingsDragItem, setDetailSettingsDragItem] = useState(null);
  const [detailResizingColumn, setDetailResizingColumn] = useState(null);
  const detailStartXRef = useRef(0);
  const detailStartWidthRef = useRef(0);

  const DETAIL_COL_SETTINGS_KEY = 'bclh_detail_columns_v1';
  const defaultDetailColumns = [
    // keep identifier columns first, then match financial column order requested
    { id: 'barcode', label: 'Mã vạch', width: 140, visible: true, align: 'left' },
    { id: 'productCode', label: 'Mã hàng', width: 120, visible: true, align: 'left' },
    { id: 'productName', label: 'Tên hàng', width: 220, visible: true, align: 'left' },

    { id: 'triGiaBan', label: 'Trị giá bán', width: 130, visible: true, align: 'right' },
    { id: 'tongXuatThung', label: 'Tổng xuất thùng', width: 130, visible: true, align: 'right' },
    { id: 'xuatBanThung', label: 'Xuất bán thùng', width: 130, visible: true, align: 'right' },
    { id: 'lai', label: 'Lãi', width: 120, visible: true, align: 'right' },
    { id: 'tyLeLai', label: 'Tỉ lệ lãi', width: 100, visible: true, align: 'right' },
    { id: 'xuatBan', label: 'Xuất bán', width: 100, visible: true, align: 'right' },
    { id: 'khuyenMai', label: 'Khuyến mãi', width: 110, visible: true, align: 'right' },
    { id: 'tongXuat', label: 'Tổng xuất', width: 100, visible: true, align: 'right' },
    { id: 'triGiaVon', label: 'Trị giá vốn', width: 130, visible: true, align: 'right' },
    { id: 'tienKhuyenMai', label: 'Tiền khuyến mãi', width: 140, visible: true, align: 'right' },
    { id: 'vonKhuyenMai', label: 'Vốn khuyến mãi', width: 150, visible: true, align: 'right' },
  ];

  const [detailColumns, setDetailColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(DETAIL_COL_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : defaultDetailColumns;
    } catch { return defaultDetailColumns; }
  });

  useEffect(() => { localStorage.setItem(DETAIL_COL_SETTINGS_KEY, JSON.stringify(detailColumns)); }, [detailColumns]);
  useEffect(() => { localStorage.setItem('bclh_detail_pageSize', String(detailPageSize)); }, [detailPageSize]);

  // Column settings
  const COL_SETTINGS_KEY = 'bclh_columns_v1';
  const defaultColumns = [
    { id: 'loaiHang', label: 'Loại hàng', width: 180, visible: true, align: 'left' },
    { id: 'triGiaBan', label: 'Trị giá bán', width: 130, visible: true, align: 'right' },
    { id: 'tongXuatThung', label: 'Tổng xuất thùng', width: 130, visible: true, align: 'right' },
    { id: 'xuatBanThung', label: 'Xuất bán thùng', width: 130, visible: true, align: 'right' },
    { id: 'lai', label: 'Lãi', width: 120, visible: true, align: 'right' },
    { id: 'tyLeLai', label: 'Tỉ lệ lãi', width: 100, visible: true, align: 'right' },
    { id: 'xuatBan', label: 'Xuất bán', width: 100, visible: true, align: 'right' },
    { id: 'khuyenMai', label: 'Khuyến mãi', width: 110, visible: true, align: 'right' },
    { id: 'tongXuat', label: 'Tổng xuất', width: 100, visible: true, align: 'right' },
    { id: 'triGiaVon', label: 'Trị giá vốn', width: 130, visible: true, align: 'right' },
    { id: 'tienKhuyenMai', label: 'Tiền khuyến mãi', width: 140, visible: true, align: 'right' },
    { id: 'vonKhuyenMai', label: 'Vốn khuyến mãi', width: 150, visible: true, align: 'right' },
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
  // numeric search modal state
  const [searchOperator, setSearchOperator] = useState('=');
  const [searchValue, setSearchValue] = useState('');
  const [searchValue2, setSearchValue2] = useState('');
  // Loai hang popover (header checkbox list search)
  const [openPopoverColumn, setOpenPopoverColumn] = useState(null);
  const [popoverSearchQuery, setPopoverSearchQuery] = useState('');
  const [popoverSelectedValues, setPopoverSelectedValues] = useState([]);

  // Column drag-drop
  const [dragColumn, setDragColumn] = useState(null);
  const [settingsDragItem, setSettingsDragItem] = useState(null);

  // Column resize
  const [resizingColumn, setResizingColumn] = useState(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save column settings
  useEffect(() => { localStorage.setItem(COL_SETTINGS_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem('bclh_pageSize', String(pageSize)); }, [pageSize]);

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Load initial data
  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [productData, categoryData, usersData] = await Promise.all([
        api.get(API_ENDPOINTS.products),
        api.get(API_ENDPOINTS.productCategories),
        api.get(API_ENDPOINTS.users),
      ]);
      setProducts(productData || []);
      setCategories(categoryData || []);
      setSalesPeople(usersData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Search handler
  const handleSearch = async () => {
    setLoading(true);
    setDataLoaded(false);
    try {
      const exportData = await api.get(API_ENDPOINTS.exports);
      setExports(exportData || []);
      setDataLoaded(true);
      setCurrentPage(1);
      setSelectedRowKey(null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data by category
  const aggregatedData = useMemo(() => {
    if (!dataLoaded) return [];

    const startDate = selectedStartDate;
    const endDate = selectedEndDate;
    const categoryMap = {};

    (exports || []).forEach(exp => {
      const expDate = new Date(exp.date);
      if (startDate && expDate < startDate) return;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (expDate > endOfDay) return;
      }

      // Filter by sales person
      const salesPersonVal = (exp.salesPerson || exp.seller || exp.createdByName || exp.createdBy || exp.userName || (exp.user && (exp.user.name || exp.user.username)) || '').toString();
      if (selectedSalesPerson && salesPersonVal !== selectedSalesPerson) return;

      (exp.items || []).forEach(item => {
        const product = products.find(p => p.productCode === item.productCode || p.name === item.productName);
        const catName = product?.category || 'Chưa phân loại';
        const qty = Number(item.quantity) || 0;
        const promo = Number(item.promotionQty || item.khuyenMai || 0);
        const totalExport = qty + promo;
        const conversion = Number(product?.conversion || item.conversion || 1);
        const totalExportBoxes = conversion > 0 ? totalExport / conversion : 0;
        const soldBoxes = conversion > 0 ? qty / conversion : 0;
        const costPrice = Number(item.costPrice || product?.costPrice || 0);
        const salePrice = Number(item.unitPrice || item.salePrice || 0);
        const costValue = costPrice * qty;
        const promoAmount = costPrice * promo;
        const saleValue = salePrice * qty;

        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            key: catName,
            loaiHang: catName,
            xuatBan: 0,
            khuyenMai: 0,
            tongXuat: 0,
            tongXuatThung: 0,
            xuatBanThung: 0,
            triGiaVon: 0,
            tienKhuyenMai: 0,
            vonKhuyenMai: 0,
            triGiaBan: 0,
            lai: 0,
            tyLeLai: 0,
          };
        }
        const row = categoryMap[catName];
        row.xuatBan += qty;
        row.khuyenMai += promo;
        row.tongXuat += totalExport;
        row.tongXuatThung += totalExportBoxes;
        row.xuatBanThung += soldBoxes;
        row.triGiaVon += costValue;
        row.tienKhuyenMai += promoAmount;
        row.vonKhuyenMai += costValue + promoAmount;
        row.triGiaBan += saleValue;
        row.lai += saleValue - (costValue + promoAmount);
      });
    });

    // Compute profit rate
    const rows = Object.values(categoryMap);
    rows.forEach(r => {
      r.tyLeLai = r.triGiaBan > 0 ? Math.round((r.lai / r.triGiaBan) * 100) : 0;
      // Round boxes
      r.tongXuatThung = Math.round(r.tongXuatThung * 100) / 100;
      r.xuatBanThung = Math.round(r.xuatBanThung * 100) / 100;
    });

    rows.sort((a, b) => (a.loaiHang || '').localeCompare(b.loaiHang || '', 'vi'));
    return rows;
  }, [exports, selectedStartDate, selectedEndDate, selectedSalesPerson, products, dataLoaded]);

  // Apply column filters
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return aggregatedData;
    return aggregatedData.filter(row => {
      for (const [colId, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) continue;
        const cellValue = String(row[colId] ?? '').toLowerCase();
        const cellNormalized = removeVietnameseTones(cellValue);

        if (Array.isArray(filterVal)) {
          // array of selected values -> match any (exact or partial match tolerant)
          const vals = filterVal.map(v => removeVietnameseTones(String(v).toLowerCase()));
          const matched = vals.some(v => cellNormalized.includes(v) || v.includes(cellNormalized));
          if (!matched) return false;
        } else {
          const searchVal = removeVietnameseTones(String(filterVal).toLowerCase());
          if (!cellNormalized.includes(searchVal)) return false;
        }
      }
      return true;
    });
  }, [aggregatedData, columnFilters]);

  // Totals
  const numericColumns = ['xuatBan','khuyenMai','tongXuat','tongXuatThung','xuatBanThung','triGiaVon','tienKhuyenMai','vonKhuyenMai','triGiaBan','lai'];
  const detailNumericColumns = ['xuatBan','khuyenMai','tongXuat','tongXuatThung','xuatBanThung','triGiaVon','tienKhuyenMai','vonKhuyenMai','triGiaBan','lai','tyLeLai'];
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      numericColumns.forEach(c => { acc[c] = (acc[c] || 0) + (Number(row[c]) || 0); });
      return acc;
    }, {});
  }, [filteredData]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // ============ Detail data: products of selected category ============
  const detailData = useMemo(() => {
    if (!dataLoaded || !selectedRowKey) return [];
    const startDate = selectedStartDate;
    const endDate = selectedEndDate;
    const productMap = {};

    (exports || []).forEach(exp => {
      const expDate = new Date(exp.date);
      if (startDate && expDate < startDate) return;
      if (endDate) { const eod = new Date(endDate); eod.setHours(23,59,59,999); if (expDate > eod) return; }
      const salesPersonVal = (exp.salesPerson || exp.seller || exp.createdByName || exp.createdBy || exp.userName || (exp.user && (exp.user.name || exp.user.username)) || '').toString();
      if (selectedSalesPerson && salesPersonVal !== selectedSalesPerson) return;

      (exp.items || []).forEach(item => {
        const product = products.find(p => p.productCode === item.productCode || p.name === item.productName);
        const catName = product?.category || 'Chưa phân loại';
        if (catName !== selectedRowKey) return;

        const pKey = item.productCode || item.productName || product?.productCode || '';
        const qty = Number(item.quantity) || 0;
        const promo = Number(item.promotionQty || item.khuyenMai || 0);
        const totalExport = qty + promo;
        const conversion = Number(product?.conversion || item.conversion || 1);
        const totalExportBoxes = conversion > 0 ? totalExport / conversion : 0;
        const soldBoxes = conversion > 0 ? qty / conversion : 0;
        const costPrice = Number(item.costPrice || product?.costPrice || 0);
        const salePrice = Number(item.unitPrice || item.salePrice || 0);
        const costValue = costPrice * qty;
        const promoAmount = costPrice * promo;
        const saleValue = salePrice * qty;

        if (!productMap[pKey]) {
          productMap[pKey] = {
            key: pKey,
            barcode: item.barcode || product?.barcode || '',
            productCode: item.productCode || product?.productCode || '',
            productName: item.productName || product?.name || '',
            xuatBan: 0, khuyenMai: 0, tongXuat: 0, tongXuatThung: 0, xuatBanThung: 0,
            triGiaVon: 0, tienKhuyenMai: 0, vonKhuyenMai: 0, triGiaBan: 0,
            lai: 0, tyLeLai: 0,
          };
        }
        const r = productMap[pKey];
        r.xuatBan += qty;
        r.khuyenMai += promo;
        r.tongXuat += totalExport;
        r.tongXuatThung += totalExportBoxes;
        r.xuatBanThung += soldBoxes;
        r.triGiaVon += costValue;
        r.tienKhuyenMai += promoAmount;
        r.vonKhuyenMai += costValue + promoAmount;
        r.triGiaBan += saleValue;
      });
    });

    const rows = Object.values(productMap);
    rows.forEach(r => {
      r.tongXuatThung = Math.round(r.tongXuatThung * 100) / 100;
      r.xuatBanThung = Math.round(r.xuatBanThung * 100) / 100;
      // compute profit and profit rate per product row
      r.lai = (Number(r.triGiaBan) || 0) - (Number(r.vonKhuyenMai) || 0);
      r.tyLeLai = (Number(r.triGiaBan) || 0) > 0 ? Math.round((r.lai / r.triGiaBan) * 100) : 0;
      // round monetary fields
      r.triGiaBan = Math.round((Number(r.triGiaBan) || 0) * 100) / 100;
      r.triGiaVon = Math.round((Number(r.triGiaVon) || 0) * 100) / 100;
      r.tienKhuyenMai = Math.round((Number(r.tienKhuyenMai) || 0) * 100) / 100;
      r.vonKhuyenMai = Math.round((Number(r.vonKhuyenMai) || 0) * 100) / 100;
    });
    rows.sort((a, b) => (a.productName || '').localeCompare(b.productName || '', 'vi'));
    return rows;
  }, [exports, selectedStartDate, selectedEndDate, selectedSalesPerson, products, dataLoaded, selectedRowKey]);

  // Detail filtered data
  const detailFilteredData = useMemo(() => {
    if (Object.keys(detailColumnFilters).length === 0) return detailData;
    return detailData.filter(row => {
      for (const [colId, filterVal] of Object.entries(detailColumnFilters)) {
        if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) continue;
        const cellValueRaw = row[colId] ?? '';
        const cellValue = String(cellValueRaw).toLowerCase();
        const cellNormalized = removeVietnameseTones(cellValue);

        if (Array.isArray(filterVal)) {
          const vals = filterVal.map(v => removeVietnameseTones(String(v).toLowerCase()));
          const matched = vals.some(v => cellNormalized.includes(v) || v.includes(cellNormalized));
          if (!matched) return false;
        } else if (typeof filterVal === 'object' && filterVal.operator) {
          // numeric operator filter
          const num = Number(cellValueRaw) || 0;
          const v = filterVal.value != null ? Number(filterVal.value) : null;
          const v2 = filterVal.value2 != null ? Number(filterVal.value2) : null;
          switch (filterVal.operator) {
            case '=': if (v == null || num !== v) return false; break;
            case '!=': if (v == null || num === v) return false; break;
            case '>': if (v == null || !(num > v)) return false; break;
            case '>=': if (v == null || !(num >= v)) return false; break;
            case '<': if (v == null || !(num < v)) return false; break;
            case '<=': if (v == null || !(num <= v)) return false; break;
            case 'between': if (v == null || v2 == null || !(num >= Math.min(v, v2) && num <= Math.max(v, v2))) return false; break;
            default: break;
          }
        } else {
          const searchVal = removeVietnameseTones(String(filterVal).toLowerCase());
          if (!cellNormalized.includes(searchVal)) return false;
        }
      }
      return true;
    });
  }, [detailData, detailColumnFilters]);

  // Detail totals
  const detailTotals = useMemo(() => {
    return detailFilteredData.reduce((acc, row) => {
      detailNumericColumns.forEach(c => { acc[c] = (acc[c] || 0) + (Number(row[c]) || 0); });
      return acc;
    }, {});
  }, [detailFilteredData]);

  // Detail pagination
  const detailPaginatedData = useMemo(() => {
    const start = (detailCurrentPage - 1) * detailPageSize;
    return detailFilteredData.slice(start, start + detailPageSize);
  }, [detailFilteredData, detailCurrentPage, detailPageSize]);

  // Reset detail page when category changes
  useEffect(() => { setDetailCurrentPage(1); setDetailColumnFilters({}); }, [selectedRowKey]);

  // Sales person options
  const salesPersonOptions = useMemo(() => {
    return salesPeople.map(u => ({
      value: (u.name || u.username || String(u.id)),
      label: `${u.name || u.username || String(u.id)}${u.position ? ` ${u.position}` : ''}`
    }));
  }, [salesPeople]);

  // ============ Date picker handlers (inherited from FilterSales) ============
  const handleDateRangeClick = () => setShowDatePicker(!showDatePicker);

  const handleDateRangeInputChange = (e) => {
    setDateRangeText(e.target.value);
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

    const monthNames = ['Tháng 01','Tháng 02','Tháng 03','Tháng 04','Tháng 05','Tháng 06','Tháng 07','Tháng 08','Tháng 09','Tháng 10','Tháng 11','Tháng 12'];

    const handleNavPrev = () => { const d = new Date(calendarBaseDate); d.setMonth(d.getMonth() - 1); setCalendarBaseDate(d); };
    const handleNavNext = () => { const d = new Date(calendarBaseDate); d.setMonth(d.getMonth() + 1); setCalendarBaseDate(d); };

    const days = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(current);
      const isCurrentMonth = dayDate.getMonth() === month;
      const dayTime = dayDate.setHours(0, 0, 0, 0);
      const startTime = selectedStartDate ? new Date(selectedStartDate).setHours(0, 0, 0, 0) : null;
      const endTime = selectedEndDate ? new Date(selectedEndDate).setHours(0, 0, 0, 0) : null;
      const isSelected = ((startTime && dayTime === startTime) || (endTime && dayTime === endTime) || (startTime && endTime && dayTime > startTime && dayTime < endTime));
      const isStart = startTime && dayTime === startTime;
      const isEnd = endTime && dayTime === endTime;

      days.push(
        <div key={i}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''}`}
          onClick={() => {
            const clickedDate = new Date(dayDate); clickedDate.setHours(0, 0, 0, 0);
            if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
              setSelectedStartDate(clickedDate); setSelectedEndDate(null);
            } else {
              if (clickedDate >= selectedStartDate) { handleDateSelect(clickedDate, 'end'); }
              else { setSelectedStartDate(clickedDate); setSelectedEndDate(selectedStartDate); setDateRangeText(`${formatDate(clickedDate)} - ${formatDate(selectedStartDate)}`); }
            }
          }}
        >{new Date(current).getDate()}</div>
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
        <div className="calendar-weekdays"><div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div></div>
        <div className="calendar-days">{days}</div>
      </div>
    );
  };

  // ============ Column features (inherited from FilterSales) ============
  const toggleColumn = (colId) => setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  const resetColumns = () => setColumns(defaultColumns);

  const handleColumnDragStart = (e, id) => { setDragColumn(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleColumnDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleColumnDrop = (e, id) => {
    e.preventDefault();
    if (!dragColumn || dragColumn === id) return;
    setColumns(prev => { const arr = [...prev]; const from = arr.findIndex(c => c.id === dragColumn); const to = arr.findIndex(c => c.id === id); if (from < 0 || to < 0) return prev; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
    setDragColumn(null);
  };
  const handleColumnDragEnd = () => setDragColumn(null);

  const handleSettingsDragStart = (e, index) => { setSettingsDragItem(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleSettingsDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleSettingsDrop = (e, index) => {
    e.preventDefault();
    setColumns(prev => { const arr = [...prev]; const item = arr.splice(settingsDragItem, 1)[0]; arr.splice(index, 0, item); return arr; });
    setSettingsDragItem(null);
  };
  const handleSettingsDragEnd = () => setSettingsDragItem(null);

  const handleResizeStart = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setResizingColumn(id);
    startXRef.current = e.clientX;
    const col = columns.find(c => c.id === id);
    startWidthRef.current = col ? col.width : 100;
    const onMouseMove = (ev) => {
      const dx = ev.clientX - startXRef.current;
      setColumns(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(50, startWidthRef.current + dx) } : c));
    };
    const onMouseUp = () => { setResizingColumn(null); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Column search
  const openColumnSearch = (colId, label) => {
    setSearchColumn({ id: colId, label });
    const existing = columnFilters[colId];
    if (numericColumns.includes(colId) && existing && typeof existing === 'object') {
      setSearchOperator(existing.operator || '=');
      setSearchValue(existing.value != null ? String(existing.value) : '');
      setSearchValue2(existing.value2 != null ? String(existing.value2) : '');
    } else {
      setColumnSearchQuery(existing && !Array.isArray(existing) ? String(existing) : '');
      setSearchOperator('='); setSearchValue(''); setSearchValue2('');
    }
    setShowSearchModal(true);
  };
  const closeSearchModal = () => { setShowSearchModal(false); setSearchColumn(null); setColumnSearchQuery(''); setSearchOperator('='); setSearchValue(''); setSearchValue2(''); };
  const applyColumnSearch = () => {
    if (!searchColumn) return closeSearchModal();
    if (numericColumns.includes(searchColumn.id)) {
      const v = searchValue !== '' ? Number(searchValue) : null;
      const v2 = searchValue2 !== '' ? Number(searchValue2) : null;
      if (v == null && v2 == null) {
        // nothing
      } else {
        setColumnFilters(prev => ({ ...prev, [searchColumn.id]: { operator: searchOperator, value: v, value2: v2 } }));
      }
    } else {
      if (columnSearchQuery.trim()) { setColumnFilters(prev => ({ ...prev, [searchColumn.id]: columnSearchQuery.trim() })); }
    }
    closeSearchModal();
  };
  const clearColumnSearch = (colId) => { const f = { ...columnFilters }; delete f[colId]; setColumnFilters(f); };

  // Loai hang popover handlers
  const openLoaiHangPopover = (colId) => {
    setOpenPopoverColumn(colId);
    setPopoverSearchQuery('');
    const existing = columnFilters[colId];
    setPopoverSelectedValues(Array.isArray(existing) ? existing.slice() : []);
  };
  const closeLoaiHangPopover = () => { setOpenPopoverColumn(null); setPopoverSearchQuery(''); setPopoverSelectedValues([]); };
  const togglePopoverValue = (val) => {
    setPopoverSelectedValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const selectAllPopoverValues = (col) => {
    const all = getLoaiHangOptions(col);
    setPopoverSelectedValues(all);
  };
  const applyPopoverFilter = (col) => {
    setColumnFilters(prev => ({ ...prev, [col.id]: popoverSelectedValues.slice() }));
    closeLoaiHangPopover();
  };

  const getUniqueColumnValues = (col) => {
    if (!col) return [];
    const values = new Set();
    filteredData.forEach(row => { const val = row[col.id]; if (val !== null && val !== undefined && val !== '') values.add(String(val)); });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  const getUniqueColumnValuesFull = (col) => {
    if (!col) return [];
    const values = new Set();
    (aggregatedData || []).forEach(row => { const val = row[col.id]; if (val !== null && val !== undefined && val !== '') values.add(String(val)); });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Get suggestion options for Loại hàng: prefer categories loaded from API, fallback to aggregated data
  const getLoaiHangOptions = (col) => {
    try {
      if (categories && categories.length > 0) {
        const vals = categories.map(c => (c.name || c.categoryName || c.label || c.loaiHang || c)).filter(Boolean).map(String);
        return Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b, 'vi'));
      }
    } catch (e) {
      // ignore and fallback
    }
    return getUniqueColumnValuesFull(col);
  };

  // Render cell value
  const renderCell = (row, colId) => {
    const value = row[colId];
    if (numericColumns.includes(colId)) return (Number(value) || 0).toLocaleString('vi-VN');
    if (colId === 'tyLeLai') return value != null ? value : '';
    return value || '';
  };

  const renderDetailCell = (row, colId) => {
    const value = row[colId];
    if (detailNumericColumns.includes(colId)) return (Number(value) || 0).toLocaleString('vi-VN');
    return value || '';
  };

  // ============ Detail column features ============
  const detailToggleColumn = (colId) => setDetailColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  const detailResetColumns = () => setDetailColumns(defaultDetailColumns);

  const handleDetailColumnDragStart = (e, id) => { setDetailDragColumn(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDetailColumnDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDetailColumnDrop = (e, id) => {
    e.preventDefault();
    if (!detailDragColumn || detailDragColumn === id) return;
    setDetailColumns(prev => { const arr = [...prev]; const from = arr.findIndex(c => c.id === detailDragColumn); const to = arr.findIndex(c => c.id === id); if (from < 0 || to < 0) return prev; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
    setDetailDragColumn(null);
  };
  const handleDetailColumnDragEnd = () => setDetailDragColumn(null);

  const handleDetailSettingsDragStart = (e, index) => { setDetailSettingsDragItem(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDetailSettingsDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDetailSettingsDrop = (e, index) => {
    e.preventDefault();
    setDetailColumns(prev => { const arr = [...prev]; const item = arr.splice(detailSettingsDragItem, 1)[0]; arr.splice(index, 0, item); return arr; });
    setDetailSettingsDragItem(null);
  };
  const handleDetailSettingsDragEnd = () => setDetailSettingsDragItem(null);

  const handleDetailResizeStart = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setDetailResizingColumn(id);
    detailStartXRef.current = e.clientX;
    const col = detailColumns.find(c => c.id === id);
    detailStartWidthRef.current = col ? col.width : 100;
    const onMouseMove = (ev) => {
      const dx = ev.clientX - detailStartXRef.current;
      setDetailColumns(prev => prev.map(c => c.id === id ? { ...c, width: Math.max(50, detailStartWidthRef.current + dx) } : c));
    };
    const onMouseUp = () => { setDetailResizingColumn(null); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const openDetailColumnSearch = (colId, label) => {
    setDetailSearchColumn({ id: colId, label });
    const existing = detailColumnFilters[colId];
    if (detailNumericColumns.includes(colId) && existing && typeof existing === 'object' && existing.operator) {
      setDetailSearchOperator(existing.operator || '=');
      setDetailSearchValue(existing.value != null ? String(existing.value) : '');
      setDetailSearchValue2(existing.value2 != null ? String(existing.value2) : '');
    } else {
      setDetailColumnSearchQuery(existing && !Array.isArray(existing) ? String(existing) : '');
      setDetailSearchOperator('='); setDetailSearchValue(''); setDetailSearchValue2('');
    }
    setDetailShowSearchModal(true);
  };
  const closeDetailSearchModal = () => { setDetailShowSearchModal(false); setDetailSearchColumn(null); setDetailColumnSearchQuery(''); setDetailSearchOperator('='); setDetailSearchValue(''); setDetailSearchValue2(''); };
  const applyDetailColumnSearch = () => {
    if (!detailSearchColumn) return closeDetailSearchModal();
    if (detailNumericColumns.includes(detailSearchColumn.id)) {
      const v = detailSearchValue !== '' ? Number(detailSearchValue) : null;
      const v2 = detailSearchValue2 !== '' ? Number(detailSearchValue2) : null;
      if (v != null || v2 != null) {
        setDetailColumnFilters(prev => ({ ...prev, [detailSearchColumn.id]: { operator: detailSearchOperator, value: v, value2: v2 } }));
      }
    } else {
      if (detailColumnSearchQuery.trim()) { setDetailColumnFilters(prev => ({ ...prev, [detailSearchColumn.id]: detailColumnSearchQuery.trim() })); }
    }
    closeDetailSearchModal();
  };
  const clearDetailColumnSearch = (colId) => { const f = { ...detailColumnFilters }; delete f[colId]; setDetailColumnFilters(f); };

  const getDetailUniqueColumnValues = (col) => {
    if (!col) return [];
    const values = new Set();
    detailFilteredData.forEach(row => { const val = row[col.id]; if (val !== null && val !== undefined && val !== '') values.add(String(val)); });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  const getDetailOptions = (col) => {
    if (!col) return [];
    const setVals = new Set();
    // prefer global products list for suggestions
    (products || []).forEach(p => {
      if (col.id === 'barcode') {
        if (p.barcode) setVals.add(String(p.barcode));
      } else if (col.id === 'productCode') {
        if (p.productCode) setVals.add(String(p.productCode));
      }
    });
    // also include any values present in current detailData
    (detailData || []).forEach(r => { const v = r[col.id]; if (v !== null && v !== undefined && v !== '') setVals.add(String(v)); });
    return Array.from(setVals).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Suggestions combining productCode + barcode + productName + sale price + stock
  const getProductSuggestionStrings = () => {
    const setVals = new Set();
    (products || []).forEach(p => {
      const code = p.productCode || p.code || '';
      const barcode = p.barcode || '';
      const name = p.name || p.productName || p.label || '';
      const price = p.salePrice || p.unitPrice || p.price || p.retailPrice || p.triGiaBan || '';
      const stock = p.stock != null ? String(p.stock) : (p.quantityOnHand != null ? String(p.quantityOnHand) : '');
      const parts = [code, barcode, name, price, stock].map(x => (x === null || x === undefined) ? '' : String(x).trim()).filter(Boolean);
      if (parts.length) setVals.add(parts.join(' | '));
    });
    // include detailData-derived entries
    (detailData || []).forEach(r => {
      const code = r.productCode || '';
      const barcode = r.barcode || '';
      const name = r.productName || '';
      const price = r.triGiaBan || r.triGiaBan || '';
      const stock = r.stock || '';
      const parts = [code, barcode, name, price, stock].map(x => (x === null || x === undefined) ? '' : String(x).trim()).filter(Boolean);
      if (parts.length) setVals.add(parts.join(' | '));
    });
    return Array.from(setVals).sort((a, b) => a.localeCompare(b, 'vi'));
  };

  // Detail Excel export
  const exportDetailToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chi tiết loại hàng');
    const visibleCols = detailColumns.filter(c => c.visible);
    worksheet.addRow(visibleCols.map(c => c.label));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
    detailFilteredData.forEach(row => {
      worksheet.addRow(visibleCols.map(c => {
        const v = row[c.id]; if (detailNumericColumns.includes(c.id)) return Number(v) || 0; return v || '';
      }));
    });
    worksheet.addRow(visibleCols.map(c => {
      if (c.id === 'barcode') return 'TỔNG CỘNG';
      if (detailNumericColumns.includes(c.id)) return detailTotals[c.id] || 0;
      return '';
    }));
    const tRow = worksheet.getRow(worksheet.rowCount);
    tRow.font = { bold: true };
    tRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    visibleCols.forEach((col, idx) => { worksheet.getColumn(idx + 1).width = Math.max(col.width / 8, 12); });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Chi_tiet_${selectedRowKey || 'loai_hang'}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    a.click(); window.URL.revokeObjectURL(url);
  };

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BC theo loại hàng');
    const visibleCols = columns.filter(c => c.visible);
    worksheet.addRow(visibleCols.map(c => c.label));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
    filteredData.forEach(row => {
      worksheet.addRow(visibleCols.map(c => {
        const v = row[c.id];
        if (numericColumns.includes(c.id) || c.id === 'tyLeLai') return Number(v) || 0;
        return v || '';
      }));
    });
    worksheet.addRow(visibleCols.map(c => {
      if (c.id === 'loaiHang') return 'TỔNG CỘNG';
      if (numericColumns.includes(c.id)) return totals[c.id] || 0;
      return '';
    }));
    const totalsRow = worksheet.getRow(worksheet.rowCount);
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    visibleCols.forEach((col, idx) => { worksheet.getColumn(idx + 1).width = Math.max(col.width / 8, 12); });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BC_theo_loai_hang_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Column settings popover
  const columnSettingsContent = (
    <div className="column-settings-popover">
      <div className="column-settings-header">Tùy chọn cột hiển thị</div>
      <div className="column-settings-list">
        {columns.map((col, index) => (
          <div key={col.id} className={`column-settings-item ${settingsDragItem === index ? 'dragging' : ''}`}
            draggable onDragStart={(e) => handleSettingsDragStart(e, index)} onDragOver={handleSettingsDragOver}
            onDrop={(e) => handleSettingsDrop(e, index)} onDragEnd={handleSettingsDragEnd}>
            <span className="drag-handle">⋮⋮</span>
            <Checkbox checked={col.visible} onChange={() => toggleColumn(col.id)}>{col.label}</Checkbox>
          </div>
        ))}
      </div>
      <div className="column-settings-actions"><Button size="small" onClick={resetColumns}>Đặt lại mặc định</Button></div>
    </div>
  );

  // Detail column settings popover
  const detailColumnSettingsContent = (
    <div className="column-settings-popover">
      <div className="column-settings-header">Tùy chọn cột hiển thị</div>
      <div className="column-settings-list">
        {detailColumns.map((col, index) => (
          <div key={col.id} className={`column-settings-item ${detailSettingsDragItem === index ? 'dragging' : ''}`}
            draggable onDragStart={(e) => handleDetailSettingsDragStart(e, index)} onDragOver={handleDetailSettingsDragOver}
            onDrop={(e) => handleDetailSettingsDrop(e, index)} onDragEnd={handleDetailSettingsDragEnd}>
            <span className="drag-handle">⋮⋮</span>
            <Checkbox checked={col.visible} onChange={() => detailToggleColumn(col.id)}>{col.label}</Checkbox>
          </div>
        ))}
      </div>
      <div className="column-settings-actions"><Button size="small" onClick={detailResetColumns}>Đặt lại mặc định</Button></div>
    </div>
  );

  return (
    <div className="bc-loai-hang-page">
      {openDetailPopoverColumn && (
        <div className="popover-mask" onClick={() => setOpenDetailPopoverColumn(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1100 }} />
      )}
      <div className="page-header"><h1>BÁO CÁO DOANH SỐ THEO LOẠI HÀNG</h1></div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-item date-range-container small" ref={datePickerRef}>
            <input type="text" value={dateRangeText} className="date-range-input" placeholder="DD/MM/YYYY - DD/MM/YYYY" onClick={handleDateRangeClick} readOnly />
            <span className="date-range-icon" onClick={handleDateRangeClick}>📅</span>
            {showDatePicker && (
              <div className="date-picker-popup">
                <div className="date-picker-header">
                  <input type="text" value={dateRangeText} onChange={handleDateRangeInputChange} className="date-range-display" placeholder="dd/mm/yyyy - dd/mm/yyyy" />
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
              placeholder="Nhân viên sales (Tên - Vị trí)"
              value={selectedSalesPerson}
              onChange={setSelectedSalesPerson}
              allowClear
              showSearch
              // custom filter to allow searching without Vietnamese diacritics
              filterOption={(input, option) => {
                try {
                  const label = (option?.label || option?.children || '')?.toString();
                  return removeVietnameseTones(label.toLowerCase()).includes(removeVietnameseTones(input.toLowerCase()));
                } catch (e) {
                  return false;
                }
              }}
              options={salesPersonOptions}
              style={{ width: '100%' }}
            />
          </div>

          <div className="filter-item search-btn-container">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading} className="search-btn">
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <span className="total-count">Tổng {filteredData.length.toLocaleString('vi-VN')}</span>
        <div className="toolbar-actions">
          <Tooltip title="Xuất Excel"><Button icon={<FileExcelOutlined />} onClick={exportToExcel} disabled={filteredData.length === 0} className="excel-btn" /></Tooltip>
          <Tooltip title="Làm mới"><Button icon={<ReloadOutlined />} onClick={handleSearch} /></Tooltip>
        </div>
        <div className="settings-corner">
          <Popover content={columnSettingsContent} trigger="click" open={showColumnSettings} onOpenChange={setShowColumnSettings} placement="bottomRight">
            <Tooltip title="Tùy chọn cột"><Button icon={<SettingOutlined />} /></Tooltip>
          </Popover>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40, minWidth: 40, textAlign: 'center' }}></th>
                {columns.filter(c => c.visible).map(col => (
                  <th key={col.id}
                    style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                    className={`${columnFilters[col.id] ? 'filtered' : ''} ${resizingColumn === col.id ? 'resizing' : ''}`}
                    draggable onDragStart={(e) => handleColumnDragStart(e, col.id)} onDragOver={handleColumnDragOver}
                    onDrop={(e) => handleColumnDrop(e, col.id)} onDragEnd={handleColumnDragEnd}>
                    <div className="th-content">
                      <span className="th-label">{col.label}</span>
                      <div className="th-actions">
                        {col.id === 'loaiHang' ? (
                          <Popover
                            content={
                              <div style={{ width: 300 }} className="loaihang-popover">
                                <Input placeholder={`Tìm kiếm theo ${col.label}`} value={popoverSearchQuery} onChange={e => setPopoverSearchQuery(e.target.value)} style={{ marginBottom: 8 }} />
                                <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 8 }}>
                                  {getLoaiHangOptions(col)
                                    .filter(v => {
                                      const q = (popoverSearchQuery || '').trim().toLowerCase();
                                      if (!q) return true;
                                      return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(q));
                                    })
                                    .map((val) => (
                                      <div key={val} style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
                                        <Checkbox checked={popoverSelectedValues.includes(val)} onChange={() => togglePopoverValue(val)} />
                                        <span style={{ marginLeft: 8 }}>{val}</span>
                                      </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                  <Button size="small" onClick={() => selectAllPopoverValues(col)}>Xem tất cả</Button>
                                  <div>
                                    <Button size="small" style={{ marginRight: 8 }} onClick={() => { clearColumnSearch(col.id); closeLoaiHangPopover(); }}>Xóa</Button>
                                    <Button type="primary" size="small" onClick={() => applyPopoverFilter(col)}>Tìm</Button>
                                  </div>
                                </div>
                              </div>
                            }
                            trigger="click"
                            open={openPopoverColumn === col.id}
                            onOpenChange={(open) => { if (open) openLoaiHangPopover(col.id); else closeLoaiHangPopover(); }}
                            placement="bottom"
                          >
                            <Tooltip title="Tìm kiếm">
                              <button className={`filter-btn ${columnFilters[col.id] ? 'active' : ''}`}>
                                <SearchOutlined />
                              </button>
                            </Tooltip>
                          </Popover>
                        ) : (
                          <>
                            <Tooltip title="Tìm kiếm">
                              <button className={`filter-btn ${columnFilters[col.id] ? 'active' : ''}`} onClick={() => openColumnSearch(col.id, col.label)}>
                                <SearchOutlined />
                              </button>
                            </Tooltip>
                            {columnFilters[col.id] && (
                              <Tooltip title="Xóa lọc">
                                <button className="clear-filter-btn" onClick={() => clearColumnSearch(col.id)}><CloseOutlined /></button>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>
                      <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, col.id)} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.filter(c => c.visible).length + 1} className="loading-cell"><Spin size="large" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={columns.filter(c => c.visible).length + 1} className="empty-cell">{dataLoaded ? 'Không có dữ liệu' : 'Nhấn "Tìm kiếm" để tải dữ liệu'}</td></tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.key} className={selectedRowKey === row.key ? 'selected-row' : ''} onClick={() => setSelectedRowKey(row.key)}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="radio" name="bclh-radio" checked={selectedRowKey === row.key} onChange={() => setSelectedRowKey(row.key)} />
                    </td>
                    {columns.filter(c => c.visible).map(col => (
                      <td key={col.id} style={{ textAlign: col.align }}>{renderCell(row, col.id)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {paginatedData.length > 0 && (
              <tfoot>
                <tr className="totals-row">
                  <td></td>
                  {columns.filter(c => c.visible).map(col => (
                    <td key={col.id} style={{ textAlign: col.align }}>
                      {numericColumns.includes(col.id) ? (totals[col.id] || 0).toLocaleString('vi-VN') : ''}
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
          Dòng {filteredData.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}-{Math.min(currentPage * pageSize, filteredData.length)} trên tổng {filteredData.length.toLocaleString('vi-VN')} dòng
        </span>
        <div className="pagination-controls">
          <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{'<'}</Button>
          <span className="page-numbers">
            {Array.from({ length: Math.min(5, Math.ceil(filteredData.length / pageSize) || 1) }, (_, i) => {
              const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return <Button key={pageNum} size="small" type={currentPage === pageNum ? 'primary' : 'default'} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>;
            })}
          </span>
          <Button size="small" disabled={currentPage >= (Math.ceil(filteredData.length / pageSize) || 1)} onClick={() => setCurrentPage(p => p + 1)}>{'>'}</Button>
          <Select size="small" value={pageSize} onChange={v => { setPageSize(v); setCurrentPage(1); }}
            options={[{ value: 10, label: '10 / trang' }, { value: 25, label: '25 / trang' }, { value: 50, label: '50 / trang' }, { value: 100, label: '100 / trang' }]}
            style={{ width: 100 }} />
        </div>
      </div>

      {/* ============ CHI TIẾT Section ============ */}
      <div className="detail-section">
        <div className="page-header"><h1>CHI TIẾT</h1></div>

        {/* Detail Stats Row */}
        <div className="stats-row">
          <span className="total-count">Tổng {detailFilteredData.length.toLocaleString('vi-VN')}</span>
          <div className="toolbar-actions">
            <Tooltip title="Xuất Excel"><Button icon={<FileExcelOutlined />} onClick={exportDetailToExcel} disabled={detailFilteredData.length === 0} className="excel-btn" /></Tooltip>
            <Tooltip title="Làm mới"><Button icon={<ReloadOutlined />} onClick={() => { setDetailColumnFilters({}); setDetailCurrentPage(1); }} /></Tooltip>
          </div>
          <div className="settings-corner">
            <Popover content={detailColumnSettingsContent} trigger="click" open={detailShowColumnSettings} onOpenChange={setDetailShowColumnSettings} placement="bottomRight">
              <Tooltip title="Tùy chọn cột"><Button icon={<SettingOutlined />} /></Tooltip>
            </Popover>
          </div>
        </div>

        {/* Detail Table */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {detailColumns.filter(c => c.visible).map(col => (
                    <th key={col.id}
                      style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                      className={`${detailColumnFilters[col.id] ? 'filtered' : ''} ${detailResizingColumn === col.id ? 'resizing' : ''}`}
                      draggable onDragStart={(e) => handleDetailColumnDragStart(e, col.id)} onDragOver={handleDetailColumnDragOver}
                      onDrop={(e) => handleDetailColumnDrop(e, col.id)} onDragEnd={handleDetailColumnDragEnd}>
                      <div className="th-content">
                        <span className="th-label">{col.label}</span>
                        <div className="th-actions">
                          {(col.id === 'barcode' || col.id === 'productCode' || col.id === 'productName') ? (
                            <Popover
                              content={
                                <div style={{ width: '100%' }} className="detail-popover">
                                  <Input placeholder={`Tìm kiếm theo ${col.label}`} value={detailPopoverSearchQuery} onChange={e => setDetailPopoverSearchQuery(e.target.value)} style={{ marginBottom: 8 }} />
                                  <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                                    {(col.id === 'productName' ? getProductSuggestionStrings() : getDetailOptions(col))
                                      .filter(v => {
                                        const q = (detailPopoverSearchQuery || '').trim().toLowerCase();
                                        if (!q) return true;
                                        return removeVietnameseTones(String(v).toLowerCase()).includes(removeVietnameseTones(q));
                                      })
                                      .map((val) => (
                                        <div key={val} style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
                                          <Checkbox checked={detailPopoverSelectedValues.includes(val)} onChange={() => setDetailPopoverSelectedValues(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])} />
                                          <span style={{ marginLeft: 8 }}>{val}</span>
                                        </div>
                                      ))}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                    <Button size="small" onClick={() => setDetailPopoverSelectedValues(col.id === 'productName' ? getProductSuggestionStrings() : getDetailOptions(col))}>Xem tất cả</Button>
                                    <div>
                                      <Button size="small" style={{ marginRight: 8 }} onClick={() => { clearDetailColumnSearch(col.id); setOpenDetailPopoverColumn(null); }}>Xóa</Button>
                                      <Button type="primary" size="small" onClick={() => { setDetailColumnFilters(prev => ({ ...prev, [col.id]: detailPopoverSelectedValues.slice() })); setOpenDetailPopoverColumn(null); }}>Tìm</Button>
                                    </div>
                                  </div>
                                </div>
                              }
                              overlayStyle={{ zIndex: 1101, width: '50vw' }}
                              trigger="click"
                              open={openDetailPopoverColumn === col.id}
                              onOpenChange={(open) => { if (open) { setOpenDetailPopoverColumn(col.id); setDetailPopoverSearchQuery(''); const existing = detailColumnFilters[col.id]; setDetailPopoverSelectedValues(Array.isArray(existing) ? existing.slice() : []); } else { setOpenDetailPopoverColumn(null); } }}
                              placement="bottom"
                            >
                              <Tooltip title="Tìm kiếm">
                                <button className={`filter-btn ${detailColumnFilters[col.id] ? 'active' : ''}`}>
                                  <SearchOutlined />
                                </button>
                              </Tooltip>
                            </Popover>
                          ) : (
                            <>
                              <Tooltip title="Tìm kiếm">
                                <button className={`filter-btn ${detailColumnFilters[col.id] ? 'active' : ''}`} onClick={() => openDetailColumnSearch(col.id, col.label)}>
                                  <SearchOutlined />
                                </button>
                              </Tooltip>
                              {detailColumnFilters[col.id] && (
                                <Tooltip title="Xóa lọc">
                                  <button className="clear-filter-btn" onClick={() => clearDetailColumnSearch(col.id)}><CloseOutlined /></button>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>
                        <div className="resize-handle" onMouseDown={(e) => handleDetailResizeStart(e, col.id)} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!selectedRowKey ? (
                  <tr><td colSpan={detailColumns.filter(c => c.visible).length} className="empty-cell">Chọn một loại hàng ở bảng trên để xem chi tiết</td></tr>
                ) : detailPaginatedData.length === 0 ? (
                  <tr><td colSpan={detailColumns.filter(c => c.visible).length} className="empty-cell">Không có dữ liệu chi tiết</td></tr>
                ) : (
                  detailPaginatedData.map((row) => (
                    <tr key={row.key}>
                      {detailColumns.filter(c => c.visible).map(col => (
                        <td key={col.id} style={{ textAlign: col.align }}>{renderDetailCell(row, col.id)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {detailPaginatedData.length > 0 && (
                <tfoot>
                  <tr className="totals-row">
                    {detailColumns.filter(c => c.visible).map(col => (
                      <td key={col.id} style={{ textAlign: col.align }}>
                        {detailNumericColumns.includes(col.id) ? (detailTotals[col.id] || 0).toLocaleString('vi-VN') : ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Detail Pagination */}
        <div className="pagination-row">
          <span className="pagination-info">
            Dòng {detailFilteredData.length > 0 ? ((detailCurrentPage - 1) * detailPageSize) + 1 : 0}-{Math.min(detailCurrentPage * detailPageSize, detailFilteredData.length)} trên tổng {detailFilteredData.length.toLocaleString('vi-VN')} dòng
          </span>
          <div className="pagination-controls">
            <Button size="small" disabled={detailCurrentPage === 1} onClick={() => setDetailCurrentPage(p => p - 1)}>{'<'}</Button>
            <span className="page-numbers">
              {Array.from({ length: Math.min(5, Math.ceil(detailFilteredData.length / detailPageSize) || 1) }, (_, i) => {
                const totalPages = Math.ceil(detailFilteredData.length / detailPageSize) || 1;
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (detailCurrentPage <= 3) pageNum = i + 1;
                else if (detailCurrentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = detailCurrentPage - 2 + i;
                return <Button key={pageNum} size="small" type={detailCurrentPage === pageNum ? 'primary' : 'default'} onClick={() => setDetailCurrentPage(pageNum)}>{pageNum}</Button>;
              })}
            </span>
            <Button size="small" disabled={detailCurrentPage >= (Math.ceil(detailFilteredData.length / detailPageSize) || 1)} onClick={() => setDetailCurrentPage(p => p + 1)}>{'>'}</Button>
            <Select size="small" value={detailPageSize} onChange={v => { setDetailPageSize(v); setDetailCurrentPage(1); }}
              options={[{ value: 10, label: '10 / trang' }, { value: 25, label: '25 / trang' }, { value: 50, label: '50 / trang' }, { value: 100, label: '100 / trang' }]}
              style={{ width: 100 }} />
          </div>
        </div>
      </div>

      {/* Column Search Modal (top table) */}
      {showSearchModal && searchColumn && (
        <div className="search-modal-overlay" onClick={closeSearchModal}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-header">
              <span>Tìm kiếm: {searchColumn.label}</span>
              <button className="close-btn" onClick={closeSearchModal}>×</button>
            </div>
            <div className="search-modal-body">
                    {numericColumns.includes(searchColumn.id) ? (
                      <div>
                        <div style={{ marginBottom: 8 }}><label>Phép toán</label>
                          <Select value={searchOperator} onChange={setSearchOperator} style={{ width: '100%' }} options={[
                            { value: '=', label: 'Bằng' },
                            { value: '!=', label: 'Khác' },
                            { value: '>', label: 'Lớn hơn' },
                            { value: '>=', label: 'Lớn hơn hoặc bằng' },
                            { value: '<', label: 'Nhỏ hơn' },
                            { value: '<=', label: 'Nhỏ hơn hoặc bằng' },
                            { value: 'between', label: 'Trong khoảng' },
                          ]} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Input placeholder="Số lượng" value={searchValue} onChange={e => setSearchValue(e.target.value)} onPressEnter={applyColumnSearch} />
                          {searchOperator === 'between' && <Input placeholder="Đến" value={searchValue2} onChange={e => setSearchValue2(e.target.value)} onPressEnter={applyColumnSearch} />}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Input placeholder="Nhập giá trị tìm kiếm..." value={columnSearchQuery} onChange={e => setColumnSearchQuery(e.target.value)} onPressEnter={applyColumnSearch} autoFocus />
                        <div className="search-suggestions">
                          <div className="suggestions-header">Gợi ý giá trị:</div>
                          <div className="suggestions-list">
                            {getUniqueColumnValues(searchColumn)
                              .filter(val => { const q = (columnSearchQuery || '').trim().toLowerCase(); if (!q) return true; return removeVietnameseTones(String(val).toLowerCase()).includes(removeVietnameseTones(q)); })
                              .slice(0, 10)
                              .map((val, idx) => (<button key={idx} className="suggestion-item" onClick={() => setColumnSearchQuery(val)}>{val}</button>))}
                          </div>
                        </div>
                      </>
                    )}
            </div>
            <div className="search-modal-footer">
              <Button onClick={() => { clearColumnSearch(searchColumn.id); closeSearchModal(); }}>Xem tất cả</Button>
              <Button type="primary" onClick={applyColumnSearch}>Tìm</Button>
            </div>
          </div>
        </div>
      )}

      {/* Column Search Modal (detail table) */}
      {detailShowSearchModal && detailSearchColumn && (
        <div className="search-modal-overlay" onClick={closeDetailSearchModal}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-modal-header">
              <span>Tìm kiếm: {detailSearchColumn.label}</span>
              <button className="close-btn" onClick={closeDetailSearchModal}>×</button>
            </div>
            <div className="search-modal-body">
              {detailNumericColumns.includes(detailSearchColumn.id) ? (
                <div>
                  <div style={{ marginBottom: 8 }}><label>Phép toán</label>
                    <Select value={detailSearchOperator} onChange={setDetailSearchOperator} style={{ width: '100%' }} options={[
                      { value: '=', label: 'Bằng' },
                      { value: '!=', label: 'Khác' },
                      { value: '>', label: 'Lớn hơn' },
                      { value: '>=', label: 'Lớn hơn hoặc bằng' },
                      { value: '<', label: 'Nhỏ hơn' },
                      { value: '<=', label: 'Nhỏ hơn hoặc bằng' },
                      { value: 'between', label: 'Trong khoảng' },
                    ]} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input placeholder="Số lượng" value={detailSearchValue} onChange={e => setDetailSearchValue(e.target.value)} onPressEnter={applyDetailColumnSearch} />
                    {detailSearchOperator === 'between' && <Input placeholder="Đến" value={detailSearchValue2} onChange={e => setDetailSearchValue2(e.target.value)} onPressEnter={applyDetailColumnSearch} />}
                  </div>
                </div>
              ) : (
                <>
                  <Input placeholder="Nhập giá trị tìm kiếm..." value={detailColumnSearchQuery} onChange={e => setDetailColumnSearchQuery(e.target.value)} onPressEnter={applyDetailColumnSearch} autoFocus />
                  <div className="search-suggestions">
                    <div className="suggestions-header">Gợi ý giá trị:</div>
                    <div className="suggestions-list">
                      {getDetailUniqueColumnValues(detailSearchColumn)
                        .filter(val => { const q = (detailColumnSearchQuery || '').trim().toLowerCase(); if (!q) return true; return removeVietnameseTones(String(val).toLowerCase()).includes(removeVietnameseTones(q)); })
                        .slice(0, 10)
                        .map((val, idx) => (<button key={idx} className="suggestion-item" onClick={() => setDetailColumnSearchQuery(val)}>{val}</button>))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="search-modal-footer">
              <Button onClick={() => { clearDetailColumnSearch(detailSearchColumn.id); closeDetailSearchModal(); }}>Xem tất cả</Button>
              <Button type="primary" onClick={applyDetailColumnSearch}>Tìm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BcTheoLoaiHang;
