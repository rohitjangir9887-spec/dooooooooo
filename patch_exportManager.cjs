const fs = require('fs');
const path = 'src/lib/exportManager.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "onOpen: onOpenModal,",
  "onOpen: () => useTaskStore.getState().openExportModal(id),"
);

fs.writeFileSync(path, code);
