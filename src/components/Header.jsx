import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeVietnameseTones } from '../utils/searchUtils';
import { API_ENDPOINTS, api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, canView } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Ensure global CSS variable for header size is set so page content can offset correctly
  useEffect(() => {
    function setHeaderSize() {
      try {
        const el = document.querySelector('.header');
        if (el) {
          const rect = el.getBoundingClientRect();
          document.documentElement.style.setProperty('--global-header-height', `${rect.height}px`);
          document.documentElement.style.setProperty('--global-header-bottom', `${rect.bottom}px`);
        } else {
          document.documentElement.style.setProperty('--global-header-height', '60px');
          document.documentElement.style.setProperty('--global-header-bottom', '60px');
        }
      } catch (e) {
        // ignore
      }
    }

    setHeaderSize();
    window.addEventListener('resize', setHeaderSize);
    const t = setTimeout(setHeaderSize, 300);
    // Use ResizeObserver to detect header size changes (helps when user zooms)
    let ro;
    try {
      const el = document.querySelector('.header');
      if (el && window.ResizeObserver) {
        ro = new ResizeObserver(() => setHeaderSize());
        ro.observe(el);
      }
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('resize', setHeaderSize);
      clearTimeout(t);
      try { if (ro && ro.disconnect) ro.disconnect(); } catch (e) {}
    };
  }, []);

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
        { name: 'Dashboard', path: '/dashboard', resourceKey: 'dashboard' }
      ]
    },
    {
      id: 'setup',
      title: 'Thiết lập ban đầu',
      icon: '⚙️',
      items: [
        { name: 'Thông tin doanh nghiệp', path: '/setup/company-info', resourceKey: 'company_info' },
        { name: 'Tài khoản quỹ & Nợ ngân hàng', path: '/setup/accounts-funds', resourceKey: 'accounts_funds' },
        { name: 'Nhóm khách hàng', path: '/setup/customer-groups', resourceKey: 'customer_groups' },
        { name: 'Khách hàng', path: '/setup/customers', resourceKey: 'customers' },
        { name: 'Nhà cung cấp', path: '/setup/suppliers', resourceKey: 'suppliers' },
        { name: 'Danh sách loại hàng', path: '/setup/product-categories', resourceKey: 'product_categories' },
        { name: 'Danh sách hàng hóa', path: '/setup/products', resourceKey: 'products' },
        { name: 'Danh sách đơn vị tính', path: '/setup/units', resourceKey: 'units' },
        { name: 'Nội dung thu, chi, xuất, nhập', path: '/setup/transaction-contents', resourceKey: 'transaction_contents' },
        { name: 'Danh sách kho hàng', path: '/setup/warehouses', resourceKey: 'warehouses' },
        { name: 'Khai báo xe', path: '/setup/vehicles', resourceKey: 'vehicles' }
      ]
    },
    {
      id: 'business',
      title: 'Quản lý nghiệp vụ',
      icon: '💼',
      items: [
        { name: 'Bảng báo giá', path: '/business/quotation-table', resourceKey: 'quotations' },
        { name: 'Nhập hàng', path: '/business/import-goods', resourceKey: 'imports' },
        { name: 'Xuất hàng', path: '/business/exports', resourceKey: 'exports' },
        { name: 'Chuyển kho', path: '/business/warehouse-transfer', resourceKey: 'warehouse_transfers' },
        { 
          name: 'Bán hàng', 
          path: '/business/sales',
          resourceKey: 'orders',
          submenu: [
            { name: 'Quản lý bán hàng (User)', path: '/business/sales/sale-management-by-current-user', resourceKey: 'sale_management' },
            { name: 'Quản lý bán hàng (Admin)', path: '/business/sales/sale-management', resourceKey: 'order_management' },
            { name: 'In đơn hàng', path: '/business/sales/print-order', resourceKey: 'print_order' },
            { name: 'In đơn hàng theo xe', path: '/business/sales/print-order-by-vehicle', resourceKey: 'print_order' },
            { name: 'In bảng kê tổng', path: '/business/sales/in-bang-ke-tong', resourceKey: 'orders' }
          ]
        },
        { name: 'Phiếu thu', path: '/business/accounting/receipt-voucher', resourceKey: 'receipt_voucher' },
        { name: 'Phiếu chi', path: '/business/accounting/expense-voucher', resourceKey: 'expense_voucher' },
        { name: 'Tính giá vốn', path: '/business/cost-calculation', resourceKey: 'cost_calculation' },
        
        { name: 'Điều chỉnh kho', path: '/business/adjustments', resourceKey: 'adjustments' },
        { name: 'Khách trả hàng', path: '/business/returns', resourceKey: 'returns' }
      ]
    },
    {
      id: 'reports',
      title: 'Báo cáo thống kê',
      icon: '📊',
      items: [
        { name: 'Báo cáo bán hàng', path: '/reports/sales', resourceKey: 'sales_report' },
        { name: 'Báo cáo tồn kho', path: '/reports/inventory', resourceKey: 'inventory_report' },
        { name: 'Báo cáo tài chính', path: '/reports/financial', resourceKey: 'financial_report' }
      ]
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: '🛠️',
      items: [
        { name: 'Quản lý dữ liệu', path: '/admin/manage-data', resourceKey: 'manage_data' },
        { name: 'Nhóm quyền', path: '/permissions/groups', resourceKey: 'permission_groups' },
        { name: 'Phân quyền người dùng', path: '/permissions/users', resourceKey: 'user_permissions' }
      ]
    }
  ];

  // Determine visibility based on permissions.
  const shouldShowItem = (item) => {
    // First check parent's resourceKey if it has one
    if (item.resourceKey && canView(item.resourceKey)) {
      // If has submenu, also check if at least one submenu item is visible
      if (item.submenu) {
        const visibleSub = item.submenu.filter(sub => {
          const key = sub.resourceKey;
          return !key || canView(key);
        });
        return visibleSub.length > 0;
      }
      return true;
    }

    if (item.submenu) {
      // Check if any submenu item is visible
      const visibleSub = item.submenu.filter(sub => {
        const key = sub.resourceKey;
        return !key || canView(key);
      });
      return visibleSub.length > 0;
    }

    if (item.resourceKey) {
      return canView(item.resourceKey);
    }

    // If no resourceKey defined, show by default
    return true;
  };

  // Filter submenu items by permission
  const filterSubmenuItems = (submenu) => {
    if (!submenu) return submenu;
    return submenu.filter(sub => {
      const key = sub.resourceKey;
      return !key || canView(key);
    });
  };

  const visibleMenuItems = menuItems
    .map(menu => ({
      ...menu,
      items: menu.items
        .filter(i => shouldShowItem(i))
        .map(item => ({
          ...item,
          submenu: filterSubmenuItems(item.submenu)
        })),
    }))
    .filter(menu => menu.items && menu.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        {visibleMenuItems.map((menu) => (
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

      {/* header-actions removed: using page-level search modal instead */}

      <div className="header-user">
        <div 
          className="user-info"
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{ cursor: 'pointer' }}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="user-avatar" />
          ) : (
            <span className="user-icon">👤</span>
          )}
          <span className="user-name">{user?.name || user?.username || 'Người dùng'}</span>
          <span className="dropdown-arrow">▼</span>
        </div>
        
        {showUserMenu && (
          <>
            <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)} />
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-avatar">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="user-menu-info">
                  <div className="user-menu-name">{user?.name || user?.username}</div>
                  <div className="user-menu-email">{user?.email || user?.position || ''}</div>
                </div>
              </div>
              <div className="user-menu-items">
                <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
                  <span>👤</span> Thông tin cá nhân
                </button>
                <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/change-password'); }}>
                  <span>🔑</span> Đổi mật khẩu
                </button>
                <div className="user-menu-divider"></div>
                <button className="user-menu-item logout" onClick={handleLogout}>
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}
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
