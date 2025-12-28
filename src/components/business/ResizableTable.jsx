import React, { useState, useRef } from 'react';

const ResizableTable = () => {
  const [colWidths, setColWidths] = useState({
    barcode: 150,
    productCode: 150,
    productName: 200,
    unit: 100,
    quantity: 100
  });

  const handleMouseDown = (colKey, e) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = colWidths[colKey];
    
    const handleMouseMove = (e) => {
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🧪 Resizable Table Test</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <colgroup>
          <col style={{ width: `${colWidths.barcode}px` }} />
          <col style={{ width: `${colWidths.productCode}px` }} />
          <col style={{ width: `${colWidths.productName}px` }} />
          <col style={{ width: `${colWidths.unit}px` }} />
          <col style={{ width: `${colWidths.quantity}px` }} />
        </colgroup>
        <thead>
          <tr>
            <th 
              style={{ 
                border: '1px solid #ccc', 
                background: '#f0f0f0', 
                cursor: 'col-resize',
                userSelect: 'none',
                padding: '8px'
              }}
              onMouseDown={(e) => handleMouseDown('barcode', e)}
            >
              Mã vạch ({colWidths.barcode}px)
            </th>
            <th 
              style={{ 
                border: '1px solid #ccc', 
                background: '#f0f0f0', 
                cursor: 'col-resize',
                userSelect: 'none',
                padding: '8px'
              }}
              onMouseDown={(e) => handleMouseDown('productCode', e)}
            >
              Mã hàng ({colWidths.productCode}px)
            </th>
            <th 
              style={{ 
                border: '1px solid #ccc', 
                background: '#f0f0f0', 
                cursor: 'col-resize',
                userSelect: 'none',
                padding: '8px'
              }}
              onMouseDown={(e) => handleMouseDown('productName', e)}
            >
              Hàng hóa ({colWidths.productName}px)
            </th>
            <th 
              style={{ 
                border: '1px solid #ccc', 
                background: '#f0f0f0', 
                cursor: 'col-resize',
                userSelect: 'none',
                padding: '8px'
              }}
              onMouseDown={(e) => handleMouseDown('unit', e)}
            >
              Đơn vị ({colWidths.unit}px)
            </th>
            <th 
              style={{ 
                border: '1px solid #ccc', 
                background: '#f0f0f0', 
                cursor: 'col-resize',
                userSelect: 'none',
                padding: '8px'
              }}
              onMouseDown={(e) => handleMouseDown('quantity', e)}
            >
              Số lượng ({colWidths.quantity}px)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>123456789</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>SP001</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Sản phẩm test</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Cái</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>10</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ResizableTable;