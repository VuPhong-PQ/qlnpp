import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeVietnameseTones } from '../utils/searchUtils';
import { API_ENDPOINTS, api } from '../config/api';
import './Header.css';

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Load all products khi component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get(API_ENDPOINTS.products);
        setAllProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Tìm kiếm khi searchTerm thay đổi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
    const filtered = allProducts.filter(product => {
      const normalizedName = removeVietnameseTones(product.name?.toLowerCase() || '');
      const normalizedCode = removeVietnameseTones(product.code?.toLowerCase() || '');
      const normalizedBarcode = removeVietnameseTones(product.barcode?.toLowerCase() || '');
      
      return normalizedName.includes(normalizedSearch) || 
             normalizedCode.includes(normalizedSearch) ||
             normalizedBarcode.includes(normalizedSearch);
    });

    setSearchResults(filtered.slice(0, 50)); // Giới hạn 50 kết quả
  }, [searchTerm, allProducts]);

  const handleCheckboxChange = (productId) => {
    setSelectedItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSearch = () => {
    if (selectedItems.length > 0) {
      // Lưu danh sách ID đã chọn vào localStorage
      localStorage.setItem('selectedProductIds', JSON.stringify(selectedItems));
      // Chuyển đến trang Products
      navigate('/setup/products');
      // Đóng modal
      setShowSearchModal(false);
      setSearchTerm('');
      setSelectedItems([]);
    }
  };

  const handleCloseModal = () => {
    setShowSearchModal(false);
    setSearchTerm('');
    setSelectedItems([]);
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Trang chủ',
      icon: '🏠',
      items: [
        { name: 'Dashboard', path: '/dashboard' }
      ]
    },
    {
      id: 'setup',
      title: 'Thiết lập ban đầu',
      icon: '⚙️',
      items: [
        { name: 'Thông tin doanh nghiệp', path: '/setup/company-info' },
        { name: 'Tài khoản quỹ & Nợ ngân hàng', path: '/setup/accounts-funds' },
        { name: 'Nhóm khách hàng', path: '/setup/customer-groups' },
        { name: 'Khách hàng', path: '/setup/customers' },
        { name: 'Nhà cung cấp', path: '/setup/suppliers' },
        { name: 'Danh sách loại hàng', path: '/setup/product-categories' },
        { name: 'Danh sách hàng hóa', path: '/setup/products' },
        { name: 'Danh sách đơn vị tính', path: '/setup/units' },
        { name: 'Nội dung thu, chi, xuất, nhập', path: '/setup/transaction-contents' },
        { name: 'Danh sách kho hàng', path: '/setup/warehouses' },
        { name: 'Khai báo xe', path: '/setup/vehicles' }
      ]
    },
    {
      id: 'business',
      title: 'Quản lý nghiệp vụ',
      icon: '💼',
      items: [
        { name: 'Bảng báo giá', path: '/business/quotation-table' },
        { name: 'Nhập hàng', path: '/business/import-goods' },
        { name: 'Chuyển kho', path: '/business/warehouse-transfer' },
        { 
          name: 'Bán hàng', 
          path: '/business/sales',
          submenu: [
            { name: 'Tạo đơn hàng', path: '/business/sales/create-order' },
            { name: 'Quản lý đơn hàng', path: '/business/sales/order-management' },
            { name: 'In đơn hàng', path: '/business/sales/print-order' },
            { name: 'In đơn hàng theo xe', path: '/business/sales/print-order-by-vehicle' }
          ]
        },
        { name: 'Phiếu thu', path: '/business/accounting/receipt-voucher' },
        { name: 'Phiếu chi', path: '/business/accounting/expense-voucher' },
        { name: 'Tính giá vốn', path: '/business/cost-calculation' },
        { name: 'Xuất kho', path: '/business/exports' },
        { name: 'Điều chỉnh kho', path: '/business/adjustments' },
        { name: 'Khách trả hàng', path: '/business/returns' }
      ]
    },
    {
      id: 'reports',
      title: 'Báo cáo thống kê',
      icon: '📊',
      items: [
        { name: 'Báo cáo bán hàng', path: '/reports/sales' },
        { name: 'Báo cáo tồn kho', path: '/reports/inventory' },
        { name: 'Báo cáo tài chính', path: '/reports/financial' }
      ]
    },
    {
      id: 'permissions',
      title: 'Phân quyền',
      icon: '🔐',
      items: [
        { name: 'Quản lý vai trò', path: '/permissions/roles' },
        { name: 'Phân quyền người dùng', path: '/permissions/users' }
      ]
    }
  ];

  const handleMouseEnter = (menuId) => {
    setActiveDropdown(menuId);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-brand">
        <Link to="/" className="brand-link">
          <div className="brand-icon">✓</div>
          <span className="brand-text">Quản Lý Nhà Phân Phối</span>
        </Link>
      </div>
      
      <nav className="header-nav">
        {menuItems.map((menu) => (
          <div
            key={menu.id}
            className={`nav-item ${activeDropdown === menu.id ? 'active' : ''}`}
            onMouseEnter={() => handleMouseEnter(menu.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="nav-link">
              <span className="nav-icon">{menu.icon}</span>
              <span className="nav-text">{menu.title}</span>
              {menu.items.length > 1 && <span className="dropdown-arrow">▼</span>}
            </div>
            
            {activeDropdown === menu.id && (
              <div className="dropdown-menu">
                {menu.items.map((item, index) => (
                  item.submenu ? (
                    <div key={index} className="dropdown-submenu">
                      <div className="dropdown-item-header">{item.name}</div>
                      <div className="submenu-items">
                        {item.submenu.map((subitem, subindex) => (
                          <Link 
                            key={subindex} 
                            to={subitem.path}
                            className={`dropdown-item submenu-item ${isActiveRoute(subitem.path) ? 'active' : ''}`}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      key={index} 
                      to={item.path}
                      className={`dropdown-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="header-actions">
        <button 
          className="search-icon-btn"
          onClick={() => setShowSearchModal(true)}
          title="Tìm kiếm"
        >
          🔍
        </button>
      </div>

      <div className="header-user">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">admin</span>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <>
          <div className="search-modal-overlay" onClick={handleCloseModal} />
          <div className="global-search-modal">
            <div className="search-modal-header">
              <input
                type="text"
                className="search-modal-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <button className="search-modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="search-modal-results">
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <div key={product.id} className="search-result-item">
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(product.id)}
                      onChange={() => handleCheckboxChange(product.id)}
                    />
                    <div className="result-content">
                      <div className="result-code">
                        {product.barcode || product.code}
                      </div>
                      <div className="result-name">{product.name}</div>
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="search-empty">Không tìm thấy sản phẩm</div>
              ) : (
                <div className="search-empty">Nhập từ khóa để tìm kiếm...</div>
              )}
            </div>

            <div className="search-modal-footer">
              <button className="btn-view-all" onClick={handleCloseModal}>
                Xem tất cả
              </button>
              <button 
                className="btn-search-primary"
                onClick={handleSearch}
                disabled={selectedItems.length === 0}
              >
                🔍 Tìm ({selectedItems.length})
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
