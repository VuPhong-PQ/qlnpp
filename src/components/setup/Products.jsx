import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';
import { useColumnFilter } from '../../hooks/useColumnFilter.jsx';
import { useExcelImportExport } from '../../hooks/useExcelImportExport.jsx';
import { ExcelButtons } from '../common/ExcelButtons.jsx';

const Products = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const { applyFilters, renderFilterPopup, setShowFilterPopup, columnFilters, showFilterPopup } = useColumnFilter();
  
  // Modal thêm loại hàng
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ code: '', name: '', note: '', noGroupOrder: false });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  
  // Context menu (chuột phải)
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  
  // Checkbox chọn nhiều
  const [selectedRows, setSelectedRows] = useState([]);
  // Safer delete-all modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirmChecked, setDeleteAllConfirmChecked] = useState(false);

  // Load data from API
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
  }, []);

  // Check for selected products from search modal
  useEffect(() => {
    const selectedIds = localStorage.getItem('selectedProductIds');
    if (selectedIds) {
      try {
        const ids = JSON.parse(selectedIds);
        setSelectedRows(ids);
        // Clear localStorage after use
        localStorage.removeItem('selectedProductIds');
        // Scroll to first selected item
        if (ids.length > 0) {
          setTimeout(() => {
            const firstSelected = document.querySelector(`tr[data-product-id="${ids[0]}"]`);
            if (firstSelected) {
              firstSelected.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error parsing selected product IDs:', error);
      }
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get(API_ENDPOINTS.products);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.productCategories);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.units);
      console.log('Loaded units:', data);
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const [formData, setFormData] = useState({
    category: '',
    code: '',
    barcode: '',
    name: '',
    vatName: '',
    description: '',
    shelfLife: 0,
    baseUnit: '',
    unit1: '',
    unit2: '',
    unit3: '',
    unit4: '',
    defaultUnit: '',
    baseConversion: 1,
    conversion1: 0,
    conversion2: 0,
    conversion3: 0,
    conversion4: 0,
    importPrice: 0,
    importPrice1: 0,
    importPrice2: 0,
    importPrice3: 0,
    importPrice4: 0,
    retailPrice: 0,
    retailPrice1: 0,
    retailPrice2: 0,
    retailPrice3: 0,
    retailPrice4: 0,
    retailDiscount1: 0,
    retailDiscount2: 0,
    retailDiscount3: 0,
    retailDiscount4: 0,
    wholesalePrice: 0,
    wholesalePrice1: 0,
    wholesalePrice2: 0,
    wholesalePrice3: 0,
    wholesalePrice4: 0,
    wholesaleDiscount1: 0,
    wholesaleDiscount2: 0,
    wholesaleDiscount3: 0,
    wholesaleDiscount4: 0,
    weight: 0,
    weight1: 0,
    weight2: 0,
    weight3: 0,
    weight4: 0,
    volume: 0,
    volume1: 0,
    volume2: 0,
    volume3: 0,
    volume4: 0,
    shippingFee: 0,
    shippingFee1: 0,
    shippingFee2: 0,
    shippingFee3: 0,
    shippingFee4: 0,
    minStock: 0,
    discount: 0,
    note: '',
    promotion: '',
    status: 'active'
  });

  // Validation: map required fields to user-facing labels
  const requiredFieldMap = {
    category: 'Loại hàng',
    code: 'Mã hàng',
    name: 'Tên hàng',
    baseUnit: 'ĐVT Gốc',
    defaultUnit: 'ĐVT mặc định'
  };

  const validateRequiredForm = () => {
    const missing = [];
    Object.keys(requiredFieldMap).forEach(key => {
      const val = formData[key];
      if (val === undefined || val === null || String(val).toString().trim() === '') missing.push(requiredFieldMap[key]);
    });
    if (missing.length > 0) {
      alert('Vui lòng nhập/chọn các trường bắt buộc: ' + missing.join(', '));
      return false;
    }
    return true;
  };

  // Refs and state to match defaultUnit width to unit2 select
  const unit2Ref = useRef(null);
  const defaultUnitContainerRef = useRef(null);
  const [defaultUnitWidth, setDefaultUnitWidth] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      try {
        if (unit2Ref.current) {
          const w = Math.round(unit2Ref.current.getBoundingClientRect().width);
          setDefaultUnitWidth(w);
        }
      } catch (e) {
        // ignore
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [formData.unit2, formData.unit1, formData.baseUnit, products]);

  // Xử lý thêm loại hàng
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({ ...categoryForm, [name]: value });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.code || !categoryForm.name) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    // Kiểm tra trùng mã
    if (categories.some(cat => cat.code === categoryForm.code)) {
      alert('Mã loại hàng đã tồn tại!');
      return;
    }
    try {
      setLoading(true);
      // Gọi API để lưu loại hàng mới
      const newCategory = {
        code: categoryForm.code,
        name: categoryForm.name,
        noGroupOrder: categoryForm.noGroupOrder,
        note: categoryForm.note,
        status: 'active'
      };
      
      const savedCategory = await api.post(API_ENDPOINTS.productCategories, newCategory);
      
      // Cập nhật danh sách categories
      await fetchCategories();
      
      // Tự động chọn loại hàng vừa tạo
      setFormData({ ...formData, category: savedCategory.code });
      
      alert('Thêm loại hàng thành công!');
      setShowCategoryModal(false);
      setCategoryForm({ code: '', name: '', note: '', noGroupOrder: false });
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Có lỗi xảy ra khi thêm loại hàng!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // update value and recalc any dependent fields (conversion -> retailPriceN)
    const parsed = type === 'number' ? parseFloat(value) || 0 : value;
    const newForm = { ...formData, [name]: parsed };

    // If a conversion field changed, recalc corresponding retailPrice and weights
    if (name === 'conversion1') {
      // conversion1 affects retailPrice1 and weight1
      newForm.retailPrice1 = (newForm.retailPrice || 0) * (parsed || 0);
      newForm.weight1 = (newForm.weight || 0) * (parsed || 0);
      newForm.volume1 = (newForm.volume || 0) * (parsed || 0);
    } else if (name === 'conversion2') {
      // conversion2 affects retailPrice2 and weight2
      newForm.retailPrice2 = (newForm.retailPrice || 0) * (parsed || 0);
      newForm.weight2 = (newForm.weight || 0) * (parsed || 0);
      newForm.volume2 = (newForm.volume || 0) * (parsed || 0);
    }

    // Weight fields reverse/forward calculation
    if (name === 'weight') {
      // forward: base weight -> derived weights
      newForm.weight1 = (newForm.weight || 0) * (newForm.conversion1 || 0);
      newForm.weight2 = (newForm.weight || 0) * (newForm.conversion2 || 0);
      // forward: base volume -> derived volumes
      newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
    } else if (name === 'weight1') {
      // reverse: weight1 -> base weight using conversion1
      const c1 = newForm.conversion1 || 0;
      if (c1 !== 0) {
        newForm.weight = (newForm.weight1 || 0) / c1;
        // update other derived weight based on new base weight
        newForm.weight2 = (newForm.weight || 0) * (newForm.conversion2 || 0);
        // update derived volumes based on new base weight (keep volumes consistent)
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    } else if (name === 'weight2') {
      // reverse: weight2 -> base weight using conversion2
      const c2 = newForm.conversion2 || 0;
      if (c2 !== 0) {
        newForm.weight = (newForm.weight2 || 0) / c2;
        newForm.weight1 = (newForm.weight || 0) * (newForm.conversion1 || 0);
        // update derived volumes based on new base weight
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    }

    // Volume fields reverse/forward calculation
    if (name === 'volume') {
      // forward: base volume -> derived volumes
      newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
    } else if (name === 'volume1') {
      // reverse: volume1 -> base volume using conversion1
      const cv1 = newForm.conversion1 || 0;
      if (cv1 !== 0) {
        newForm.volume = (newForm.volume1 || 0) / cv1;
        // update other derived volumes based on new base volume
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    } else if (name === 'volume2') {
      const cv2 = newForm.conversion2 || 0;
      if (cv2 !== 0) {
        newForm.volume = (newForm.volume2 || 0) / cv2;
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      }
    }

    setFormData(newForm);
  };

  // Helpers to format price inputs with comma separators (display only)
  const formatNumberWithCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const n = Number(num) || 0;
    return n.toLocaleString('en-US');
  };

  const parseNumberFromString = (str) => {
    if (str === null || str === undefined || str === '') return 0;
    const cleaned = String(str).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatFixed4 = (num) => {
    if (num === null || num === undefined || num === '') return '0.0000';
    const n = Number(num) || 0;
    return n.toFixed(4);
  };

  // Generic formatter for fixed decimals
  const formatNumberPrecision = (num, decimals = 2) => {
    if (num === null || num === undefined || num === '') return (0).toFixed(decimals);
    const n = Number(num) || 0;
    return n.toFixed(decimals);
  };

  // Allow free typing for weight inputs; format to 2 decimals on blur
  const handleWeightInputChange = (e) => {
    const { name, value } = e.target;
    // store raw input to avoid formatting while typing
    setFormData(prev => ({ ...prev, [name + 'Input']: value }));
  };

  const handleWeightInputBlur = (e) => {
    const { name, value } = e.target;
    const numeric = parseNumberFromString(value);

    const newForm = { ...formData, [name]: numeric };

    // Mirror weight forward/reverse logic from handleInputChange
    if (name === 'weight') {
      newForm.weight1 = (newForm.weight || 0) * (newForm.conversion1 || 0);
      newForm.weight2 = (newForm.weight || 0) * (newForm.conversion2 || 0);
      // keep volumes consistent
      newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
    } else if (name === 'weight1') {
      const c1 = newForm.conversion1 || 0;
      if (c1 !== 0) {
        newForm.weight = (newForm.weight1 || 0) / c1;
        newForm.weight2 = (newForm.weight || 0) * (newForm.conversion2 || 0);
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    } else if (name === 'weight2') {
      const c2 = newForm.conversion2 || 0;
      if (c2 !== 0) {
        newForm.weight = (newForm.weight2 || 0) / c2;
        newForm.weight1 = (newForm.weight || 0) * (newForm.conversion1 || 0);
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    }

    // remove temp input fields
    delete newForm.weightInput;
    delete newForm.weight1Input;
    delete newForm.weight2Input;

    setFormData(newForm);
  };

  // Allow free typing for volume inputs; format to 4 decimals on blur
  const handleVolumeInputChange = (e) => {
    const { name, value } = e.target;
    // store raw input in temporary field to avoid formatting while typing
    setFormData(prev => ({ ...prev, [name + 'Input']: value }));
  };

  const handleVolumeInputBlur = (e) => {
    const { name, value } = e.target;
    const numeric = parseNumberFromString(value);

    const newForm = { ...formData, [name]: numeric };

    // Mirror volume forward/reverse logic from handleInputChange
    if (name === 'volume') {
      newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
    } else if (name === 'volume1') {
      const cv1 = newForm.conversion1 || 0;
      if (cv1 !== 0) {
        newForm.volume = (newForm.volume1 || 0) / cv1;
        newForm.volume2 = (newForm.volume || 0) * (newForm.conversion2 || 0);
      }
    } else if (name === 'volume2') {
      const cv2 = newForm.conversion2 || 0;
      if (cv2 !== 0) {
        newForm.volume = (newForm.volume2 || 0) / cv2;
        newForm.volume1 = (newForm.volume || 0) * (newForm.conversion1 || 0);
      }
    }

    // remove temp input fields
    delete newForm.volumeInput;
    delete newForm.volume1Input;
    delete newForm.volume2Input;

    setFormData(newForm);
  };

  const handlePriceInputChange = (e) => {
    const { name, value } = e.target;
    const numeric = parseNumberFromString(value);
    
    // Always update the specific field first
    const newForm = { ...formData, [name]: numeric };
    
    // If the main retailPrice changes, recalc dependent retailPrice1..4
    if (name === 'retailPrice') {
      newForm.retailPrice1 = (numeric || 0) * (newForm.conversion1 || 0);
      newForm.retailPrice2 = (numeric || 0) * (newForm.conversion2 || 0);
    }
    // Reverse calculation: if retailPrice1 changes, calculate retailPrice
    else if (name === 'retailPrice1') {
      const conv1 = newForm.conversion1 || 0;
      if (conv1 !== 0) {
        newForm.retailPrice = numeric / conv1;
        // Also update other derived price based on new retailPrice
        newForm.retailPrice2 = newForm.retailPrice * (newForm.conversion2 || 0);
      }
    }
    // Reverse calculation: if retailPrice2 changes, calculate retailPrice
    else if (name === 'retailPrice2') {
      const conv2 = newForm.conversion2 || 0;
      if (conv2 !== 0) {
        newForm.retailPrice = numeric / conv2;
        // Update other derived price
        newForm.retailPrice1 = newForm.retailPrice * (newForm.conversion1 || 0);
      }
    }
    
    setFormData(newForm);
  };

  // Ensure derived retailPriceN are always in sync when retailPrice or conversions change
  useEffect(() => {
    const rp = Number(formData.retailPrice) || 0;
    const c1 = Number(formData.conversion1) || 0;
    const c2 = Number(formData.conversion2) || 0;

    const expected1 = rp * c1; // conversion1 affects retailPrice1
    const expected2 = rp * c2; // conversion2 affects retailPrice2

    const cur1 = Number(formData.retailPrice1) || 0;
    const cur2 = Number(formData.retailPrice2) || 0;

    if (cur1 !== expected1 || cur2 !== expected2) {
      setFormData(prev => ({
        ...prev,
        retailPrice1: expected1,
        retailPrice2: expected2
      }));
    }
  }, [formData.retailPrice, formData.conversion1, formData.conversion2]);

  // Ensure derived weightN are always in sync when weight or conversions change
  useEffect(() => {
    const w = Number(formData.weight) || 0;
    const c1 = Number(formData.conversion1) || 0;
    const c2 = Number(formData.conversion2) || 0;

    const expectedW1 = w * c1;
    const expectedW2 = w * c2;

    const curW1 = Number(formData.weight1) || 0;
    const curW2 = Number(formData.weight2) || 0;

    if (curW1 !== expectedW1 || curW2 !== expectedW2) {
      setFormData(prev => ({
        ...prev,
        weight1: expectedW1,
        weight2: expectedW2
      }));
    }
  }, [formData.weight, formData.conversion1, formData.conversion2]);

  // Ensure derived volumeN are always in sync when volume or conversions change
  useEffect(() => {
    const v = Number(formData.volume) || 0;
    const c1 = Number(formData.conversion1) || 0;
    const c2 = Number(formData.conversion2) || 0;

    const expectedV1 = v * c1;
    const expectedV2 = v * c2;

    const curV1 = Number(formData.volume1) || 0;
    const curV2 = Number(formData.volume2) || 0;

    if (curV1 !== expectedV1 || curV2 !== expectedV2) {
      setFormData(prev => ({
        ...prev,
        volume1: expectedV1,
        volume2: expectedV2
      }));
    }
  }, [formData.volume, formData.conversion1, formData.conversion2]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!validateRequiredForm()) return;
    try {
      setLoading(true);
      // Check duplicates for code and barcode
      try {
        const existing = await api.get(API_ENDPOINTS.products);
        const code = (formData.code || '').toString().toLowerCase().trim();
        const barcode = (formData.barcode || '').toString().toLowerCase().trim();

        if (editingItem) {
          // When editing, ensure no other product (different id) has the same code/barcode
          const dupCode = existing.some(p => p.id !== editingItem.id && (p.code || '').toString().toLowerCase().trim() === code && code !== '');
          const dupBarcode = existing.some(p => p.id !== editingItem.id && (p.barcode || '').toString().toLowerCase().trim() === barcode && barcode !== '');
          if (dupCode || dupBarcode) {
            const parts = [];
            if (dupCode) parts.push('Mã hàng');
            if (dupBarcode) parts.push('Mã vạch');
            alert('Không thể cập nhật — trường sau đã trùng với sản phẩm khác: ' + parts.join(' và ') + '. Vui lòng sửa trước khi lưu.');
            setLoading(false);
            return;
          }
          const dataToUpdate = { ...formData, id: editingItem.id };
          await api.put(API_ENDPOINTS.products, editingItem.id, dataToUpdate);
          alert('Cập nhật sản phẩm thành công!');
        } else {
          // When creating new, do not allow duplicates
          const dupCode = existing.some(p => (p.code || '').toString().toLowerCase().trim() === code && code !== '');
          const dupBarcode = existing.some(p => (p.barcode || '').toString().toLowerCase().trim() === barcode && barcode !== '');
          if (dupCode || dupBarcode) {
            const parts = [];
            if (dupCode) parts.push('Mã hàng');
            if (dupBarcode) parts.push('Mã vạch');
            alert('Không thể thêm mới — trường sau đã trùng: ' + parts.join(' và ') + '. Vui lòng sửa trước khi lưu.');
            setLoading(false);
            return;
          }
          await api.post(API_ENDPOINTS.products, formData);
          alert('Thêm sản phẩm thành công!');
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra trùng trước khi lưu:', err);
        alert('Có lỗi khi kiểm tra trùng. Vui lòng thử lại.');
        setLoading(false);
        return;
      }
      await fetchProducts();
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý lưu copy
  const handleSaveCopy = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Tạo bản sao mới không có ID
      const copyData = { ...formData };
      delete copyData.id;
      // Validate required fields before saving a copy
      if (!validateRequiredForm()) return;

      // Check duplicates: mã hàng và mã vạch
      try {
        const existing = await api.get(API_ENDPOINTS.products);
        const code = (copyData.code || '').toString().toLowerCase().trim();
        const barcode = (copyData.barcode || '').toString().toLowerCase().trim();
        const dupCode = existing.some(p => (p.code || '').toString().toLowerCase().trim() === code && code !== '');
        const dupBarcode = existing.some(p => (p.barcode || '').toString().toLowerCase().trim() === barcode && barcode !== '');
        if (dupCode || dupBarcode) {
          const parts = [];
          if (dupCode) parts.push('Mã hàng');
          if (dupBarcode) parts.push('Mã vạch');
          alert('Không thể lưu Copy — trường sau đã trùng: ' + parts.join(' và ') + '.\nVui lòng sửa khác trước khi lưu.');
          return;
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra trùng trước khi lưu copy:', err);
        alert('Có lỗi khi kiểm tra dữ liệu trùng. Vui lòng thử lại.');
        return;
      }

      await api.post(API_ENDPOINTS.products, copyData);
      alert('Sao chép sản phẩm thành công!');
      await fetchProducts();
      // Giữ modal mở và giữ nguyên dữ liệu để tiếp tục sao chép
    } catch (error) {
      console.error('Error copying product:', error);
      alert('Có lỗi xảy ra khi sao chép dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      code: '',
      barcode: '',
      name: '',
      vatName: '',
      description: '',
      shelfLife: 0,
      baseUnit: '',
      unit1: '',
      unit2: '',
      unit3: '',
      unit4: '',
      defaultUnit: '',
      baseConversion: 1,
      conversion1: 0,
      conversion2: 0,
      conversion3: 0,
      conversion4: 0,
      importPrice: 0,
      importPrice1: 0,
      importPrice2: 0,
      importPrice3: 0,
      importPrice4: 0,
      retailPrice: 0,
      retailPrice1: 0,
      retailPrice2: 0,
      retailPrice3: 0,
      retailPrice4: 0,
      retailDiscount1: 0,
      retailDiscount2: 0,
      retailDiscount3: 0,
      retailDiscount4: 0,
      wholesalePrice: 0,
      wholesalePrice1: 0,
      wholesalePrice2: 0,
      wholesalePrice3: 0,
      wholesalePrice4: 0,
      wholesaleDiscount1: 0,
      wholesaleDiscount2: 0,
      wholesaleDiscount3: 0,
      wholesaleDiscount4: 0,
      weight: 0,
      weight1: 0,
      weight2: 0,
      weight3: 0,
      weight4: 0,
      volume: 0,
      volume1: 0,
      volume2: 0,
      volume3: 0,
      volume4: 0,
      shippingFee: 0,
      shippingFee1: 0,
      shippingFee2: 0,
      shippingFee3: 0,
      shippingFee4: 0,
      minStock: 0,
      discount: 0,
      note: '',
      promotion: '',
      status: 'active'
    });
  };

  const handleEdit = (item) => {
    console.log('=== EDITING ITEM DEBUG ===');
    console.log('Original item:', item);
    console.log('item.category:', item.category);
    console.log('item.baseUnit:', item.baseUnit);
    console.log('item.unit2 VALUE:', `"${item.unit2}"`);
    console.log('item.unit2 type:', typeof item.unit2);
    console.log('item.unit2 === undefined:', item.unit2 === undefined);
    console.log('item.unit2 === null:', item.unit2 === null);
    console.log('item.defaultUnit:', item.defaultUnit);
    console.log('Available categories:', categories);
    console.log('Available units:', units);
    console.log('Units with "Lốc":', units.filter(u => u.name.includes('Lốc') || u.name.includes('lốc')));
    
    // Check if unit2 value exists in units list
    if (item.unit2) {
      const matchingUnit = units.find(u => u.name === item.unit2);
      console.log(`Unit2 "${item.unit2}" exists in units list:`, !!matchingUnit);
      if (matchingUnit) {
        console.log('Matching unit:', matchingUnit);
      }
    }
    
    console.log('==========================');
    
    setEditingItem(item);
    
    // Use exact original data without any modifications
    const formDataCopy = {...item};
    console.log('Setting formData.unit2 to:', `"${formDataCopy.unit2}"`);
    
    setFormData(formDataCopy);
    setShowModal(true);
    setShowProductColSetting(false); // Đóng popup cài đặt cột khi mở modal
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        setLoading(true);
        await api.delete(API_ENDPOINTS.products, id);
        alert('Xóa sản phẩm thành công!');
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Có lỗi xảy ra khi xóa dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Open safer confirmation modal for deleting all products
  const handleDeleteAll = () => {
    setDeleteAllConfirmChecked(false);
    setShowDeleteAllModal(true);
  };

  // Perform the actual delete-all operation (called after user confirms via checkbox)
  const performDeleteAll = async () => {
    try {
      // close modal immediately to avoid accidental double-clicks
      setShowDeleteAllModal(false);
      setLoading(true);

      const all = await api.get(API_ENDPOINTS.products);
      if (!all || all.length === 0) {
        alert('Không có sản phẩm nào để xóa.');
        return;
      }

      // delete sequentially to avoid overloading server; show simple progress
      let deleted = 0;
      for (const p of all) {
        try {
          await api.delete(API_ENDPOINTS.products, p.id);
          deleted += 1;
        } catch (err) {
          console.warn(`Lỗi khi xóa sản phẩm id=${p.id}`, err);
        }
      }

      alert(`Đã xóa ${deleted} / ${all.length} sản phẩm.`);
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting all products:', err);
      alert('Có lỗi xảy ra khi xóa. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products - nếu có selectedRows từ search, chỉ hiển thị những sản phẩm đó
  let filteredProducts = applyFilters(products, searchTerm, ['code', 'name', 'barcode', 'category', 'vatName', 'baseUnit']);
  
  // Nếu có products được chọn từ search modal, chỉ hiển thị những sản phẩm đó
  if (selectedRows.length > 0) {
    filteredProducts = filteredProducts.filter(product => selectedRows.includes(product.id));
  }
  
  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);
  
  // Đóng context menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);
  
  // Xử lý chuột phải
  const handleContextMenu = (e, product) => {
    e.preventDefault();
    setSelectedRow(product);
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleContextEdit = () => {
    if (selectedRow) {
      handleEdit(selectedRow);
      setContextMenu(null);
    }
  };
  
  const handleContextDelete = () => {
    if (selectedRow) {
      handleDelete(selectedRow.id);
      setContextMenu(null);
    }
  };
  
  // Xử lý checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedProducts.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Excel Import/Export
  const exportData = (selectedRows && selectedRows.length > 0)
    ? products.filter(p => selectedRows.includes(p.id))
    : filteredProducts;
  const {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  } = useExcelImportExport({
    data: exportData,
    loadData: async () => {
      await fetchProducts();
      await fetchCategories();
      await fetchUnits();
    },
    apiPost: async (data, globalChoices = {}) => {
      const { 
        globalOverwriteChoice, 
        globalIdenticalChoice,
        setGlobalOverwriteChoice,
        setGlobalIdenticalChoice
      } = globalChoices;
      console.log('=== IMPORT DEBUG START ===');
      console.log('Raw import data:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('unit2 from Excel:', data.unit2);
      console.log('============================');
      
      // AUTO-CREATE MISSING UNITS AND CATEGORIES FIRST (before any product operations)
      
      // Auto-create missing units
      const unitFields = ['baseUnit', 'unit1', 'unit2', 'unit3', 'unit4', 'defaultUnit'];
      console.log('Processing unit fields:', unitFields);
      
      for (const field of unitFields) {
        if (data[field]) {
          console.log(`Processing ${field}: "${data[field]}"`);
          try {
            const unitsResponse = await api.get(API_ENDPOINTS.units);
            const unitName = String(data[field]).trim();
            const existingUnit = unitsResponse.find(
              unit => unit.name.toLowerCase().trim() === unitName.toLowerCase()
            );

            if (!existingUnit) {
              // Tạo mã ĐVT tự động từ tên (VD: "Thùng" -> "THUNG", "Lốc" -> "LOC")
              const unitCode = unitName
                .replace(/[^a-zA-ZÀ-ỹ0-9]/g, '')
                .toUpperCase()
                .substring(0, 10);

              const newUnit = {
                code: unitCode,
                name: unitName, // Giữ nguyên case từ Excel
                note: 'Tự động tạo khi import sản phẩm',
                status: 'active'
              };

              console.log(`🔍 Creating new unit:`, newUnit);
              console.log(`🔍 Input unitName: "${unitName}"`);
              console.log(`🔍 Generated unitCode: "${unitCode}"`);
              
              const createdUnit = await api.post(API_ENDPOINTS.units, newUnit);
              console.log(`✓ API Response - Created unit:`, createdUnit);
              console.log(`✓ API returned unit name: "${createdUnit.name}"`);
              console.log(`✓ API returned unit code: "${createdUnit.code}"`);
              
              // CRITICAL FIX: Refresh units list sau khi tạo mới
              await fetchUnits();
              console.log('✓ Refreshed units list after creating new unit');
              
              // CRITICAL: Always use the exact name, not code
              const finalUnitName = createdUnit.name || unitName;
              data[field] = finalUnitName;
              console.log(`✓ Final ${field} value set to: "${finalUnitName}"`);
            } else {
              // Use existing unit's exact name to ensure consistency
              data[field] = existingUnit.name;
              console.log(`Using existing ${field}: "${data[field]}"`);
            }
          } catch (error) {
            console.warn(`Lỗi khi kiểm tra/tạo unit '${data[field]}':`, error);
          }
        }
      }

      // Auto-create missing category
      if (data.category) {
        try {
          const categoriesResponse = await api.get(API_ENDPOINTS.productCategories);
          const existingCategory = categoriesResponse.find(
            cat => cat.name.toLowerCase().trim() === data.category.toLowerCase().trim()
          );

          if (!existingCategory) {
            // Tạo mã loại tự động từ tên (VD: "Thực phẩm" -> "TP")
            const categoryCode = data.category
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .substring(0, 10);

            const newCategory = {
              code: categoryCode,
              name: data.category,
              noGroupOrder: false,
              note: 'Tự động tạo khi import sản phẩm',
              status: 'active'
            };

            await api.post(API_ENDPOINTS.productCategories, newCategory);
            console.log(`✓ Đã tạo loại hàng mới: ${data.category} (${categoryCode})`);
            
            // CRITICAL FIX: Refresh categories list sau khi tạo mới
            await fetchCategories();
          }
        } catch (error) {
          console.warn('Lỗi khi kiểm tra/tạo category:', error);
        }
      }
      
      // NOW CHECK FOR EXISTING PRODUCTS WITH ADVANCED VALIDATION
      const existingProducts = await api.get(API_ENDPOINTS.products);
      const existingByCode = existingProducts.find(
        product => (product.code || '').toString().toLowerCase().trim() === (data.code || '').toString().toLowerCase().trim()
      );
      const existingByBarcode = data.barcode ? existingProducts.find(
        product => (product.barcode || '').toString().toLowerCase().trim() === (data.barcode || '').toString().toLowerCase().trim()
      ) : null;

      // Tìm sản phẩm tồn tại (ưu tiên theo mã hàng)
      const existing = existingByCode || existingByBarcode;

      if (existing) {
        const conflictFields = [];
        if (existingByCode) conflictFields.push('Mã hàng');
        if (existingByBarcode && existingByCode?.id !== existingByBarcode?.id) {
          conflictFields.push('Mã vạch');
        }
        
        // So sánh tất cả các trường để xác định loại conflict
        const importantFields = ['category', 'name', 'vatName', 'description', 'baseUnit', 'unit1', 'unit2', 'defaultUnit', 'retailPrice'];
        let identicalCount = 0;
        let differentFields = [];
        
        importantFields.forEach(field => {
          const existingValue = String(existing[field] || '').trim();
          const newValue = String(data[field] || '').trim();
          
          if (existingValue === newValue) {
            identicalCount++;
          } else if (newValue !== '') { // Chỉ tính khác biệt nếu giá trị mới không rỗng
            differentFields.push(field);
          }
        });
        
        const totalFieldsToCompare = importantFields.filter(field => String(data[field] || '').trim() !== '').length;
        const isCompletelyIdentical = identicalCount === totalFieldsToCompare && differentFields.length === 0;
        
        console.log(`🔍 Conflict Analysis for ${data.code}:`);
        console.log(`- Identical fields: ${identicalCount}/${totalFieldsToCompare}`);
        console.log(`- Different fields: [${differentFields.join(', ')}]`);
        console.log(`- Is completely identical: ${isCompletelyIdentical}`);
        
        if (isCompletelyIdentical) {
          // CASE 2: Hoàn toàn trùng khớp - hỏi bỏ qua hay ghi đè
          let userChoice;
          
          if (globalIdenticalChoice) {
            userChoice = globalIdenticalChoice === 'overwrite';
            console.log(`🔄 Sử dụng lựa chọn toàn cục (identical): ${globalIdenticalChoice}`);
          } else {
            // Tạo custom dialog với 4 options
            const dialogResult = await new Promise((resolve) => {
              const modal = document.createElement('div');
              modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                  <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 16px 0; color: #333;">Sản phẩm trùng lặp hoàn toàn</h3>
                    <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
                      Sản phẩm "<strong>${data.name || data.code}</strong>" đã có sẵn trong hệ thống với thông tin giống hệt.
                    </p>
                    <div style="display: grid; gap: 8px;">
                      <button id="overwrite-once" style="padding: 10px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">Ghi đè sản phẩm này</button>
                      <button id="overwrite-all" style="padding: 10px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">Ghi đè tất cả tương tự</button>
                      <button id="skip-once" style="padding: 10px; background: #faad14; color: white; border: none; border-radius: 4px; cursor: pointer;">Bỏ qua sản phẩm này</button>
                      <button id="skip-all" style="padding: 10px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer;">Hủy</button>

                    </div>
                  </div>
                </div>
              `;
              document.body.appendChild(modal);
              
              modal.querySelector('#overwrite-once').onclick = () => { document.body.removeChild(modal); resolve('overwrite-once'); };
              modal.querySelector('#overwrite-all').onclick = () => { document.body.removeChild(modal); resolve('overwrite-all'); };
              modal.querySelector('#skip-once').onclick = () => { document.body.removeChild(modal); resolve('skip-once'); };
              modal.querySelector('#skip-all').onclick = () => { document.body.removeChild(modal); resolve('skip-all'); };
            });
            
            if (dialogResult === 'overwrite-all') {
              setGlobalIdenticalChoice && setGlobalIdenticalChoice('overwrite');
              userChoice = true;
            } else if (dialogResult === 'skip-all') {
              setGlobalIdenticalChoice && setGlobalIdenticalChoice('skip');
              userChoice = false;
            } else {
              userChoice = dialogResult === 'overwrite-once';
            }
          }
          
          if (!userChoice) {
            console.log(`⏭️ Bỏ qua sản phẩm trùng lặp: ${data.code}`);
            return { action: 'skipped', product: existing, reason: 'Người dùng chọn bỏ qua sản phẩm trùng lặp' };
          }
        } else {
          // CASE 1: Trùng một số trường nhưng khác các trường khác
          let userChoice;
          
          if (globalOverwriteChoice) {
            userChoice = globalOverwriteChoice === 'overwrite';
            console.log(`🔄 Sử dụng lựa chọn toàn cục (overwrite): ${globalOverwriteChoice}`);
          } else {
            const conflictInfo = conflictFields.length > 0 ? `trùng ${conflictFields.join(', ')}` : 'có thông tin tương tự';
            
            // Tạo custom dialog với 4 options
            const dialogResult = await new Promise((resolve) => {
              const modal = document.createElement('div');
              modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                  <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 16px 0; color: #333;">Sản phẩm có thông tin trùng lặp</h3>
                    <p style="margin: 0 0 12px 0; color: #666; line-height: 1.4;">
                      Sản phẩm "<strong>${data.name || data.code}</strong>" ${conflictInfo} nhưng khác nhau về các trường khác:
                    </p>
                    <p style="margin: 0 0 20px 0; color: #d46b08; font-size: 14px;">
                      <strong>Các trường khác biệt:</strong> ${differentFields.length > 0 ? differentFields.join(', ') : 'Một số trường khác'}
                    </p>
                    <div style="display: grid; gap: 8px;">
                      <button id="overwrite-once" style="padding: 10px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">Ghi đè sản phẩm này</button>
                      <button id="overwrite-all" style="padding: 10px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">Ghi đè tất cả tương tự</button>
                      <button id="skip-once" style="padding: 10px; background: #faad14; color: white; border: none; border-radius: 4px; cursor: pointer;">Bỏ qua sản phẩm này</button>
                      <button id="skip-all" style="padding: 10px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer;">Hủy</button>
                    </div>
                  </div>
                </div>
              `;
              document.body.appendChild(modal);
              
              modal.querySelector('#overwrite-once').onclick = () => { document.body.removeChild(modal); resolve('overwrite-once'); };
              modal.querySelector('#overwrite-all').onclick = () => { document.body.removeChild(modal); resolve('overwrite-all'); };
              modal.querySelector('#skip-once').onclick = () => { document.body.removeChild(modal); resolve('skip-once'); };
              modal.querySelector('#skip-all').onclick = () => { document.body.removeChild(modal); resolve('skip-all'); };
            });
            
            if (dialogResult === 'overwrite-all') {
              setGlobalOverwriteChoice && setGlobalOverwriteChoice('overwrite');
              userChoice = true;
            } else if (dialogResult === 'skip-all') {
              setGlobalOverwriteChoice && setGlobalOverwriteChoice('skip');
              userChoice = false;
            } else {
              userChoice = dialogResult === 'overwrite-once';
            }
          }
          
          if (!userChoice) {
            console.log(`⏭️ Bỏ qua ghi đè sản phẩm: ${data.code}`);
            return { action: 'skipped', product: existing, reason: 'Người dùng từ chối ghi đè sản phẩm có conflict' };
          }
        }
        
        // Thực hiện update nếu user đồng ý
        console.log(`⚠️ Cập nhật sản phẩm tồn tại (${conflictFields.join(', ')}): ${data.code || data.name}`);
        
        try {
          // Merge: giữ các trường hiện có, ghi đè bằng data nếu data có giá trị
          const merged = { ...existing };
          Object.keys(data).forEach(k => {
            const v = data[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              merged[k] = v;
            }
          });

          console.log('About to PUT to API:', JSON.stringify(merged, null, 2));
          
          const updatedProduct = await api.put(API_ENDPOINTS.products, existing.id, merged);
          console.log('Updated product from API response:', updatedProduct);
          
          return { action: 'updated', product: updatedProduct };
        } catch (err) {
          throw new Error(`Cập nhật sản phẩm ${data.code} thất bại: ${err.message}`);
        }
      }

      // CASE 3: Sản phẩm hoàn toàn mới - tạo mới bình thường
      console.log(`✨ Tạo sản phẩm mới: ${data.code || data.name}`);
      console.log('About to POST to API:', JSON.stringify(data, null, 2));
      
      const newProduct = await api.post(API_ENDPOINTS.products, data);
      console.log(`✅ Đã tạo sản phẩm mới thành công: ${data.code || data.name}`);
      console.log('Created product from API response:', newProduct);
      console.log('=== IMPORT DEBUG END ===');
      
      return { action: 'created', product: newProduct };
    },
    columnMapping: {
      'Loại hàng': 'category',
      'Mã hàng hóa': 'code',
      'Mã vạch': 'barcode',
      'Tên hàng hóa': 'name',
      'Tên hàng hóa VAT': 'vatName',
      'Mô tả': 'description',
      'Hạn sử dụng theo tháng': 'shelfLife',
      'ĐVT': 'baseUnit',
      'ĐVT1': 'unit1',
      'ĐVT2': 'unit2',
      'ĐVT3': 'unit3',
      'ĐVT4': 'unit4',
      'ĐVT mặc định': 'defaultUnit',
      'Quy đổi 1': 'conversion1',
      'Quy đổi 2': 'conversion2',
      'Quy đổi 3': 'conversion3',
      'Quy đổi 4': 'conversion4',
      'Giá nhập': 'importPrice',
      'Giá nhập1': 'importPrice1',
      'Giá nhập2': 'importPrice2',
      'Giá nhập3': 'importPrice3',
      'Giá nhập4': 'importPrice4',
      'Giá bán lẻ': 'retailPrice',
      'Giá bán lẻ1': 'retailPrice1',
      'Giá bán lẻ2': 'retailPrice2',
      'Giá bán lẻ3': 'retailPrice3',
      'Giá bán lẻ4': 'retailPrice4',
      'Giảm bán lẻ 1': 'retailDiscount1',
      'Giảm bán lẻ 2': 'retailDiscount2',
      'Giảm bán lẻ 3': 'retailDiscount3',
      'Giảm bán lẻ 4': 'retailDiscount4',
      'Giá bán sỉ': 'wholesalePrice',
      'Giá bán sỉ1': 'wholesalePrice1',
      'Giá bán sỉ2': 'wholesalePrice2',
      'Giá bán sỉ3': 'wholesalePrice3',
      'Giá bán sỉ4': 'wholesalePrice4',
      'Giảm bán sỉ 1': 'wholesaleDiscount1',
      'Giảm bán sỉ 2': 'wholesaleDiscount2',
      'Giảm bán sỉ 3': 'wholesaleDiscount3',
      'Giảm bán sỉ 4': 'wholesaleDiscount4',
      'Số Kg': 'weight',
      'Số Kg1': 'weight1',
      'Số Kg2': 'weight2',
      'Số Kg3': 'weight3',
      'Số Kg4': 'weight4',
      'Số khối': 'volume',
      'Số khối1': 'volume1',
      'Số khối2': 'volume2',
      'Số khối3': 'volume3',
      'Số khối4': 'volume4',
      'Phí vận chuyển': 'shippingFee',
      'Phí vận chuyển1': 'shippingFee1',
      'Phí vận chuyển2': 'shippingFee2',
      'Phí vận chuyển3': 'shippingFee3',
      'Phí vận chuyển4': 'shippingFee4',
      'Tồn tối thiểu': 'minStock',
      'Chiết khấu': 'discount',
      'Ghi chú': 'note',
      'Khuyến mãi': 'promotion',
      'Trạng thái': 'status'
    },
    requiredFields: ['Loại hàng', 'Mã hàng hóa', 'Tên hàng hóa'],
    filename: 'Danh_sach_hang_hoa',
    sheetName: 'Hàng hóa',
    transformDataForExport: (item) => ({
      'Loại hàng': item.category || '',
      'Mã hàng hóa': item.code || '',
      'Mã vạch': item.barcode || '',
      'Tên hàng hóa': item.name || '',
      'Tên hàng hóa VAT': item.vatName || '',
      'Mô tả': item.description || '',
      'Hạn sử dụng theo tháng': item.shelfLife || 0,
      'ĐVT': item.baseUnit || '',
      'ĐVT1': item.unit1 || '',
      'ĐVT2': item.unit2 || '',
      'ĐVT3': item.unit3 || '',
      'ĐVT4': item.unit4 || '',
      'ĐVT mặc định': item.defaultUnit || '',
      'Quy đổi 1': item.conversion1 || 0,
      'Quy đổi 2': item.conversion2 || 0,
      'Quy đổi 3': item.conversion3 || 0,
      'Quy đổi 4': item.conversion4 || 0,
      'Giá nhập': item.importPrice || 0,
      'Giá nhập1': item.importPrice1 || 0,
      'Giá nhập2': item.importPrice2 || 0,
      'Giá nhập3': item.importPrice3 || 0,
      'Giá nhập4': item.importPrice4 || 0,
      'Giá bán lẻ': item.retailPrice || 0,
      'Giá bán lẻ1': item.retailPrice1 || 0,
      'Giá bán lẻ2': item.retailPrice2 || 0,
      'Giá bán lẻ3': item.retailPrice3 || 0,
      'Giá bán lẻ4': item.retailPrice4 || 0,
      'Giảm bán lẻ 1': item.retailDiscount1 || 0,
      'Giảm bán lẻ 2': item.retailDiscount2 || 0,
      'Giảm bán lẻ 3': item.retailDiscount3 || 0,
      'Giảm bán lẻ 4': item.retailDiscount4 || 0,
      'Giá bán sỉ': item.wholesalePrice || 0,
      'Giá bán sỉ1': item.wholesalePrice1 || 0,
      'Giá bán sỉ2': item.wholesalePrice2 || 0,
      'Giá bán sỉ3': item.wholesalePrice3 || 0,
      'Giá bán sỉ4': item.wholesalePrice4 || 0,
      'Giảm bán sỉ 1': item.wholesaleDiscount1 || 0,
      'Giảm bán sỉ 2': item.wholesaleDiscount2 || 0,
      'Giảm bán sỉ 3': item.wholesaleDiscount3 || 0,
      'Giảm bán sỉ 4': item.wholesaleDiscount4 || 0,
      'Số Kg': item.weight || 0,
      'Số Kg1': item.weight1 || 0,
      'Số Kg2': item.weight2 || 0,
      'Số Kg3': item.weight3 || 0,
      'Số Kg4': item.weight4 || 0,
      'Số khối': item.volume || 0,
      'Số khối1': item.volume1 || 0,
      'Số khối2': item.volume2 || 0,
      'Số khối3': item.volume3 || 0,
      'Số khối4': item.volume4 || 0,
      'Phí vận chuyển': item.shippingFee || 0,
      'Phí vận chuyển1': item.shippingFee1 || 0,
      'Phí vận chuyển2': item.shippingFee2 || 0,
      'Phí vận chuyển3': item.shippingFee3 || 0,
      'Phí vận chuyển4': item.shippingFee4 || 0,
      'Tồn tối thiểu': item.minStock || 0,
      'Chiết khấu': item.discount || 0,
      'Ghi chú': item.note || '',
      'Khuyến mãi': item.promotion || '',
      'Trạng thái': item.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'
    }),
    transformDataForImport: (row) => ({
      category: row['Loại hàng'],
      code: row['Mã hàng hóa'],
      barcode: row['Mã vạch'] || '',
      name: row['Tên hàng hóa'],
      vatName: row['Tên hàng hóa VAT'] || '',
      description: row['Mô tả'] || '',
      shelfLife: parseFloat(row['Hạn sử dụng theo tháng']) || 0,
      baseUnit: row['ĐVT'] || '',
      unit1: row['ĐVT1'] || '',
      unit2: row['ĐVT2'] || '',
      unit3: row['ĐVT3'] || '',
      unit4: row['ĐVT4'] || '',
      defaultUnit: row['ĐVT mặc định'] || '',
      conversion1: parseFloat(row['Quy đổi 1']) || 0,
      conversion2: parseFloat(row['Quy đổi 2']) || 0,
      conversion3: parseFloat(row['Quy đổi 3']) || 0,
      conversion4: parseFloat(row['Quy đổi 4']) || 0,
      importPrice: parseFloat(row['Giá nhập']) || 0,
      importPrice1: parseFloat(row['Giá nhập1']) || 0,
      importPrice2: parseFloat(row['Giá nhập2']) || 0,
      importPrice3: parseFloat(row['Giá nhập3']) || 0,
      importPrice4: parseFloat(row['Giá nhập4']) || 0,
      retailPrice: parseFloat(row['Giá bán lẻ']) || 0,
      retailPrice1: parseFloat(row['Giá bán lẻ1']) || 0,
      retailPrice2: parseFloat(row['Giá bán lẻ2']) || 0,
      retailPrice3: parseFloat(row['Giá bán lẻ3']) || 0,
      retailPrice4: parseFloat(row['Giá bán lẻ4']) || 0,
      retailDiscount1: parseFloat(row['Giảm bán lẻ 1']) || 0,
      retailDiscount2: parseFloat(row['Giảm bán lẻ 2']) || 0,
      retailDiscount3: parseFloat(row['Giảm bán lẻ 3']) || 0,
      retailDiscount4: parseFloat(row['Giảm bán lẻ 4']) || 0,
      wholesalePrice: parseFloat(row['Giá bán sỉ']) || 0,
      wholesalePrice1: parseFloat(row['Giá bán sỉ1']) || 0,
      wholesalePrice2: parseFloat(row['Giá bán sỉ2']) || 0,
      wholesalePrice3: parseFloat(row['Giá bán sỉ3']) || 0,
      wholesalePrice4: parseFloat(row['Giá bán sỉ4']) || 0,
      wholesaleDiscount1: parseFloat(row['Giảm bán sỉ 1']) || 0,
      wholesaleDiscount2: parseFloat(row['Giảm bán sỉ 2']) || 0,
      wholesaleDiscount3: parseFloat(row['Giảm bán sỉ 3']) || 0,
      wholesaleDiscount4: parseFloat(row['Giảm bán sỉ 4']) || 0,
      weight: parseFloat(row['Số Kg']) || 0,
      weight1: parseFloat(row['Số Kg1']) || 0,
      weight2: parseFloat(row['Số Kg2']) || 0,
      weight3: parseFloat(row['Số Kg3']) || 0,
      weight4: parseFloat(row['Số Kg4']) || 0,
      volume: parseFloat(row['Số khối']) || 0,
      volume1: parseFloat(row['Số khối1']) || 0,
      volume2: parseFloat(row['Số khối2']) || 0,
      volume3: parseFloat(row['Số khối3']) || 0,
      volume4: parseFloat(row['Số khối4']) || 0,
      shippingFee: parseFloat(row['Phí vận chuyển']) || 0,
      shippingFee1: parseFloat(row['Phí vận chuyển1']) || 0,
      shippingFee2: parseFloat(row['Phí vận chuyển2']) || 0,
      shippingFee3: parseFloat(row['Phí vận chuyển3']) || 0,
      shippingFee4: parseFloat(row['Phí vận chuyển4']) || 0,
      minStock: parseInt(row['Tồn tối thiểu']) || 0,
      discount: parseFloat(row['Chiết khấu']) || 0,
      note: row['Ghi chú'] || '',
      promotion: row['Khuyến mãi'] || '',
      status: row['Trạng thái'] === 'Ngưng hoạt động' ? 'inactive' : 'active'
    }),
    onImportStart: () => setLoading(true),
    onImportComplete: () => setLoading(false),
    // Allow importing even if some optional columns are missing in Excel
    allowMissingFields: true
  });

  // Cột và độ rộng mặc định
  // --- CẤU HÌNH CỘT, DRAG, LƯU LOCALSTORAGE ---
  const PRODUCT_COLS_KEY = 'products_table_cols_v3'; // v3 để đảm bảo cột STT ở đầu
  const productColumns = [
    { key: 'select', label: 'STT', fixed: true },
    { key: 'category', label: 'Loại hàng' },
    { key: 'code', label: 'Mã hàng hóa' },
    { key: 'barcode', label: 'Mã vạch' },
    { key: 'name', label: 'Tên hàng hóa' },
    { key: 'vatName', label: 'Tên hàng hóa VAT' },
    { key: 'description', label: 'Mô tả' },
    { key: 'shelfLife', label: 'HSD (tháng)' },
    { key: 'baseUnit', label: 'ĐVT' },
    { key: 'unit1', label: 'ĐVT1' },
    { key: 'unit2', label: 'ĐVT2' },
    { key: 'defaultUnit', label: 'ĐVT mặc định' },
    { key: 'conversion1', label: 'Quy đổi 1' },
    { key: 'conversion2', label: 'Quy đổi 2' },
    { key: 'retailPrice', label: 'Giá bán lẻ' },
    { key: 'retailPrice1', label: 'Giá bán lẻ1' },
    { key: 'retailPrice2', label: 'Giá bán lẻ2' },
    { key: 'weight', label: 'Số Kg' },
    { key: 'weight1', label: 'Số Kg1' },
    { key: 'weight2', label: 'Số Kg2' },
    { key: 'volume', label: 'Số khối' },
    { key: 'volume1', label: 'Số khối1' },
    { key: 'volume2', label: 'Số khối2' },
    { key: 'minStock', label: 'Tồn tối thiểu' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Thao tác', fixed: true }
  ];
  const defaultProductOrder = productColumns.map(col => col.key);
  // Hiển thị tất cả các cột theo mặc định
  const defaultProductVisible = productColumns.map(col => col.key);
  const defaultProductWidths = Array(productColumns.length).fill(120);
  // Lấy cấu hình cột từ localStorage nếu có
  const getInitialProductCols = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCT_COLS_KEY));
      if (saved && Array.isArray(saved.visibleCols) && Array.isArray(saved.order)) {
        // Đảm bảo các cột fixed luôn ở đúng vị trí (select đầu, actions cuối)
        const fixedCols = productColumns.filter(col => col.fixed).map(col => col.key);
        const nonFixedCols = saved.order.filter(key => !productColumns.find(col => col.key === key)?.fixed);
        const correctedOrder = ['select', ...nonFixedCols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
        return [saved.visibleCols, correctedOrder];
      }
    } catch {}
    return [defaultProductVisible, defaultProductOrder];
  };
  const [[initProductVisible, initProductOrder]] = [getInitialProductCols()];
  const [productVisibleCols, setProductVisibleCols] = useState(initProductVisible);
  const [productColOrder, setProductColOrder] = useState(initProductOrder);
  const [productColWidths, setProductColWidths] = useState(defaultProductWidths);
  const [showProductColSetting, setShowProductColSetting] = useState(false);
  const productTableRef = useRef(null);
  const productColSettingRef = useRef(null);
  // Drag state cho popup
  const [popupDragIndex, setPopupDragIndex] = useState(null);
  const [popupDragOverIndex, setPopupDragOverIndex] = useState(null);
  // Drag state cho header bảng
  const [headerDragIndex, setHeaderDragIndex] = useState(null);
  const [headerDragOverIndex, setHeaderDragOverIndex] = useState(null);
  // Lưu cấu hình cột vào localStorage
  const saveProductColConfig = (visibleCols, order) => {
    localStorage.setItem(PRODUCT_COLS_KEY, JSON.stringify({ visibleCols, order }));
  };
  // Tự động lưu khi thay đổi
  React.useEffect(() => {
    saveProductColConfig(productVisibleCols, productColOrder);
  }, [productVisibleCols, productColOrder]);
  // Đóng popup khi click ra ngoài và tự động lưu
  React.useEffect(() => {
    if (!showProductColSetting) return;
    const handleClick = (e) => {
      if (productColSettingRef.current && !productColSettingRef.current.contains(e.target)) {
        setShowProductColSetting(false);
        saveProductColConfig(productVisibleCols, productColOrder);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProductColSetting, productVisibleCols, productColOrder]);
  // Drag & drop trong popup
  const handlePopupDragStart = (idx) => setPopupDragIndex(idx);
  const handlePopupDragOver = (idx, e) => { e.preventDefault(); setPopupDragOverIndex(idx); };
  const handlePopupDrop = () => {
    if (popupDragIndex === null || popupDragOverIndex === null || popupDragIndex === popupDragOverIndex) {
      setPopupDragIndex(null); setPopupDragOverIndex(null); return;
    }
    const cols = productColOrder.filter(k => !productColumns.find(col => col.key === k)?.fixed);
    const dragged = cols[popupDragIndex];
    cols.splice(popupDragIndex, 1);
    cols.splice(popupDragOverIndex, 0, dragged);
    // Đảm bảo select ở đầu, actions ở cuối
    const newOrder = ['select', ...cols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
    setProductColOrder(newOrder);
    setPopupDragIndex(null); setPopupDragOverIndex(null);
  };
  // Khi click checkbox cột hiển thị
  const handleColVisibleChange = (key, checked) => {
    if (checked) setProductVisibleCols(cols => [...cols, key]);
    else setProductVisibleCols(cols => cols.filter(k => k !== key));
  };
  // Khi click "Làm lại"
  const handleResetCols = () => {
    setProductVisibleCols(defaultProductVisible);
    setProductColOrder(defaultProductOrder);
    saveProductColConfig(defaultProductVisible, defaultProductOrder);
  };

  // Đóng popup khi click ra ngoài
  React.useEffect(() => {
    if (!showProductColSetting) return;
    const handleClickOutside = (e) => {
      if (productColSettingRef.current && !productColSettingRef.current.contains(e.target)) {
        setShowProductColSetting(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProductColSetting]);

  // Kéo cột để thay đổi kích thước
  const handleProductMouseDown = (index, e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidths = [...productColWidths];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setProductColWidths((widths) => {
        const newWidths = [...widths];
        if (edge === 'right') {
          newWidths[index] = Math.max(50, startWidths[index] + delta);
        } else if (edge === 'left' && index > 0) {
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

  // Drag & drop để thay đổi thứ tự cột trên header
  const handleHeaderDragStart = (key, idx) => {
    const col = productColumns.find(c => c.key === key);
    if (col?.fixed) return; // Không cho kéo cột cố định
    setHeaderDragIndex(idx);
  };

  const handleHeaderDragOver = (idx, e) => {
    e.preventDefault();
    const col = productColumns.find(c => c.key === productColOrder[idx]);
    if (col?.fixed) return; // Không cho thả vào cột cố định
    setHeaderDragOverIndex(idx);
  };

  const handleHeaderDrop = (idx) => {
    if (headerDragIndex === null || headerDragIndex === idx) {
      setHeaderDragIndex(null);
      setHeaderDragOverIndex(null);
      return;
    }
    
    const targetCol = productColumns.find(c => c.key === productColOrder[idx]);
    if (targetCol?.fixed) {
      setHeaderDragIndex(null);
      setHeaderDragOverIndex(null);
      return;
    }

    // Chỉ di chuyển các cột không fixed
    const nonFixedCols = productColOrder.filter(k => !productColumns.find(col => col.key === k)?.fixed);
    const draggedKey = productColOrder[headerDragIndex];
    
    // Tìm vị trí mới trong danh sách non-fixed
    const oldIdx = nonFixedCols.indexOf(draggedKey);
    const newIdx = nonFixedCols.indexOf(productColOrder[idx]);
    
    if (oldIdx !== -1 && newIdx !== -1) {
      nonFixedCols.splice(oldIdx, 1);
      nonFixedCols.splice(newIdx, 0, draggedKey);
    }
    
    // Đảm bảo select ở đầu, actions ở cuối
    const newOrder = ['select', ...nonFixedCols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
    setProductColOrder(newOrder);
    setHeaderDragIndex(null);
    setHeaderDragOverIndex(null);
  };

  const handleHeaderDragEnd = () => {
    setHeaderDragIndex(null);
    setHeaderDragOverIndex(null);
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Danh sách hàng hóa</h1>
        <p>Quản lý thông tin chi tiết sản phẩm và hàng hóa</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ 
            padding: '8px 16px',
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#0050b3',
            fontWeight: 500
          }}>
            Tổng {products.length > 0 ? products.length.toLocaleString('vi-VN') : 0} sản phẩm
          </div>
          {selectedRows.length > 0 && (
            <>
              <div style={{ 
                padding: '8px 16px',
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#d46b08',
                fontWeight: 500
              }}>
                Đang hiển thị {selectedRows.length} sản phẩm đã chọn
              </div>
              <button
                onClick={() => setSelectedRows([])}
                style={{
                  padding: '6px 12px',
                  background: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                ✕ Xóa bộ lọc
              </button>
            </>
          )}
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã sản phẩm hoặc mã vạch..."
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
                setShowProductColSetting(false); // Đóng popup cài đặt cột khi mở modal
              }}
            >
              + Thêm sản phẩm
            </button>
            <ExcelButtons 
              onExport={handleExportExcel}
              onImport={handleImportExcel}
              onFileChange={handleFileChange}
              fileInputRef={fileInputRef}
              disabled={loading}
            />
            <button
              className="btn btn-danger"
              onClick={handleDeleteAll}
              style={{ marginLeft: 8, background: '#ff4d4f', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}
              title="Xóa toàn bộ sản phẩm"
            >
              🗑️ Xóa toàn bộ
            </button>
            <button
              className="btn btn-settings"
              style={{ background: 'transparent', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
              title="Cài đặt cột hiển thị"
              onClick={() => setShowProductColSetting(v => !v)}
            >
              <span role="img" aria-label="settings">⚙️</span>
            </button>
          </div>

          {/* Popup chọn cột hiển thị */}
          {showProductColSetting && (
            <div
              ref={productColSettingRef}
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
                  checked={
                    productColumns.filter(col => !col.fixed).every(col => productVisibleCols.includes(col.key)) &&
                    productColumns.filter(col => !col.fixed).length === productVisibleCols.filter(key => !productColumns.find(col => col.key === key)?.fixed).length
                  }
                  onChange={e => {
                    const nonFixedCols = productColumns.filter(col => !col.fixed).map(col => col.key);
                    if (e.target.checked) {
                      // Thêm các cột chưa cố định vào visible, giữ nguyên các cột cố định nếu đã có
                      const newVisible = Array.from(new Set([...productVisibleCols, ...nonFixedCols, ...productColumns.filter(col => col.fixed).map(col => col.key)]));
                      setProductVisibleCols(newVisible);
                      const newOrder = ['select', ...nonFixedCols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
                      setProductColOrder(newOrder);
                      saveProductColConfig(newVisible, newOrder);
                    } else {
                      // Bỏ các cột chưa cố định khỏi visible, giữ lại cột cố định
                      const fixedCols = productColumns.filter(col => col.fixed).map(col => col.key);
                      setProductVisibleCols(fixedCols);
                      const newOrder = ['select', ...nonFixedCols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
                      setProductColOrder(newOrder);
                      saveProductColConfig(fixedCols, newOrder);
                    }
                  }}
                  style={{ marginRight: 6 }}
                />
                <span style={{ fontWeight: 500 }}>Cột hiển thị</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  onClick={handleResetCols}
                >Làm lại</button>
              </div>
              
              {/* Cột cố định trái (STT) */}
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Cố định trái</div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, opacity: 0.7 }}>
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                <span>STT</span>
              </div>
              
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Chưa cố định</div>
              {productColOrder.filter(key => !productColumns.find(col => col.key === key)?.fixed).map((key, idx) => {
                const col = productColumns.find(c => c.key === key);
                return (
                  <div
                    key={col.key}
                    style={{ display: 'flex', alignItems: 'center', marginBottom: 2, background: popupDragOverIndex === idx && popupDragIndex !== null ? '#e6f7ff' : undefined, opacity: popupDragIndex === idx ? 0.5 : 1, cursor: 'move', borderRadius: 4 }}
                    draggable
                    onDragStart={() => setPopupDragIndex(idx)}
                    onDragOver={e => { e.preventDefault(); setPopupDragOverIndex(idx); }}
                    onDrop={() => {
                      if (popupDragIndex === null || popupDragIndex === idx) { setPopupDragIndex(null); setPopupDragOverIndex(null); return; }
                      const cols = productColOrder.filter(k => !productColumns.find(col => col.key === k)?.fixed);
                      const dragged = cols[popupDragIndex];
                      cols.splice(popupDragIndex, 1);
                      cols.splice(idx, 0, dragged);
                      // Đảm bảo select ở đầu, actions ở cuối
                      const newOrder = ['select', ...cols.filter(k => k !== 'select' && k !== 'actions'), 'actions'];
                      setProductColOrder(newOrder);
                      setPopupDragIndex(null); setPopupDragOverIndex(null);
                    }}
                    onDragEnd={() => { setPopupDragIndex(null); setPopupDragOverIndex(null); }}
                  >
                    <span style={{ color: '#ccc', marginRight: 4, fontSize: 15, cursor: 'grab' }}>⋮⋮</span>
                    <input
                      type="checkbox"
                      checked={productVisibleCols.includes(col.key)}
                      onChange={e => handleColVisibleChange(col.key, e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                    <span>{col.label}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 13, color: '#888', margin: '6px 0 2px' }}>Cố định phải</div>
              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <span style={{ color: '#ccc', marginRight: 4, fontSize: 15 }}>⋮⋮</span>
                <input type="checkbox" checked disabled style={{ marginRight: 6 }} />
                <span>Thao tác</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', position: 'relative' }}>
          <table className="data-table" ref={productTableRef}>
            <colgroup>
              {productColOrder.map((key, i) => (
                productVisibleCols.includes(key) ? <col key={key} style={{ width: productColWidths[i] }} /> : null
              ))}
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa' }}>
              <tr>
                {productColOrder.map((key, idx, arr) => {
                  const col = productColumns.find(c => c.key === key);
                  if (!col || !productVisibleCols.includes(key)) return null;
                  
                  // Cột STT với checkbox
                  if (col.key === 'select') {
                    return (
                      <th 
                        key={col.key} 
                        style={{ 
                          position: 'relative', 
                          width: '80px',
                          minWidth: '80px',
                          textAlign: 'center',
                          background: '#fafafa',
                          cursor: 'default'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox"
                            checked={selectedRows.length === paginatedProducts.length && paginatedProducts.length > 0}
                            onChange={handleSelectAll}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>STT</span>
                        </div>
                      </th>
                    );
                  }
                  
                  const isDragging = headerDragIndex === idx;
                  const isDragOver = headerDragOverIndex === idx && headerDragIndex !== null && headerDragIndex !== idx;
                  const canDrag = !col.fixed;
                  
                  return (
                    <th 
                      key={col.key} 
                      draggable={canDrag}
                      onDragStart={() => canDrag && handleHeaderDragStart(col.key, idx)}
                      onDragOver={(e) => handleHeaderDragOver(idx, e)}
                      onDrop={() => handleHeaderDrop(idx)}
                      onDragEnd={handleHeaderDragEnd}
                      style={{ 
                        position: 'relative',
                        opacity: isDragging ? 0.5 : 1,
                        background: isDragOver ? '#e6f7ff' : undefined,
                        cursor: canDrag ? 'move' : 'default'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span>{col.label}</span>
                        {col.key !== 'actions' && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFilterPopup(showFilterPopup === col.key ? null : col.key);
                            }}
                            style={{ 
                              cursor: 'pointer', 
                              fontSize: '14px', 
                              opacity: columnFilters[col.key] ? 1 : 0.5,
                              color: columnFilters[col.key] ? '#1890ff' : 'inherit'
                            }}
                          >
                            🔍
                          </span>
                        )}
                      </div>
                      {col.key !== 'actions' && col.key !== 'select' && renderFilterPopup(col.key, col.label, false, products)}
                      {/* Mép phải để resize */}
                      <span
                        className="col-resizer right"
                        onMouseDown={e => handleProductMouseDown(idx, e, 'right')}
                        style={{ 
                          position: 'absolute', 
                          right: -3, 
                          top: 0, 
                          height: '100%', 
                          width: 6, 
                          cursor: 'col-resize', 
                          zIndex: 10,
                          background: 'transparent'
                        }}
                        title="Kéo để thay đổi kích thước cột"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <tr 
                  key={product.id}
                  data-product-id={product.id}
                  onContextMenu={(e) => handleContextMenu(e, product)}
                  style={{ 
                    cursor: 'context-menu',
                    background: selectedRows.includes(product.id) ? '#e6f7ff' : undefined
                  }}
                >
                  {productColOrder.map((key, idx) => {
                    if (!productVisibleCols.includes(key)) return null;
                    const col = productColumns.find(c => c.key === key);
                    if (!col) return null;
                    
                    // Cột STT với checkbox
                    if (col.key === 'select') {
                      return (
                        <td key={col.key} style={{ textAlign: 'center', background: '#fafafa' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox"
                              checked={selectedRows.includes(product.id)}
                              onChange={() => handleSelectRow(product.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{startIndex + index + 1}</span>
                          </div>
                        </td>
                      );
                    }
                    
                    // Các cột giá tiền
                    if (col.key.includes('Price') || col.key.includes('Fee')) {
                      return <td key={col.key}>{formatCurrency(product[col.key] || 0)}</td>;
                    }
                    
                    // Cột trạng thái
                    if (col.key === 'status') {
                      return (
                        <td key={col.key}>
                          <span className={`status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {product.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                      );
                    }
                    
                    // Cột thao tác
                    if (col.key === 'actions') {
                      return (
                        <td key={col.key}>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => handleEdit(product)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(product.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      );
                    }
                    
                    return <td key={col.key}>{product[col.key] || ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {filteredProducts.length > 0 && (
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 0',
            borderTop: '1px solid #e0e0e0',
            marginTop: '8px'
          }}>
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              Dòng {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} trên tổng {filteredProducts.length} dòng
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Nút phân trang */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  ⏮
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  ◀
                </button>
                
                {/* Hiển thị các số trang */}
                {(() => {
                  const pageNumbers = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          background: currentPage === i ? '#1890ff' : '#fff',
                          color: currentPage === i ? '#fff' : '#333',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: currentPage === i ? 'bold' : 'normal'
                        }}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  return (
                    <>
                      {startPage > 1 && <span style={{ padding: '0 4px' }}>...</span>}
                      {pageNumbers}
                      {endPage < totalPages && <span style={{ padding: '0 4px' }}>...</span>}
                    </>
                  );
                })()}
                
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  ▶
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  ⏭
                </button>
              </div>
              
              {/* Dropdown chọn số dòng/trang */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {itemsPerPage} / trang
                  <span style={{ fontSize: '12px' }}>▼</span>
                </button>
                {showPageSizeDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999
                      }}
                      onClick={() => setShowPageSizeDropdown(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        bottom: 'auto',
                        top: 'auto',
                        right: 'auto',
                        left: 'auto',
                        transform: 'translateY(-100%)',
                        marginBottom: '40px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 10000,
                        minWidth: '120px'
                      }}
                      ref={(el) => {
                        if (el) {
                          const button = el.previousSibling?.previousSibling;
                          if (button) {
                            const rect = button.getBoundingClientRect();
                            el.style.left = `${rect.right - 120}px`;
                            el.style.top = `${rect.top}px`;
                          }
                        }
                      }}
                    >
                      {[10, 20, 50, 100, 500, 1000].map(size => (
                        <div
                          key={size}
                          onClick={() => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                            setShowPageSizeDropdown(false);
                          }}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            background: itemsPerPage === size ? '#f0f0f0' : '#fff',
                            fontSize: '14px',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.background = itemsPerPage === size ? '#f0f0f0' : '#fff'}
                        >
                          {size} / trang
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy hàng hóa nào
          </div>
        )}
      </div>

      {/* Context Menu chuột phải */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              resetForm();
              setShowModal(true);
              setEditingItem(null);
              setContextMenu(null);
              setShowProductColSetting(false); // Đóng popup cài đặt cột khi mở modal
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <span>➕</span>
            <span>Thêm</span>
          </div>
          <div
            onClick={handleContextEdit}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <span>✏️</span>
            <span>Xem chi tiết</span>
          </div>
          <div
            onClick={handleContextDelete}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc3545'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <span>🗑️</span>
            <span>Xóa</span>
          </div>
        </div>
      )}

      {/* Safer confirm modal for Delete All */}
      {showDeleteAllModal && (
        <div className="modal-overlay" style={{ zIndex: 110000 }}>
          <div className="modal-content" style={{ maxWidth: '560px', width: '92%', zIndex: 110001 }}>
            <div className="modal-header">
              <h3>XÁC NHẬN XÓA TOÀN BỘ</h3>
              <button className="close-btn" onClick={() => setShowDeleteAllModal(false)}>×</button>
            </div>

            <div style={{ padding: '12px' }}>
              <p style={{ marginBottom: 12 }}>Hành động này sẽ <strong>xóa toàn bộ</strong> sản phẩm khỏi hệ thống và <strong>không thể hoàn tác</strong>. Vui lòng xác nhận bạn hiểu rõ trước khi tiếp tục.</p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={deleteAllConfirmChecked} onChange={(e) => setDeleteAllConfirmChecked(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span>Tôi hiểu và đồng ý xóa toàn bộ sản phẩm</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => { setShowDeleteAllModal(false); setDeleteAllConfirmChecked(false); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
                <button type="button" onClick={performDeleteAll} disabled={!deleteAllConfirmChecked || loading} style={{ padding: '8px 16px', background: deleteAllConfirmChecked ? '#ff4d4f' : '#ffb3b3', color: '#fff', border: 'none', borderRadius: 4, cursor: deleteAllConfirmChecked ? 'pointer' : 'not-allowed' }}>
                  ❗ Xóa toàn bộ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 50000 }}>
          <div className="modal-content" style={{ maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflow: 'auto', zIndex: 50001 }}>
            <div className="modal-header">
              <h3>THÔNG TIN HÀNG HÓA</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '0 8px' }}>
              {/* Thông tin chính */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Loại hàng <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      style={{ flex: 1, padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                      <option value="">Chọn loại hàng</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCategoryModal(true)} style={{ width: '32px', padding: '0', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Mã vạch</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="Mã vạch"
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Mã hàng <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Mã hàng"
                    required
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Tên hàng và Tên hàng VAT (cùng hàng) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Tên hàng <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Tên hàng hóa"
                    required
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Tên hàng VAT</label>
                  <input
                    type="text"
                    name="vatName"
                    value={formData.vatName}
                    onChange={handleInputChange}
                    placeholder="Tên hàng VAT"
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Mô tả và HSD trên cùng một hàng (tỷ lệ 90% / 10%) */}
              <div style={{ display: 'grid', gridTemplateColumns: '9fr 1fr', gap: '16px', marginBottom: '12px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Mô tả"
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>HSD (Tháng)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="shelfLife"
                    value={formData.shelfLife}
                    onChange={handleInputChange}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Bảng ĐVT */}
              <div style={{ marginBottom: '12px' }}>
                
                <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          ĐVT Gốc <span style={{ color: 'red' }}>*</span>
                        </th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Quy đổi</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Giá bán lẻ</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '100px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Số Kg</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '100px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Số khối</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ĐVT gốc */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <select name="baseUnit" value={formData.baseUnit || ''} onChange={handleInputChange} required style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                            <option value="">Chọn ĐVT</option>
                            {units.map(unit => (<option key={unit.id} value={unit.name}>{unit.name}</option>))}
                          </select>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          {/* Cột trống - không có quy đổi cho ĐVT gốc */}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="text" name="retailPrice" value={formatNumberWithCommas(formData.retailPrice)} onChange={handlePriceInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="text" name="weight" value={formData.weightInput !== undefined ? formData.weightInput : formatNumberPrecision(formData.weight, 2)} onChange={handleWeightInputChange} onBlur={handleWeightInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.00" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="text" name="volume" value={formData.volumeInput !== undefined ? formData.volumeInput : formatFixed4(formData.volume)} onChange={handleVolumeInputChange} onBlur={handleVolumeInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.0000" />
                        </td>
                      </tr>
                      {/* ĐVT 1 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>ĐVT 1</label>
                          </div>
                          <select name="unit1" value={formData.unit1 || ''} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                            <option value="">Chọn đơn vị tính 1</option>
                            {units.map(unit => (<option key={unit.id} value={unit.name}>{unit.name}</option>))}
                          </select>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 1</label>
                          </div>
                          <input type="number" name="conversion1" value={formData.conversion1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giá bán lẻ 1</label>
                          </div>
                          <input type="text" name="retailPrice1" value={formatNumberWithCommas(formData.retailPrice1)} onChange={handlePriceInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 1</label>
                          </div>
                          <input type="text" name="weight1" value={formData.weight1Input !== undefined ? formData.weight1Input : formatNumberPrecision(formData.weight1, 2)} onChange={handleWeightInputChange} onBlur={handleWeightInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.00" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 1</label>
                          </div>
                          <input type="text" name="volume1" value={formData.volume1Input !== undefined ? formData.volume1Input : formatFixed4(formData.volume1)} onChange={handleVolumeInputChange} onBlur={handleVolumeInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.0000" />
                        </td>
                      </tr>
                      {/* ĐVT 2 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>ĐVT 2</label>
                          </div>
                          <select ref={unit2Ref} name="unit2" value={formData.unit2 || ''} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                            <option value="">Chọn đơn vị tính 2</option>
                            {units.map(unit => (<option key={unit.id} value={unit.name}>{unit.name}</option>))}
                          </select>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 2</label>
                          </div>
                          <input type="number" name="conversion2" value={formData.conversion2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giá bán lẻ 2</label>
                          </div>
                          <input type="text" name="retailPrice2" value={formatNumberWithCommas(formData.retailPrice2)} onChange={handlePriceInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 2</label>
                          </div>
                          <input type="text" name="weight2" value={formData.weight2Input !== undefined ? formData.weight2Input : formatNumberPrecision(formData.weight2, 2)} onChange={handleWeightInputChange} onBlur={handleWeightInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.00" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 2</label>
                          </div>
                          <input type="text" name="volume2" value={formData.volume2Input !== undefined ? formData.volume2Input : formatFixed4(formData.volume2)} onChange={handleVolumeInputChange} onBlur={handleVolumeInputBlur} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0.0000" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ĐVT mặc định và Ghi chú (Ghi chú thay chỗ Tồn tối thiểu/Chiết khấu) */}
              {/* ĐVT mặc định và Ghi chú - note sẽ mở rộng ngang bằng phần còn lại của modal */}
              <div style={{ display: 'grid', gridTemplateColumns: '156px 1fr', gap: '0px', marginBottom: '12px', alignItems: 'start' }}>
                <div style={{ padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>ĐVT mặc định <span style={{ color: 'red' }}>*</span></label>
                    <select name="defaultUnit" value={formData.defaultUnit || ''} onChange={handleInputChange} required style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <option value="">Chọn ĐVT</option>
                      {formData.baseUnit && (
                        <option value={formData.baseUnit}>ĐVT Gốc ({formData.baseUnit})</option>
                      )}
                      {formData.unit1 && (
                        <option value={formData.unit1}>ĐVT 1 ({formData.unit1})</option>
                      )}
                      {formData.unit2 && (
                        <option value={formData.unit2}>ĐVT 2 ({formData.unit2})</option>
                      )}
                    </select>
                  </div>
                </div>
                <div style={{ padding: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Ghi chú</label>
                  <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2" placeholder="Ghi chú" style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }} />
                </div>
              </div>

              {/* Khuyến mãi removed per request */}

              {/* Hình ảnh hàng hóa */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Hình ảnh hàng hóa</label>
                <div style={{ border: '1px dashed #d9d9d9', borderRadius: '4px', padding: '20px', textAlign: 'center', background: '#fafafa' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1890ff' }}>
                    <span style={{ fontSize: '24px' }}>📷</span>
                    <span style={{ fontSize: '13px' }}>Click hoặc di chuyển file vào khung</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Trạng thái */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.status === 'inactive'} onChange={(e) => setFormData({...formData, status: e.target.checked ? 'inactive' : 'active'})} style={{ width: '16px', height: '16px' }} />
                  <span>Ngưng hoạt động</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e8e8e8' }}>
                <button type="submit" disabled={loading} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '500', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  💾 {editingItem ? 'Lưu' : 'Lưu'}
                </button>
                {!editingItem && (
                  <button type="button" onClick={handleSaveCopy} disabled={loading} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '500', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                    📋 Lưu Copy
                  </button>
                )}
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '500', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  ❌ Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Loại Hàng */}
      {showCategoryModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', zIndex: 100000 }}>
            <div className="modal-header">
              <h3>THÔNG TIN LOẠI HÀNG</h3>
              <button className="close-btn" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddCategory} style={{ padding: '0 8px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Mã loại <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="code"
                  value={categoryForm.code}
                  onChange={handleCategoryInputChange}
                  placeholder="Nhập mã loại"
                  required
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Tên loại <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryInputChange}
                  placeholder="Nhập tên loại"
                  required
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="noGroupOrder"
                    checked={categoryForm.noGroupOrder}
                    onChange={(e) => setCategoryForm({...categoryForm, noGroupOrder: e.target.checked})}
                    style={{ width: '16px', height: '16px' }} 
                  />
                  <span>Không cập đơn hàng</span>
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Ghi chú</label>
                <textarea
                  name="note"
                  value={categoryForm.note}
                  onChange={handleCategoryInputChange}
                  rows="3"
                  placeholder="Ghi chú"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e8e8e8' }}>
                <button type="submit" disabled={loading} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '500', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                  💾 Lưu lại
                </button>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '500', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  ❌ Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
