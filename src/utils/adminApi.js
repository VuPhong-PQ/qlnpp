const base = '/api/admin';

export async function fetchBackups() {
  const r = await fetch(base + '/backups');
  return await r.json();
}

export async function manualBackup() {
  const r = await fetch(base + '/backup/manual', { method: 'POST' });
  const responseText = await r.text();
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error('Invalid JSON response: ' + responseText);
  }
  
  if (!r.ok) {
    throw new Error(result.error || result.message || `HTTP ${r.status}`);
  }
  
  return result;
}

export async function restoreBackup(fileName) {
  const r = await fetch(base + '/backup/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName }) });
  
  // Read response once and handle both success and error cases
  const responseText = await r.text();
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error('Invalid JSON response: ' + responseText);
  }
  
  if (!r.ok) {
    throw new Error(result.error || result.message || `HTTP ${r.status}`);
  }
  
  return result;
}

export async function getSettings() {
  const r = await fetch(base + '/settings');
  return await r.json();
}

export async function updateSettings(settings) {
  const r = await fetch(base + '/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
  const responseText = await r.text();
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error('Invalid JSON response: ' + responseText);
  }
  
  if (!r.ok) {
    throw new Error(result.error || result.message || `HTTP ${r.status}`);
  }
  
  return result;
}

export async function getInfo() {
  const r = await fetch(base + '/info');
  return await r.json();
}

export async function getBackupFiles() {
  const r = await fetch(base + '/backup-files');
  return await r.json();
}

export async function uploadBackupFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  
  try {
    const r = await fetch(base + '/upload', { method: 'POST', body: fd });
    
    // Read response once and handle both success and error cases
    const responseText = await r.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response: ' + responseText);
    }
    
    if (!r.ok) {
      throw new Error(result.error || result.message || `HTTP ${r.status}`);
    }
    
    
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function getBackupHistory() {
  const r = await fetch(base + '/history');
  return await r.json();
}

export async function testBackup() {
  const r = await fetch(base + '/settings/test', { method: 'POST' });
  const responseText = await r.text();
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error('Invalid JSON response: ' + responseText);
  }
  
  if (!r.ok) {
    throw new Error(result.error || result.message || `HTTP ${r.status}`);
  }
  
  return result;
}

export async function deleteSalesData(confirmationText) {
  const r = await fetch(base + '/delete-sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationText }) });
  return await r.json();
}

export async function scheduleBackup(scheduledAt) {
  const r = await fetch(base + '/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduledAt }) });
  return await r.json();
}
