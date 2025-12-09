import React, { useEffect, useState } from 'react';
import { fetchBackups, manualBackup, restoreBackup, getSettings, updateSettings } from '../../utils/adminApi';
import './Admin.css';

export default function BackupDashboardModal({ onClose }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettingsState] = useState({ BackupFolder: './Backups', AutoBackupEnabled: false, AutoBackupIntervalMinutes: 60 });

  async function load() {
    setLoading(true);
    try {
      const b = await fetchBackups();
      setBackups(b || []);
      const s = await getSettings();
      setSettingsState(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      await manualBackup();
      await load();
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleRestore = async (file) => {
    if (!confirm(`Bạn chắc chắn muốn phục hồi dữ liệu từ ${file.fileName}? Hành động này sẽ thay thế cơ sở dữ liệu hiện tại.`)) return;
    setLoading(true);
    try {
      await restoreBackup(file.fileName);
      alert('Restore initiated. Server may need a moment to complete.');
    } catch (err) {
      console.error(err);
      alert('Restore failed: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleToggleAuto = async () => {
    const newSettings = { ...settings, AutoBackupEnabled: !settings.AutoBackupEnabled };
    setSettingsState(newSettings);
    await updateSettings(newSettings);
  };

  const handleIntervalChange = async (e) => {
    const val = parseInt(e.target.value || '60', 10);
    const newSettings = { ...settings, AutoBackupIntervalMinutes: val };
    setSettingsState(newSettings);
    await updateSettings(newSettings);
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3>Quản lý dữ liệu (Sao lưu & Phục hồi)</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-panel">
            <div className="panel-row">
              <div>
                <strong>Thư mục sao lưu:</strong>
                <div className="muted">{settings.BackupFolder}</div>
              </div>
              <div>
                <strong>Backup tự động:</strong>
                <label className="switch">
                  <input type="checkbox" checked={!!settings.AutoBackupEnabled} onChange={handleToggleAuto} />
                  <span className="slider" />
                </label>
              </div>
              <div>
                <strong>Chu kỳ (phút):</strong>
                <input type="number" min="1" value={settings.AutoBackupIntervalMinutes || 60} onChange={handleIntervalChange} />
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary" onClick={handleManualBackup} disabled={loading}>Sao lưu thủ công</button>
              <button className="btn-ghost" onClick={load} disabled={loading}>Làm mới</button>
            </div>

            <div className="backup-list">
              <h4>Danh sách bản sao lưu</h4>
              {loading && <div>Đang tải...</div>}
              {!loading && backups.length === 0 && <div className="muted">Chưa có bản sao lưu</div>}
              <table>
                <thead>
                  <tr><th>Tệp</th><th>Kích thước</th><th>Ngày tạo (UTC)</th><th>Hành động</th></tr>
                </thead>
                <tbody>
                  {backups.map((b, i) => (
                    <tr key={i}>
                      <td>{b.fileName}</td>
                      <td>{(b.size/1024).toFixed(1)} KB</td>
                      <td>{new Date(b.created).toLocaleString()}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleRestore(b)}>Phục hồi</button>
                        <a className="btn-ghost" href={`/api/admin/backup/download?fileName=${encodeURIComponent(b.fileName)}`} target="_blank" rel="noreferrer">Tải</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
