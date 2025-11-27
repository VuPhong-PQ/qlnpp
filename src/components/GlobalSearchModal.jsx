import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeVietnameseTones } from '../utils/searchUtils';
import './GlobalSearchModal.css';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🔍' },
    { id: 'products', name: 'Hàng hóa', icon: '📦' },
    { id: 'customers', name: 'Khách hàng', icon: '👥' },
    { id: 'suppliers', name: 'Nhà cung cấp', icon: '🏢' },
    { id: 'orders', name: 'Đơn hàng', icon: '📋' },
    { id: 'warehouses', name: 'Kho hàng', icon: '🏪' },
  ];

  // Mock data - trong thực tế sẽ gọi API
  const mockData = {
    products: [
      { id: 1, code: 'B936211162345', name: 'S2 Xúc xích định dưỡng S2 SIUML LY THẢO HỦC bột tác phơi mai Bắp Caramel', category: 'products', path: '/setup/products' },
      { id: 2, code: 'B936211626642', name: 'S2 Xúc xích định dưỡng SIUML Vi Sườn Hầm Bắp Ngọt', category: 'products', path: '/setup/products' },
      { id: 3, code: 'B936211626635', name: 'S2 Xúc xích định dưỡng SIUML Vi Cà Cay', category: 'products', path: '/setup/products' },
      { id: 4, code: 'B936211627397', name: 'S2 JOY Xúc xích định dưỡng Ngon', category: 'products', path: '/setup/products' },
      { id: 5, code: 'B936211627175', name: 'S2 Xúc xích định dưỡng R2 SIU BIỆP vị Bò hầm', category: 'products', path: '/setup/products' },
      { id: 6, code: 'B936211626963', name: 'S2 JOY Xúc Xích Định Dưỡng Bắp Ngon', category: 'products', path: '/setup/products' },
    ],
    customers: [
      { id: 1, code: 'KH001', name: 'Công ty TNHH ABC', category: 'customers', path: '/setup/customers' },
      { id: 2, code: 'KH002', name: 'Khách hàng XYZ', category: 'customers', path: '/setup/customers' },
    ],
    suppliers: [
      { id: 1, code: 'NCC001', name: 'Nhà cung cấp Thực phẩm A', category: 'suppliers', path: '/setup/suppliers' },
    ],
    orders: [
      { id: 1, code: 'DH001', name: 'Đơn hàng ngày 20/11/2025', category: 'orders', path: '/business/sales/order-management' },
    ],
    warehouses: [
      { id: 1, code: 'KHO01', name: 'Kho chính', category: 'warehouses', path: '/setup/warehouses' },
    ],
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
    let filtered = [];

    if (selectedCategory === 'all') {
      Object.values(mockData).forEach(categoryData => {
        filtered = [...filtered, ...categoryData];
      });
    } else {
      filtered = mockData[selectedCategory] || [];
    }

    const searchResults = filtered.filter(item => {
      const normalizedName = removeVietnameseTones(item.name.toLowerCase());
      const normalizedCode = removeVietnameseTones(item.code.toLowerCase());
      return normalizedName.includes(normalizedSearch) || normalizedCode.includes(normalizedSearch);
    });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [searchTerm, selectedCategory]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectResult = (result) => {
    navigate(result.path);
    onClose();
    setSearchTerm('');
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  const highlightText = (text, search) => {
    if (!search) return text;
    const normalizedText = removeVietnameseTones(text.toLowerCase());
    const normalizedSearch = removeVietnameseTones(search.toLowerCase());
    const index = normalizedText.indexOf(normalizedSearch);
    
    if (index === -1) return text;
    
    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + search.length);
    const afterMatch = text.substring(index + search.length);
    
    return (
      <>
        {beforeMatch}
        <mark style={{ background: '#fff59d', padding: '0 2px', borderRadius: '2px' }}>{match}</mark>
        {afterMatch}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Tìm kiếm hàng hóa, khách hàng, đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="search-results">
          {searchTerm && results.length === 0 && (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>Không tìm thấy kết quả</p>
            </div>
          )}
          
          {results.length > 0 && (
            <>
              <div className="results-header">
                <button className="view-all-btn">
                  Xem tất cả
                  <span className="result-count">{results.length}</span>
                </button>
                <button className="search-btn">
                  🔍 Tìm
                </button>
              </div>
              
              <div className="results-list">
                {results.map((result, index) => (
                  <div
                    key={`${result.category}-${result.id}`}
                    className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <input 
                      type="checkbox" 
                      className="result-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="result-content">
                      <div className="result-code">{result.code}</div>
                      <div className="result-name">{highlightText(result.name, searchTerm)}</div>
                      <div className="result-meta">
                        <span className="result-category">{getCategoryName(result.category)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="search-footer">
          <div className="keyboard-shortcuts">
            <span className="shortcut">
              <kbd>↑</kbd><kbd>↓</kbd> Di chuyển
            </span>
            <span className="shortcut">
              <kbd>Enter</kbd> Chọn
            </span>
            <span className="shortcut">
              <kbd>Esc</kbd> Đóng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
