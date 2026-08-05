const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "export interface HistoryItem {",
  "export interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }\nexport interface HistoryItem {"
);

code = code.replace(
  "clearHistory: () => void;\n}",
  "clearHistory: () => void;\n  toasts: Toast[];\n  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;\n  removeToast: (id: string) => void;\n}"
);

code = code.replace(
  "clearHistory: () => set({ history: [] }),",
  "clearHistory: () => set({ history: [] }),\n      toasts: [],\n      addToast: (message, type = 'info') => set(state => { const id = Math.random().toString(36).substring(2); setTimeout(() => state.removeToast(id), 3000); return { toasts: [...state.toasts, { id, message, type }] }; }),\n      removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),"
);

fs.writeFileSync(path, code);
