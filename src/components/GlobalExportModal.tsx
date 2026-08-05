import { useTaskStore } from '../store/useTaskStore';
import { ExportModal } from './ExportModal';

export function GlobalExportModal() {
  const activeExportModal = useTaskStore((state) => state.activeExportModal);
  const tasks = useTaskStore((state) => state.tasks);
  const closeExportModal = useTaskStore((state) => state.closeExportModal);

  if (!activeExportModal) return null;

  const task = tasks.find(t => t.id === activeExportModal);
  if (!task || !task.owner || !task.repoName || !task.branch || !task.files) return null;

  return (
    <ExportModal
      taskId={task.id}
      owner={task.owner}
      repo={task.repoName}
      branch={task.branch}
      files={task.files}
      onClose={closeExportModal}
    />
  );
}
