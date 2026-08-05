const fs = require('fs');
let code = fs.readFileSync('src/store/useTaskStore.ts', 'utf8');

code = code.replace(
  '  onOpen?: () => void;\n}',
  `  onOpen?: () => void;
  startTime?: number;
  totalFiles?: number;
  processedFiles?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}`
);

code = code.replace(
  '  closeExportModal: () => void;\n}',
  `  closeExportModal: () => void;
  activeJobModal: string | null;
  openJobModal: (id: string) => void;
  closeJobModal: () => void;
}`
);

code = code.replace(
  '  closeExportModal: () => set({ activeExportModal: null }),\n}));',
  `  closeExportModal: () => set({ activeExportModal: null }),
  activeJobModal: null,
  openJobModal: (id) => set({ activeJobModal: id }),
  closeJobModal: () => set({ activeJobModal: null }),
}));`
);

fs.writeFileSync('src/store/useTaskStore.ts', code);
