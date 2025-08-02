import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    {
      title: 'Tổng doanh thu',
      value: '125,430,000 ₫',
      change: '+12.5%',
      changeType: 'positive',
      icon: '💰'
    },
    {
      title: 'Đơn hàng',
      value: '1,234',
      change: '+5.2%',
      changeType: 'positive',
      icon: '📦'
    },
    {
      title: 'Khách hàng',
      value: '856',
      change: '+8.1%',
      changeType: 'positive',
      icon: '👥'
    },
    {
      title: 'Tồn kho',
      value: '2,456',
      change: '-2.3%',
      changeType: 'negative',
      icon: '📊'
    }
  ];

  const recentOrders = [
    { id: '#DH001', customer: 'Nguyễn Văn A', amount: '2,500,000 ₫', status: 'Hoàn thành', date: '02/08/2025' },
    { id: '#DH002', customer: 'Trần Thị B', amount: '1,800,000 ₫', status: 'Đang xử lý', date: '02/08/2025' },
    { id: '#DH003', customer: 'Lê Văn C', amount: '3,200,000 ₫', status: 'Hoàn thành', date: '01/08/2025' },
    { id: '#DH004', customer: 'Phạm Thị D', amount: '950,000 ₫', status: 'Chờ xác nhận', date: '01/08/2025' },
    { id: '#DH005', customer: 'Hoàng Văn E', amount: '4,100,000 ₫', status: 'Hoàn thành', date: '31/07/2025' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Chào mừng bạn quay trại! Đây là tổng quan về hoạt động kinh doanh của bạn.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.changeType}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Đơn hàng gần đây</h2>
          <button className="view-all-btn">Xem tất cả</button>
        </div>
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr key={index}>
                  <td className="order-id">{order.id}</td>
                  <td>{order.customer}</td>
                  <td className="amount">{order.amount}</td>
                  <td>
                    <span className={`status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Thao tác nhanh</h2>
        </div>
        <div className="quick-actions">
          <div className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-title">Tạo đơn hàng mới</div>
            <div className="action-desc">Thêm đơn hàng cho khách hàng</div>
          </div>
          <div className="action-card">
            <div className="action-icon">📦</div>
            <div className="action-title">Nhập hàng</div>
            <div className="action-desc">Cập nhật hàng hóa vào kho</div>
          </div>
          <div className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-title">Thêm khách hàng</div>
            <div className="action-desc">Tạo hồ sơ khách hàng mới</div>
          </div>
          <div className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-title">Xem báo cáo</div>
            <div className="action-desc">Theo dõi hiệu suất kinh doanh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
