import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

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
        { name: 'Nhà cung cấp', path: '/setup/suppliers' }
      ]
    },
    {
      id: 'business',
      title: 'Quản lý nghiệp vụ',
      icon: '💼',
      items: [
        { name: 'Bảng báo giá', path: '/business/quotes' },
        { name: 'Đặt hàng NCC', path: '/business/purchase-orders' },
        { name: 'Nhập hàng', path: '/business/imports' },
        { name: 'Chuyển kho', path: '/business/transfers' },
        { name: 'Bán hàng', path: '/business/sales' },
        { name: 'Phiếu thu', path: '/business/receipts' },
        { name: 'Phiếu chi', path: '/business/payments' },
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
                  <Link 
                    key={index} 
                    to={item.path}
                    className={`dropdown-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="header-user">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
