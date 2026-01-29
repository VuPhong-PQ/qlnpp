import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

// Hàm xóa dấu tiếng Việt để tìm kiếm
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const SearchableSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Chọn...', 
  className = '',
  valueKey = 'value',
  labelKey = 'label'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Get display label for current value
  const getDisplayLabel = () => {
    if (!value) return '';
    const selected = options.find(opt => {
      const optValue = typeof opt === 'string' ? opt : opt[valueKey];
      return optValue === value;
    });
    if (selected) {
      return typeof selected === 'string' ? selected : selected[labelKey];
    }
    return value;
  };

  // Filter options based on search term (support Vietnamese without diacritics)
  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt[labelKey];
    const searchNormalized = removeVietnameseTones(searchTerm);
    const labelNormalized = removeVietnameseTones(label);
    return labelNormalized.includes(searchNormalized);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    const optValue = typeof opt === 'string' ? opt : opt[valueKey];
    onChange({ target: { value: optValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '' } });
    setSearchTerm('');
  };

  return (
    <div className={`searchable-select ${className}`} ref={containerRef}>
      <div 
        className={`searchable-select-control ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="searchable-select-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`searchable-select-value ${!value ? 'placeholder' : ''}`}>
            {value ? getDisplayLabel() : placeholder}
          </span>
        )}
        <div className="searchable-select-indicators">
          {value && (
            <span className="searchable-select-clear" onClick={handleClear}>
              ×
            </span>
          )}
          <span className="searchable-select-arrow">▼</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="searchable-select-menu">
          <div 
            className="searchable-select-option"
            onClick={() => handleSelect({ [valueKey]: '', [labelKey]: placeholder })}
          >
            {placeholder}
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => {
              const optValue = typeof opt === 'string' ? opt : opt[valueKey];
              const optLabel = typeof opt === 'string' ? opt : opt[labelKey];
              return (
                <div
                  key={optValue || index}
                  className={`searchable-select-option ${optValue === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {optLabel}
                </div>
              );
            })
          ) : (
            <div className="searchable-select-no-options">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
