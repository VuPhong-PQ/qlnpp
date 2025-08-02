import React from 'react';
import '../BusinessPage.css';

const PrintOrderByVehicle = () => {
  return (
    <div className="business-page">
      <div className="page-header">
        <h1>In đơn hàng theo xe</h1>
        <p>In đơn hàng được phân nhóm theo phương tiện vận chuyển</p>
      </div>
      
      <div className="content-placeholder">
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <div>Trang in đơn hàng theo xe đang được phát triển</div>
        </div>
      </div>
    </div>
  );
};

export default PrintOrderByVehicle;
