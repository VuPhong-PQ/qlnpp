import React, { useState, useRef, useEffect } from 'react';
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
  const itemsPerPage = 10;
  
  // Context menu (chuột phải)
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  
  // Checkbox chọn nhiều
  const [selectedRows, setSelectedRows] = useState([]);

  // Load data from API
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
  }, []);

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
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingItem) {
        const dataToUpdate = { ...formData, id: editingItem.id };
        await api.put(API_ENDPOINTS.products, editingItem.id, dataToUpdate);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await api.post(API_ENDPOINTS.products, formData);
        alert('Thêm sản phẩm thành công!');
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
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
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

  const filteredProducts = applyFilters(products, searchTerm, ['code', 'name', 'barcode', 'category', 'vatName', 'baseUnit']);
  
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
  const {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  } = useExcelImportExport({
    data: products,
    loadData: fetchProducts,
    apiPost: (data) => api.post(API_ENDPOINTS.products, data),
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
    onImportComplete: () => setLoading(false)
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
    { key: 'unit3', label: 'ĐVT3' },
    { key: 'unit4', label: 'ĐVT4' },
    { key: 'defaultUnit', label: 'ĐVT mặc định' },
    { key: 'conversion1', label: 'Quy đổi 1' },
    { key: 'conversion2', label: 'Quy đổi 2' },
    { key: 'conversion3', label: 'Quy đổi 3' },
    { key: 'conversion4', label: 'Quy đổi 4' },
    { key: 'importPrice', label: 'Giá nhập' },
    { key: 'importPrice1', label: 'Giá nhập1' },
    { key: 'importPrice2', label: 'Giá nhập2' },
    { key: 'importPrice3', label: 'Giá nhập3' },
    { key: 'importPrice4', label: 'Giá nhập4' },
    { key: 'retailPrice', label: 'Giá bán lẻ' },
    { key: 'retailPrice1', label: 'Giá bán lẻ1' },
    { key: 'retailPrice2', label: 'Giá bán lẻ2' },
    { key: 'retailPrice3', label: 'Giá bán lẻ3' },
    { key: 'retailPrice4', label: 'Giá bán lẻ4' },
    { key: 'retailDiscount1', label: 'Giảm bán lẻ 1' },
    { key: 'retailDiscount2', label: 'Giảm bán lẻ 2' },
    { key: 'retailDiscount3', label: 'Giảm bán lẻ 3' },
    { key: 'retailDiscount4', label: 'Giảm bán lẻ 4' },
    { key: 'wholesalePrice', label: 'Giá bán sỉ' },
    { key: 'wholesalePrice1', label: 'Giá bán sỉ1' },
    { key: 'wholesalePrice2', label: 'Giá bán sỉ2' },
    { key: 'wholesalePrice3', label: 'Giá bán sỉ3' },
    { key: 'wholesalePrice4', label: 'Giá bán sỉ4' },
    { key: 'wholesaleDiscount1', label: 'Giảm bán sỉ 1' },
    { key: 'wholesaleDiscount2', label: 'Giảm bán sỉ 2' },
    { key: 'wholesaleDiscount3', label: 'Giảm bán sỉ 3' },
    { key: 'wholesaleDiscount4', label: 'Giảm bán sỉ 4' },
    { key: 'weight', label: 'Số Kg' },
    { key: 'weight1', label: 'Số Kg1' },
    { key: 'weight2', label: 'Số Kg2' },
    { key: 'weight3', label: 'Số Kg3' },
    { key: 'weight4', label: 'Số Kg4' },
    { key: 'volume', label: 'Số khối' },
    { key: 'volume1', label: 'Số khối1' },
    { key: 'volume2', label: 'Số khối2' },
    { key: 'volume3', label: 'Số khối3' },
    { key: 'volume4', label: 'Số khối4' },
    { key: 'shippingFee', label: 'Phí vận chuyển' },
    { key: 'shippingFee1', label: 'Phí vận chuyển1' },
    { key: 'shippingFee2', label: 'Phí vận chuyển2' },
    { key: 'shippingFee3', label: 'Phí vận chuyển3' },
    { key: 'shippingFee4', label: 'Phí vận chuyển4' },
    { key: 'minStock', label: 'Tồn tối thiểu' },
    { key: 'discount', label: 'Chiết khấu' },
    { key: 'note', label: 'Ghi chú' },
    { key: 'promotion', label: 'Khuyến mãi' },
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
        <div style={{ 
          marginTop: '12px',
          padding: '8px 16px',
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '4px',
          display: 'inline-block',
          fontSize: '14px',
          color: '#0050b3',
          fontWeight: 500
        }}>
          Tổng {products.length > 0 ? products.length.toLocaleString('vi-VN') : 0} sản phẩm
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
                      {col.key !== 'actions' && col.key !== 'select' && renderFilterPopup(col.key, col.label)}
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
                  onContextMenu={(e) => handleContextMenu(e, product)}
                  style={{ cursor: 'context-menu' }}
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
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} trong tổng số {filteredProducts.length} bản ghi
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  background: currentPage === 1 ? '#f5f5f5' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                ⏮ Đầu
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  background: currentPage === 1 ? '#f5f5f5' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                ◀ Trước
              </button>
              <span style={{ padding: '0 12px', color: '#333' }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                Sau ▶
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                Cuối ⏭
              </button>
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

      {/* Modal Thêm Loại Hàng */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
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
                        <option key={cat.id} value={cat.code}>{cat.name}</option>
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

              {/* Tên hàng */}
              <div style={{ marginBottom: '12px' }}>
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

              {/* Tên hàng VAT */}
              <div style={{ marginBottom: '12px' }}>
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

              {/* Mô tả */}
              <div style={{ marginBottom: '12px' }}>
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

              {/* HSD */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>HSD (Tháng)</label>
                <input
                  type="number"
                  step="0.1"
                  name="shelfLife"
                  value={formData.shelfLife}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{ width: '180px', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>

              {/* Bảng ĐVT */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#333' }}>ĐVT gốc</label>
                <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>ĐVT</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Giá nhập</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Giá bán lẻ</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Giá bán sỉ</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '100px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Số Kg</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '100px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Số khối</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'left', width: '140px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Tiền vận chuyển</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ĐVT gốc */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <select name="baseUnit" value={formData.baseUnit} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                            <option value="">Chọn ĐVT</option>
                            {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                          </select>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" name="importPrice" value={formData.importPrice} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" name="retailPrice" value={formData.retailPrice} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" step="0.001" name="volume" value={formData.volume} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <input type="number" name="shippingFee" value={formData.shippingFee} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                      </tr>
                      {/* ĐVT 1 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', minWidth: '35px' }}>ĐVT 1</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <select name="unit1" value={formData.unit1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                              <option value="">Chọn đơn vị tính 1</option>
                              {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                            </select>
                            <input type="number" name="conversion1" value={formData.conversion1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Quy đổi 1" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 1</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="importPrice1" value={formData.importPrice1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="retailDiscount1" value={formData.retailDiscount1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm lẻ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán lẻ 1</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="retailPrice1" value={formData.retailPrice1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#f5f5f5' }} placeholder="0" disabled />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán sỉ 1</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="wholesalePrice1" value={formData.wholesalePrice1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="wholesaleDiscount1" value={formData.wholesaleDiscount1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm sỉ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 1</label>
                          </div>
                          <input type="number" step="0.01" name="weight1" value={formData.weight1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 1</label>
                          </div>
                          <input type="number" step="0.001" name="volume1" value={formData.volume1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Tiền vận chuyển 1</label>
                          </div>
                          <input type="number" name="shippingFee1" value={formData.shippingFee1} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                      </tr>
                      {/* ĐVT 2 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', minWidth: '35px' }}>ĐVT 2</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <select name="unit2" value={formData.unit2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                              <option value="">Chọn đơn vị tính 2</option>
                              {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                            </select>
                            <input type="number" name="conversion2" value={formData.conversion2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Quy đổi 2" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 2</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="importPrice2" value={formData.importPrice2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="retailDiscount2" value={formData.retailDiscount2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm lẻ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán lẻ 2</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="retailPrice2" value={formData.retailPrice2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#f5f5f5' }} placeholder="0" disabled />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán sỉ 2</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="wholesalePrice2" value={formData.wholesalePrice2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="wholesaleDiscount2" value={formData.wholesaleDiscount2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm sỉ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 2</label>
                          </div>
                          <input type="number" step="0.01" name="weight2" value={formData.weight2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 2</label>
                          </div>
                          <input type="number" step="0.001" name="volume2" value={formData.volume2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Tiền vận chuyển 2</label>
                          </div>
                          <input type="number" name="shippingFee2" value={formData.shippingFee2} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                      </tr>
                      {/* ĐVT 3 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', minWidth: '35px' }}>ĐVT 3</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <select name="unit3" value={formData.unit3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                              <option value="">Chọn đơn vị tính 3</option>
                              {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                            </select>
                            <input type="number" name="conversion3" value={formData.conversion3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Quy đổi 3" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 3</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="importPrice3" value={formData.importPrice3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="retailDiscount3" value={formData.retailDiscount3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm lẻ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán lẻ 3</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="retailPrice3" value={formData.retailPrice3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#f5f5f5' }} placeholder="0" disabled />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán sỉ 3</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="wholesalePrice3" value={formData.wholesalePrice3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="wholesaleDiscount3" value={formData.wholesaleDiscount3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm sỉ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 3</label>
                          </div>
                          <input type="number" step="0.01" name="weight3" value={formData.weight3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 3</label>
                          </div>
                          <input type="number" step="0.001" name="volume3" value={formData.volume3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Tiền vận chuyển 3</label>
                          </div>
                          <input type="number" name="shippingFee3" value={formData.shippingFee3} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                      </tr>
                      {/* ĐVT 4 */}
                      <tr style={{ background: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', minWidth: '35px' }}>ĐVT 4</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <select name="unit4" value={formData.unit4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                              <option value="">Chọn đơn vị tính 4</option>
                              {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                            </select>
                            <input type="number" name="conversion4" value={formData.conversion4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Quy đổi 4" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Quy đổi 4</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="importPrice4" value={formData.importPrice4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="retailDiscount4" value={formData.retailDiscount4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm lẻ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán lẻ 4</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="retailPrice4" value={formData.retailPrice4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#f5f5f5' }} placeholder="0" disabled />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Giảm bán sỉ 4</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="number" name="wholesalePrice4" value={formData.wholesalePrice4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                            <input type="number" name="wholesaleDiscount4" value={formData.wholesaleDiscount4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" title="Giảm sỉ" />
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số Kg 4</label>
                          </div>
                          <input type="number" step="0.01" name="weight4" value={formData.weight4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Số khối 4</label>
                          </div>
                          <input type="number" step="0.001" name="volume4" value={formData.volume4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666', display: 'block', marginBottom: '4px' }}>Tiền vận chuyển 4</label>
                          </div>
                          <input type="number" name="shippingFee4" value={formData.shippingFee4} onChange={handleInputChange} style={{ width: '100%', padding: '7px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} placeholder="0" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ĐVT mặc định, Tồn tối thiểu, Chiết khấu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>ĐVT mặc định</label>
                  <select name="defaultUnit" value={formData.defaultUnit} onChange={handleInputChange} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                    <option value="">Chọn ĐVT</option>
                    {units.map(unit => (<option key={unit.id} value={unit.code}>{unit.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Tồn tối thiểu</label>
                  <input type="number" name="minStock" value={formData.minStock} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Chiết khấu</label>
                  <input type="number" step="0.1" name="discount" value={formData.discount} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Ghi chú và Khuyến mãi */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Ghi chú</label>
                <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2" placeholder="Ghi chú" style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Khuyến mãi</label>
                <textarea name="promotion" value={formData.promotion} onChange={handleInputChange} rows="2" placeholder="Khuyến mãi" style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }} />
              </div>

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
    </div>
  );
};

export default Products;
