import React, { useState } from 'react';

/**
 * Pagination Component - Phân trang tái sử dụng
 * @param {number} currentPage - Trang hiện tại
 * @param {function} setCurrentPage - Hàm set trang hiện tại
 * @param {number} itemsPerPage - Số dòng mỗi trang
 * @param {function} setItemsPerPage - Hàm set số dòng mỗi trang
 * @param {number} totalItems - Tổng số items
 * @param {number} startIndex - Index bắt đầu
 * @param {number} endIndex - Index kết thúc
 */
export const Pagination = ({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  startIndex,
  endIndex
}) => {
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 0',
      borderTop: '1px solid #e0e0e0',
      marginTop: '8px'
    }}>
      <div style={{ color: '#6c757d', fontSize: '14px' }}>
        Dòng {startIndex + 1}-{Math.min(endIndex, totalItems)} trên tổng {totalItems} dòng
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
  );
};
