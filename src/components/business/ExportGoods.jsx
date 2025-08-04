
import React, { useRef, useState } from 'react';
import './ExportGoods.css';

const ExportGoods = () => {
  // Khởi tạo độ rộng mặc định cho các cột
  const defaultWidths = [110, 90, 120, 110, 110, 90, 80, 90, 90, 110, 80, 90, 100, 70];
  const [colWidths, setColWidths] = useState(defaultWidths);
  const tableRef = useRef(null);

  // Hàm xử lý kéo cột
  const handleMouseDown = (index, e) => {
    const startX = e.clientX;
    const startWidth = colWidths[index];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setColWidths((widths) => {
        const newWidths = [...widths];
        newWidths[index] = Math.max(50, startWidth + delta);
        return newWidths;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="export-goods-layout">
      {/* Cột trái: Tìm kiếm */}
      <div className="export-goods-search">
        <div className="search-title">TÌM KIẾM</div>
        <div className="search-fields">
          <input type="date" className="search-input" />
          <input type="date" className="search-input" />
          <input type="text" className="search-input" placeholder="loại xuất" />
          <input type="text" className="search-input" placeholder="nhân viên lập" />
          <button className="btn-search">Tìm kiếm</button>
        </div>
        <div className="search-table">
          <div className="search-table-header">
            <span>Tổng 13</span>
            <div className="search-table-actions">
              <button className="btn-table-action purple"></button>
              <button className="btn-table-action pink"></button>
              <button className="btn-table-action gray"></button>
            </div>
          </div>
          <table className="search-list-table">
            <thead>
              <tr>
                <th></th>
                <th>Số phiếu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i}>
                  <td><input type="checkbox" /></td>
                  <td className="search-link">PXK250804-00060{i}</td>
                  <td>
                    <button className="btn-table-edit">✏️</button>
                    <button className="btn-table-delete">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="search-pagination">Dòng 1-10 trên tổng 13 dòng <span className="search-page">1</span> 2 <span className="search-page-size">10/trang</span></div>
        </div>
      </div>

      {/* Cột phải: Thông tin xuất kho + bảng chi tiết */}
      <div className="export-goods-main">
        <div className="export-goods-header">
          <span className="main-title">THÔNG TIN XUẤT KHO</span>
          <button className="btn-create">+ Tạo mới</button>
        </div>
        <div className="export-goods-info-row">
          <div className="info-group">
            <label>Ngày lập <span className="required">*</span></label>
            <input type="date" />
          </div>
          <div className="info-group">
            <label>Nhân viên xuất <span className="required">*</span></label>
            <input type="text" value="admin 66" readOnly />
          </div>
          <div className="info-group">
            <label>Loại xuất <span className="required">*</span></label>
            <input type="text" />
          </div>
          <div className="info-group">
            <label>Tổng số kg</label>
            <input type="number" value={0} readOnly />
          </div>
          <div className="info-group">
            <label>Tổng số khối</label>
            <input type="number" value={0} readOnly />
          </div>
        </div>
        <div className="export-goods-info-row">
          <div className="info-group">
            <label>Số phiếu</label>
            <input type="text" value="PXK250804-000601" readOnly />
          </div>
          <div className="info-group" style={{flex: 1}}>
            <label>Ghi chú</label>
            <input type="text" />
          </div>
        </div>
        <div className="export-goods-table-wrapper">
          <table className="export-goods-table" ref={tableRef}>
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {['Mã vạch','Mã hàng','Hàng hóa','Đơn vị tính','Mô tả','Quy cách','Quy đổi','Số lượng','Đơn giá','Thành tiền','Số kg','Số khối','Kho hàng','Thao tác'].map((col, idx) => (
                  <th key={col} style={{ position: 'relative' }}>
                    {col}
                    {idx < colWidths.length - 1 && (
                      <span
                        className="col-resizer"
                        onMouseDown={e => handleMouseDown(idx, e)}
                        style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize', zIndex: 2 }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" value="8938505970012" readOnly /></td>
                <td><input type="text" value="SP001" readOnly /></td>
                <td><input type="text" value="Bánh gạo" readOnly /></td>
                <td><input type="text" value="Gói" readOnly /></td>
                <td><input type="text" value="Vị rong biển" readOnly /></td>
                <td><input type="text" value="12x30g" readOnly /></td>
                <td><input type="number" value={1} readOnly /></td>
                <td><input type="number" value={10} readOnly /></td>
                <td><input type="number" value={12000} readOnly /></td>
                <td><input type="number" value={120000} readOnly /></td>
                <td><input type="number" value={3.6} readOnly /></td>
                <td><input type="number" value={0.012} readOnly /></td>
                <td><input type="text" value="Kho A" readOnly /></td>
                <td><button className="btn-delete">🗑</button></td>
              </tr>
              <tr>
                <td><input type="text" value="8938505970029" readOnly /></td>
                <td><input type="text" value="SP002" readOnly /></td>
                <td><input type="text" value="Nước suối" readOnly /></td>
                <td><input type="text" value="Thùng" readOnly /></td>
                <td><input type="text" value="500ml" readOnly /></td>
                <td><input type="text" value="24 chai" readOnly /></td>
                <td><input type="number" value={2} readOnly /></td>
                <td><input type="number" value={5} readOnly /></td>
                <td><input type="number" value={40000} readOnly /></td>
                <td><input type="number" value={200000} readOnly /></td>
                <td><input type="number" value={12} readOnly /></td>
                <td><input type="number" value={0.024} readOnly /></td>
                <td><input type="text" value="Kho B" readOnly /></td>
                <td><button className="btn-delete">🗑</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="export-goods-actions">
          <button className="btn-save">Lưu lại</button>
          <button className="btn-print">In A4</button>
          <button className="btn-excel">Xuất Excel</button>
        </div>
      </div>
    </div>
  );
};

export default ExportGoods;
