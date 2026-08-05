const fs = require('fs');
let code = fs.readFileSync('src/store/useTaskStore.ts', 'utf8');

if (!code.includes('isJobsListOpen')) {
  code = code.replace(
    '  closeJobModal: () => void;',
    '  closeJobModal: () => void;\n  isJobsListOpen: boolean;\n  setJobsListOpen: (open: boolean) => void;'
  );

  code = code.replace(
    '  closeJobModal: () => set({ activeJobModal: null }),',
    '  closeJobModal: () => set({ activeJobModal: null }),\n  isJobsListOpen: false,\n  setJobsListOpen: (open) => set({ isJobsListOpen: open }),'
  );
  fs.writeFileSync('src/store/useTaskStore.ts', code);
}
