const fs = require('fs');

const path = 'src/store/useTaskStore.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "removeTask: (id: string) => void;\n}",
  "removeTask: (id: string) => void;\n  activeExportModal: string | null;\n  openExportModal: (id: string) => void;\n  closeExportModal: () => void;\n}"
);

code = code.replace(
  "removeTask: (id) => set((state) => ({\n    tasks: state.tasks.filter((t) => t.id !== id)\n  })),",
  "removeTask: (id) => set((state) => ({\n    tasks: state.tasks.filter((t) => t.id !== id)\n  })),\n  activeExportModal: null,\n  openExportModal: (id) => set({ activeExportModal: id }),\n  closeExportModal: () => set({ activeExportModal: null }),"
);

fs.writeFileSync(path, code);
