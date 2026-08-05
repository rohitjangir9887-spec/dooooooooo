import { useAppStore } from '../store/useAppStore';
import { CopyFallbackModal } from './CopyFallbackModal';

export function GlobalCopyModal() {
  const data = useAppStore(state => state.fallbackData);
  const setFallbackData = useAppStore(state => state.setFallbackData);

  if (!data) return null;

  return <CopyFallbackModal data={data} onClose={() => setFallbackData(null)} />;
}
