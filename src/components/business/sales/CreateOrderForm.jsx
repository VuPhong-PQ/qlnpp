import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../BusinessPage.css';
import { API_ENDPOINTS, API_BASE_URL, api } from '../../../config/api';
import OpenStreetMapModal from '../../OpenStreetMapModal';

const CreateOrderForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);

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
    discountPercent: 0,
    discountAmount: 0,
    discountNote: '',
    totalKg: 0,
    totalM3: 0,
    payment: 0,
    accountFund: '',
    notes: '',
    productType: ''
  });

  const [orderItems, setOrderItems] = useState([
    { id: 1, productCode: '', barcode: '', productName: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'xuất bán', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }
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
  const nonEmptyCount = orderItems.filter(item => {
    const hasText = (item.productCode && String(item.productCode).trim()) || (item.barcode && String(item.barcode).trim()) || (item.productName && String(item.productName).trim());
    const hasNumbers = (item.quantity && Number(item.quantity) > 0) || (item.unitPrice && Number(item.unitPrice) > 0);
    return Boolean(hasText) || Boolean(hasNumbers);
  }).length;

  
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCustomerForMap, setSelectedCustomerForMap] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedOrders, setSavedOrders] = useState([]); // Danh sách orders từ DB
  const [showOrdersList, setShowOrdersList] = useState(false); // Hiển thị danh sách orders
  const [editingOrderId, setEditingOrderId] = useState(null); // ID của order đang sửa
  const isCustomerSelected = Boolean(orderForm.customer);
  const initialColWidths = [120, 120, 220, 120, 80, 90, 110, 100, 80, 120, 120, 90, 120, 100, 180, 140, 90, 90, 100, 100, 120, 100, 130, 120];
  const [colWidths, setColWidths] = useState(initialColWidths);
  const resizerState = useRef({ isResizing: false, startX: 0, colIndex: null, startWidth: 0 });
  
  // Column configuration (key must match renderCell switch cases)
  const defaultColumns = [
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
    const getCurrentUser = () => {
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
    const cu = getCurrentUser();
    setCurrentUser(cu);
    // heuristic: allow choosing sales if user has explicit flag or roles/permissions that imply admin-like access
    const allowed = Boolean(cu && (cu.canSelectSales || (cu.roles && (cu.roles.includes('admin') || cu.roles.includes('sales_manager'))) || (cu.permissions && cu.permissions.includes('choose_sales'))));
    setCanChooseSales(allowed);
    // ensure default nvSales for existing rows when not allowed to choose
    if (!allowed && cu) {
      setOrderItems(prev => prev.map(it => ({ ...it, nvSales: it.nvSales || (cu.name || cu.username || cu.displayName || '') })));
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
          // include any default columns that were not in saved order (append them)
          defaultColumns.forEach(dc => { if (!rebuilt.find(r => r.key === dc.key)) rebuilt.push(dc); });
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
  }, []);

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
          notes: data.order.notes || ''
        });
        
        // Map order items
        if (data.items && data.items.length > 0) {
          setOrderItems(data.items.map((item, index) => ({
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
          })));
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

  // Load initial data
  useEffect(() => {
    fetchProductCategories();
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
      // Thành tiền = số lượng * đơn giá
      item.amount = Number((qty * price).toFixed(2));
      const disc = parseFloat(item.discountPercent) || 0;
      const priceAfter = price * (1 - disc / 100);
      const totalAfter = qty * priceAfter;
      item.priceAfterCK = Number(priceAfter.toFixed(2));
      item.totalAfterCK = Number(totalAfter.toFixed(2));
      // apply order-level giảm % (orderForm.discountPercent) to compute final amount per row
      const orderDisc = parseFloat(orderForm.discountPercent) || 0;
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
    setOrderItems(prev => [...prev, {
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
      nvSales: canChooseSales ? '' : (currentUser ? (currentUser.name || currentUser.username || currentUser.displayName || '') : ''),
      description: '',
      conversion: '',
      amount: 0,
      total: 0,
      weight: 0,
      volume: 0,
      baseWeight: 0,
      baseVolume: 0,
      exportType: 'xuất bán',
      stock: 0,
      tax: 'KCT',
      priceExcludeVAT: 0,
      totalExcludeVAT: 0
    }]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Add a new order item after a specific index
  const addOrderItemAfter = (index) => {
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
      nvSales: '',
      description: '',
      conversion: 1,
      amount: 0,
      total: 0,
      weight: 0,
      volume: 0,
      baseWeight: 0,
      baseVolume: 0,
      exportType: 'xuất bán',
      stock: 0,
      tax: 'KCT',
      priceExcludeVAT: 0,
      totalExcludeVAT: 0
    };
    
    setOrderItems(prev => {
      const newItems = [...prev];
      newItems.splice(index + 1, 0, newItem);
      return newItems;
    });
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.totalAfterDiscount) || 0), 0);
    return subtotal;
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
      
// Filter out empty order items and map to backend format
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
      }));

      // Auto-set order ProductType based on items
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
        DiscountPercent: Number(orderForm.discountPercent || 0),
        DiscountAmount: Number(orderForm.discountAmount || 0),
        DiscountNote: String(orderForm.discountNote || ''),
        TotalKg: Number(orderForm.totalKg || 0),
        TotalM3: Number(orderForm.totalM3 || 0),
        Payment: Number(orderForm.payment || 0),
        AccountFund: String(orderForm.accountFund || ''),
        Notes: String(orderForm.notes || ''),
        ProductType: mostCommonProductType,
        TotalAmount: calculateTotals(),
        TotalAfterDiscount: calculateTotals()
      };
      
      let response;
      
      if (editingOrderId) {
        // Update existing order - include ID in orderData
        const updatePayload = {
          Order: { ...orderData, Id: editingOrderId },
          OrderItems: validOrderItems
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
          OrderItems: validOrderItems
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
    setOrderForm({
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
    setOrderItems([{ id: 1, productCode: '', barcode: '', productName: '', productType: '', warehouse: '', unit: '', quantity: 0, unitPrice: 0, discountPercent: 0, priceAfterCK: 0, totalAfterCK: 0, totalAfterDiscount: 0, nvSales: '', description: '', conversion: '', amount: 0, total: 0, weight: 0, volume: 0, baseWeight: 0, baseVolume: 0, exportType: 'xuất bán', stock: 0, tax: 'KCT', priceExcludeVAT: 0, totalExcludeVAT: 0 }]);
    setDiscountNoteEdited(false);
    setOrderNumberEdited(false);
    // Reset customer selection
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setSelectedCustomerForMap(null);
    
    // Refresh orders list
    fetchOrders();
  };

  const handleGoBack = () => {
    navigate('/business/sales/create-order');
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
          
          // Get current logged in user
          const loggedInUser = localStorage.getItem('currentUser') || localStorage.getItem('username') || '';
          // current logged in user (from localStorage)
          
          let defaultUser = '';
          
          if (loggedInUser) {
            // Find user by username/name
            const currentUserObj = udata.find(u => 
              u.username === loggedInUser || 
              u.name === loggedInUser ||
              u.displayName === loggedInUser ||
              u.tenNhanVien === loggedInUser
            );
            if (currentUserObj) {
              defaultUser = currentUserObj.tenNhanVien || currentUserObj.name || currentUserObj.username || '';
              setCurrentUser(defaultUser);
            }
          }
          
          // If no current user found, use default "tên nhân viên"
          if (!defaultUser) {
            const defaultUserObj = udata.find(u => 
              u.tenNhanVien === 'tên nhân viên' ||
              u.name === 'tên nhân viên' ||
              u.username === 'tên nhân viên'
            );
            if (defaultUserObj) {
              defaultUser = defaultUserObj.tenNhanVien || defaultUserObj.name || defaultUserObj.username || '';
            } else if (udata.length > 0) {
              // If no "tên nhân viên" found, use first user
              defaultUser = udata[0].tenNhanVien || udata[0].name || udata[0].username || '';
            }
            setCurrentUser(defaultUser);
          }
          
          // Set default createdBy
          if (defaultUser) {
            setOrderForm(prev => ({
              ...prev,
              createdBy: defaultUser
            }));
          }
          
          // default createdBy set
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
    handleOrderItemChange(rowIndex, 'nvSales', sel.nvSales || '');
    // Set VAT % from product, show "KCT" if null/empty
    const vatPercent = sel.vatPercent || sel.VAT_Percent || sel.vat || sel.taxRate || '';
    handleOrderItemChange(rowIndex, 'tax', vatPercent || 'KCT');
    const vol = sel.volume || sel.m3 || sel.cbm || sel.volume_m3 || 0;
    const wt = sel.weight || sel.kg || sel.weightKg || sel.weight_kg || 0;
    // Store base weight and volume for calculation
    handleOrderItemChange(rowIndex, 'baseVolume', parseFloat(vol) || 0);
    handleOrderItemChange(rowIndex, 'baseWeight', parseFloat(wt) || 0);
    // Calculate displayed weight and volume: base * conversion * quantity
    const qty = orderItems[rowIndex] ? (parseFloat(orderItems[rowIndex].quantity) || 0) : 0;
    handleOrderItemChange(rowIndex, 'volume', Number((parseFloat(vol) * (chosenConv || 1) * qty).toFixed(2)));
    handleOrderItemChange(rowIndex, 'weight', Number((parseFloat(wt) * (chosenConv || 1) * qty).toFixed(2)));
    handleOrderItemChange(rowIndex, 'productName', sel.name || sel.vatName || sel.displayName || sel.code || sel.id || '');
    setProductSuggestions([]);
    setSuggestionRow(null);
    setActiveSuggestionIndex(0);
    setTimeout(() => {
      setOrderItems(prev => {
        if (rowIndex === prev.length - 1) {
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
            nvSales: '',
            description: '',
            conversion: '',
            total: 0,
            weight: 0,
            volume: 0,
            baseWeight: 0,
            baseVolume: 0,
            exportType: 'xuất bán',
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
              <select
                value={orderForm.createdBy}
                onChange={(e) => handleOrderFormChange('createdBy', e.target.value)}
                className="order-form-select"
              >
                <option value="">Chọn nhân viên</option>
                {users.map(user => {
                  const displayName = user.tenNhanVien || user.name || user.username || '';
                  return (
                    <option key={user.id || user.username} value={displayName}>
                      {displayName}
                    </option>
                  );
                })}
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

          <div className="order-items-table-container">
            <table 
              className="order-items-table"
              style={{
                width: columns.reduce((sum, c, i) => 
                  sum + (c.visible ? (colWidths[i] || 120) : 0), 0) + 'px',
                minWidth: columns.reduce((sum, c, i) => 
                  sum + (c.visible ? (colWidths[i] || 120) : 0), 0) + 'px'
              }}
            >
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
                      {c.label} {c.key === 'barcode' || c.key === 'productCode' || c.key === 'productName' ? <i className="sort-icon" onClick={handleSearchInOrderItems} style={{cursor: 'pointer'}} title="Tìm kiếm trong đơn hàng">🔍</i> : null}
                      <div className="col-resizer" onMouseDown={startResize} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, rowIndex) => (
                  <tr key={item.id}>
                    {columns.map((c, colIndex) => c.visible && (
                      <td key={c.key} className={['priceAfterCK','totalAfterCK','discountPercentGlobal','totalAfterDiscount','stock'].includes(c.key) ? 'total-cell' : ''}>
                        {(() => {
                          switch (c.key) {
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
                              return (
                                <select
                                  value={item.productType || ''}
                                  onChange={(e) => handleOrderItemChange(rowIndex, 'productType', e.target.value)}
                                  className="item-select"
                                >
                                  <option value="">Chọn loại hàng</option>
                                  {productCategories.map(category => (
                                    <option key={category.id} value={category.name}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
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
                                      <option key={u.id} value={u.name || u.username || u.displayName}>
                                        {u.name || u.username || u.displayName}
                                      </option>
                                    ))}
                                  </select>
                                );
                              }
                              // not allowed to choose: show current user as static text
                              return <div className="item-text">{item.nvSales || (currentUser ? (currentUser.name || currentUser.username || currentUser.displayName) : '')}</div>;
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
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              <label>Tổng tiền: <strong>{calculateTotals().toLocaleString()}</strong></label>
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
        <button className="modal-btn copy" onClick={handleCopyOrder}>
          📋 Copy
        </button>
        <button className="modal-btn cancel">
          🚫 Hủy
        </button>
        <button className="modal-btn approve">
          ✓ Duyệt
        </button>
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
