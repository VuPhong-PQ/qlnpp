import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../BusinessPage.css';
import { API_ENDPOINTS, API_BASE_URL, api } from '../../../config/api';
import OpenStreetMapModal from '../../OpenStreetMapModal';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { useAuth } from '../../../contexts/AuthContext';

const CreateOrderForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const { user: authUser } = useAuth();

  // Vietnamese text normalization utility
  const removeVietnameseTones = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Date formatting utility for dd/mm/yyyy display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Parse dd/mm/yyyy input to yyyy-mm-dd format
  const parseDateInput = (dateStr) => {
    if (!dateStr) return '';
    
    // Handle dd/mm/yyyy format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    
    // Handle existing yyyy-mm-dd format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    return '';
  };

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

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

  // Order number helpers: format BHyyyymmdd-xxxxxx
  const formatOrderNumber = (date, serial) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const datePart = `${yyyy}${mm}${dd}`;
    const serialStr = String(serial).padStart(6, '0');
    return `BH${datePart}-${serialStr}`;
  };

  const peekNextSerialForYear = (year) => {
    try {
      const key = `orderSerial:${year}`;
      const raw = localStorage.getItem(key);
      const curr = parseInt(raw || '0', 10) || 0;
      return curr + 1;
    } catch (e) {
      return 1;
    }
  };

  const reserveNextSerialForYear = (year) => {
    try {
      const key = `orderSerial:${year}`;
      const raw = localStorage.getItem(key);
      const curr = parseInt(raw || '0', 10) || 0;
      const next = curr + 1;
      localStorage.setItem(key, String(next));
      return next;
    } catch (e) {
      return 1;
    }
  };

  const commitSerialFromOrderNumber = (orderNumber) => {
    try {
      // expect format BHyyyymmdd-xxxxxx
      const m = String(orderNumber).match(/^BH(\d{8})-(\d{1,})$/);
      if (!m) return;
      const datePart = m[1];
      const serial = parseInt(m[2], 10) || 0;
      const year = datePart.slice(0,4);
      const key = `orderSerial:${year}`;
      const raw = localStorage.getItem(key);
      const curr = parseInt(raw || '0', 10) || 0;
      if (serial > curr) localStorage.setItem(key, String(serial));
    } catch (e) {
      // ignore
    }
  };

  const [orderForm, setOrderForm] = useState({
    orderDate: defaultOrderDate,
    orderNumber: formatOrderNumber(defaultOrderDate, peekNextSerialForYear(new Date(defaultOrderDate).getFullYear())),
    customer: '',
    customerName: '',
    phone: '',
    createdBy: '',
    address: '',
    vehicle: '',
    customerGroup: '',
    salesSchedule: '',
    printOrder: 0,
    deliveryVehicle: '',
    priceType: 'retail', // retail or wholesale
    activeTab: 'products', // products or promotions
    // Thông tin cho hàng bán
    discountPercent: 0,
    discountAmount: 0,
    discountNote: '',
    totalKg: 0,
    totalM3: 0,
    payment: 0,
    accountFund: '',
    notes: '',
    // Thông tin cho hàng khuyến mãi (riêng biệt)
    promoDiscountPercent: 0,
    promoDiscountAmount: 0,
    promoDiscountNote: '',
    promoTotalKg: 0,
    promoTotalM3: 0,
    promoNotes: '',
    productType: '',
    status: 'chưa duyệt' // chưa duyệt, đã duyệt, đã hủy
  });

  // Hàng bán (sale items)
  const [orderItems, setOrderItems] = useState([
    { id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'xuất bán', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }
  ]);

  // Hàng khuyến mãi (promotion items) - separate from sale items
  const [promotionItems, setPromotionItems] = useState([
    { id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'khuyến mãi', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }
  ]);

  const [positions, setPositions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [exportTypes, setExportTypes] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [suggestionRow, setSuggestionRow] = useState(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const productInputRefs = useRef([]);
  const [suggestionCoords, setSuggestionCoords] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [canChooseSales, setCanChooseSales] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [discountNoteEdited, setDiscountNoteEdited] = useState(false);
  const [orderNumberEdited, setOrderNumberEdited] = useState(false);
  // count only rows that contain actual data (not empty placeholder rows)
  // Use appropriate list based on activeTab
  const currentDisplayItems = orderForm.activeTab === 'promotions' ? promotionItems : orderItems;
  const nonEmptyCount = currentDisplayItems.filter(item => {
    const hasText = (item.productCode && String(item.productCode).trim()) || (item.barcode && String(item.barcode).trim()) || (item.productName && String(item.productName).trim());
    const hasNumbers = (item.quantity && Number(item.quantity) > 0) || (item.unitPrice && Number(item.unitPrice) > 0);
    return Boolean(hasText) || Boolean(hasNumbers);
  }).length;

  
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCustomerForMap, setSelectedCustomerForMap] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Promotion search modal state (copy from sales modal but with hidden price fields)
  const [showPromoSearchModal, setShowPromoSearchModal] = useState(false);
  const [promoSearchQuery, setPromoSearchQuery] = useState('');
  const [promoSearchResults, setPromoSearchResults] = useState([]);
  const [savedOrders, setSavedOrders] = useState([]); // Danh sách orders từ DB
  const [showOrdersList, setShowOrdersList] = useState(false); // Hiển thị danh sách orders
  const [editingOrderId, setEditingOrderId] = useState(null); // ID của order đang sửa
  const [companyInfo, setCompanyInfo] = useState(null); // Thông tin công ty cho xuất Excel
  const [selectedItems, setSelectedItems] = useState([]); // Danh sách các item được chọn (checkbox)
  const isCustomerSelected = Boolean(orderForm.customer);
  const initialColWidths = [40, 120, 120, 220, 120, 80, 90, 110, 100, 80, 120, 120, 90, 120, 100, 180, 140, 90, 90, 100, 100, 120, 100, 130, 120];
  const [colWidths, setColWidths] = useState(initialColWidths);
  const resizerState = useRef({ isResizing: false, startX: 0, colIndex: null, startWidth: 0 });
  
  // Column configuration (key must match renderCell switch cases)
  const defaultColumns = [
    { key: 'checkbox', label: '', visible: true },
    { key: 'barcode', label: 'Mã vạch', visible: true },
    { key: 'productCode', label: 'Mã hàng', visible: true },
    { key: 'productName', label: 'Tên hàng', visible: true },
    { key: 'productType', label: 'Loại hàng', visible: true },
    { key: 'warehouse', label: 'Kho hàng', visible: true },
    { key: 'unit', label: 'ĐVT', visible: true },
    { key: 'quantity', label: 'Số lượng', visible: true },
    { key: 'unitPrice', label: 'Đơn giá', visible: true },
    { key: 'amount', label: 'Thành tiền', visible: true },
    { key: 'discountPercent', label: '% CK', visible: true },
    { key: 'priceAfterCK', label: 'Giá sau CK', visible: true },
    { key: 'totalAfterCK', label: 'Ttien sau CK', visible: true },
    { key: 'discountPercentGlobal', label: 'Giảm %', visible: true },
    { key: 'totalAfterDiscount', label: 'Ttien sau giảm %', visible: true },
    { key: 'nvSales', label: 'NV Sales', visible: true },
    { key: 'description', label: 'Mô tả chi tiết', visible: true },
    { key: 'conversion', label: 'Quy đổi', visible: true },
    { key: 'weight', label: 'Số kg', visible: true },
    { key: 'volume', label: 'Số khối', visible: true },
    { key: 'exportType', label: 'Loại xuất', visible: true },
    { key: 'stock', label: 'Tồn kho', visible: true },
    { key: 'tax', label: 'Thuế', visible: true },
    { key: 'priceExcludeVAT', label: 'Giá bán (-VAT)', visible: true },
    { key: 'totalExcludeVAT', label: 'TT (-VAT)', visible: true },
    { key: 'actions', label: 'Thao tác', visible: true }
  ];
  const [columns, setColumns] = useState(defaultColumns);
  const [showColumnsSettings, setShowColumnsSettings] = useState(false);

  // Ensure 'amount' column is positioned immediately after 'unitPrice' on first load
  const _ensureAmountPosRef = useRef(false);
  useEffect(() => {
    if (_ensureAmountPosRef.current) return;
    _ensureAmountPosRef.current = true;
    const unitPriceIdx = columns.findIndex(c => c.key === 'unitPrice');
    const amtIdx = columns.findIndex(c => c.key === 'amount');
    if (unitPriceIdx >= 0 && amtIdx >= 0 && amtIdx !== unitPriceIdx + 1) {
      const colCopy = [...columns];
      const [amtCol] = colCopy.splice(amtIdx, 1);
      colCopy.splice(unitPriceIdx + 1, 0, amtCol);
      skipColumnsRef.current = true;
      setColumns(colCopy);
    }
  }, [columns]);

  // Persist column order and widths across page refreshes.
  // Save a compact spec (order array + visibility map) to avoid serializing non-serializable values.
  const skipColumnsRef = useRef(false);
  const skipWidthsRef = useRef(false);
  
  useEffect(() => {
    // determine current user and permissions
    // Priority: authUser from context > localStorage
    const getCurrentUser = () => {
      // First, use authUser from AuthContext (most reliable source)
      if (authUser) return authUser;
      
      try {
        if (window && window.__USER__) return window.__USER__;
      } catch {}
      try {
        const raw = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('loggedUser');
        if (raw) return JSON.parse(raw);
      } catch {}
      try {
        const name = localStorage.getItem('username') || localStorage.getItem('displayName') || localStorage.getItem('userName');
        if (name) return { name };
      } catch {}
      return null;
    };
    
    // Get user permissions from localStorage
    const getUserPermissions = () => {
      try {
        const perms = localStorage.getItem('permissions');
        if (perms) return JSON.parse(perms);
      } catch {}
      return [];
    };
    
    const cu = getCurrentUser();
    const userPermissions = getUserPermissions();
    setCurrentUser(cu);
    
    // Check if user can choose sales staff:
    // 1. Has 'chon_nhan_vien_sale' permission (with any action)
    // 2. Is admin (by role or by having 'quan_tri_he_thong' permission)
    // 3. Has admin-like username/name
    const hasSelectSalesPermission = userPermissions.some(p => 
      p.startsWith('chon_nhan_vien_sale:') || p === 'chon_nhan_vien_sale'
    );
    const hasAdminPermission = userPermissions.some(p => 
      p.startsWith('quan_tri_he_thong:') || p === 'quan_tri_he_thong'
    );
    const isAdminByRole = cu && (
      cu.canSelectSales || 
      (cu.roles && (cu.roles.includes('admin') || cu.roles.includes('Admin') || cu.roles.includes('sales_manager'))) || 
      (cu.role && (cu.role.toLowerCase().includes('admin') || cu.role.toLowerCase().includes('manager')))
    );
    const isAdminByName = cu && (
      (cu.username && cu.username.toLowerCase().includes('admin')) ||
      (cu.name && cu.name.toLowerCase().includes('admin')) ||
      (cu.displayName && cu.displayName.toLowerCase().includes('admin'))
    );
    
    const canSelectSales = hasSelectSalesPermission || hasAdminPermission || isAdminByRole || isAdminByName;
    setCanChooseSales(canSelectSales);
    
    // Get current user's display name for auto-fill
    // Priority: name (from backend) > tenNhanVien > username > displayName
    const currentUserDisplayName = cu?.name || cu?.tenNhanVien || cu?.username || cu?.displayName || '';
    
    // Check if we're creating a new order (no id in URL)
    const isCreatingNew = !searchParams.get('id');
    
    // ALWAYS auto-fill createdBy (Nhân viên lập) and nvSales with current user's name when creating new
    // Admin can change later, but default is always current user
    if (currentUserDisplayName && isCreatingNew) {
      // Auto-fill createdBy (Nhân viên lập) - FORCE set for new orders
      setOrderForm(prev => ({
        ...prev,
        createdBy: currentUserDisplayName  // Always use current user's name for new orders
      }));
      
      // Auto-fill nvSales for all order items
      setOrderItems(prev => prev.map(it => ({ 
        ...it, 
        nvSales: currentUserDisplayName  // Always use current user's name for new orders
      })));
    }
    let rebuilt = null;
    try {
      const saved = localStorage.getItem('createOrderForm.columns');
      const savedWidths = localStorage.getItem('createOrderForm.colWidths');
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // expected shape: { order: ['key1','key2',...], visible: { key: true }}
        if (parsed && Array.isArray(parsed.order)) {
          const order = parsed.order;
          const visibleMap = parsed.visible || {};
          rebuilt = order.map(k => {
            const found = defaultColumns.find(dc => dc.key === k);
            if (found) return { ...found, visible: (visibleMap[k] !== undefined ? visibleMap[k] : found.visible) };
            return null;
          }).filter(Boolean);
          // include any default columns that were not in saved order (prepend checkbox at start, append others at end)
          defaultColumns.forEach(dc => { 
            if (!rebuilt.find(r => r.key === dc.key)) {
              if (dc.key === 'checkbox') {
                rebuilt.unshift(dc); // Add checkbox at the beginning
              } else {
                rebuilt.push(dc);
              }
            }
          });
          setColumns(rebuilt);
          // prevent immediately persisting back the same values (avoid race on StrictMode double mount)
          skipColumnsRef.current = true;
        }
      }
      
      if (savedWidths) {
        try {
          const parsedW = JSON.parse(savedWidths);
          // parsedW may be array (old) or object mapping key->width (new)
          if (Array.isArray(parsedW)) {
            setColWidths(parsedW);
            skipWidthsRef.current = true;
          } else if (parsedW && typeof parsedW === 'object') {
            // build widths array aligned with rebuilt columns (if rebuilt exists) or defaultColumns
            const base = (Array.isArray(rebuilt) && rebuilt.length > 0) ? rebuilt : defaultColumns;
            const mapped = base.map((c) => {
              const idx = defaultColumns.findIndex(dc => dc.key === c.key);
              const fallback = idx >= 0 ? initialColWidths[idx] : 120;
              return parsedW[c.key] !== undefined ? parsedW[c.key] : fallback;
            });
            setColWidths(mapped);
            skipWidthsRef.current = true;
          }
        } catch (e) {
          // Invalid saved widths format, use defaults
        }
      }
    } catch (e) {
      // Failed to load persisted settings, use defaults
    }
  }, [authUser, searchParams]); // Re-run when authUser or searchParams changes

  // Save compact columns spec (order + visibility)
  useEffect(() => {
    if (skipColumnsRef.current) {
      skipColumnsRef.current = false;
      return;
    }
    try {
      const spec = { order: columns.map(c => c.key), visible: columns.reduce((acc, c) => (acc[c.key] = c.visible, acc), {}) };
      localStorage.setItem('createOrderForm.columns', JSON.stringify(spec));
    } catch (e) {
      // Failed to persist columns
    }
  }, [columns]);

  useEffect(() => {
    if (skipWidthsRef.current) {
      skipWidthsRef.current = false;
      return;
    }
    try {
      // persist as mapping key->width so order changes don't break mapping
      const widthMap = (columns || []).reduce((acc, c, idx) => { 
        acc[c.key] = colWidths[idx] !== undefined ? colWidths[idx] : (initialColWidths[defaultColumns.findIndex(dc => dc.key === c.key)] || 120); 
        return acc; 
      }, {});
      localStorage.setItem('createOrderForm.colWidths', JSON.stringify(widthMap));
    } catch (e) { 
      // Failed to persist colWidths
    }
  }, [colWidths]);

  // Recompute suggestion coordinates when column widths change or suggestion row changes
  useEffect(() => {
    if (suggestionRow === null) return;
    const el = productInputRefs.current && productInputRefs.current[suggestionRow];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const bottom = window.innerHeight - rect.top + 6;
    setSuggestionCoords({ left: rect.left, width: rect.width, bottom });
  }, [colWidths, suggestionRow]);

  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Orders`);
      if (response.ok) {
        const orders = await response.json();
        setSavedOrders(orders);
      } else {
        console.error('Failed to fetch orders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Load order detail with items
  const loadOrderDetail = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Map order data to form
        setOrderForm({
          orderDate: data.order.orderDate ? data.order.orderDate.split('T')[0] : defaultOrderDate,
          orderNumber: data.order.orderNumber || '',
          customer: data.order.customer || '',
          customerName: data.order.customerName || '',
          phone: data.order.phone || '',
          createdBy: data.order.createdBy || '',
          address: data.order.address || '',
          vehicle: data.order.vehicle || '',
          customerGroup: data.order.customerGroup || '',
          salesSchedule: data.order.salesSchedule || '',
          printOrder: data.order.printOrder || 0,
          deliveryVehicle: data.order.deliveryVehicle || '',
          priceType: data.order.priceType || 'retail',
          activeTab: 'products',
          discountPercent: data.order.discountPercent || 0,
          discountAmount: data.order.discountAmount || 0,
          discountNote: data.order.discountNote || '',
          totalKg: data.order.totalKg || 0,
          totalM3: data.order.totalM3 || 0,
          payment: data.order.payment || 0,
          accountFund: data.order.accountFund || '',
          notes: data.order.notes || '',
          status: data.order.status || 'chưa duyệt',
          // Promotion fields (hàng khuyến mãi - độc lập)
          promoDiscountPercent: data.order.promoDiscountPercent || 0,
          promoDiscountAmount: data.order.promoDiscountAmount || 0,
          promoDiscountNote: data.order.promoDiscountNote || '',
          promoTotalKg: data.order.promoTotalKg || 0,
          promoTotalM3: data.order.promoTotalM3 || 0,
          promoNotes: data.order.promoNotes || ''
        });
        
        // Helper function to map item from backend
        const mapItemFromBackend = (item, index) => ({
          id: index + 1,
          productCode: item.productCode || '',
          barcode: item.barcode || '',
          productName: item.productName || '',
          productType: item.productType || '',
          warehouse: item.warehouse || '',
          unit: item.unit || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          discountPercent: item.discountPercent || 0,
          priceAfterCK: item.priceAfterCK || 0,
          totalAfterCK: item.totalAfterCK || 0,
          totalAfterDiscount: item.totalAfterDiscount || 0,
          nvSales: item.nvSales || '',
          description: item.description || '',
          conversion: item.conversion || '',
          amount: item.amount || 0,
          total: item.total || 0,
          weight: item.weight || 0,
          volume: item.volume || 0,
          baseWeight: item.baseWeight || 0,
          baseVolume: item.baseVolume || 0,
          exportType: item.exportType || 'xuất bán',
          stock: item.stock || 0,
          tax: item.tax || 'KCT',
          priceExcludeVAT: item.priceExcludeVAT || 0,
          totalExcludeVAT: item.totalExcludeVAT || 0
        });
        
        // Map sale order items (hàng bán)
        if (data.items && data.items.length > 0) {
          setOrderItems(data.items.map(mapItemFromBackend));
        } else {
          // Reset to default empty row if no sale items
          setOrderItems([{ id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'xuất bán', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }]);
        }
        
        // Map promotion items (hàng khuyến mãi)
        if (data.promotionItems && data.promotionItems.length > 0) {
          setPromotionItems(data.promotionItems.map(mapItemFromBackend));
        } else {
          // Reset to default empty row if no promotion items
          setPromotionItems([{ id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'khuyến mãi', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }]);
        }
        
        // Set editing mode with order ID
        setEditingOrderId(orderId);
        
        // Update customer search if customer is selected
        if (data.order.customerName) {
          setCustomerSearch(`${data.order.customerName}${data.order.phone ? ' (' + data.order.phone + ')' : ''}`);
        }
        
        setShowOrdersList(false);
      } else {
        alert('Không thể tải đơn hàng: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Lỗi khi tải đơn hàng: ' + error.message);
    }
  };

  // Auto-calculate totals for orderItems (hàng bán)
  useEffect(() => {
    const totalKg = orderItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalM3 = orderItems.reduce((sum, item) => sum + (parseFloat(item.volume) || 0), 0);
    const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterCK) || 0), 0);
    const discountPercent = parseFloat(orderForm.discountPercent) || 0;
    const discountAmount = Number((subtotal * discountPercent / 100).toFixed(2));
    
    setOrderForm(prev => ({
      ...prev,
      totalKg: Number(totalKg.toFixed(2)),
      totalM3: Number(totalM3.toFixed(3)),
      discountAmount
    }));
  }, [orderItems, orderForm.discountPercent]);

  // Auto-calculate totals for promotionItems (hàng khuyến mãi)
  useEffect(() => {
    const promoTotalKg = promotionItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const promoTotalM3 = promotionItems.reduce((sum, item) => sum + (parseFloat(item.volume) || 0), 0);
    const subtotal = promotionItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterCK) || 0), 0);
    const promoDiscountPercent = parseFloat(orderForm.promoDiscountPercent) || 0;
    const promoDiscountAmount = Number((subtotal * promoDiscountPercent / 100).toFixed(2));
    
    setOrderForm(prev => ({
      ...prev,
      promoTotalKg: Number(promoTotalKg.toFixed(2)),
      promoTotalM3: Number(promoTotalM3.toFixed(3)),
      promoDiscountAmount
    }));
  }, [promotionItems, orderForm.promoDiscountPercent]);

  // Load orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Load order from URL param if present (edit mode)
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId) {
      loadOrderDetail(parseInt(orderId));
    }
  }, [searchParams]);

  // Fetch product categories
  const fetchProductCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ProductCategories`);
      if (response.ok) {
        const data = await response.json();
        setProductCategories(data);
      }
    } catch (error) {
      console.error('Error fetching product categories:', error);
    }
  };

  // Fetch company info for Excel export
  const fetchCompanyInfo = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.companyInfos);
      if (data && data.length > 0) {
        setCompanyInfo({
          name: data[0].companyName || data[0].name || 'CÔNG TY',
          address: data[0].address || '',
          phone: data[0].phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchProductCategories();
    fetchCompanyInfo();
  }, []);

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
    setOrderForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Khi thay đổi giảm % cho tab promotions, cần cập nhật lại discountAmount và các items
      if (field === 'promoDiscountPercent') {
        const discountPercent = parseFloat(value) || 0;
        const subtotal = promotionItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterCK) || 0), 0);
        newForm.promoDiscountAmount = Number((subtotal * discountPercent / 100).toFixed(2));
        
        // Cập nhật lại totalAfterDiscount cho từng item trong promotionItems
        setPromotionItems(items => items.map(item => {
          const totalAfterCK = parseFloat(item.totalAfterCK) || 0;
          const totalAfterDiscount = Number((totalAfterCK - (totalAfterCK * discountPercent / 100)).toFixed(2));
          return { ...item, totalAfterDiscount, total: totalAfterDiscount };
        }));
      }
      
      // Khi thay đổi giảm % cho tab hàng bán
      if (field === 'discountPercent') {
        const discountPercent = parseFloat(value) || 0;
        const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterCK) || 0), 0);
        newForm.discountAmount = Number((subtotal * discountPercent / 100).toFixed(2));
        
        // Cập nhật lại totalAfterDiscount cho từng item trong orderItems
        setOrderItems(items => items.map(item => {
          const totalAfterCK = parseFloat(item.totalAfterCK) || 0;
          const totalAfterDiscount = Number((totalAfterCK - (totalAfterCK * discountPercent / 100)).toFixed(2));
          return { ...item, totalAfterDiscount, total: totalAfterDiscount };
        }));
      }
      
      return newForm;
    });
  };

  // Helper function to get current items based on active tab
  const getCurrentItems = () => {
    return orderForm.activeTab === 'promotions' ? promotionItems : orderItems;
  };

  // Helper function to set current items based on active tab
  const setCurrentItems = (updater) => {
    if (orderForm.activeTab === 'promotions') {
      setPromotionItems(updater);
    } else {
      setOrderItems(updater);
    }
  };

  const handleOrderItemChange = (index, field, value) => {
    const setItems = orderForm.activeTab === 'promotions' ? setPromotionItems : setOrderItems;
    // Use appropriate discount percent based on active tab
    const currentDiscountPercent = orderForm.activeTab === 'promotions' ? orderForm.promoDiscountPercent : orderForm.discountPercent;
    
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate total after discount
      const item = updated[index];
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      // Thành tiền = số lượng * đơn giá
      item.amount = Number((qty * price).toFixed(2));
      const disc = parseFloat(item.discountPercent) || 0;
      const priceAfter = price * (1 - disc / 100);
      const totalAfter = qty * priceAfter;
      item.priceAfterCK = Number(priceAfter.toFixed(2));
      item.totalAfterCK = Number(totalAfter.toFixed(2));
      // apply order-level giảm % to compute final amount per row
      const orderDisc = parseFloat(currentDiscountPercent) || 0;
      item.totalAfterDiscount = Number((item.totalAfterCK - (item.totalAfterCK * orderDisc / 100)).toFixed(2));
      item.total = item.totalAfterDiscount;
      
      // Recalculate weight and volume when quantity changes
      if (field === 'quantity' && (item.baseWeight !== undefined || item.baseVolume !== undefined)) {
        const conv = parseFloat(item.conversion) || 1;
        if (item.baseWeight !== undefined) {
          item.weight = Number((item.baseWeight * conv * qty).toFixed(2));
        }
        if (item.baseVolume !== undefined) {
          item.volume = Number((item.baseVolume * conv * qty).toFixed(2));
        }
      }
      
      return updated;
    });
  };

  const addOrderItem = () => {
    // ALWAYS auto-fill nvSales with current user's name (admin can change later if needed)
    const defaultNvSales = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
    const isPromoTab = orderForm.activeTab === 'promotions';
    const setItems = isPromoTab ? setPromotionItems : setOrderItems;
    
    setItems(prev => [...prev, {
      id: prev.length + 1,
      productCode: '',
      barcode: '',
      productName: '',
      productType: '',
      warehouse: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      discountPercent: 0,
      priceAfterCK: 0,
      totalAfterCK: 0,
      totalAfterDiscount: 0,
      nvSales: defaultNvSales,
      description: '',
      conversion: '',
      amount: 0,
      total: 0,
      weight: 0,
      volume: 0,
      baseWeight: 0,
      baseVolume: 0,
      exportType: isPromoTab ? 'khuyến mãi' : 'xuất bán',
      stock: 0,
      tax: 'KCT',
      priceExcludeVAT: 0,
      totalExcludeVAT: 0
    }]);
  };

  const removeOrderItem = (index) => {
    const currentItems = getCurrentItems();
    if (currentItems.length > 1) {
      setCurrentItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Add a new order item after a specific index
  const addOrderItemAfter = (index) => {
    // ALWAYS auto-fill nvSales with current user's name (admin can change later if needed)
    const defaultNvSales = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
    const isPromoTab = orderForm.activeTab === 'promotions';
    
    const newItem = {
      id: Date.now(),
      productCode: '',
      barcode: '',
      productName: '',
      productType: '',
      warehouse: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      discountPercent: 0,
      priceAfterCK: 0,
      totalAfterCK: 0,
      totalAfterDiscount: 0,
      nvSales: defaultNvSales,
      description: '',
      conversion: 1,
      amount: 0,
      total: 0,
      weight: 0,
      volume: 0,
      baseWeight: 0,
      baseVolume: 0,
      exportType: isPromoTab ? 'khuyến mãi' : 'xuất bán',
      stock: 0,
      tax: 'KCT',
      priceExcludeVAT: 0,
      totalExcludeVAT: 0
    };
    
    setCurrentItems(prev => {
      const newItems = [...prev];
      newItems.splice(index + 1, 0, newItem);
      return newItems;
    });
  };

  // Calculate totals for sale items (hàng bán)
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterDiscount) || 0), 0);
    return subtotal;
  };

  // Calculate totals for promotion items (hàng khuyến mãi)
  const calculatePromoTotals = () => {
    const subtotal = promotionItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterDiscount) || 0), 0);
    return subtotal;
  };

  // Get current totals based on active tab
  const getCurrentTotals = () => {
    return orderForm.activeTab === 'promotions' ? calculatePromoTotals() : calculateTotals();
  };

  // Export Excel theo mẫu Phiếu Giao Hàng Kiểm Xác Nhận Công Nợ với định dạng đẹp
  const handleExportExcel = async () => {
    // Filter valid sale items and promotion items separately
    const validSaleItems = orderItems.filter(item => {
      const hasText = (item.productCode && String(item.productCode).trim()) || 
                     (item.barcode && String(item.barcode).trim()) || 
                     (item.productName && String(item.productName).trim());
      const hasNumbers = (item.quantity && Number(item.quantity) > 0) || 
                        (item.unitPrice && Number(item.unitPrice) > 0);
      return Boolean(hasText) || Boolean(hasNumbers);
    });

    const validPromoItems = promotionItems.filter(item => {
      const hasText = (item.productCode && String(item.productCode).trim()) || 
                     (item.barcode && String(item.barcode).trim()) || 
                     (item.productName && String(item.productName).trim());
      const hasNumbers = (item.quantity && Number(item.quantity) > 0) || 
                        (item.unitPrice && Number(item.unitPrice) > 0);
      return Boolean(hasText) || Boolean(hasNumbers);
    });

    if (validSaleItems.length === 0 && validPromoItems.length === 0) {
      alert('Không có sản phẩm nào để xuất!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Phiếu Giao Hàng');

      // Set page setup for A4 Landscape printing
      ws.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3
        }
      };

      // Company info
      const compName = companyInfo?.name || 'CÔNG TY TNHH MTV Phân Phối TPQ';
      const compAddr = companyInfo?.address || '';
      const compPhone = companyInfo?.phone || '';

      // Set column widths - optimized for A4 Landscape
      ws.columns = [
        { width: 5 },   // A - STT
        { width: 14 },  // B - NVBH
        { width: 16 },  // C - MV (barcode)
        { width: 45 },  // D - Tên hàng
        { width: 7 },   // E - ĐVT
        { width: 7 },   // F - SL
        { width: 11 },  // G - Đơn giá
        { width: 6 },   // H - %CK
        { width: 11 },  // I - Giá sau CK
        { width: 13 },  // J - Thành tiền
        { width: 10 }   // K - QR Code column
      ];

      // Helper function for border style
      const thinBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Set row heights for header area
      ws.getRow(1).height = 18;
      ws.getRow(2).height = 18;
      ws.getRow(3).height = 18;
      ws.getRow(4).height = 18;

      // Row 1: Company name + Order number
      ws.mergeCells('A1:E1');
      ws.getCell('A1').value = compName;
      ws.getCell('A1').font = { bold: true, size: 12 };
      ws.mergeCells('G1:J1');
      ws.getCell('G1').value = `Số: ${orderForm.orderNumber || ''}`;
      ws.getCell('G1').alignment = { horizontal: 'right' };

      // Row 2: Address + Coordinates
      ws.mergeCells('A2:E2');
      ws.getCell('A2').value = `Địa chỉ: ${compAddr}`;
      ws.getCell('A2').font = { size: 10 };
      ws.mergeCells('G2:J2');
      ws.getCell('G2').value = `Tọa độ: ${orderForm.vehicle || ''}`;
      ws.getCell('G2').font = { size: 9 };
      ws.getCell('G2').alignment = { horizontal: 'right' };

      // Generate a styled QR Code that encodes the order number (số phiếu)
      // Draw the QR on an offscreen canvas with a rounded card, shadow and label
      if (orderForm.orderNumber) {
        try {
          const payload = String(orderForm.orderNumber || '');

          // Create base QR as data URL (high-res for quality)
          const baseQrDataUrl = await QRCode.toDataURL(payload, {
            width: 600,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
          });

          // Helper: create styled PNG from QR data URL using canvas
          const createStyledPng = async (qrDataUrl, options = {}) => {
            const cardSize = options.cardSize || 300; // square card
            const padding = options.padding || 18;
            const labelHeight = options.labelHeight || 26;

            const img = await new Promise((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = reject;
              i.src = qrDataUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = cardSize + padding * 2;
            canvas.height = cardSize + padding * 2 + labelHeight;
            const ctx = canvas.getContext('2d');

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw shadowed rounded card
            const cardX = padding;
            const cardY = padding;
            const cardW = cardSize;
            const cardH = cardSize;
            const radius = 18;

            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 6;
            ctx.fillStyle = '#ffffff';
            // rounded rect path
            ctx.beginPath();
            ctx.moveTo(cardX + radius, cardY);
            ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, radius);
            ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, radius);
            ctx.arcTo(cardX, cardY + cardH, cardX, cardY, radius);
            ctx.arcTo(cardX, cardY, cardX + cardW, cardY, radius);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Draw QR image centered inside card with inner padding
            const innerPad = 18;
            const qrSize = cardSize - innerPad * 2;
            const dx = cardX + innerPad;
            const dy = cardY + innerPad;
            ctx.drawImage(img, dx, dy, qrSize, qrSize);

            // Draw subtle border around card
            ctx.strokeStyle = 'rgba(0,0,0,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + radius, cardY);
            ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, radius);
            ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, radius);
            ctx.arcTo(cardX, cardY + cardH, cardX, cardY, radius);
            ctx.arcTo(cardX, cardY, cardX + cardW, cardY, radius);
            ctx.closePath();
            ctx.stroke();

            // Draw order number label below the card
            ctx.fillStyle = '#333333';
            ctx.font = '600 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelX = canvas.width / 2;
            const labelY = cardY + cardH + labelHeight / 2 + 4;
            ctx.fillText(payload, labelX, labelY);

            return canvas.toDataURL('image/png');
          };

          const styledDataUrl = await createStyledPng(baseQrDataUrl, { cardSize: 220, padding: 12, labelHeight: 26 });

          // Add QR code image to workbook
          const qrImageId = workbook.addImage({
            base64: styledDataUrl,
            extension: 'png'
          });

          // Place styled QR code in upper right corner area (columns H-J, rows 4-7)
          ws.addImage(qrImageId, {
            tl: { col: 7.2, row: 3.2 },
            br: { col: 9.8, row: 6.8 }
          });
        } catch (qrError) {
          console.warn('Could not generate styled QR code:', qrError);
        }
      }

      // Row 3: Phone + Customer group (display group NAME instead of code)
      ws.mergeCells('A3:E3');
      ws.getCell('A3').value = `Điện thoại: ${compPhone}`;
      ws.getCell('A3').font = { size: 10 };
      // Resolve customer group name from code if available
      const custGroupCode = orderForm.customerGroup || '';
      const custGroupObj = (customerGroups || []).find(g => String(g.code) === String(custGroupCode));
      const custGroupName = custGroupObj ? custGroupObj.name : custGroupCode;
      ws.mergeCells('G3:J3');
      ws.getCell('G3').value = `Nhóm: ${custGroupName || ''}`;
      ws.getCell('G3').alignment = { horizontal: 'right' };

      // Row 4: STT In
      ws.mergeCells('G4:J4');
      ws.getCell('G4').value = `STT In: ${orderForm.printOrder || 0}`;
      ws.getCell('G4').alignment = { horizontal: 'right' };

      // Row 5: Empty

      // Row 6: Title
      ws.mergeCells('A6:J6');
      ws.getCell('A6').value = 'PHIẾU GIAO HÀNG KIỂM XÁC NHẬN CÔNG NỢ';
      ws.getCell('A6').font = { bold: true, size: 16 };
      ws.getCell('A6').alignment = { horizontal: 'center' };

      // Row 7: Liên
      ws.mergeCells('A7:J7');;
      ws.getCell('A7').value = 'Liên: 1';
      ws.getCell('A7').alignment = { horizontal: 'center' };

      // Row 8: Empty

      // Row 9: Customer info
      ws.getCell('A9').value = 'Khách hàng:';
      ws.getCell('A9').font = { bold: true };
      ws.mergeCells('B9:E9');
      ws.getCell('B9').value = orderForm.customerName || '';
      ws.getCell('B9').font = { bold: true, size: 12 };
      
      // Xác nhận đã thanh toán box
      ws.mergeCells('G9:J12');
      ws.getCell('G9').value = 'Xác nhận đã thanh toán';
      ws.getCell('G9').alignment = { horizontal: 'center', vertical: 'top' };
      ws.getCell('G9').border = thinBorder;

      // Row 10: Address
      ws.getCell('A10').value = 'Địa chỉ:';
      ws.mergeCells('B10:E10');
      ws.getCell('B10').value = orderForm.address || '';

      // Row 11: Phone
      ws.getCell('A11').value = 'ĐT:';
      ws.mergeCells('B11:E11');
      ws.getCell('B11').value = orderForm.phone || '';

      // Row 12: Empty

      // Row 13: Table headers
      const headerRow = 13;
      const headers = ['STT', 'NVBH', 'MV', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', '%CK', 'Giá sau CK', 'Thành tiền'];
      headers.forEach((header, idx) => {
        const cell = ws.getCell(headerRow, idx + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = thinBorder;
      });
      ws.getRow(headerRow).height = 22;

      // Row 14: Section "Hàng bán"
      let currentRow = 14;
      ws.mergeCells(`A${currentRow}:J${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'Hàng bán';
      ws.getCell(`A${currentRow}`).font = { bold: true, italic: true };
      ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      for (let col = 1; col <= 10; col++) {
        ws.getCell(currentRow, col).border = thinBorder;
      }
      currentRow++;

      let totalAmount = 0;
      let stt = 1;

      // Data rows - "Hàng bán"
      validSaleItems.forEach((item) => {
        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discPercent = parseFloat(item.discountPercent) || 0;
        const priceAfterCK = parseFloat(item.priceAfterCK) || unitPrice * (1 - discPercent / 100);
        const thanhTien = parseFloat(item.totalAfterCK) || qty * priceAfterCK;
        totalAmount += thanhTien;

        const rowData = [
          stt++,
          item.nvSales || '',
          item.barcode || '',
          item.productName || '',
          item.unit || '',
          qty,
          unitPrice,
          discPercent,
          priceAfterCK,
          thanhTien
        ];

        rowData.forEach((value, colIdx) => {
          const cell = ws.getCell(currentRow, colIdx + 1);
          cell.value = value;
          cell.border = thinBorder;
          // Alignment
          if (colIdx === 0) cell.alignment = { horizontal: 'center' }; // STT
          else if (colIdx >= 5) cell.alignment = { horizontal: 'right' }; // Numbers
          // Number format
          if (colIdx >= 5 && typeof value === 'number') {
            cell.numFmt = '#,##0';
          }
        });
        currentRow++;
      });

      // Hàng khuyến mãi section (from promotionItems)
      if (validPromoItems.length > 0) {
        ws.mergeCells(`A${currentRow}:J${currentRow}`);
        ws.getCell(`A${currentRow}`).value = 'Hàng khuyến mãi';
        ws.getCell(`A${currentRow}`).font = { bold: true, italic: true };
        ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
        for (let col = 1; col <= 10; col++) {
          ws.getCell(currentRow, col).border = thinBorder;
        }
        currentRow++;

        validPromoItems.forEach((item) => {
          const qty = parseFloat(item.quantity) || 0;
          const rowData = [stt++, item.nvSales || '', item.barcode || '', item.productName || '', item.unit || '', qty, 0, 0, 0, 0];
          rowData.forEach((value, colIdx) => {
            const cell = ws.getCell(currentRow, colIdx + 1);
            cell.value = value;
            cell.border = thinBorder;
            if (colIdx === 0) cell.alignment = { horizontal: 'center' };
            else if (colIdx >= 5) cell.alignment = { horizontal: 'right' };
            if (colIdx >= 5 && typeof value === 'number') cell.numFmt = '#,##0';
          });
          currentRow++;
        });
      }

      // Empty row
      currentRow++;

      // Compute total weight (kg) and total volume (m3) including both sale and promo items
      let totalKgComputed = 0;
      let totalM3Computed = 0;
      const sumKgFunc = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const per = parseFloat(item.weight) || parseFloat(item.baseWeight) || 0;
        return qty * per;
      };
      const sumM3Func = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const per = parseFloat(item.volume) || parseFloat(item.baseVolume) || 0;
        return qty * per;
      };
      validSaleItems.forEach(i => { totalKgComputed += sumKgFunc(i); totalM3Computed += sumM3Func(i); });
      validPromoItems.forEach(i => { totalKgComputed += sumKgFunc(i); totalM3Computed += sumM3Func(i); });

      // Totals section
      const discountPercent = parseFloat(orderForm.discountPercent) || 0;
      const discountAmount = parseFloat(orderForm.discountAmount) || 0;
      const finalTotal = totalAmount - discountAmount;

      // Row: Số tài khoản + Tổng cộng
      ws.mergeCells(`A${currentRow}:F${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'Số tài khoản: -';
      ws.mergeCells(`G${currentRow}:I${currentRow}`);
      ws.getCell(`G${currentRow}`).value = 'Tổng cộng:';
      ws.getCell(`G${currentRow}`).font = { bold: true };
      ws.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
      ws.getCell(`J${currentRow}`).value = totalAmount;
      ws.getCell(`J${currentRow}`).numFmt = '#,##0';
      ws.getCell(`J${currentRow}`).font = { bold: true };
      ws.getCell(`J${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      // Row: Lưu ý + Chiết khấu
      ws.mergeCells(`A${currentRow}:F${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'Lưu ý chuyển khoản: Quý khách vui lòng ghi tên cửa hàng theo hóa đơn khi CK';
      ws.getCell(`A${currentRow}`).font = { italic: true, size: 9 };
      ws.mergeCells(`G${currentRow}:I${currentRow}`);
      ws.getCell(`G${currentRow}`).value = `Chiết khấu: ${discountPercent}%`;
      ws.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
      ws.getCell(`J${currentRow}`).value = discountAmount;
      ws.getCell(`J${currentRow}`).numFmt = '#,##0';
      ws.getCell(`J${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      // Row: Thành tiền
      ws.mergeCells(`G${currentRow}:I${currentRow}`);
      ws.getCell(`G${currentRow}`).value = 'Thành tiền:';
      ws.getCell(`G${currentRow}`).font = { bold: true };
      ws.getCell(`G${currentRow}`).alignment = { horizontal: 'right' };
      ws.getCell(`J${currentRow}`).value = finalTotal;
      ws.getCell(`J${currentRow}`).numFmt = '#,##0';
      ws.getCell(`J${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } };
      ws.getCell(`J${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      // Empty row
      currentRow++;

      // Tổng số kg, m3 (tính lại bao gồm cả hàng khuyến mãi)
      ws.getCell(`A${currentRow}`).value = `Tổng số kg: ${Number(totalKgComputed || orderForm.totalKg || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
      ws.getCell(`A${currentRow}`).font = { bold: true };
      ws.getCell(`C${currentRow}`).value = `Số m³: ${Number(totalM3Computed || orderForm.totalM3 || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
      ws.getCell(`C${currentRow}`).font = { bold: true };
      currentRow++;

      // Empty row
      currentRow++;

      // Tổng tiền bằng chữ
      ws.mergeCells(`A${currentRow}:J${currentRow}`);
      ws.getCell(`A${currentRow}`).value = `Tổng tiền bằng chữ: ${totalInWords(finalTotal)}`;
      ws.getCell(`A${currentRow}`).font = { italic: true, bold: true };
      currentRow++;

      // Empty row
      currentRow++;

      // Signatures section
      ws.getCell(`B${currentRow}`).value = 'Ký nhận hàng, chưa thanh toán';
      ws.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
      ws.getCell(`E${currentRow}`).value = 'Người giao';
      ws.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };
      ws.mergeCells(`H${currentRow}:J${currentRow}`);
      ws.getCell(`H${currentRow}`).value = `Ngày: ${formatDisplayDate(orderForm.orderDate) || new Date().toLocaleDateString('vi-VN')}`;
      ws.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      ws.getCell(`B${currentRow}`).value = '(Ký, ghi rõ họ tên)';
      ws.getCell(`B${currentRow}`).font = { italic: true, size: 9 };
      ws.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
      ws.mergeCells(`H${currentRow}:J${currentRow}`);
      ws.getCell(`H${currentRow}`).value = 'Người in phiếu';
      ws.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      // Empty rows for signature space
      currentRow += 2;

      ws.mergeCells(`H${currentRow}:J${currentRow}`);
      ws.getCell(`H${currentRow}`).value = orderForm.createdBy || currentUser?.name || '';
      ws.getCell(`H${currentRow}`).font = { bold: true };
      ws.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
      currentRow++;

      // Empty row
      currentRow++;

      // Ghi chú
      ws.mergeCells(`A${currentRow}:J${currentRow}`);
      ws.getCell(`A${currentRow}`).value = `Ghi chú: ${orderForm.notes || ''}`;
      currentRow++;

      // Empty row
      currentRow++;

      // Footer warning
      ws.mergeCells(`A${currentRow}:J${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'ĐỀ NGHỊ QUÝ KHÁCH KIỂM ĐẾM KỸ HÀNG & TIỀN NV NPP SẼ KHÔNG CHỊU TRÁCH NHIỆM SAU KHI ĐI KHỎI CỬA HÀNG';
      ws.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' }, size: 10 };
      ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

      // Set print area (columns A to K, row 1 to current row)
      ws.pageSetup.printArea = `A1:K${currentRow}`;

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PhieuGiaoHang_${orderForm.orderNumber || 'New'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('Xuất Excel thành công!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Lỗi khi xuất file Excel: ' + error.message);
    }
  };

  // Export order data to Excel (raw data format with filter)
  const handleExportOrderData = async () => {
    // Filter valid items
    const validItems = orderItems.filter(item => {
      const hasText = (item.productCode && String(item.productCode).trim()) || 
                     (item.barcode && String(item.barcode).trim()) || 
                     (item.productName && String(item.productName).trim());
      const hasNumbers = (item.quantity && Number(item.quantity) > 0) || 
                        (item.unitPrice && Number(item.unitPrice) > 0);
      return Boolean(hasText) || Boolean(hasNumbers);
    });

    if (validItems.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Quản Lý Nhà Phân Phối';
      workbook.created = new Date();
      
      // Single sheet for all data
      const ws = workbook.addWorksheet('Dữ liệu đơn hàng');
      
      // Styles
      const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      const thinBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Set column widths
      ws.columns = [
        { width: 20 },  // A - Label column (wider for info section)
        { width: 15 },  // B - Mã vạch
        { width: 15 },  // C - Mã hàng
        { width: 40 },  // D - Tên hàng
        { width: 18 },  // E - Loại hàng
        { width: 15 },  // F - Kho hàng
        { width: 8 },   // G - ĐVT
        { width: 10 },  // H - Số lượng
        { width: 12 },  // I - Đơn giá
        { width: 14 },  // J - Thành tiền
        { width: 8 },   // K - % CK
        { width: 12 },  // L - Giá sau CK
        { width: 14 },  // M - Tiền sau CK
        { width: 8 },   // N - Giảm %
        { width: 14 },  // O - Tiền sau giảm
        { width: 15 }   // P - NV Sales
      ];

      // ========== PHẦN 1: THÔNG TIN ĐƠN HÀNG ==========
      // Title
      ws.mergeCells('A1:D1');
      ws.getCell('A1').value = 'THÔNG TIN ĐƠN HÀNG';
      ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF4472C4' } };
      ws.getCell('A1').alignment = { horizontal: 'center' };
      
      // Get customer group name from code
      const customerGroupCode = orderForm.customerGroup || '';
      const customerGroupObj = customerGroups.find(g => g.code === customerGroupCode);
      const customerGroupName = customerGroupObj ? customerGroupObj.name : customerGroupCode;

      // Compute totals (kg and m3) including promotion items
      let computedTotalKg = 0;
      let computedTotalM3 = 0;
      const sumKg = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const per = parseFloat(item.weight) || parseFloat(item.baseWeight) || 0;
        return qty * per;
      };
      const sumM3 = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const per = parseFloat(item.volume) || parseFloat(item.baseVolume) || 0;
        return qty * per;
      };
      (orderItems || []).forEach(i => { computedTotalKg += sumKg(i); computedTotalM3 += sumM3(i); });
      (promotionItems || []).forEach(i => { computedTotalKg += sumKg(i); computedTotalM3 += sumM3(i); });

      // Order info rows
      const orderInfo = [
        ['Số phiếu', orderForm.orderNumber || ''],
        ['Ngày lập', formatDisplayDate(orderForm.orderDate) || ''],
        ['Nhân viên lập', orderForm.createdBy || ''],
        ['Khách hàng', orderForm.customerName || ''],
        ['Địa chỉ', orderForm.address || ''],
        ['Điện thoại', orderForm.phone || ''],
        ['Nhóm khách hàng', customerGroupName],
        ['Lịch bán hàng', orderForm.salesSchedule || ''],
        ['STT In', orderForm.printOrder || ''],
        ['Trạng thái', orderForm.status || 'chưa duyệt'],
        ['Vị trí', orderForm.location || ''],
        ['Tọa độ', orderForm.vehicle || ''],
        ['Tổng tiền', orderForm.totalAmount || 0],
        ['Giảm %', (orderForm.discountPercent || 0) + '%'],
        ['Tiền giảm', orderForm.discountAmount || 0],
        ['Tổng sau giảm', (orderForm.totalAmount || 0) - (orderForm.discountAmount || 0)],
        ['Tổng kg', Number(computedTotalKg || orderForm.totalKg || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })],
        ['Tổng khối', Number(computedTotalM3 || orderForm.totalM3 || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })],
        ['Ghi chú', orderForm.notes || '']
      ];

      let currentRow = 3;
      orderInfo.forEach(([label, value]) => {
        ws.getCell(`A${currentRow}`).value = label;
        ws.getCell(`A${currentRow}`).font = { bold: true };
        ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
        ws.getCell(`A${currentRow}`).border = thinBorder;
        ws.mergeCells(`B${currentRow}:D${currentRow}`);
        ws.getCell(`B${currentRow}`).value = value;
        ws.getCell(`B${currentRow}`).border = thinBorder;
        ws.getCell(`C${currentRow}`).border = thinBorder;
        ws.getCell(`D${currentRow}`).border = thinBorder;
        if (typeof value === 'number') {
          ws.getCell(`B${currentRow}`).numFmt = '#,##0';
        }
        currentRow++;
      });

      // ========== PHẦN 2: CHI TIẾT SẢN PHẨM ==========
      // Add empty row for spacing
      currentRow += 2;
      
      // Title for product details
      ws.mergeCells(`A${currentRow}:P${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'CHI TIẾT SẢN PHẨM';
      ws.getCell(`A${currentRow}`).font = { bold: true, size: 16, color: { argb: 'FF4472C4' } };
      ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow += 2;

      // Header row for product table
      const productHeaders = ['STT', 'Mã vạch', 'Mã hàng', 'Tên hàng', 'Loại hàng', 'Kho hàng', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', '% CK', 'Giá sau CK', 'Tiền sau CK', 'Giảm %', 'Tiền sau giảm', 'NV Sales'];
      const headerRowNum = currentRow;
      
      productHeaders.forEach((header, index) => {
        const cell = ws.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
      });
      ws.getRow(currentRow).height = 25;
      currentRow++;

      // Add data rows
      validItems.forEach((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const totalAmt = qty * unitPrice;
        const discPct = parseFloat(item.discountPercent) || 0;
        const priceAfterCK = parseFloat(item.priceAfterCK) || unitPrice * (1 - discPct / 100);
        const totalAfterCK = parseFloat(item.totalAfterCK) || qty * priceAfterCK;
        const orderDiscPct = parseFloat(orderForm.discountPercent) || 0;
        const totalAfterDiscount = parseFloat(item.totalAfterDiscount) || totalAfterCK * (1 - orderDiscPct / 100);

        const rowData = [
          index + 1,
          item.barcode || '',
          item.productCode || '',
          item.productName || '',
          item.productType || '',
          item.warehouse || '',
          item.unit || '',
          qty,
          unitPrice,
          totalAmt,
          discPct,
          priceAfterCK,
          totalAfterCK,
          orderDiscPct,
          totalAfterDiscount,
          item.nvSales || ''
        ];

        rowData.forEach((value, colIndex) => {
          const cell = ws.getCell(currentRow, colIndex + 1);
          cell.value = value;
          cell.border = thinBorder;
          // Format number columns
          if ([8, 9, 11, 12, 14].includes(colIndex)) {
            cell.numFmt = '#,##0';
          }
        });
        currentRow++;
      });

      // Add totals row
      const totalRowNum = currentRow;
      const totalsData = [
        '',
        '',
        '',
        'TỔNG CỘNG',
        '',
        '',
        '',
        validItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
        '',
        validItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0),
        '',
        '',
        validItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterCK) || 0), 0),
        '',
        validItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterDiscount) || parseFloat(item.totalAfterCK) || 0), 0),
        ''
      ];

      totalsData.forEach((value, colIndex) => {
        const cell = ws.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        cell.border = thinBorder;
        if ([7, 9, 12, 14].includes(colIndex) && typeof value === 'number') {
          cell.numFmt = '#,##0';
        }
      });

      // Add AutoFilter for product table
      ws.autoFilter = {
        from: { row: headerRowNum, column: 1 },
        to: { row: totalRowNum, column: 16 }
      };

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DuLieuDonHang_${orderForm.orderNumber || 'New'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('Xuất dữ liệu Excel thành công!');
    } catch (error) {
      console.error('Error exporting order data:', error);
      alert('Lỗi khi xuất dữ liệu: ' + error.message);
    }
  };

  // Recalculate per-item final totals when order-level discountPercent changes
  useEffect(() => {
    const od = parseFloat(orderForm.discountPercent) || 0;
    setOrderItems(prev => prev.map(item => {
      const ta = parseFloat(item.totalAfterCK) || 0;
      const tad = Number((ta - (ta * od / 100)).toFixed(2));
      return { ...item, totalAfterDiscount: tad, total: tad };
    }));
  }, [orderForm.discountPercent]);

  // Recalculate order-level discount amount when items or order-level discountPercent change
  useEffect(() => {
    const od = parseFloat(orderForm.discountPercent) || 0;
    const sumTotalAfterCK = orderItems.reduce((s, it) => s + (parseFloat(it.totalAfterCK) || 0), 0);
    const discountAmt = Number((sumTotalAfterCK * od / 100).toFixed(2));
    setOrderForm(prev => ({ ...prev, discountAmount: discountAmt }));
  }, [orderItems, orderForm.discountPercent]);

  // Auto-fill discount note when user hasn't edited it manually
  useEffect(() => {
    if (discountNoteEdited) return;
    const pctRaw = orderForm.discountPercent || 0;
    const pctNum = Number(pctRaw) || 0;
    const pctDisplay = (pctNum % 1 !== 0) ? pctNum.toFixed(2).replace(/\.0+$/, '') : String(pctNum);
    const note = `Giảm ${pctDisplay}%`;
    setOrderForm(prev => ({ ...prev, discountNote: note }));
  }, [orderForm.discountAmount, orderForm.discountPercent, discountNoteEdited]);

  // Auto-update order number when order date changes, unless user manually edited order number
  useEffect(() => {
    if (orderNumberEdited) return;
    try {
      const d = new Date(orderForm.orderDate);
      if (isNaN(d)) return;
      const year = d.getFullYear();
      const serial = peekNextSerialForYear(year);
      const newNum = formatOrderNumber(d, serial);
      setOrderForm(prev => ({ ...prev, orderNumber: newNum }));
    } catch (e) {}
  }, [orderForm.orderDate, orderNumberEdited]);

  // Recalculate total kg and total m3 from order items
  useEffect(() => {
    const totalKg = orderItems.reduce((s, it) => s + (parseFloat(it.weight) || 0), 0);
    const totalM3 = orderItems.reduce((s, it) => s + (parseFloat(it.volume) || 0), 0);
    setOrderForm(prev => ({ ...prev, totalKg: Number(totalKg.toFixed(2)), totalM3: Number(totalM3.toFixed(3)) }));
  }, [orderItems]);

  const threeDigitsToWords = (num) => {
    const ones = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const unit = num % 10;
    let parts = [];
    if (hundred > 0) parts.push(ones[hundred] + ' trăm');
    if (ten > 1) {
      parts.push(ones[ten] + ' mươi');
      if (unit === 1) parts.push('mốt');
      else if (unit === 4) parts.push('tư');
      else if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(ones[unit]);
    } else if (ten === 1) {
      parts.push('mười');
      if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(ones[unit]);
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0) parts.push('lẻ');
      if (unit > 0) parts.push(ones[unit]);
    }
    return parts.join(' ');
  };

  const numberToVietnamese = (n) => {
    const raw = Number(n) || 0;
    const sign = raw < 0 ? 'âm ' : '';
    const abs = Math.abs(raw);
    const intPart = Math.floor(abs);
    const frac = +(abs - intPart).toFixed(6); // keep up to 6 decimals safely

    const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
    const parts = [];
    let num = intPart;
    let scaleIdx = 0;
    if (num === 0) parts.push('không');
    while (num > 0) {
      const segment = num % 1000;
      if (segment > 0) {
        const words = threeDigitsToWords(segment);
        parts.unshift((words ? words + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') : '').trim());
      }
      num = Math.floor(num / 1000);
      scaleIdx += 1;
    }
    const intWords = parts.join(' ').replace(/\s+/g, ' ').trim();
    let result = (intWords ? intWords.charAt(0).toUpperCase() + intWords.slice(1) : 'Không');

    if (frac > 0) {
      // Convert fractional part to string without trailing zeros
      const fracStr = frac.toString().replace(/^0\./, '');
      const fracDigits = fracStr.split('');
      const digitWords = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
      const fracWords = fracDigits.map(d => digitWords[parseInt(d, 10)]).join(' ');
      result = result + ' phẩy ' + fracWords;
    }

    return sign + result;
  };

  const totalInWords = (amount) => {
    const w = numberToVietnamese(amount);
    return w + ' đồng';
  };

  const handleSaveOrder = async () => {
    try {
      // Commit serial from order number so next generated will be higher
      try { commitSerialFromOrderNumber(orderForm.orderNumber); } catch(e) {}
      
      // Helper function to map item to backend format
      const mapItemToBackend = (item) => ({
        ProductCode: String(item.productCode || ''),
        Barcode: String(item.barcode || ''),
        ProductName: String(item.productName || ''),
        ProductType: String(item.productType || ''),
        Warehouse: String(item.warehouse || ''),
        Unit: String(item.unit || ''),
        Quantity: Number(item.quantity || 0),
        UnitPrice: Number(item.unitPrice || 0),
        DiscountPercent: Number(item.discountPercent || 0),
        PriceAfterCK: Number(item.priceAfterCK || 0),
        TotalAfterCK: Number(item.totalAfterCK || 0),
        TotalAfterDiscount: Number(item.totalAfterDiscount || 0),
        NvSales: String(item.nvSales || ''),
        Description: String(item.description || ''),
        Conversion: Number(item.conversion || 1),
        Amount: Number(item.amount || 0),
        Total: Number(item.total || 0),
        Weight: Number(item.weight || 0),
        Volume: Number(item.volume || 0),
        BaseWeight: Number(item.baseWeight || 0),
        BaseVolume: Number(item.baseVolume || 0),
        ExportType: String(item.exportType || 'xuất bán'),
        Stock: Number(item.stock || 0),
        Tax: String(item.tax || 'KCT'),
        PriceExcludeVAT: Number(item.priceExcludeVAT || 0),
        TotalExcludeVAT: Number(item.totalExcludeVAT || 0)
      });

      // Filter and validate items helper
      const filterValidItems = (items) => items.filter(item => {
        const hasText = (item.productCode && String(item.productCode).trim()) || 
                       (item.barcode && String(item.barcode).trim()) || 
                       (item.productName && String(item.productName).trim());
        const hasNumbers = (item.quantity && Number(item.quantity) > 0) || 
                          (item.unitPrice && Number(item.unitPrice) > 0);
        return Boolean(hasText) || Boolean(hasNumbers);
      });

      // Filter out empty order items (hàng bán)
      const validOrderItems = filterValidItems(orderItems).map(mapItemToBackend);
      
      // Filter out empty promotion items (hàng khuyến mãi)
      const validPromotionItems = filterValidItems(promotionItems).map(mapItemToBackend);

      // Auto-set order ProductType based on sale items
      const orderProductTypes = validOrderItems.map(item => item.ProductType).filter(pt => pt);
      const mostCommonProductType = orderProductTypes.length > 0 ? orderProductTypes[0] : '';
      
      // Prepare order data with proper field mapping for backend (after validOrderItems)
      const orderData = {
        OrderDate: orderForm.orderDate || new Date().toISOString().split('T')[0],
        OrderNumber: String(orderForm.orderNumber || ''),
        Customer: String(orderForm.customer || ''),
        CustomerName: String(orderForm.customerName || ''),
        Phone: String(orderForm.phone || ''),
        CreatedBy: String(orderForm.createdBy || ''),
        Address: String(orderForm.address || ''),
        Vehicle: String(orderForm.vehicle || ''),
        CustomerGroup: String(orderForm.customerGroup || ''),
        SalesSchedule: String(orderForm.salesSchedule || ''),
        PrintOrder: Number(orderForm.printOrder || 0),
        DeliveryVehicle: String(orderForm.deliveryVehicle || ''),
        PriceType: String(orderForm.priceType || 'retail'),
        ActiveTab: String(orderForm.activeTab || 'products'),
        // Hàng bán fields
        DiscountPercent: Number(orderForm.discountPercent || 0),
        DiscountAmount: Number(orderForm.discountAmount || 0),
        DiscountNote: String(orderForm.discountNote || ''),
        TotalKg: Number(orderForm.totalKg || 0),
        TotalM3: Number(orderForm.totalM3 || 0),
        Payment: Number(orderForm.payment || 0),
        AccountFund: String(orderForm.accountFund || ''),
        Notes: String(orderForm.notes || ''),
        // Hàng khuyến mãi fields
        PromoDiscountPercent: Number(orderForm.promoDiscountPercent || 0),
        PromoDiscountAmount: Number(orderForm.promoDiscountAmount || 0),
        PromoDiscountNote: String(orderForm.promoDiscountNote || ''),
        PromoTotalKg: Number(orderForm.promoTotalKg || 0),
        PromoTotalM3: Number(orderForm.promoTotalM3 || 0),
        PromoNotes: String(orderForm.promoNotes || ''),
        ProductType: mostCommonProductType,
        TotalAmount: calculateTotals(),
        TotalAfterDiscount: calculateTotals()
      };
      
      let response;
      
      if (editingOrderId) {
        // Update existing order - include ID in orderData
        const updatePayload = {
          Order: { ...orderData, Id: editingOrderId },
          OrderItems: validOrderItems,
          PromotionItems: validPromotionItems
        };
        
        response = await fetch(`${API_BASE_URL}/Orders/${editingOrderId}/update-with-items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
        
        if (response.ok) {
          alert('Đơn hàng đã được cập nhật thành công!');
          fetchOrders(); // Refresh orders list
        } else {
          const errorData = await response.text();
          throw new Error(`Lỗi cập nhật: ${errorData}`);
        }
      } else {
        // Create new order
        const createPayload = {
          Order: orderData,
          OrderItems: validOrderItems,
          PromotionItems: validPromotionItems
        };
        
        response = await api.post(`${API_ENDPOINTS.orders}/create-with-items`, createPayload);
        
        if (response) {
          alert('Đơn hàng đã được tạo thành công!');
          fetchOrders(); // Refresh orders list after successful save
        }
      }
    } catch (error) {
      console.error('Full error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      let errorMsg = 'Vui lòng thử lại';
      if (error.message) {
        errorMsg = error.message;
      }
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || error.response.data || errorMsg;
      }
      
      alert(`Lỗi khi lưu đơn hàng: ${errorMsg}`);
    }
  };

  const handleCopyOrder = async () => {
    try {
      // Generate new order number for the copy
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const newSerial = reserveNextSerialForYear(year);
      const newOrderNumber = formatOrderNumber(currentDate, newSerial);
      
      // Prepare order data with new order number but same other data
      const orderData = {
        OrderDate: orderForm.orderDate || new Date().toISOString().split('T')[0],
        OrderNumber: newOrderNumber, // New order number for copy
        Customer: String(orderForm.customer || ''),
        CustomerName: String(orderForm.customerName || ''),
        Phone: String(orderForm.phone || ''),
        CreatedBy: String(orderForm.createdBy || ''),
        Address: String(orderForm.address || ''),
        Vehicle: String(orderForm.vehicle || ''),
        CustomerGroup: String(orderForm.customerGroup || ''),
        SalesSchedule: String(orderForm.salesSchedule || ''),
        PrintOrder: Number(orderForm.printOrder || 0),
        DeliveryVehicle: String(orderForm.deliveryVehicle || ''),
        PriceType: String(orderForm.priceType || 'retail'),
        ActiveTab: String(orderForm.activeTab || 'products'),
        DiscountPercent: Number(orderForm.discountPercent || 0),
        DiscountAmount: Number(orderForm.discountAmount || 0),
        DiscountNote: String(orderForm.discountNote || ''),
        TotalKg: Number(orderForm.totalKg || 0),
        TotalM3: Number(orderForm.totalM3 || 0),
        Payment: Number(orderForm.payment || 0),
        AccountFund: String(orderForm.accountFund || ''),
        Notes: String(orderForm.notes || ''),
        TotalAmount: calculateTotals(),
        TotalAfterDiscount: calculateTotals()
      };
      
      // Use same order items as current form
      const validOrderItems = orderItems.filter(item => {
        const hasText = (item.productCode && String(item.productCode).trim()) || 
                       (item.barcode && String(item.barcode).trim()) || 
                       (item.productName && String(item.productName).trim());
        const hasNumbers = (item.quantity && Number(item.quantity) > 0) || 
                          (item.unitPrice && Number(item.unitPrice) > 0);
        return Boolean(hasText) || Boolean(hasNumbers);
      }).map(item => ({
        ProductCode: String(item.productCode || ''),
        Barcode: String(item.barcode || ''),
        ProductName: String(item.productName || ''),
        Warehouse: String(item.warehouse || ''),
        Unit: String(item.unit || ''),
        Quantity: Number(item.quantity || 0),
        UnitPrice: Number(item.unitPrice || 0),
        DiscountPercent: Number(item.discountPercent || 0),
        PriceAfterCK: Number(item.priceAfterCK || 0),
        TotalAfterCK: Number(item.totalAfterCK || 0),
        TotalAfterDiscount: Number(item.totalAfterDiscount || 0),
        NvSales: String(item.nvSales || ''),
        Description: String(item.description || ''),
        Conversion: Number(item.conversion || 1),
        Amount: Number(item.amount || 0),
        Total: Number(item.total || 0),
        Weight: Number(item.weight || 0),
        Volume: Number(item.volume || 0),
        BaseWeight: Number(item.baseWeight || 0),
        BaseVolume: Number(item.baseVolume || 0),
        ExportType: String(item.exportType || 'xuất bán'),
        Stock: Number(item.stock || 0),
        Tax: String(item.tax || 'KCT'),
        PriceExcludeVAT: Number(item.priceExcludeVAT || 0),
        TotalExcludeVAT: Number(item.totalExcludeVAT || 0)
      }));
      
      // Prepare request payload
      const requestPayload = {
        Order: orderData,
        OrderItems: validOrderItems
      };
      
      console.log('Copying order with data:', requestPayload);
      
      // Call API to create copy of order
      const response = await api.post(`${API_ENDPOINTS.orders}/create-with-items`, requestPayload);
      
      if (response) {
        alert(`Đơn hàng đã được sao chép thành công! Số phiếu mới: ${newOrderNumber}`);
        
        // Update form with new order number to reflect the copy
        setOrderForm(prev => ({ 
          ...prev, 
          orderNumber: newOrderNumber 
        }));
        setOrderNumberEdited(true); // Prevent auto-generation of order number
      }
    } catch (error) {
      console.error('Full error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      let errorMsg = 'Vui lòng thử lại';
      if (error.message) {
        errorMsg = error.message;
      }
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || error.response.data || errorMsg;
      }
      
      alert(`Lỗi khi sao chép đơn hàng: ${errorMsg}`);
    }
  };

  const handleCreateNew = () => {
    // ALWAYS auto-fill with current user's name (admin can change later if needed)
    const defaultCreatedBy = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
    const defaultNvSales = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
    
    setOrderForm({
      orderDate: defaultOrderDate,
      orderNumber: formatOrderNumber(defaultOrderDate, peekNextSerialForYear(new Date(defaultOrderDate).getFullYear())),
      customer: '',
      customerName: '',
      phone: '',
      createdBy: defaultCreatedBy,
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
      notes: '',
      status: 'chưa duyệt'
    });
    setOrderItems([{ id: 1, productCode: '', barcode: '', productName: '', productType: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: defaultNvSales, description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'xuất bán', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }]);
    setDiscountNoteEdited(false);
    setOrderNumberEdited(false);
    setEditingOrderId(null); // Reset editing mode
    // Reset customer selection
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setSelectedCustomerForMap(null);
    
    // Refresh orders list
    fetchOrders();
  };

  const handleGoBack = () => {
    navigate('/business/sales/sale-management-by-current-user');
  };

  // Handle approve order
  const handleApproveOrder = async () => {
    if (!editingOrderId) {
      alert('Vui lòng lưu đơn hàng trước khi duyệt!');
      return;
    }
    
    if (orderForm.status === 'đã duyệt') {
      alert('Đơn hàng này đã được duyệt rồi!');
      return;
    }
    
    if (orderForm.status === 'đã hủy') {
      alert('Không thể duyệt đơn hàng đã bị hủy!');
      return;
    }
    
    const confirmApprove = window.confirm('Bạn có chắc chắn muốn DUYỆT đơn hàng này?');
    if (!confirmApprove) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/Orders/${editingOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'đã duyệt' })
      });
      
      if (response.ok) {
        setOrderForm(prev => ({ ...prev, status: 'đã duyệt' }));
        alert('Đơn hàng đã được duyệt thành công!');
        fetchOrders(); // Refresh orders list
      } else {
        const errorData = await response.text();
        throw new Error(`Lỗi duyệt đơn hàng: ${errorData}`);
      }
    } catch (error) {
      console.error('Error approving order:', error);
      alert(`Lỗi khi duyệt đơn hàng: ${error.message}`);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!editingOrderId) {
      alert('Vui lòng lưu đơn hàng trước khi hủy!');
      return;
    }
    
    if (orderForm.status === 'đã hủy') {
      alert('Đơn hàng này đã bị hủy rồi!');
      return;
    }
    
    if (orderForm.status === 'đã duyệt') {
      const confirmCancelApproved = window.confirm('Đơn hàng này đã được duyệt. Bạn vẫn muốn HỦY?');
      if (!confirmCancelApproved) return;
    }
    
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn HỦY đơn hàng này?');
    if (!confirmCancel) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/Orders/${editingOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'đã hủy' })
      });
      
      if (response.ok) {
        setOrderForm(prev => ({ ...prev, status: 'đã hủy' }));
        alert('Đơn hàng đã được hủy!');
        fetchOrders(); // Refresh orders list
      } else {
        const errorData = await response.text();
        throw new Error(`Lỗi hủy đơn hàng: ${errorData}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`Lỗi khi hủy đơn hàng: ${error.message}`);
    }
  };

  const handleSearchInOrderItems = () => {
    setShowSearchModal(true);
    setSearchQuery('');
    // Hiển thị tất cả sản phẩm đã chọn ban đầu
    const allItems = orderItems.map((item, index) => ({
      ...item,
      rowIndex: index
    })).filter(item => {
      // Chỉ hiển thị những item có dữ liệu
      return (item.productCode && String(item.productCode).trim()) || 
             (item.barcode && String(item.barcode).trim()) || 
             (item.productName && String(item.productName).trim());
    });
    setSearchResults(allItems);
  };

  const handleSearchQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Nếu không có query, hiển thị tất cả items đã chọn
    if (!query.trim()) {
      const allItems = orderItems.map((item, index) => ({
        ...item,
        rowIndex: index
      })).filter(item => {
        return (item.productCode && String(item.productCode).trim()) || 
               (item.barcode && String(item.barcode).trim()) || 
               (item.productName && String(item.productName).trim());
      });
      setSearchResults(allItems);
      return;
    }

    // Tìm kiếm trong các order items hiện tại với hỗ trợ tiếng Việt không dấu
    const queryNormalized = removeVietnameseTones(query.toLowerCase());
    const results = orderItems.filter((item, index) => {
      // Chỉ tìm những item có dữ liệu
      const hasData = (item.productCode && String(item.productCode).trim()) || 
                     (item.barcode && String(item.barcode).trim()) || 
                     (item.productName && String(item.productName).trim());
      
      if (!hasData) return false;

      const searchText = `${item.barcode || ''} ${item.productCode || ''} ${item.productName || ''} ${item.description || ''}`.toLowerCase();
      const searchTextNormalized = removeVietnameseTones(searchText);
      
      return searchTextNormalized.includes(queryNormalized);
    }).map((item, originalIndex) => ({
      ...item,
      rowIndex: orderItems.indexOf(item) // Lưu index gốc để highlight
    }));

    setSearchResults(results);
  };

  const handleSelectSearchResult = (result) => {
    setShowSearchModal(false);
    
    // Scroll đến dòng được chọn và highlight
    const table = document.querySelector('.order-items-table tbody');
    if (table) {
      const targetRow = table.children[result.rowIndex];
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight dòng được chọn
        targetRow.style.backgroundColor = '#fffacd';
        setTimeout(() => {
          targetRow.style.backgroundColor = '';
        }, 3000);
      }
    }
  };

  // === Promotion Search Modal Handlers (copy from sales modal) ===
  const handleSearchInPromoItems = () => {
    setShowPromoSearchModal(true);
    setPromoSearchQuery('');
    // Hiển thị tất cả sản phẩm khuyến mãi đã chọn ban đầu
    const allItems = promotionItems.map((item, index) => ({
      ...item,
      rowIndex: index
    })).filter(item => {
      // Chỉ hiển thị những item khuyến mãi có dữ liệu
      const hasData = (item.productCode && String(item.productCode).trim()) || 
             (item.barcode && String(item.barcode).trim()) || 
             (item.productName && String(item.productName).trim());
      return hasData;
    });
    setPromoSearchResults(allItems);
  };

  const handlePromoSearchQueryChange = (e) => {
    const query = e.target.value;
    setPromoSearchQuery(query);
    
    // Nếu không có query, hiển thị tất cả items khuyến mãi đã chọn
    if (!query.trim()) {
      const allItems = promotionItems.map((item, index) => ({
        ...item,
        rowIndex: index
      })).filter(item => {
        const hasData = (item.productCode && String(item.productCode).trim()) || 
               (item.barcode && String(item.barcode).trim()) || 
               (item.productName && String(item.productName).trim());
        return hasData;
      });
      setPromoSearchResults(allItems);
      return;
    }

    // Tìm kiếm trong các promotion items với hỗ trợ tiếng Việt không dấu
    const queryNormalized = removeVietnameseTones(query.toLowerCase());
    const results = promotionItems.filter((item, index) => {
      // Chỉ tìm những item có dữ liệu
      const hasData = (item.productCode && String(item.productCode).trim()) || 
                     (item.barcode && String(item.barcode).trim()) || 
                     (item.productName && String(item.productName).trim());
      
      if (!hasData) return false;

      const searchText = `${item.barcode || ''} ${item.productCode || ''} ${item.productName || ''} ${item.description || ''}`.toLowerCase();
      const searchTextNormalized = removeVietnameseTones(searchText);
      
      return searchTextNormalized.includes(queryNormalized);
    }).map((item, originalIndex) => ({
      ...item,
      rowIndex: promotionItems.indexOf(item) // Lưu index gốc để highlight
    }));

    setPromoSearchResults(results);
  };

  const handleSelectPromoSearchResult = (result) => {
    setShowPromoSearchModal(false);
    
    // Scroll đến dòng được chọn và highlight
    const table = document.querySelector('.order-items-table tbody');
    if (table) {
      const targetRow = table.children[result.rowIndex];
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight dòng được chọn
        targetRow.style.backgroundColor = '#fffacd';
        setTimeout(() => {
          targetRow.style.backgroundColor = '';
        }, 3000);
      }
    }
  };

  // Use same simple approach as CreateOrder page - no measurement needed

  // Filter customers based on search text
  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const searchNormalized = removeVietnameseTones(customerSearch);
    const filtered = customers.filter(c => {
      const customerText = `${c.name || ''} ${c.phone || ''} ${c.customerGroup || ''}`;
      const customerNormalized = removeVietnameseTones(customerText);
      return customerNormalized.includes(searchNormalized);
    });
    
    setFilteredCustomers(filtered);
  }, [customerSearch, customers]);

  useEffect(() => {
    // Load customers and extract unique position values for 'Vị trí' dropdown
    let mounted = true;
    
    // Load both customers and customer groups
    Promise.all([
      api.get(API_ENDPOINTS.customers),
      api.get(API_ENDPOINTS.customerGroups)
    ])
    .then(([customersData, groupsData]) => {
      if (!mounted) return;
      
      if (Array.isArray(customersData) && Array.isArray(groupsData)) {
        // Apply salesSchedule mapping from customer groups salesSchedule field
        const groupMap = {};
        groupsData.forEach(g => {
          const key = g.code || g.id || g.name;
          const schedule = g.salesSchedule || '';
          if (key) groupMap[key] = schedule;
        });
        
        const mappedCustomers = customersData.map(c => ({
          ...c,
          salesSchedule: groupMap[c.customerGroup] || groupMap[c.customerGroup?.toString()] || c.salesSchedule || ''
        }));
        
        setCustomers(mappedCustomers);
        setFilteredCustomers(mappedCustomers);
        
        const pos = Array.from(new Set(mappedCustomers.map(c => (c.Position || c.position || c.positionName || '').toString().trim()).filter(Boolean)));
        setPositions(pos);
        
        setCustomerGroups(groupsData);
      }
    })
    .catch(err => console.warn('Failed to load data:', err));

    // load products for product selection
    api.get(API_ENDPOINTS.products)
      .then(pdata => {
        if (!mounted) return;
        if (Array.isArray(pdata)) setProducts(pdata);
      })
      .catch(err => console.warn('Failed to load products', err));

    // load warehouses for warehouse select
    api.get(API_ENDPOINTS.warehouses)
      .then(wdata => {
        if (!mounted) return;
        if (Array.isArray(wdata)) setWarehouses(wdata);
      })
      .catch(err => console.warn('Failed to load warehouses', err));

    // load units for unit select
    api.get(API_ENDPOINTS.units)
      .then(udata => {
        if (!mounted) return;
        if (Array.isArray(udata)) setUnits(udata);
      })
      .catch(err => console.warn('Failed to load units', err));
    
    // load export types (transaction contents) for export type select
    api.get(API_ENDPOINTS.transactionContents)
      .then(edata => {
        if (!mounted) return;
        if (Array.isArray(edata)) setExportTypes(edata);
      })
      .catch(err => console.warn('Failed to load export types', err));

    // load sales users for NV Sales select
    api.get(API_ENDPOINTS.users)
      .then(udata => {
        if (!mounted) return;
        if (Array.isArray(udata)) {
          setSalesUsers(udata);
          setUsers(udata);
          
          // Don't override createdBy here - it's handled by the authUser useEffect
          // This useEffect only loads the users list for dropdowns
        }
      })
      .catch(err => console.warn('Failed to load users', err));
    return () => { mounted = false; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const normalizeText = (s) => {
    if (!s && s !== 0) return '';
    try {
      return String(s).normalize('NFD').replace(/[ -\uFFFF]/g, (c) => c).replace(/\p{Diacritic}/gu, '').toLowerCase();
    } catch (e) {
      return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
  };

  const filterProducts = (query) => {
    const q = normalizeText(query || '');
    if (!q) return [];
    const matches = products.filter(p => {
      const barcode = normalizeText(p.barcode || p.Barcode || p.bar_code || '');
      const code = normalizeText(p.code || p.productCode || p.id || '');
      const name = normalizeText(p.name || p.vatName || p.displayName || '');
      return barcode.includes(q) || code.includes(q) || name.includes(q) || name.split(' ').some(token => token.includes(q));
    });
    return matches.slice(0, 100);
  };

  const handleSelectProduct = (sel, rowIndex) => {
    if (!sel) return;
    handleOrderItemChange(rowIndex, 'barcode', sel.barcode || sel.Barcode || '');
    handleOrderItemChange(rowIndex, 'productCode', sel.code || sel.productCode || '');
    
    // Auto-set ProductType from product category if available
    if (sel.category) {
      // Find the ProductCategory by code/id and get its name
      const category = productCategories.find(cat => 
        cat.code === sel.category || cat.id === sel.category || cat.name === sel.category
      );
      if (category) {
        handleOrderItemChange(rowIndex, 'productType', category.name);
      } else {
        // If category not found in productCategories but exists in product, use it directly
        handleOrderItemChange(rowIndex, 'productType', sel.category);
      }
    }
    
    const price = sel.retailPrice || sel.price || sel.retailPrice1 || sel.sellPrice || 0;
    const rawPrice = parseFloat(price) || 0;
    const stockVal = sel.stock || sel.quantity || sel.available || sel.onHand || sel.tonkho || sel.tongton || 0;
    handleOrderItemChange(rowIndex, 'stock', parseFloat(stockVal) || 0);
    const preferredUnit = sel.baseUnit || sel.defaultUnit || sel.unit || '';
    let unitCode = preferredUnit;
    if (preferredUnit) {
      const found = units.find(u => (u.code && String(u.code) === String(preferredUnit)) || (u.name && String(u.name) === String(preferredUnit)));
      if (found) unitCode = found.code || found.name;
    }
    handleOrderItemChange(rowIndex, 'unit', unitCode || '');
    const unitCandidates = [sel.baseUnit, sel.unit1, sel.unit2, sel.unit3].filter(Boolean);
    const unitConversions = [sel.baseConversion, sel.conversion1, sel.conversion2, sel.conversion3];
    const unitOptions = unitCandidates.map((u, idx) => {
      const conv = unitConversions[idx] !== undefined && unitConversions[idx] !== null ? unitConversions[idx] : (idx === 0 ? (sel.baseConversion || 1) : 0);
      const found = units.find(x => (x.code && String(x.code) === String(u)) || (x.name && String(x.name) === String(u)));
      return { value: found ? (found.code || found.name) : u, label: found ? (found.name || found.code) : u, conversion: conv };
    });
    if (unitOptions.length === 0 && preferredUnit) {
      const found = units.find(x => (x.code && String(x.code) === String(preferredUnit)) || (x.name && String(x.name) === String(preferredUnit)));
      unitOptions.push({ value: found ? (found.code||found.name) : preferredUnit, label: found ? (found.name||found.code) : preferredUnit, conversion: sel.baseConversion || 1 });
    }
    handleOrderItemChange(rowIndex, 'unitOptions', unitOptions);
    const selectedUnitOption = unitOptions.find(uo => String(uo.value) === String(unitCode));
    // determine conversion for selected/default unit and compute base price per smallest unit
    const chosenConv = selectedUnitOption ? (selectedUnitOption.conversion || 1) : (sel.baseConversion || 1);
    const computedUnitPriceBase = chosenConv ? (rawPrice / chosenConv) : rawPrice;
    handleOrderItemChange(rowIndex, 'unitPriceBase', computedUnitPriceBase);
    handleOrderItemChange(rowIndex, 'conversion', chosenConv);
    handleOrderItemChange(rowIndex, 'unitPrice', Number((computedUnitPriceBase * (chosenConv || 1)).toFixed(2)));
    const defaultWh = sel.defaultWarehouseId || sel.warehouseId || (warehouses.length > 0 ? warehouses[0].id : '');
    if (defaultWh) handleOrderItemChange(rowIndex, 'warehouse', String(defaultWh));
    handleOrderItemChange(rowIndex, 'description', sel.description || sel.note || '');
    // ALWAYS auto-fill nvSales with current user's name (keep existing value if product has nvSales and admin)
    const currentUserName = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
    const defaultNvSalesValue = currentUserName || sel.nvSales || '';
    handleOrderItemChange(rowIndex, 'nvSales', defaultNvSalesValue);
    // Set VAT % from product, show "KCT" if null/empty
    const vatPercent = sel.vatPercent || sel.VAT_Percent || sel.vat || sel.taxRate || '';
    handleOrderItemChange(rowIndex, 'tax', vatPercent || 'KCT');
    const vol = sel.volume || sel.m3 || sel.cbm || sel.volume_m3 || 0;
    const wt = sel.weight || sel.kg || sel.weightKg || sel.weight_kg || 0;
    // Store base weight and volume for calculation
    handleOrderItemChange(rowIndex, 'baseVolume', parseFloat(vol) || 0);
    handleOrderItemChange(rowIndex, 'baseWeight', parseFloat(wt) || 0);
    // Calculate displayed weight and volume: base * conversion * quantity
    const currentItems = orderForm.activeTab === 'promotions' ? promotionItems : orderItems;
    const qty = currentItems[rowIndex] ? (parseFloat(currentItems[rowIndex].quantity) || 0) : 0;
    handleOrderItemChange(rowIndex, 'volume', Number((parseFloat(vol) * (chosenConv || 1) * qty).toFixed(2)));
    handleOrderItemChange(rowIndex, 'weight', Number((parseFloat(wt) * (chosenConv || 1) * qty).toFixed(2)));
    handleOrderItemChange(rowIndex, 'productName', sel.name || sel.vatName || sel.displayName || sel.code || sel.id || '');
    setProductSuggestions([]);
    setSuggestionRow(null);
    setActiveSuggestionIndex(0);
    setTimeout(() => {
      const isPromoTab = orderForm.activeTab === 'promotions';
      const setItems = isPromoTab ? setPromotionItems : setOrderItems;
      setItems(prev => {
        if (rowIndex === prev.length - 1) {
          // ALWAYS auto-fill nvSales with current user's name for new row
          const newRowNvSales = currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '';
          return [...prev, {
            id: prev.length + 1,
            productCode: '',
            barcode: '',
            productName: '',
            productType: '',
            warehouse: '',
            unit: '',
            quantity: 0,
            unitPrice: 0,
            discountPercent: 0,
            priceAfterCK: 0,
            totalAfterCK: 0,
            totalAfterDiscount: 0,
            nvSales: newRowNvSales,
            description: '',
            conversion: '',
            total: 0,
            weight: 0,
            volume: 0,
            baseWeight: 0,
            baseVolume: 0,
            exportType: isPromoTab ? 'khuyến mãi' : 'xuất bán',
            stock: 0
          }];
        }
        return prev;
      });
    }, 50);
  };

  const toggleColumnVisibility = (key) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const resetColumnsToDefault = () => {
    // Reset columns and widths to default, clear localStorage
    setColumns(defaultColumns);
    setColWidths(initialColWidths);
    
    try {
      localStorage.removeItem('createOrderForm.columns');
      localStorage.removeItem('createOrderForm.colWidths');
      // Columns and widths reset to default
    } catch (e) {
      // Failed to clear localStorage
    }
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
        <div className="header-buttons">
          <button className="btn-view-orders" onClick={() => setShowOrdersList(true)}>
            📋 Xem đơn hàng đã lưu ({savedOrders.length})
          </button>
          <button className="btn-create-new" onClick={handleCreateNew}>
            + Tạo mới
          </button>
        </div>
      </div>

      {/* Form Body */}
      <div className="order-form-body">
        <div className="order-form-top">
        {/* Row 1: Ngày lập, Khách hàng */}
        <div className="order-form-row">
          <div className="order-form-group">
            <label className="required">Ngày lập</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={formatDisplayDate(orderForm.orderDate)}
                onChange={(e) => {
                  const parsed = parseDateInput(e.target.value);
                  if (parsed) {
                    handleOrderFormChange('orderDate', parsed);
                  }
                }}
                onBlur={(e) => {
                  const parsed = parseDateInput(e.target.value);
                  if (parsed) {
                    handleOrderFormChange('orderDate', parsed);
                  } else if (e.target.value.trim()) {
                    // If invalid format, revert to current valid date
                    e.target.value = formatDisplayDate(orderForm.orderDate);
                  }
                }}
                className="order-form-input"
                placeholder="dd/mm/yyyy"
                style={{ paddingRight: '35px' }}
              />
              <input
                type="date"
                ref={(el) => {
                  if (el) {
                    // Hidden date picker input
                    el.style.position = 'absolute';
                    el.style.right = '5px';
                    el.style.top = '50%';
                    el.style.transform = 'translateY(-50%)';
                    el.style.width = '25px';
                    el.style.height = '25px';
                    el.style.opacity = '0';
                    el.style.cursor = 'pointer';
                  }
                }}
                value={orderForm.orderDate}
                onChange={(e) => handleOrderFormChange('orderDate', e.target.value)}
                title="Chọn ngày"
              />
              <span 
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666',
                  pointerEvents: 'none'
                }}
              >
                📅
              </span>
            </div>
          </div>
          <div className="order-form-group" style={{ position: 'relative' }}>
            <label className="required">Khách hàng</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Tìm kiếm khách hàng..."
              className="order-form-input"
            />
            
            {showCustomerDropdown && (
              <div className="dropdown-list" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderTop: 'none',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.slice(0, 10).map(c => {
                    const group = customerGroups.find(g => g.code === c.customerGroup);
                    const groupName = group ? group.name : c.customerGroup;
                    
                    return (
                      <div
                        key={c.id || c.code}
                        onClick={() => {
                          const val = c.id || c.code;
                          handleOrderFormChange('customer', val);
                          setCustomerSearch(`${c.name || ''}${c.phone ? ' (' + c.phone + ')' : ''}${groupName ? ' - ' + groupName : ''}`);
                          setShowCustomerDropdown(false);
                    
                          handleOrderFormChange('customerName', c.name || '');
                          handleOrderFormChange('phone', c.phone || c.Phone || '');
                          handleOrderFormChange('customerGroup', c.customerGroup || c.group || c.customerGroupName || '');
                          handleOrderFormChange('address', c.address || c.vatAddress || c.Address || '');
                          handleOrderFormChange('vehicle', c.position || c.Position || c.vehicle || '');
                          const printVal = c.printIn !== undefined && c.printIn !== null ? parseInt(c.printIn, 10) || 0 : 0;
                          handleOrderFormChange('printOrder', printVal);
                          const salesScheduleValue = c.salesSchedule || c.salesScheduleName || c.sales || '';
                          handleOrderFormChange('salesSchedule', salesScheduleValue);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {`${c.name || ''}${c.phone ? ' (' + c.phone + ')' : ''}${groupName ? ' - ' + groupName : ''}`}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '8px 12px', color: '#999' }}>
                    Không tìm thấy khách hàng
                  </div>
                )}
              </div>
            )}
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
                onChange={(e) => { setOrderNumberEdited(true); handleOrderFormChange('orderNumber', e.target.value); }}
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
              readOnly={isCustomerSelected}
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
              readOnly={isCustomerSelected}
            />
          </div>
        </div>
        </div>

        {/* Row 3: Nhân viên lập, Địa chỉ, Xe */}
        <div className="order-form-row three-cols">
          <div className="order-form-group">
            <label className="required">Nhân viên lập</label>
            <div className="input-with-icon">
              {canChooseSales ? (
                <select
                  value={orderForm.createdBy}
                  onChange={(e) => handleOrderFormChange('createdBy', e.target.value)}
                  className="order-form-select"
                >
                  <option value="">Chọn nhân viên</option>
                  {users.map(user => {
                    // Use same priority as auto-fill: name > tenNhanVien > username
                    const displayName = user.name || user.tenNhanVien || user.username || '';
                    return (
                      <option key={user.id || user.username} value={displayName}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  value={orderForm.createdBy || (currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '')}
                  className="order-form-input"
                  disabled
                  title="Bạn không có quyền chọn nhân viên khác"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              )}
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
              readOnly={isCustomerSelected}
            />
          </div>
          <div className="order-form-group">
            <label>Vị trí</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={orderForm.vehicle}
              onChange={(e) => handleOrderFormChange('vehicle', e.target.value)}
              className="order-form-select"
              style={{ flex: 1 }}
              disabled={isCustomerSelected}
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
            {/* Clickable icon to open map modal for the selected position */}
            <button
              type="button"
              onClick={() => {
                // Try to find original customer by selected customer id/code
                const sel = customers.find(c => String(c.id) === String(orderForm.customer) || String(c.code) === String(orderForm.customer));
                if (sel && sel.position) {
                  setSelectedCustomerForMap(sel);
                  setShowMapModal(true);
                } else if (orderForm.vehicle) {
                  // Construct a small object compatible with OpenStreetMapModal
                  setSelectedCustomerForMap({ name: orderForm.customerName || 'Khách hàng', code: orderForm.customer || '', position: orderForm.vehicle, address: orderForm.address, phone: orderForm.phone });
                  setShowMapModal(true);
                } else {
                  alert('Không có vị trí để hiển thị. Vui lòng chọn khách hàng hoặc vị trí.');
                }
              }}
              title="Xem vị trí"
              style={{ padding: '6px 10px', cursor: 'pointer' }}
            >
              📍
            </button>
            </div>
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
              disabled={isCustomerSelected}
            >
              <option value="">Chọn nhóm khách hàng</option>
              {customerGroups.length === 0 && (
                <option value="">(Không có nhóm)</option>
              )}
              {customerGroups.map(g => (
                <option key={g.id} value={g.code}>{g.code} - {g.name}</option>
              ))}
            </select>
          </div>
          <div className="order-form-group">
            <label>Lịch bán hàng</label>
            <input
              type="text"
              value={orderForm.salesSchedule}
              readOnly
              className="order-form-input"
              placeholder="Chọn khách hàng để hiển thị lịch bán hàng"
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
              readOnly={isCustomerSelected}
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
            <i className="sort-icon" onClick={(e) => { e.stopPropagation(); handleSearchInOrderItems(); }} style={{cursor: 'pointer', marginLeft: '8px'}} title="Tìm kiếm hàng bán">🔍</i>
          </button>
          <button
            className={`tab-btn ${orderForm.activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => handleOrderFormChange('activeTab', 'promotions')}
          >
            🔊 Hàng khuyến mãi
            <i className="sort-icon" onClick={(e) => { e.stopPropagation(); handleSearchInPromoItems(); }} style={{cursor: 'pointer', marginLeft: '8px'}} title="Tìm kiếm hàng khuyến mãi">🔍</i>
          </button>
        </div>

        {/* Products Table */}
        <div className="order-items-section">
            <div className="order-items-header">
            <span className="items-total">Tổng {nonEmptyCount}</span>
            <div className="items-actions">
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
                  <button onClick={resetColumnsToDefault} style={{ marginRight: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                    Reset
                  </button>
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

          {/* Columns to hide when promotions tab is active */}
          {(() => {
            const hiddenColumnsForPromo = ['unitPrice', 'amount', 'discountPercent', 'priceAfterCK', 'totalAfterCK', 'discountPercentGlobal', 'totalAfterDiscount', 'priceExcludeVAT', 'totalExcludeVAT'];
            const isPromoTab = orderForm.activeTab === 'promotions';
            const visibleColumns = columns.filter(c => {
              if (!c.visible) return false;
              if (isPromoTab && hiddenColumnsForPromo.includes(c.key)) return false;
              return true;
            });
            const visibleColIndices = columns.map((c, i) => {
              if (!c.visible) return -1;
              if (isPromoTab && hiddenColumnsForPromo.includes(c.key)) return -1;
              return i;
            }).filter(i => i >= 0);

            return (
          <div className="order-items-table-container">
            <table 
              className="order-items-table"
              style={{
                width: visibleColIndices.reduce((sum, i) => sum + (colWidths[i] || 120), 0) + 'px',
                minWidth: visibleColIndices.reduce((sum, i) => sum + (colWidths[i] || 120), 0) + 'px'
              }}
            >
              <colgroup>
                {columns.map((c, i) => {
                  const shouldShow = c.visible && !(isPromoTab && hiddenColumnsForPromo.includes(c.key));
                  return (
                    <col key={c.key} style={{ width: (colWidths[i] || 120) + 'px', display: shouldShow ? undefined : 'none' }} />
                  );
                })}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((c, i) => {
                    const shouldShow = c.visible && !(isPromoTab && hiddenColumnsForPromo.includes(c.key));
                    if (!shouldShow) return null;
                    return (
                    <th key={c.key}
                        draggable={c.key !== 'checkbox'}
                        onDragStart={(e) => c.key !== 'checkbox' && onDragStartHeader(e, i)}
                        onDragOver={onDragOverHeader}
                        onDrop={(e) => onDropHeader(e, i)}
                        onDragEnd={onDragEndHeader}
                    >
                      {c.key === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={currentDisplayItems.length > 0 && selectedItems.length === currentDisplayItems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(currentDisplayItems.map(item => item.id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                          title="Chọn tất cả"
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      ) : (
                        <>
                          {c.label} {c.key === 'barcode' || c.key === 'productCode' || c.key === 'productName' ? <i className="sort-icon" onClick={isPromoTab ? handleSearchInPromoItems : handleSearchInOrderItems} style={{cursor: 'pointer'}} title="Tìm kiếm trong đơn hàng">🔍</i> : null}
                        </>
                      )}
                      <div className="col-resizer" onMouseDown={startResize} />
                    </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {currentDisplayItems.map((item, rowIndex) => (
                  <tr key={item.id} className={selectedItems.includes(item.id) ? 'selected-row' : ''}>
                    {columns.map((c, colIndex) => {
                      const shouldShow = c.visible && !(isPromoTab && hiddenColumnsForPromo.includes(c.key));
                      if (!shouldShow) return null;
                      return (
                      <td key={c.key} className={['priceAfterCK','totalAfterCK','discountPercentGlobal','totalAfterDiscount','stock'].includes(c.key) ? 'total-cell' : ''}>
                        {(() => {
                          switch (c.key) {
                            case 'checkbox':
                              return (
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(prev => [...prev, item.id]);
                                    } else {
                                      setSelectedItems(prev => prev.filter(id => id !== item.id));
                                    }
                                  }}
                                  className="item-checkbox"
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                              );
                            case 'barcode':
                              return (
                                <input
                                  type="text"
                                  value={item.barcode || ''}
                                  onChange={(e) => handleOrderItemChange(rowIndex, 'barcode', e.target.value)}
                                  className="item-input"
                                  readOnly
                                />
                              );
                            case 'productCode':
                              return (
                                <input
                                  type="text"
                                  value={item.productCode || ''}
                                  onChange={(e) => handleOrderItemChange(rowIndex, 'productCode', e.target.value)}
                                  className="item-input"
                                  readOnly
                                />
                              );
                            case 'productName':
                              return (
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    ref={el => { productInputRefs.current[rowIndex] = el; }}
                                    value={item.productName || ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      handleOrderItemChange(rowIndex, 'productName', v);
                                      const list = filterProducts(v);
                                      setProductSuggestions(list);
                                      setSuggestionRow(rowIndex);
                                      setActiveSuggestionIndex(0);
                                      // compute coords so suggestion list can be fixed-positioned above input
                                      const el = productInputRefs.current[rowIndex];
                                      if (el) {
                                        const rect = el.getBoundingClientRect();
                                        const bottom = window.innerHeight - rect.top + 6; // place list bottom at input top
                                        setSuggestionCoords({ left: rect.left, width: rect.width, bottom });
                                      }
                                    }}
                                      onFocus={(e) => {
                                        // Show suggestions on focus (click into cell) even if input empty
                                        const list = products && products.length ? products.slice(0, 100) : [];
                                        setProductSuggestions(list);
                                        setSuggestionRow(rowIndex);
                                        setActiveSuggestionIndex(0);
                                        const el = productInputRefs.current[rowIndex];
                                        if (el) {
                                          const rect = el.getBoundingClientRect();
                                          const bottom = window.innerHeight - rect.top + 6;
                                          setSuggestionCoords({ left: rect.left, width: rect.width, bottom });
                                        }
                                      }}
                                      onClick={(e) => {
                                        // also open suggestions on click (useful when already focused)
                                        if (suggestionRow === rowIndex && productSuggestions && productSuggestions.length > 0) return;
                                        const list = products && products.length ? products.slice(0, 100) : [];
                                        setProductSuggestions(list);
                                        setSuggestionRow(rowIndex);
                                        setActiveSuggestionIndex(0);
                                        const el = productInputRefs.current[rowIndex];
                                        if (el) {
                                          const rect = el.getBoundingClientRect();
                                          const bottom = window.innerHeight - rect.top + 6;
                                          setSuggestionCoords({ left: rect.left, width: rect.width, bottom });
                                        }
                                      }}
                                    onKeyDown={(e) => {
                                      if (suggestionRow !== rowIndex) return;
                                      if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setActiveSuggestionIndex(i => Math.min(i + 1, productSuggestions.length - 1));
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setActiveSuggestionIndex(i => Math.max(i - 1, 0));
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const sel = productSuggestions[activeSuggestionIndex];
                                        if (sel) handleSelectProduct(sel, rowIndex);
                                      } else if (e.key === 'Escape') {
                                        setProductSuggestions([]);
                                        setSuggestionRow(null);
                                      }
                                    }}
                                    onBlur={() => setTimeout(() => { if (suggestionRow === rowIndex) { setProductSuggestions([]); setSuggestionRow(null); setActiveSuggestionIndex(0); setSuggestionCoords(null); } }, 150)}
                                    className="item-input"
                                    placeholder="nhập tên hàng hoặc mã"
                                  />
                                  { /* suggestions rendered in fixed-position container at end of component */ }
                                </div>
                              );
                            case 'productType':
                              // Loại hàng tự động theo sản phẩm - chỉ hiển thị, không cho chọn
                              return (
                                <input
                                  type="text"
                                  value={item.productType || ''}
                                  className="item-input"
                                  disabled
                                  readOnly
                                  title="Loại hàng tự động theo sản phẩm đã chọn"
                                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                              );
                            case 'warehouse':
                              return (
                                <select value={item.warehouse} onChange={(e) => handleOrderItemChange(rowIndex, 'warehouse', e.target.value)} className="item-select">
                                  <option value="">Chọn kho</option>
                                  {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{`${w.name}${(item.stock !== undefined && item.stock !== null) ? ' (' + Number(item.stock).toLocaleString() + ')' : ''}`}</option>
                                  ))}
                                </select>
                              );
                            case 'unit':
                              // Render unit options limited to the product's own units if provided
                              const opts = item.unitOptions && Array.isArray(item.unitOptions) && item.unitOptions.length > 0
                                ? item.unitOptions
                                : units.map(u => ({ value: u.code || u.name, label: u.name || u.code }));
                              return (
                                <select
                                  value={item.unit}
                                  onChange={(e) => {
                                      const v = e.target.value;
                                      handleOrderItemChange(rowIndex, 'unit', v);
                                      const opt = opts.find(o => String(o.value) === String(v));
                                      if (opt) {
                                        const conv = opt.conversion || 1;
                                        handleOrderItemChange(rowIndex, 'conversion', conv);
                                        // recalc displayed unit price from stored base price
                                        const base = (orderItems[rowIndex] && orderItems[rowIndex].unitPriceBase) ? orderItems[rowIndex].unitPriceBase : (parseFloat(orderItems[rowIndex].unitPrice) || 0);
                                        handleOrderItemChange(rowIndex, 'unitPrice', Number((base * conv).toFixed(2)));
                                        // recalc weight and volume with new conversion
                                        const qty = parseFloat(orderItems[rowIndex].quantity) || 0;
                                        if (orderItems[rowIndex].baseWeight !== undefined) {
                                          handleOrderItemChange(rowIndex, 'weight', Number((orderItems[rowIndex].baseWeight * conv * qty).toFixed(2)));
                                        }
                                        if (orderItems[rowIndex].baseVolume !== undefined) {
                                          handleOrderItemChange(rowIndex, 'volume', Number((orderItems[rowIndex].baseVolume * conv * qty).toFixed(2)));
                                        }
                                      }
                                    }}
                                  className="item-select small"
                                >
                                  <option value="" disabled hidden></option>
                                  {opts.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              );
                            case 'quantity':
                              return <input type="number" value={item.quantity} onChange={(e) => handleOrderItemChange(rowIndex, 'quantity', parseFloat(e.target.value) || 0)} className="item-input number" />;
                            case 'unitPrice':
                              return (
                                <input
                                  type="text"
                                  value={item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== '' ? Number(item.unitPrice).toLocaleString() : ''}
                                  onChange={(e) => {
                                    // allow user to type formatted numbers with commas
                                    const raw = e.target.value;
                                    const parsed = parseFloat(String(raw).replace(/[^0-9.-]+/g, ''));
                                    handleOrderItemChange(rowIndex, 'unitPrice', isNaN(parsed) ? 0 : parsed);
                                  }}
                                  className="item-input number"
                                />
                              );
                            case 'discountPercent':
                              {
                                const dp = item.discountPercent;
                                const displayDp = (typeof dp === 'string')
                                  ? dp
                                  : (dp !== undefined && dp !== null && dp !== '')
                                    ? (Number(dp) % 1 !== 0 ? Number(dp).toFixed(2) : String(Number(dp)))
                                    : '';
                                return (
                                  <input
                                    type="text"
                                    value={displayDp}
                                    onChange={(e) => {
                                      const raw = String(e.target.value).replace(',', '.');
                                      // allow empty, digits, optional leading dot, optional decimal up to 2 places
                                      if (raw === '' || /^(\d+(?:\.\d{0,2})?|\.\d{0,2})$/.test(raw)) {
                                        handleOrderItemChange(rowIndex, 'discountPercent', raw);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const v = String(e.target.value).replace(',', '.').trim();
                                      const num = parseFloat(v);
                                      handleOrderItemChange(rowIndex, 'discountPercent', isNaN(num) ? 0 : num);
                                    }}
                                    className="item-input number"
                                  />
                                );
                              }
                            case 'priceAfterCK':
                              return (item.priceAfterCK || 0).toLocaleString();
                            case 'totalAfterCK':
                              return (item.totalAfterCK || 0).toLocaleString();
                            case 'discountPercentGlobal':
                              return (
                                <div className="global-discount-display">
                                  {orderForm.discountPercent || 0}%
                                </div>
                              );
                            case 'totalAfterDiscount':
                              return (item.totalAfterDiscount || 0).toLocaleString();
                            case 'nvSales':
                              if (canChooseSales) {
                                return (
                                  <select value={item.nvSales || ''} onChange={(e) => handleOrderItemChange(rowIndex, 'nvSales', e.target.value)} className="item-select">
                                    <option value="">Chọn NV Sales</option>
                                    {salesUsers.map(u => (
                                      <option key={u.id || u.username || u.name} value={u.name || u.tenNhanVien || u.username || u.displayName}>
                                        {u.name || u.tenNhanVien || u.username || u.displayName}
                                      </option>
                                    ))}
                                  </select>
                                );
                              }
                              // not allowed to choose: show current user as static text (disabled input for visual consistency)
                              return (
                                <input 
                                  type="text" 
                                  value={item.nvSales || (currentUser?.name || currentUser?.tenNhanVien || currentUser?.username || currentUser?.displayName || '')} 
                                  className="item-input" 
                                  disabled 
                                  title="Bạn không có quyền chọn NV Sales"
                                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                              );
                            case 'description':
                              return <input type="text" value={item.description} onChange={(e) => handleOrderItemChange(rowIndex, 'description', e.target.value)} className="item-input" />;
                            case 'conversion':
                              return <input type="text" value={item.conversion} onChange={(e) => handleOrderItemChange(rowIndex, 'conversion', e.target.value)} className="item-input" />;
                            case 'amount':
                              return (item.amount || 0).toLocaleString();
                            // 'total' column removed from defaults; keep logic elsewhere if needed
                            case 'weight':
                              return (
                                <input
                                  type="text"
                                  value={item.weight !== undefined && item.weight !== null && item.weight !== '' ? Number(item.weight).toFixed(2) : ''}
                                  className="item-input number"
                                  readOnly
                                  title="Tự động tính: (Kg cơ bản × Quy đổi × Số lượng)"
                                />
                              );
                            case 'volume':
                              return (
                                <input
                                  type="text"
                                  value={item.volume !== undefined && item.volume !== null && item.volume !== '' ? Number(item.volume).toFixed(2) : ''}
                                  className="item-input number"
                                  readOnly
                                  title="Tự động tính: (M3 cơ bản × Quy đổi × Số lượng)"
                                />
                              );
                            case 'exportType':
                              return (
                                <select 
                                  value={item.exportType || 'xuất bán'} 
                                  onChange={(e) => handleOrderItemChange(rowIndex, 'exportType', e.target.value)} 
                                  className="item-select"
                                >
                                  <option value="xuất bán">xuất bán</option>
                                  {exportTypes
                                    .filter(et => {
                                      const text = (et.name || et.content || '').toLowerCase();
                                      return text.includes('xuất');
                                    })
                                    .map(et => (
                                      <option key={et.id} value={et.name || et.content}>
                                        {et.name || et.content}
                                      </option>
                                    ))}
                                </select>
                              );
                            case 'stock':
                              return (item.stock || 0).toLocaleString();
                            case 'tax':
                              return (
                                <span className="tax-display">
                                  {item.tax === 'KCT' ? 'KCT' : `${item.tax || '0'} %`}
                                </span>
                              );
                            case 'priceExcludeVAT':
                              const basePrice = (parseFloat(item.quantity) || 0) > 0 
                                ? ((parseFloat(item.totalAfterDiscount) || 0) / (parseFloat(item.quantity) || 1))
                                : 0;
                              const taxRate = item.tax === 'KCT' || !item.tax ? 0 : (parseFloat(item.tax) || 0);
                              const calculatedPriceExVAT = taxRate > 0 
                                ? basePrice / (1 + (taxRate / 100))
                                : basePrice;
                              return (
                                <span className="price-exclude-vat-display">
                                  {calculatedPriceExVAT.toLocaleString('vi-VN', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                              );
                            case 'totalExcludeVAT':
                              const basePriceForTotal = (parseFloat(item.quantity) || 0) > 0 
                                ? ((parseFloat(item.totalAfterDiscount) || 0) / (parseFloat(item.quantity) || 1))
                                : 0;
                              const taxRateForTotal = item.tax === 'KCT' || !item.tax ? 0 : (parseFloat(item.tax) || 0);
                              const priceExVATForTotal = taxRateForTotal > 0 
                                ? basePriceForTotal / (1 + (taxRateForTotal / 100))
                                : basePriceForTotal;
                              const calculatedTotalExVAT = priceExVATForTotal * (parseFloat(item.quantity) || 0);
                              return (
                                <span className="total-exclude-vat-display">
                                  {calculatedTotalExVAT.toLocaleString('vi-VN', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                              );
                            case 'actions':
                              return (
                                <div className="item-actions" style={{ display: 'flex', gap: '4px' }}>
                                  <button 
                                    className="item-btn delete" 
                                    onClick={() => removeOrderItem(rowIndex)}
                                    title="Xóa dòng"
                                  >
                                    🗑️
                                  </button>
                                  <button 
                                    className="item-btn add" 
                                    onClick={() => addOrderItemAfter(rowIndex)}
                                    title="Thêm dòng mới"
                                    style={{
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      fontSize: '14px'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}
                      </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            );
          })()}

          <div className="items-pagination">
            <span>Dòng 1-{nonEmptyCount} trên tổng {nonEmptyCount} dòng</span>
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
              <label>Tổng tiền (Hàng bán): <strong>{calculateTotals().toLocaleString()}</strong></label>
              <span className="summary-note">{totalInWords(calculateTotals())}</span>
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
                type="text"
                value={(orderForm.discountAmount || 0).toLocaleString()}
                readOnly
                className="summary-input"
              />
            </div>
            <div className="summary-field wide">
              <label>Ghi chú giảm</label>
              <input
                type="text"
                value={orderForm.discountNote}
                onChange={(e) => { setDiscountNoteEdited(true); handleOrderFormChange('discountNote', e.target.value); }}
                className="summary-input"
              />
            </div>
            <div className="summary-field">
              <label>Tổng số kg</label>
              <input
                type="number"
                value={Number((parseFloat(orderForm.totalKg) || 0) + (parseFloat(orderForm.promoTotalKg) || 0)).toFixed(2)}
                readOnly
                className="summary-input highlight-red"
              />
            </div>
            <div className="summary-field">
              <label>Tổng số khối</label>
              <input
                type="number"
                value={Number((parseFloat(orderForm.totalM3) || 0) + (parseFloat(orderForm.promoTotalM3) || 0)).toFixed(3)}
                readOnly
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
        <button className="modal-btn excel" onClick={handleExportExcel}>
          🧾 Xuất phiếu BH
        </button>
        <button className="modal-btn copy" onClick={handleCopyOrder}>
          📋 Copy
        </button>
        <button className="modal-btn cancel" onClick={handleCancelOrder}>
          🚫 Hủy
        </button>
        <button className="modal-btn approve" onClick={handleApproveOrder}>
          ✓ Duyệt
        </button>
        <button className="modal-btn export-data" onClick={handleExportOrderData} style={{
          backgroundColor: '#17a2b8',
          color: 'white'
        }}>
          📊 Xuất DL Excel
        </button>
        {/* Order status indicator */}
        {editingOrderId && (
          <div className="order-status-indicator" style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            backgroundColor: orderForm.status === 'đã duyệt' ? '#28a745' : 
                           orderForm.status === 'đã hủy' ? '#dc3545' : '#ffc107',
            color: orderForm.status === 'chưa duyệt' ? '#000' : '#fff'
          }}>
            Trạng thái: {orderForm.status || 'chưa duyệt'}
          </div>
        )}
      </div>
      
      {/* Search Modal */}
      {showSearchModal && (
        <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3 className="search-modal-title">🔍 Tìm kiếm sản phẩm trong đơn hàng</h3>
              <button className="search-modal-close" onClick={() => setShowSearchModal(false)}>×</button>
            </div>
            
            <div className="search-modal-search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder="Tìm sản phẩm (có thể gõ không dấu): tên, mã, đơn vị..."
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  autoFocus
                />
                <span className="search-input-icon">🔍</span>
              </div>
            </div>
            
            <div className="search-modal-body">
              <div className="search-results-container">
                {searchResults.length === 0 ? (
                  <div className="search-results-empty">
                    {orderItems.filter(item => 
                      (item.productCode && String(item.productCode).trim()) || 
                      (item.barcode && String(item.barcode).trim()) || 
                      (item.productName && String(item.productName).trim())
                    ).length === 0 ? 'Chưa có sản phẩm nào trong đơn hàng' : 
                     searchQuery ? 'Không tìm thấy sản phẩm nào' : 'Nhập từ khóa để tìm kiếm'}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                      Tìm thấy {searchResults.length} sản phẩm{searchQuery && ` cho "${searchQuery}"`}
                    </div>
                    {searchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="search-results-item"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <div className="search-results-item-name">{result.productName || result.productCode || result.barcode || 'Không có tên'}</div>
                        <div className="search-results-item-details">
                          {result.productCode && (
                            <div className="search-results-item-detail">
                              <span>Mã:</span> <span>{result.productCode}</span>
                            </div>
                          )}
                          {result.barcode && (
                            <div className="search-results-item-detail">
                              <span>Mã vạch:</span> <span>{result.barcode}</span>
                            </div>
                          )}
                          {result.unit && (
                            <div className="search-results-item-detail">
                              <span>ĐVT:</span> <span>{result.unit}</span>
                            </div>
                          )}
                          <div className="search-results-item-detail">
                            <span>SL:</span> <span>{result.quantity || 0}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Đơn giá:</span> <span>{(result.unitPrice || 0).toLocaleString()} ₫</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Thành tiền:</span> <span>{(result.amount || ((result.quantity || 0) * (result.unitPrice || 0))).toLocaleString()} ₫</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Vị trí:</span> <span>Dòng {result.rowIndex + 1}</span>
                          </div>
                        </div>
                        {result.description && (
                          <div className="search-results-item-description" style={{marginTop: '5px', fontSize: '11px', color: '#888'}}>
                            {result.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Search Modal - copy from sales modal with hidden price fields */}
      {showPromoSearchModal && (
        <div className="search-modal-overlay" onClick={() => setShowPromoSearchModal(false)}>
          <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3 className="search-modal-title">🔍 Tìm kiếm hàng khuyến mãi trong đơn hàng</h3>
              <button className="search-modal-close" onClick={() => setShowPromoSearchModal(false)}>×</button>
            </div>
            
            <div className="search-modal-search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder="Tìm hàng khuyến mãi (có thể gõ không dấu): tên, mã, đơn vị..."
                  value={promoSearchQuery}
                  onChange={handlePromoSearchQueryChange}
                  autoFocus
                />
                <span className="search-input-icon">🔍</span>
              </div>
            </div>
            
            <div className="search-modal-body">
              <div className="search-results-container">
                {promoSearchResults.length === 0 ? (
                  <div className="search-results-empty">
                    {promotionItems.filter(item => 
                      (item.productCode && String(item.productCode).trim()) || 
                      (item.barcode && String(item.barcode).trim()) || 
                      (item.productName && String(item.productName).trim())
                    ).length === 0 ? 'Chưa có hàng khuyến mãi nào trong đơn hàng' : 
                     promoSearchQuery ? 'Không tìm thấy hàng khuyến mãi nào' : 'Nhập từ khóa để tìm kiếm'}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                      Tìm thấy {promoSearchResults.length} hàng khuyến mãi{promoSearchQuery && ` cho "${promoSearchQuery}"`}
                    </div>
                    {promoSearchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="search-results-item"
                        onClick={() => handleSelectPromoSearchResult(result)}
                      >
                        <div className="search-results-item-name">{result.productName || result.productCode || result.barcode || 'Không có tên'}</div>
                        <div className="search-results-item-details">
                          {result.productCode && (
                            <div className="search-results-item-detail">
                              <span>Mã:</span> <span>{result.productCode}</span>
                            </div>
                          )}
                          {result.barcode && (
                            <div className="search-results-item-detail">
                              <span>Mã vạch:</span> <span>{result.barcode}</span>
                            </div>
                          )}
                          {result.unit && (
                            <div className="search-results-item-detail">
                              <span>ĐVT:</span> <span>{result.unit}</span>
                            </div>
                          )}
                          <div className="search-results-item-detail">
                            <span>SL:</span> <span>{result.quantity || 0}</span>
                          </div>
                          {/* Hidden fields for promotion modal: Đơn giá, thành tiền, % CK, Giá sau ck, Ttien sau ck, giảm %, ttien sau giảm, giá bán (-vat), TT(-vat) */}
                          <div className="search-results-item-detail">
                            <span>Vị trí:</span> <span>Dòng {result.rowIndex + 1}</span>
                          </div>
                        </div>
                        {result.description && (
                          <div className="search-results-item-description" style={{marginTop: '5px', fontSize: '11px', color: '#888'}}>
                            {result.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <OpenStreetMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        customer={selectedCustomerForMap}
      />
      {suggestionRow !== null && productSuggestions && productSuggestions.length > 0 && suggestionCoords && (
        <ul
          className="product-suggestions-fixed"
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: suggestionCoords.left,
            width: suggestionCoords.width,
            bottom: suggestionCoords.bottom,
            maxHeight: 300,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ddd',
            padding: 0,
            margin: 0,
            listStyle: 'none'
          }}
        >
          {productSuggestions.map((p, i) => (
            <li
              key={p.id || p.code || p.barcode || i}
              onMouseDown={() => handleSelectProduct(p, suggestionRow)}
              style={{ padding: '6px 8px', cursor: 'pointer', background: i === activeSuggestionIndex ? '#eef' : undefined }}
            >
              <strong>{p.code || ''}</strong>&nbsp;{p.barcode ? `(${p.barcode})` : ''} - {p.name} - {(p.retailPrice||p.price||0).toLocaleString()} - {(p.stock||p.quantity||0)}
            </li>
          ))}
        </ul>
      )}

      {/* Orders List Modal */}
      {showOrdersList && (
        <div className="search-modal-overlay" onClick={() => setShowOrdersList(false)}>
          <div className="search-modal-content orders-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3 className="search-modal-title">📋 Danh sách đơn hàng đã lưu</h3>
              <button className="search-modal-close" onClick={() => setShowOrdersList(false)}>×</button>
            </div>
            
            <div className="search-modal-body">
              <div className="orders-list-container">
                {savedOrders.length === 0 ? (
                  <div className="search-results-empty">
                    Chưa có đơn hàng nào được lưu
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                      Tổng cộng {savedOrders.length} đơn hàng
                    </div>
                    {savedOrders.map((order, index) => (
                      <div 
                        key={order.id}
                        className="search-results-item"
                        onClick={() => loadOrderDetail(order.id)}
                      >
                        <div className="search-results-item-name">
                          {order.orderNumber} - {order.customerName || 'Khách hàng không xác định'}
                        </div>
                        <div className="search-results-item-details">
                          <div className="search-results-item-detail">
                            <span>Ngày:</span> <span>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>SĐT:</span> <span>{order.phone || 'N/A'}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Nhóm KH:</span> <span>{order.customerGroup || 'N/A'}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Tổng KG:</span> <span>{(order.totalKg || 0).toLocaleString()}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Tổng M3:</span> <span>{(order.totalM3 || 0).toLocaleString()}</span>
                          </div>
                          <div className="search-results-item-detail">
                            <span>Thanh toán:</span> <span>{(order.payment || 0).toLocaleString()} ₫</span>
                          </div>
                        </div>
                        {order.address && (
                          <div className="search-results-item-description" style={{marginTop: '5px', fontSize: '11px', color: '#888'}}>
                            📍 {order.address}
                          </div>
                        )}
                        {order.notes && (
                          <div className="search-results-item-description" style={{marginTop: '5px', fontSize: '11px', color: '#888'}}>
                            📝 {order.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrderForm;
