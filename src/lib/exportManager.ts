import { useTaskStore } from '../store/useTaskStore';
import { GitTreeItem } from './github';
import { useAppStore } from '../store/useAppStore';

class ExportManager {
  workers: Map<string, Worker> = new Map();

  startExport(owner: string, repo: string, branch: string, tree: GitTreeItem[], onOpenModal: () => void) {
    const id = `export-${owner}-${repo}`;
    const files = tree.filter(t => t.type === 'blob');
      const estimatedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    
    // If completed or already running, just open modal
    const existing = useTaskStore.getState().tasks.find(t => t.id === id);
    if (existing) {
      if (existing.status === 'success') {
        onOpenModal();
        return;
      }
      if (existing.status === 'running' || existing.status === 'paused') {
        onOpenModal();
        return;
      }
    }

    const worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), { type: 'module' });
    this.workers.set(id, worker);

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'PROGRESS') {
        useTaskStore.getState().updateTask(id, {
          progress: Math.round((payload.processed / payload.total) * 100),
          details: `${payload.processed} of ${payload.total} files (${(payload.bytesProcessed / 1024 / 1024).toFixed(2)} MB)`,
          processedFiles: payload.processed,
          totalFiles: payload.total,
          bytesProcessed: payload.bytesProcessed
        });
      } else if (type === 'DONE') {
        useTaskStore.getState().updateTask(id, {
          status: 'success',
          progress: 100,
          details: 'Ready to export'
        });
      } else if (type === 'PAUSED') {
        useTaskStore.getState().updateTask(id, { status: 'paused' });
      } else if (type === 'CANCELED') {
        useTaskStore.getState().updateTask(id, { status: 'canceled' });
        worker.terminate();
        this.workers.delete(id);
        useTaskStore.getState().removeTask(id);
      } else if (type === 'ERROR') {
        useTaskStore.getState().updateTask(id, { status: 'error', errorMsg: payload.error });
      }
    };

    useTaskStore.getState().addTask({
      id,
      name: 'Repository Export',
      repo: `${owner}/${repo}`,
      status: 'running',
      progress: 0,
      details: 'Starting export...',
      startTime: Date.now(),
      totalBytes: estimatedBytes,
      owner,
      repoName: repo,
      branch,
      files,
      onPause: () => worker.postMessage({ type: 'PAUSE' }),
      onResume: () => {
        useTaskStore.getState().updateTask(id, { status: 'running' });
        worker.postMessage({ type: 'RESUME', payload: { owner, repo, branch, files, isAuthenticated: useAppStore.getState().isAuthenticated } });
      },
      onCancel: () => worker.postMessage({ type: 'CANCEL' }),
      onRetry: () => {
        useTaskStore.getState().updateTask(id, { status: 'running', errorMsg: undefined });
        worker.postMessage({ type: 'RESUME', payload: { owner, repo, branch, files, isAuthenticated: useAppStore.getState().isAuthenticated } });
      },
      onOpen: () => useTaskStore.getState().openExportModal(id),
    });

    worker.postMessage({
      type: 'START',
      payload: { owner, repo, branch, files, isAuthenticated: useAppStore.getState().isAuthenticated }
    });
  }

  getWorker(owner: string, repo: string) {
    return this.workers.get(`export-${owner}-${repo}`);
  }
}

export const exportManager = new ExportManager();
