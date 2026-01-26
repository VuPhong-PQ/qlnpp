import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '../../config/api';
import '../setup/SetupPage.css';
import './PermissionStyles.css';

export default function UserPermissionsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [warehousePermissions, setWarehousePermissions] = useState([]);
  const [categoryPermissions, setCategoryPermissions] = useState([]);
  const [reportPermissions, setReportPermissions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Danh sách resources
  const resources = [
    { key: 'dashboard', name: 'Trang chủ', category: 'Hệ thống' },
    { key: 'company_info', name: 'Thông tin công ty', category: 'Thiết lập' },
    { key: 'accounts_funds', name: 'Tài khoản/Quỹ', category: 'Thiết lập' },
    { key: 'customer_groups', name: 'Nhóm khách hàng', category: 'Thiết lập' },
    { key: 'customers', name: 'Khách hàng', category: 'Danh mục' },
    { key: 'suppliers', name: 'Nhà cung cấp', category: 'Danh mục' },
    { key: 'product_categories', name: 'Danh mục hàng hóa', category: 'Thiết lập' },
    { key: 'products', name: 'Hàng hóa', category: 'Danh mục' },
    { key: 'units', name: 'Đơn vị tính', category: 'Thiết lập' },
    { key: 'transaction_contents', name: 'Nội dung giao dịch', category: 'Thiết lập' },
    { key: 'warehouses', name: 'Kho hàng', category: 'Thiết lập' },
    { key: 'vehicles', name: 'Phương tiện', category: 'Thiết lập' },
    { key: 'users', name: 'Nhân viên', category: 'Phân quyền' },
    { key: 'permission_groups', name: 'Nhóm quyền', category: 'Phân quyền' },
    { key: 'quotations', name: 'Báo giá', category: 'Nghiệp vụ' },
    { key: 'imports', name: 'Nhập kho', category: 'Nghiệp vụ' },
    { key: 'exports', name: 'Xuất kho', category: 'Nghiệp vụ' },
    { key: 'warehouse_transfers', name: 'Chuyển kho', category: 'Nghiệp vụ' },
    { key: 'orders', name: 'Đơn hàng', category: 'Nghiệp vụ' },
    { key: 'receipts', name: 'Phiếu thu', category: 'Kế toán' },
    { key: 'expenses', name: 'Phiếu chi', category: 'Kế toán' },
    { key: 'admin', name: 'Quản trị hệ thống', category: 'Hệ thống' }
  ];

  const reports = [
    { key: 'report_sales', name: 'Báo cáo bán hàng', category: 'Bán hàng' },
    { key: 'report_sales_by_customer', name: 'BC bán hàng theo khách hàng', category: 'Bán hàng' },
    { key: 'report_sales_by_product', name: 'BC bán hàng theo sản phẩm', category: 'Bán hàng' },
    { key: 'report_sales_by_employee', name: 'BC bán hàng theo nhân viên', category: 'Bán hàng' },
    { key: 'report_revenue', name: 'Báo cáo doanh thu', category: 'Doanh thu' },
    { key: 'report_revenue_by_day', name: 'BC doanh thu theo ngày', category: 'Doanh thu' },
    { key: 'report_revenue_by_month', name: 'BC doanh thu theo tháng', category: 'Doanh thu' },
    { key: 'report_inventory', name: 'Báo cáo tồn kho', category: 'Tồn kho' },
    { key: 'report_inventory_by_warehouse', name: 'BC tồn kho theo kho', category: 'Tồn kho' },
    { key: 'report_inventory_movement', name: 'Báo cáo xuất nhập tồn', category: 'Tồn kho' },
    { key: 'report_purchase', name: 'Báo cáo mua hàng', category: 'Mua hàng' },
    { key: 'report_debt_customer', name: 'BC công nợ khách hàng', category: 'Công nợ' },
    { key: 'report_debt_supplier', name: 'BC công nợ nhà cung cấp', category: 'Công nợ' },
    { key: 'report_cashflow', name: 'Báo cáo thu chi', category: 'Kế toán' },
    { key: 'report_profit_loss', name: 'Báo cáo lãi lỗ', category: 'Kế toán' }
  ];

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user info
      const userData = await api.get(`${API_ENDPOINTS.users}/${userId}`);
      setUser(userData);

      // Load permission groups
      const groups = await api.get(API_ENDPOINTS.permissionGroups);
      setPermissionGroups(groups || []);

      // Load warehouses
      const whs = await api.get(API_ENDPOINTS.warehouses);
      setWarehouses(whs || []);

      // Load product categories
      const cats = await api.get(API_ENDPOINTS.productCategories);
      setCategories(cats || []);

      // Load user permissions
      await loadUserPermissions();
      
    } catch (err) {
      console.error('Load data failed', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async () => {
    try {
      // Load general permissions
      const permsRes = await fetch(`${API_ENDPOINTS.users}/${userId}/permissions`);
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        const perms = {};
        resources.forEach(r => {
          perms[r.key] = { view: false, add: false, edit: false, delete: false, print: false, import: false, export: false };
        });
        (permsData || []).forEach(p => {
          const key = p.resourceKey || p.ResourceKey;
          if (perms[key]) {
            perms[key] = {
              view: p.canView || p.CanView || false,
              add: p.canAdd || p.CanAdd || false,
              edit: p.canEdit || p.CanEdit || false,
              delete: p.canDelete || p.CanDelete || false,
              print: p.canPrint || p.CanPrint || false,
              import: p.canImport || p.CanImport || false,
              export: p.canExport || p.CanExport || false
            };
          }
        });
        setPermissions(perms);
      }

      // Load warehouse permissions
      const whPermsRes = await fetch(`${API_ENDPOINTS.warehousePermissions}/user/${userId}`);
      if (whPermsRes.ok) {
        const whPerms = await whPermsRes.json();
        setWarehousePermissions(whPerms || []);
      }

      // Load category permissions
      const catPermsRes = await fetch(`${API_ENDPOINTS.productCategoryPermissions}/user/${userId}`);
      if (catPermsRes.ok) {
        const catPerms = await catPermsRes.json();
        setCategoryPermissions(catPerms || []);
      }

      // Load report permissions
      const rptPermsRes = await fetch(`${API_ENDPOINTS.reportPermissions}/user/${userId}`);
      if (rptPermsRes.ok) {
        const rptPerms = await rptPermsRes.json();
        setReportPermissions(rptPerms || []);
      }

    } catch (err) {
      console.error('Load user permissions failed', err);
    }
  };

  const togglePerm = (key, field) => {
    setPermissions(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: !prev[key][field] }
    }));
  };

  const toggleAllForResource = (key, checked) => {
    setPermissions(prev => ({
      ...prev,
      [key]: { view: checked, add: checked, edit: checked, delete: checked, print: checked, import: checked, export: checked }
    }));
  };

  const saveGeneralPermissions = async () => {
    try {
      const model = { Permissions: {} };
      Object.keys(permissions).forEach(key => {
        const p = permissions[key];
        model.Permissions[key] = {
          CanView: p.view,
          CanAdd: p.add,
          CanEdit: p.edit,
          CanDelete: p.delete,
          CanPrint: p.print,
          CanImport: p.import,
          CanExport: p.export
        };
      });

      await fetch(`${API_ENDPOINTS.users}/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });
      alert('Lưu quyền thành công!');
    } catch (err) {
      console.error('Save permissions failed', err);
      alert('Lưu thất bại');
    }
  };

  const saveWarehousePermissions = async () => {
    try {
      await fetch(`${API_ENDPOINTS.warehousePermissions}/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehousePermissions)
      });
      alert('Lưu quyền kho thành công!');
    } catch (err) {
      console.error('Save warehouse permissions failed', err);
      alert('Lưu thất bại');
    }
  };

  const saveCategoryPermissions = async () => {
    try {
      await fetch(`${API_ENDPOINTS.productCategoryPermissions}/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryPermissions)
      });
      alert('Lưu quyền nhóm hàng thành công!');
    } catch (err) {
      console.error('Save category permissions failed', err);
      alert('Lưu thất bại');
    }
  };

  const saveReportPermissions = async () => {
    try {
      await fetch(`${API_ENDPOINTS.reportPermissions}/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPermissions)
      });
      alert('Lưu quyền báo cáo thành công!');
    } catch (err) {
      console.error('Save report permissions failed', err);
      alert('Lưu thất bại');
    }
  };

  const toggleWarehousePerm = (warehouseId, field) => {
    setWarehousePermissions(prev => {
      const existing = prev.find(p => p.warehouseId === warehouseId);
      if (existing) {
        return prev.map(p => p.warehouseId === warehouseId ? { ...p, [field]: !p[field] } : p);
      } else {
        return [...prev, { warehouseId, [field]: true }];
      }
    });
  };

  const toggleCategoryPerm = (categoryId, field) => {
    setCategoryPermissions(prev => {
      const existing = prev.find(p => p.productCategoryId === categoryId);
      if (existing) {
        return prev.map(p => p.productCategoryId === categoryId ? { ...p, [field]: !p[field] } : p);
      } else {
        return [...prev, { productCategoryId: categoryId, [field]: true }];
      }
    });
  };

  const toggleReportPerm = (reportKey, field) => {
    setReportPermissions(prev => {
      const existing = prev.find(p => p.reportKey === reportKey);
      if (existing) {
        return prev.map(p => p.reportKey === reportKey ? { ...p, [field]: !p[field] } : p);
      } else {
        const report = reports.find(r => r.key === reportKey);
        return [...prev, { reportKey, reportName: report?.name, [field]: true }];
      }
    });
  };

  const getWarehousePerm = (warehouseId, field) => {
    const perm = warehousePermissions.find(p => p.warehouseId === warehouseId);
    return perm ? perm[field] : false;
  };

  const getCategoryPerm = (categoryId, field) => {
    const perm = categoryPermissions.find(p => p.productCategoryId === categoryId);
    return perm ? perm[field] : false;
  };

  const getReportPerm = (reportKey, field) => {
    const perm = reportPermissions.find(p => p.reportKey === reportKey);
    return perm ? perm[field] : false;
  };

  if (loading) {
    return <div className="setup-page"><div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div></div>;
  }

  const categories_list = [...new Set(resources.map(r => r.category))];
  const reportCategories = [...new Set(reports.map(r => r.category))];

  return (
    <div className="setup-page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/permissions/users')} style={{ marginRight: 16 }}>
          ← Quay lại
        </button>
        <h2>PHÂN QUYỀN CHO: {user?.name || user?.username}</h2>
      </div>

      <div className="permission-tabs">
        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          Quyền chung
        </button>
        <button className={`tab-btn ${activeTab === 'warehouse' ? 'active' : ''}`} onClick={() => setActiveTab('warehouse')}>
          Quyền kho hàng
        </button>
        <button className={`tab-btn ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab('category')}>
          Quyền nhóm hàng
        </button>
        <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          Quyền báo cáo
        </button>
      </div>

      {/* Tab: Quyền chung */}
      {activeTab === 'general' && (
        <div className="permission-section">
          <div className="permission-table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table className="permission-table">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Chức năng</th>
                  <th>Xem</th>
                  <th>Thêm</th>
                  <th>Sửa</th>
                  <th>Xóa</th>
                  <th>In</th>
                  <th>Import</th>
                  <th>Export</th>
                  <th style={{ width: 80 }}>Tất cả</th>
                </tr>
              </thead>
              <tbody>
                {categories_list.map(cat => (
                  <React.Fragment key={cat}>
                    <tr className="category-row">
                      <td colSpan={9}><strong>{cat}</strong></td>
                    </tr>
                    {resources.filter(r => r.category === cat).map(r => {
                      const p = permissions[r.key] || {};
                      const allChecked = p.view && p.add && p.edit && p.delete && p.print && p.import && p.export;
                      return (
                        <tr key={r.key}>
                          <td>{r.name}</td>
                          <td><input type="checkbox" checked={p.view || false} onChange={() => togglePerm(r.key, 'view')} /></td>
                          <td><input type="checkbox" checked={p.add || false} onChange={() => togglePerm(r.key, 'add')} /></td>
                          <td><input type="checkbox" checked={p.edit || false} onChange={() => togglePerm(r.key, 'edit')} /></td>
                          <td><input type="checkbox" checked={p.delete || false} onChange={() => togglePerm(r.key, 'delete')} /></td>
                          <td><input type="checkbox" checked={p.print || false} onChange={() => togglePerm(r.key, 'print')} /></td>
                          <td><input type="checkbox" checked={p.import || false} onChange={() => togglePerm(r.key, 'import')} /></td>
                          <td><input type="checkbox" checked={p.export || false} onChange={() => togglePerm(r.key, 'export')} /></td>
                          <td>
                            <input type="checkbox" checked={allChecked} onChange={(e) => toggleAllForResource(r.key, e.target.checked)} />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-footer">
            <button className="btn btn-primary" onClick={saveGeneralPermissions}>Lưu quyền chung</button>
          </div>
        </div>
      )}

      {/* Tab: Quyền kho hàng */}
      {activeTab === 'warehouse' && (
        <div className="permission-section">
          <div className="permission-table-container">
            <table className="permission-table">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Kho hàng</th>
                  <th>Xem</th>
                  <th>Nhập kho</th>
                  <th>Xuất kho</th>
                  <th>Chuyển kho</th>
                  <th>Xem tồn</th>
                  <th>Điều chỉnh</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map(wh => (
                  <tr key={wh.id}>
                    <td>{wh.name}</td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canView')} onChange={() => toggleWarehousePerm(wh.id, 'canView')} /></td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canImport')} onChange={() => toggleWarehousePerm(wh.id, 'canImport')} /></td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canExport')} onChange={() => toggleWarehousePerm(wh.id, 'canExport')} /></td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canTransfer')} onChange={() => toggleWarehousePerm(wh.id, 'canTransfer')} /></td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canViewStock')} onChange={() => toggleWarehousePerm(wh.id, 'canViewStock')} /></td>
                    <td><input type="checkbox" checked={getWarehousePerm(wh.id, 'canAdjustStock')} onChange={() => toggleWarehousePerm(wh.id, 'canAdjustStock')} /></td>
                  </tr>
                ))}
                {warehouses.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Chưa có kho hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="section-footer">
            <button className="btn btn-primary" onClick={saveWarehousePermissions}>Lưu quyền kho</button>
          </div>
        </div>
      )}

      {/* Tab: Quyền nhóm hàng */}
      {activeTab === 'category' && (
        <div className="permission-section">
          <div className="permission-table-container">
            <table className="permission-table">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Nhóm hàng</th>
                  <th>Xem</th>
                  <th>Thêm</th>
                  <th>Sửa</th>
                  <th>Xóa</th>
                  <th>Xem giá</th>
                  <th>Sửa giá</th>
                  <th>Xem tồn</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canView')} onChange={() => toggleCategoryPerm(cat.id, 'canView')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canAdd')} onChange={() => toggleCategoryPerm(cat.id, 'canAdd')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canEdit')} onChange={() => toggleCategoryPerm(cat.id, 'canEdit')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canDelete')} onChange={() => toggleCategoryPerm(cat.id, 'canDelete')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canViewPrice')} onChange={() => toggleCategoryPerm(cat.id, 'canViewPrice')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canEditPrice')} onChange={() => toggleCategoryPerm(cat.id, 'canEditPrice')} /></td>
                    <td><input type="checkbox" checked={getCategoryPerm(cat.id, 'canViewStock')} onChange={() => toggleCategoryPerm(cat.id, 'canViewStock')} /></td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Chưa có nhóm hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="section-footer">
            <button className="btn btn-primary" onClick={saveCategoryPermissions}>Lưu quyền nhóm hàng</button>
          </div>
        </div>
      )}

      {/* Tab: Quyền báo cáo */}
      {activeTab === 'report' && (
        <div className="permission-section">
          <div className="permission-table-container">
            <table className="permission-table">
              <thead>
                <tr>
                  <th style={{ width: 250 }}>Báo cáo</th>
                  <th>Xem</th>
                  <th>In</th>
                  <th>Xuất file</th>
                </tr>
              </thead>
              <tbody>
                {reportCategories.map(cat => (
                  <React.Fragment key={cat}>
                    <tr className="category-row">
                      <td colSpan={4}><strong>{cat}</strong></td>
                    </tr>
                    {reports.filter(r => r.category === cat).map(r => (
                      <tr key={r.key}>
                        <td>{r.name}</td>
                        <td><input type="checkbox" checked={getReportPerm(r.key, 'canView')} onChange={() => toggleReportPerm(r.key, 'canView')} /></td>
                        <td><input type="checkbox" checked={getReportPerm(r.key, 'canPrint')} onChange={() => toggleReportPerm(r.key, 'canPrint')} /></td>
                        <td><input type="checkbox" checked={getReportPerm(r.key, 'canExport')} onChange={() => toggleReportPerm(r.key, 'canExport')} /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-footer">
            <button className="btn btn-primary" onClick={saveReportPermissions}>Lưu quyền báo cáo</button>
          </div>
        </div>
      )}
    </div>
  );
}
