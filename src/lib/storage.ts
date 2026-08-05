import localforage from 'localforage';

localforage.config({
  name: 'GitHubExplorerProduction',
  storeName: 'app_persistence',
  version: 1,
  description: 'Production robust IndexedDB storage for GitHub Explorer'
});

export const idbStorage = {
  getItem: async (name: string): Promise<any> => {
    try {
      const val = await localforage.getItem(name);
      return val;
    } catch (err) {
      console.error('IDB getItem error:', err);
      return null;
    }
  },
  setItem: async (name: string, value: any): Promise<void> => {
    try {
      await localforage.setItem(name, value);
      localStorage.setItem('last_sync_timestamp', Date.now().toString());
    } catch (err) {
      console.error('IDB setItem error:', err);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
    } catch (err) {
      console.error('IDB removeItem error:', err);
    }
  }
};

export async function getStorageMetrics() {
  let idbSize = '0 KB';
  let cacheSize = '0 KB';
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        if (estimate.usage > 1024 * 1024) {
          idbSize = (estimate.usage / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
          idbSize = (estimate.usage / 1024).toFixed(2) + ' KB';
        }
      }
    }

    let totalKeys = 0;
    await localforage.iterate(() => {
      totalKeys++;
    });
    cacheSize = `${totalKeys} items stored`;
  } catch (e) {
    console.error('Error calculating storage metrics:', e);
  }

  const lastSync = localStorage.getItem('last_sync_timestamp') 
    ? new Date(Number(localStorage.getItem('last_sync_timestamp'))).toLocaleString() 
    : 'Just now';

  return { idbSize, cacheSize, lastSync };
}

export async function exportAllLocalData() {
  try {
    const data: Record<string, any> = {};
    await localforage.iterate((value, key) => {
      data[key] = value;
    });
    data['localStorage_snapshot'] = {
      last_sync: localStorage.getItem('last_sync_timestamp')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-explorer-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Export failed:', err);
    return false;
  }
}

export async function importLocalData(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    for (const [key, value] of Object.entries(data)) {
      if (key === 'localStorage_snapshot') {
        if (value && typeof value === 'object') {
          for (const [k, v] of Object.entries(value)) {
            localStorage.setItem(k, String(v));
          }
        }
      } else {
        await localforage.setItem(key, value);
      }
    }
    window.location.reload();
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}
