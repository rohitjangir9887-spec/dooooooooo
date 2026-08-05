import { useAppStore } from '../store/useAppStore';
import streamSaver from 'streamsaver';

export interface SmartCopyOptions {
  filenameFallback: string;
  minified?: string;
  structure?: string;
}

export async function smartCopy(text: string, options: SmartCopyOptions) {
  const { addToast, setFallbackData } = useAppStore.getState();
  
  try {
    await navigator.clipboard.writeText(text);
    addToast(`Copied to clipboard ✓ (${text.length.toLocaleString()} chars)`, 'success');
  } catch (error: any) {
    console.error("Clipboard copy failed:", error);
    
    // Check if it's a permission issue
    const isPermissionError = error.name === 'NotAllowedError' || (error.message && error.message.toLowerCase().includes('permission'));
    
    if (isPermissionError) {
      addToast('Clipboard permission denied — check browser settings', 'error');
    } else {
      addToast('Content too large for clipboard.', 'info');
      setFallbackData({
        text,
        filename: options.filenameFallback,
        minified: options.minified,
        structure: options.structure
      });
    }
  }
}

export function triggerDownloadFallback(text: string, filename: string) {
  const fileStream = streamSaver.createWriteStream(filename);
  const writer = fileStream.getWriter();
  writer.write(new TextEncoder().encode(text)).then(() => {
    writer.close();
  });
}
