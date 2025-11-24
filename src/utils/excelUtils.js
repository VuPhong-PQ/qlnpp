import * as XLSX from 'xlsx';

/**
 * Export data to Excel file with company header
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the worksheet
 * @param {Object} companyInfo - Company information for header
 */
export const exportToExcelWithHeader = (data, filename = 'export', sheetName = 'Sheet1', companyInfo = null) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Create array of arrays for manual worksheet construction
    const wsData = [];
    
    // Add company header if provided
    if (companyInfo) {
      wsData.push([companyInfo.name || 'CÔNG TY']);
      wsData.push([companyInfo.address || '']);
      wsData.push([companyInfo.phone || '']);
      wsData.push([]); // Empty row
      wsData.push([]); // Empty row
      wsData.push([sheetName.toUpperCase()]); // Title
      wsData.push([]); // Empty row
    }
    
    // Add data headers and rows
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      wsData.push(headers);
      
      data.forEach(row => {
        const rowData = headers.map(header => row[header]);
        wsData.push(rowData);
      });
    }
    
    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Merge cells for company header
    if (companyInfo && wsData.length > 0) {
      if (!ws['!merges']) ws['!merges'] = [];
      const colCount = data.length > 0 ? Object.keys(data[0]).length : 10;
      
      // Merge company name across columns
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
      // Merge address
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } });
      // Merge phone
      ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } });
      // Merge title
      ws['!merges'].push({ s: { r: 5, c: 0 }, e: { r: 5, c: colCount - 1 } });
    }
    
    // Set column widths
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map(() => ({ wch: 15 }));
      ws['!cols'] = colWidths;
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất file Excel: ' + error.message);
    return false;
  }
};

/**
 * Export data to Excel file (simple version without header)
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất file Excel: ' + error.message);
    return false;
  }
};

/**
 * Import data from Excel file (skip header rows if present)
 * @param {File} file - Excel file to import
 * @param {Function} callback - Callback function to process imported data
 * @param {Number} skipRows - Number of header rows to skip (default: 0)
 */
export const importFromExcel = (file, callback, skipRows = 0) => {
  try {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert worksheet to JSON with range option to skip header rows
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          range: skipRows,
          defval: '' 
        });
        
        if (jsonData.length === 0) {
          alert('File Excel không có dữ liệu!');
          return;
        }
        
        // Call callback with imported data
        callback(jsonData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Lỗi khi đọc file Excel: ' + error.message);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Lỗi khi đọc file: ' + error.message);
    };
    
    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error('Error importing from Excel:', error);
    alert('Lỗi khi nhập file Excel: ' + error.message);
  }
};

/**
 * Download Excel template with headers only
 * @param {Array} headers - Array of header names
 * @param {String} filename - Name of the template file
 * @param {String} sheetName - Name of the worksheet
 */
export const downloadTemplate = (headers, filename = 'template', sheetName = 'Template') => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Create worksheet with headers only
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_template.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error downloading template:', error);
    alert('Lỗi khi tải template: ' + error.message);
    return false;
  }
};

/**
 * Validate imported data structure
 * @param {Array} data - Imported data
 * @param {Array} requiredFields - Required field names
 * @returns {Object} - { isValid, errors }
 */
export const validateImportData = (data, requiredFields) => {
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('Dữ liệu không hợp lệ hoặc rỗng');
    return { isValid: false, errors };
  }
  
  // Check if all required fields exist in the first row
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  
  if (missingFields.length > 0) {
    errors.push(`Thiếu các cột bắt buộc: ${missingFields.join(', ')}`);
  }
  
  // Check for empty required fields in data rows
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Dòng ${index + 2}: Trường "${field}" không được để trống`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
