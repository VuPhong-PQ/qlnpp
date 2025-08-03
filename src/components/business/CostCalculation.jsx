import React, { useState, useRef, useEffect } from 'react';
import './CostCalculation.css';

const CostCalculation = () => {
  const [searchDateRange, setSearchDateRange] = useState({
    startDate: '01/08/2025',
    endDate: '03/08/2025'
  });
  
  const [voucherInfo, setVoucherInfo] = useState({
    voucherDate: '2025-08-03',
    voucherNumber: '',
    calculationDateRange: {
      startDate: new Date('2025-08-01T09:00:00'),
      endDate: new Date('2025-08-03T08:50:00')
    },
    notes: ''
  });

  const [showSearchCalendar, setShowSearchCalendar] = useState(false);
  const [showVoucherCalendar, setShowVoucherCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [tempSearchRange, setTempSearchRange] = useState(searchDateRange);
  const [tempVoucherRange, setTempVoucherRange] = useState(voucherInfo.calculationDateRange);
  const [activeCalendar, setActiveCalendar] = useState('search'); // 'search' or 'voucher'

  const searchCalendarRef = useRef(null);
  const voucherCalendarRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchCalendarRef.current && !searchCalendarRef.current.contains(event.target)) {
        setShowSearchCalendar(false);
      }
      if (voucherCalendarRef.current && !voucherCalendarRef.current.contains(event.target)) {
        setShowVoucherCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateForInput = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatDateTimeRange = (startDate, endDate) => {
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    };
    
    return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
  };

  const handleSearch = () => {
    console.log('Tìm kiếm với khoảng thời gian:', searchDateRange);
  };

  const handleCalculateCost = () => {
    const now = new Date();
    const updatedRange = {
      ...voucherInfo.calculationDateRange,
      endDate: now
    };
    
    setVoucherInfo({
      ...voucherInfo,
      calculationDateRange: updatedRange
    });
    
    alert('Đã cập nhật thời gian tính giá vốn đến hiện tại!');
  };

  const handleCreateNew = () => {
    setVoucherInfo({
      voucherDate: new Date().toISOString().split('T')[0],
      voucherNumber: '',
      calculationDateRange: {
        startDate: new Date(),
        endDate: new Date()
      },
      notes: ''
    });
  };

  const openSearchCalendar = () => {
    setActiveCalendar('search');
    setSelectedRange({ start: null, end: null });
    setShowSearchCalendar(true);
    setShowVoucherCalendar(false);
  };

  const openVoucherCalendar = () => {
    setActiveCalendar('voucher');
    setSelectedRange({ start: null, end: null });
    setShowVoucherCalendar(true);
    setShowSearchCalendar(false);
  };

  const renderCalendar = () => {
    const currentMonth = currentCalendarMonth.getMonth();
    const currentYear = currentCalendarMonth.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedRange.start && selectedRange.end && 
        date >= selectedRange.start && date <= selectedRange.end;
      const isRangeStart = selectedRange.start && date.getTime() === selectedRange.start.getTime();
      const isRangeEnd = selectedRange.end && date.getTime() === selectedRange.end.getTime();

      days.push(
        <button
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isRangeStart ? 'range-start' : ''} ${isRangeEnd ? 'range-end' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={() => setCurrentCalendarMonth(new Date(currentYear, currentMonth - 1, 1))}
          >
            &#8249;
          </button>
          <span className="calendar-month-year">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            className="calendar-nav-btn"
            onClick={() => setCurrentCalendarMonth(new Date(currentYear, currentMonth + 1, 1))}
          >
            &#8250;
          </button>
        </div>
        
        <div className="calendar-weekdays">
          <div>CN</div>
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
        </div>
        
        <div className="calendar-days">
          {days}
        </div>

        <div className="calendar-actions">
          <button 
            className="calendar-confirm-btn"
            onClick={confirmDateSelection}
          >
            Xác nhận
          </button>
          <button 
            className="calendar-cancel-btn"
            onClick={() => {
              setShowSearchCalendar(false);
              setShowVoucherCalendar(false);
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    );
  };

  const handleDateClick = (date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      setSelectedRange({ start: date, end: null });
    } else if (selectedRange.start && !selectedRange.end) {
      // Complete the range
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const confirmDateSelection = () => {
    if (selectedRange.start && selectedRange.end) {
      const startFormatted = formatDateForInput(selectedRange.start);
      const endFormatted = formatDateForInput(selectedRange.end);
      
      if (activeCalendar === 'search') {
        setSearchDateRange({
          startDate: startFormatted,
          endDate: endFormatted
        });
        setShowSearchCalendar(false);
      } else {
        setVoucherInfo({
          ...voucherInfo,
          calculationDateRange: {
            startDate: selectedRange.start,
            endDate: selectedRange.end
          }
        });
        setShowVoucherCalendar(false);
      }
    }
  };

  return (
    <div className="cost-calculation-page">
      <div className="cost-calculation-container">
        {/* Left Panel - Search */}
        <div className="search-panel">
          <div className="search-header">
            <h2>TÌM KIẾM</h2>
          </div>
          
          <div className="search-content">
            <div className="date-range" ref={searchCalendarRef}>
              <div className="date-field">
                <input 
                  type="text" 
                  value={searchDateRange.startDate}
                  readOnly
                  placeholder="01/08/2025"
                />
              </div>
              <span className="arrow">→</span>
              <div className="date-field">
                <input 
                  type="text" 
                  value={searchDateRange.endDate}
                  readOnly
                  placeholder="03/08/2025"
                />
              </div>
              <button className="calendar-btn" onClick={openSearchCalendar}>📅</button>
              
              {showSearchCalendar && (
                <div className="calendar-dropdown">
                  {renderCalendar()}
                </div>
              )}
            </div>

            <button className="search-btn" onClick={handleSearch}>
              Tìm kiếm
            </button>

            <div className="total-info">
              Tổng: 0
            </div>

            <div className="search-actions">
              <button className="action-btn green-btn">D</button>
              <button className="action-btn purple-btn">S</button>
              <button className="action-btn pink-btn">T</button>
              <button className="action-btn gray-btn">S</button>
            </div>

            <div className="products-list">
              <div className="list-header">
                <div>Ngày</div>
                <div>Tên</div>
                <div>Thao tác</div>
              </div>
              <div className="list-content">
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <p>Không có dữ liệu</p>
                </div>
              </div>
            </div>

            <div className="slider-container">
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50" 
                className="slider"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Voucher Information */}
        <div className="voucher-panel">
          <div className="voucher-header">
            <h2>THÔNG TIN PHIẾU</h2>
            <button className="add-btn" onClick={handleCreateNew}>
              + Tạo mới
            </button>
          </div>

          <div className="voucher-content">
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày lập</label>
                  <input 
                    type="date" 
                    value={voucherInfo.voucherDate}
                    onChange={(e) => setVoucherInfo({...voucherInfo, voucherDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Tên phiếu</label>
                  <input 
                    type="text" 
                    value={voucherInfo.voucherNumber}
                    onChange={(e) => setVoucherInfo({...voucherInfo, voucherNumber: e.target.value})}
                    placeholder="Nhập tên phiếu"
                  />
                </div>
                
                <div className="form-group" ref={voucherCalendarRef}>
                  <label>Thời gian tính</label>
                  <div className="datetime-picker-container">
                    <input 
                      type="text"
                      value={formatDateTimeRange(voucherInfo.calculationDateRange.startDate, voucherInfo.calculationDateRange.endDate)}
                      readOnly
                      className="datetime-display-input"
                      onClick={openVoucherCalendar}
                    />
                    <button 
                      className="calendar-trigger-btn"
                      onClick={openVoucherCalendar}
                    >
                      📅
                    </button>
                  </div>
                  
                  {showVoucherCalendar && (
                    <div className="calendar-dropdown">
                      {renderCalendar()}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button 
                    className="time-calc-btn"
                    onClick={handleCalculateCost}
                  >
                    💰 Tính giá vốn
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <input 
                    type="text" 
                    value={voucherInfo.notes}
                    onChange={(e) => setVoucherInfo({...voucherInfo, notes: e.target.value})}
                    placeholder="Nhập ghi chú"
                  />
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="product-details">
              <div className="section-label">Bộ lọc tìm sản phẩm</div>
              
              <div className="filter-section">
                <div className="filter-row">
                  <div className="filter-group">
                    <input 
                      type="text" 
                      placeholder="Nhóm hàng hóa"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <input 
                      type="text" 
                      placeholder="Chọn hàng hóa"
                      className="filter-input"
                    />
                  </div>
                </div>
                
                <div className="filter-row">
                  <div className="filter-group">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="filter-input number-input"
                    />
                  </div>
                  <div className="filter-group">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="filter-input number-input"
                    />
                  </div>
                  <div className="filter-group">
                    <button className="filter-btn">
                      🔍 Tìm kiếm
                    </button>
                  </div>
                </div>
              </div>

              <div className="summary-info">
                Tổng: 0
              </div>

              <div className="product-actions">
                <button className="action-btn purple-btn">S</button>
                <button className="action-btn pink-btn">T</button>
                <button className="action-btn gray-btn">S</button>
              </div>

              <div className="product-table">
                <div className="table-header">
                  <div>Nhóm hàng hóa</div>
                  <div>Hàng hóa</div>
                  <div>Đơn vị tính</div>
                  <div>Giá trung bình</div>
                  <div>Thao tác</div>
                </div>
                
                <div className="table-content">
                  <div className="empty-table-state">
                    <div className="empty-icon">📊</div>
                    <p>Chưa có dữ liệu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bottom-actions">
              <div className="main-actions">
                <button className="main-btn blue-btn">
                  📋 Lưu lại
                </button>
                <button className="main-btn green-btn">
                  📊 Xuất Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculation;