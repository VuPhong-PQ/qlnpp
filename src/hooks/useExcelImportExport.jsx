import { useRef } from 'react';
import { exportToExcel, importFromExcel, validateImportData } from '../utils/excelUtils';

/**
 * Custom hook for Excel Import/Export functionality
 * @param {Object} config - Configuration object
 * @param {Array} config.data - Data array to export
 * @param {Function} config.loadData - Function to reload data after import
 * @param {Function} config.apiPost - API function to create new records
 * @param {Object} config.columnMapping - Mapping between Excel headers and data fields
 * @param {Array} config.requiredFields - Required Excel column headers
 * @param {String} config.filename - Export filename
 * @param {String} config.sheetName - Excel sheet name
 * @returns {Object} - Export/Import handlers and file input ref
 */
export const useExcelImportExport = (config) => {
  const {
    data,
    loadData,
    apiPost,
    columnMapping,
    requiredFields,
    filename = 'export',
    sheetName = 'Sheet1',
    onImportStart,
    onImportComplete,
    transformDataForExport,
    transformDataForImport
  } = config;
  // allowMissingFields: when true, do not block import if some required columns are missing; show warning and allow continue
  const { allowMissingFields = false } = config;

  const fileInputRef = useRef(null);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    // Transform data for export
    let excelData = data;
    if (transformDataForExport) {
      excelData = data.map(transformDataForExport);
    } else {
      // Use column mapping
      excelData = data.map(item => {
        const row = {};
        Object.entries(columnMapping).forEach(([excelHeader, dataField]) => {
          row[excelHeader] = item[dataField] !== undefined && item[dataField] !== null ? item[dataField] : '';
        });
        return row;
      });
    }

    exportToExcel(excelData, filename, sheetName);
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importFromExcel(file, async (excelData) => {
      // Validate required fields
      const validation = validateImportData(excelData, requiredFields || []);

      if (!validation.isValid) {
        if (allowMissingFields) {
          // warn user and ask to continue
          const proceed = window.confirm('Cảnh báo khi nhập dữ liệu:\n' + validation.errors.join('\n') + '\n\nBạn có muốn tiếp tục nhập những cột còn lại không?');
          if (!proceed) return;
        } else {
          alert('Lỗi dữ liệu:\n' + validation.errors.join('\n'));
          return;
        }
      }

      // Confirm import
      if (!window.confirm(`Bạn có chắc muốn nhập ${excelData.length} bản ghi từ file Excel?`)) {
        return;
      }

      try {
        if (onImportStart) onImportStart();

        let successCount = 0;
        let errorCount = 0;
        let createdCount = 0;
        let updatedCount = 0;
        const errors = [];
        const warnings = [];

        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          try {
            // Transform data for import
            let importData;
            if (transformDataForImport) {
              importData = transformDataForImport(row);
            } else {
              // Use reverse column mapping
              importData = {};
              Object.entries(columnMapping).forEach(([excelHeader, dataField]) => {
                importData[dataField] = row[excelHeader];
              });
            }

            const result = await apiPost(importData);
            successCount++;
            
            // Track create vs update
            if (result && typeof result === 'object' && result.action) {
              if (result.action === 'created') {
                createdCount++;
              } else if (result.action === 'updated') {
                updatedCount++;
                const identifier = row[requiredFields[0]] || `Dòng ${i + 2}`;
                warnings.push(`${identifier}: Đã cập nhật sản phẩm tồn tại`);
              }
            } else {
              createdCount++; // default fallback
            }
          } catch (error) {
            errorCount++;
            const identifier = row[requiredFields[0]] || `Dòng ${i + 2}`;
            errors.push(`${identifier}: ${error.message}`);
          }
        }

        if (loadData) await loadData();
        
        let message = `Import hoàn tất!\n✓ Thành công: ${successCount} (${createdCount} mới, ${updatedCount} cập nhật)\n✗ Lỗi: ${errorCount}`;
        
        if (warnings.length > 0 && warnings.length <= 3) {
          message += '\n\n⚠️ Cảnh báo ghi đè:\n' + warnings.slice(0, 3).join('\n');
          if (warnings.length > 3) {
            message += `\n... và ${warnings.length - 3} cảnh báo khác.`;
          }
        }
        
        if (errors.length > 0 && errors.length <= 5) {
          message += '\n\n❌ Chi tiết lỗi:\n' + errors.join('\n');
        } else if (errors.length > 5) {
          message += '\n\nCó nhiều lỗi. Xem console để biết chi tiết.';
          console.error('Import errors:', errors);
        }
        
        alert(message);

        if (onImportComplete) onImportComplete(successCount, errorCount, createdCount, updatedCount);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Lỗi khi nhập dữ liệu: ' + error.message);
      } finally {
        e.target.value = ''; // Reset file input
      }
    });
  };

  return {
    handleExportExcel,
    handleImportExcel,
    handleFileChange,
    fileInputRef
  };
};
