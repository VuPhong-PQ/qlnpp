import React, { useEffect, useState } from 'react';
import PermissionModal from './PermissionModal';
import '../setup/SetupPage.css';
import { API_ENDPOINTS, api } from '../../config/api';

export default function GroupPermissions() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      // Try to load product categories or custom permission groups
      let data = [];
      if (API_ENDPOINTS.productCategories) {
        data = await api.get(API_ENDPOINTS.productCategories);
      } else if (API_ENDPOINTS.permissionGroups) {
        data = await api.get(API_ENDPOINTS.permissionGroups);
      }
      setGroups(data || []);
    } catch (err) {
      console.error('Load groups failed', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (g) => {
    setSelectedGroup(g);
    setShowModal(true);
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Phân quyền nhóm hàng</h3>
      <div style={{ marginTop: 12 }}>
        {loading && <div>Đang tải...</div>}
        {!loading && groups.length === 0 && <div>Không có nhóm quyền</div>}
        {!loading && groups.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #eee' }}>#</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Tên nhóm</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g.id || g.code || i}>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{i + 1}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{g.name || g.code || g.title}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>
                    <button className="btn btn-primary" onClick={() => handleEditGroup(g)}>Phân quyền</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PermissionModal show={showModal} onClose={() => setShowModal(false)} onSave={async () => { setShowModal(false); await loadGroups(); }} user={selectedGroup} isGroup={true} />
      )}
    </div>
  );
}
