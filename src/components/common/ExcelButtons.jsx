import React from 'react';

/**
 * Excel Import/Export Button Group Component
 * @param {Object} props
 * @param {Function} props.onExport - Export handler
 * @param {Function} props.onImport - Import handler  
 * @param {Function} props.onFileChange - File change handler
 * @param {React.Ref} props.fileInputRef - File input ref
 * @param {Boolean} props.disabled - Disable buttons
 */
export const ExcelButtons = ({ onExport, onImport, onFileChange, fileInputRef, disabled = false }) => {
  return (
    <>
      <button 
        className="btn btn-success" 
        onClick={onExport}
        disabled={disabled}
        title="Xuất dữ liệu ra file Excel"
      >
        📤 Export Excel
      </button>
      <button 
        className="btn btn-secondary" 
        onClick={onImport}
        disabled={disabled}
        title="Nhập dữ liệu từ file Excel"
      >
        📥 Import Excel
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={onFileChange}
      />
    </>
  );
};
