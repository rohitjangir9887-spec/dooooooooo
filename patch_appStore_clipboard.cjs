const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "removeToast: (id: string) => void;\n}",
  "removeToast: (id: string) => void;\n  fallbackData: any | null;\n  setFallbackData: (data: any | null) => void;\n}"
);

code = code.replace(
  "removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),",
  "removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),\n      fallbackData: null,\n      setFallbackData: (data) => set({ fallbackData: data }),"
);

fs.writeFileSync(path, code);
