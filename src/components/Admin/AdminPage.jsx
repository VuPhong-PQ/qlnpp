import React, { useEffect, useState } from 'react';
import { fetchBackups, manualBackup, restoreBackup, getSettings, updateSettings, getInfo, getBackupFiles, uploadBackupFile, getBackupHistory, testBackup, deleteSalesData, scheduleBackup } from '../../utils/adminApi';
import './Admin.css';

export default function AdminPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettingsState] = useState({ BackupFolder: './Backups', AutoBackupEnabled: false, AutoBackupIntervalMinutes: 60 });
  const [info, setInfo] = useState(null);
  const [backupFiles, setBackupFiles] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [salesDataConfirmation, setSalesDataConfirmation] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState('daily');
  const today = new Date();
  const pad = (n) => n.toString().padStart(2,'0');
  const defaultDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const [scheduleDate, setScheduleDate] = useState(defaultDate);
  const [scheduleTime, setScheduleTime] = useState(settings.ScheduledTime || '02:00');

  async function load() {
    setLoading(true);
    try {
      const [b, s, i, files, history] = await Promise.all([
        fetchBackups(),
        getSettings(),
        getInfo(),
        getBackupFiles(),
        getBackupHistory()
      ]);
      setBackups(b || []);
      setSettingsState(s || settings);
      if (s && s.ScheduledTime) setScheduleTime(s.ScheduledTime);
      setInfo(i || null);
      setBackupFiles(files || []);
      setBackupHistory(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

    const handleManualBackup = async () => {
      setLoading(true);
      try {
        await manualBackup();
        await load();
        alert('Backup created successfully');
      } catch (err) {
        console.error(err);
        alert('Backup failed');
      } finally { setLoading(false); }
    };

    const handleRestore = async (fileName) => {
      if (!fileName) { alert('Vui lòng chọn file để phục hồi'); return; }
      if (!confirm(`Bạn chắc chắn muốn phục hồi dữ liệu từ ${fileName}? Hành động này sẽ thay thế cơ sở dữ liệu hiện tại.`)) return;
      setLoading(true);
      try {
        const result = await restoreBackup(fileName);
        if (result && result.success) {
          alert('Phục hồi dữ liệu thành công!');
          await load();
        } else {
          throw new Error(result?.error || 'Restore failed');
        }
      } catch (err) {
        console.error(err);
        const errorMsg = err?.message || err?.error || 'Lỗi không xác định';
        alert('Phục hồi thất bại: ' + errorMsg);
      } finally { setLoading(false); }
    };

    const handleFileUpload = async (file) => {
      if (!file) return;
      
      // Validate file type
      if (!file.name.endsWith('.bak') && !file.name.endsWith('.sql')) {
        alert('Chỉ hỗ trợ file .bak hoặc .sql');
        return;
      }
      
      // Validate file size (max 1GB)
      if (file.size > 1000000000) {
        alert('File quá lớn (tối đa 1GB)');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Uploading file:', file.name, file.size, 'bytes');
        const res = await uploadBackupFile(file);
        console.log('Upload response:', res);
        
        if (res && res.success) {
          const displayName = res.fileName || file.name;
          setUploadedFile(displayName);
          await load();
          if (res.fileName && res.fileName !== file.name) {
            alert(`Upload thành công! File đã được đổi tên thành: ${res.fileName}`);
          } else {
            alert('Upload thành công');
          }
        } else {
          throw new Error(res?.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        const errorMsg = err?.message || err?.error || 'Lỗi không xác định';
        alert('Upload thất bại: ' + errorMsg);
      } finally { 
        setLoading(false); 
      }
    };

  const handleDeleteSalesData = async () => {
    if (salesDataConfirmation !== 'DELETE SALES DATA') { alert('Vui lòng nhập chính xác "DELETE SALES DATA"'); return; }
    setLoading(true);
    try {
      const res = await deleteSalesData(salesDataConfirmation);
      if (res && res.success) {
        alert('Xóa dữ liệu bán hàng thành công');
        await load();
      } else {
        throw new Error(res?.error || 'Unknown');
      }
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại: ' + (err.message || err));
    } finally { setLoading(false); }
  };

  return (
    <div className="manage-data-page">
      <div className="page-header">
        <h1>Quản Lý Dữ Liệu</h1>
        <div className="page-actions">
          <button className="btn-ghost">Kiểm tra kết nối</button>
          <button className="btn-ghost">Cấp quyền</button>
        </div>
      </div>

      <div className="info-card">
        <div className="info-left">
          <div className="info-title">Thông Tin Database</div>
          <div className="info-row"><strong>Tên Database</strong><span>{info?.database ?? '-'}</span></div>
          <div className="info-row"><strong>Kích Thước</strong><span>—</span></div>
        </div>
        <div className="info-right">
          <div className="info-row"><strong>Server</strong><span>{info?.server ?? '-'}</span></div>
          <div className="info-row"><strong>Backup Cuối</strong><span>{info?.lastBackupUtc ? new Date(info.lastBackupUtc).toLocaleString() + (info?.lastBackupFile ? ' (Auto)' : '') : 'Chưa có'}</span></div>
        </div>
      </div>

      <div className="manage-grid">
        <div className="card backup-card">
          <h3>🡇 Sao Lưu Dữ Liệu</h3>
          <div className="backup-options">
            <label className="option">
              <input type="radio" name="method" defaultChecked />
              <div>
                <div className="opt-title">Lưu trên Server</div>
                <div className="muted">Lưu file backup trên server</div>
              </div>
            </label>
            <label className="option">
              <input type="radio" name="method" />
              <div>
                <div className="opt-title">Download về máy</div>
                <div className="muted">Tải trực tiếp về máy local</div>
              </div>
            </label>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="btn-ghost" onClick={()=> setShowSchedule(s => !s)}>Đặt lịch backup</button>
              <div className="muted">{showSchedule ? 'Đang chỉnh lịch' : ''}</div>
            </div>
          </div>
          
          {showSchedule && (
            <div className="schedule-box">
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <label>Loại lịch:</label>
                <select value={scheduleType} onChange={(e)=> setScheduleType(e.target.value)}>
                  <option value="daily">Hàng ngày</option>
                  <option value="once">Một lần</option>
                </select>
                <label>Giờ:</label>
                <input type="time" value={scheduleTime} onChange={(e)=> setScheduleTime(e.target.value)} />
                {scheduleType === 'once' && (
                  <>
                    <label>Ngày:</label>
                    <input type="date" value={scheduleDate} onChange={(e)=> setScheduleDate(e.target.value)} />
                  </>
                )}
                <button className="btn-primary" onClick={async ()=>{
                  if (scheduleType === 'daily') {
                    // save as daily schedule
                    const newSettings = {...settings, AutoBackupEnabled: true, UseDailySchedule: true, ScheduledTime: scheduleTime };
                    try {
                      await updateSettings(newSettings);
                      setSettingsState(newSettings);
                      alert('Lưu lịch hàng ngày thành công');
                      setShowSchedule(false);
                    } catch (err) { console.error(err); alert('Lưu thất bại'); }
                  } else {
                    // schedule once
                    try {
                      const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
                      const res = await scheduleBackup(scheduledAt);
                      if (res && res.success) {
                        alert('Đã đặt lịch thực hiện backup một lần vào ' + scheduledAt);
                        setShowSchedule(false);
                      } else {
                        throw new Error(res?.error || 'Lỗi');
                      }
                    } catch (err) { console.error(err); alert('Đặt lịch thất bại: ' + (err.message || err)); }
                  }
                }}>Lưu</button>
                <button className="btn-ghost" onClick={()=> setShowSchedule(false)}>Hủy</button>
              </div>
            </div>
          )}
          <div className="path-input">
            <label>Đường dẫn sao lưu (tùy chọn)</label>
            <input placeholder="Để trống sẽ dùng đường dẫn mặc định" value={settings.BackupFolder || ''} onChange={(e)=> setSettingsState({...settings, BackupFolder: e.target.value})} />
            <div className="muted">Mặc định: {settings.BackupFolder}</div>
          </div>

          <div className="card-actions">
            <button className="btn-primary" onClick={handleManualBackup}>Tạo Backup</button>
            <button className="btn-ghost" onClick={load}>Làm mới</button>
            <button className="btn-ghost" onClick={async ()=>{
              try {
                await updateSettings(settings);
                alert('Lưu cấu hình thành công');
              } catch (err) { console.error(err); alert('Lưu thất bại'); }
            }}>Lưu cấu hình</button>
          </div>
        </div>

        <div className="card restore-card">
          <h3>🔺 Phục Hồi Dữ Liệu</h3>
          <div className="alert">Cảnh báo: Phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại!</div>
            <div className="restore-controls">
              <div className="muted">Chọn file backup có sẵn trên server:</div>
              <select className="full-width" onChange={(e)=> setInfo(prev=>prev)}>
                <option value="">-- Chọn file --</option>
                {backupFiles.map((f, idx) => (
                  <option key={idx} value={f.filePath}>{f.fileName} ({(f.size/1024).toFixed(1)} KB)</option>
                ))}
              </select>

              <div style={{marginTop:8}}>Hoặc upload file mới:</div>
              <label className="upload-box">
                <input 
                  type="file" 
                  accept=".bak,.sql" 
                  onChange={async (e)=> { 
                    const file = e.target.files?.[0]; 
                    if(file) {
                      console.log('File selected:', file.name, file.size);
                      await handleFileUpload(file);
                      e.target.value = ''; // Reset input
                    }
                  }} 
                />
                <span>Click để chọn file hoặc kéo thả</span>
              </label>

              {uploadedFile && <div className="muted">Đã upload: {uploadedFile}</div>}

              <div className="restore-actions" style={{marginTop:10}}>
                <button className="btn-primary" onClick={async ()=>{ const f = backupFiles[0]; if(f) await handleRestore(f.fileName); else if (uploadedFile) alert('Vui lòng chọn file đã upload hoặc file trong danh sách'); else alert('Không có file backup'); }}>Phục Hồi Database</button>
              </div>
            </div>
        </div>
      </div>

      <div className="history-card card">
        <h3>🕓 Lịch Sử Backup</h3>
        <table className="history-table">
          <tbody>
            {backupHistory.length > 0 ? (
              backupHistory.map((b, i) => {
                const downloadUrl = `/api/admin/backup/download?fileName=${encodeURIComponent(b.fileName)}`;
                return (
                  <tr key={i}>
                    <td>{new Date(b.backupDate).toLocaleString()}</td>
                    <td><span className="chip">{b.backupType}</span></td>
                    <td className="font-mono text-xs">{b.fileName}</td>
                    <td>{b.fileSizeMB.toFixed(2)} MB</td>
                    <td><span className={`status ${b.status === 'Success' ? 'success' : 'failed'}`}>{b.status === 'Success' ? 'Thành công' : 'Thất bại'}</span></td>
                    <td className="muted">{b.note}</td>
                    <td><a className="btn-ghost" href={downloadUrl} target="_blank" rel="noreferrer">Download</a></td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={7} className="muted">Chưa có bản sao lưu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
