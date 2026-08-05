const fs = require('fs');
const path = 'src/components/ExportModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "function ModeCard({ id, title, desc, active, onClick }: { id: string, title: string, desc: string, active: boolean, onClick: () => void }) {",
  "function ModeCard({ id, title, desc, active, onClick, disabled }: { id: string, title: string, desc: string, active: boolean, onClick: () => void, disabled?: boolean }) {"
);

code = code.replace(
  "className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${",
  "className={`p-4 rounded-xl border-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${"
);

code = code.replace(
  "<h4 className=\"font-semibold text-sm\">{title}</h4>",
  "<h4 className=\"font-semibold text-sm flex items-center gap-1\">{title} {disabled && <span className=\"text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300\">PRO</span>}</h4>"
);

// Add disabled prop to minified and chunked modes
code = code.replace(
  "active={exportMode === 'minified'} onClick={() => isFreePlan ? addToast('Minified copy requires Pro plan or higher', 'error') : updateSettings({ exportMode: 'minified' })}",
  "active={exportMode === 'minified'} disabled={isFreePlan} onClick={() => isFreePlan ? addToast('Minified copy requires Pro plan or higher', 'error') : updateSettings({ exportMode: 'minified' })}"
);
code = code.replace(
  "active={exportMode === 'chunked'} onClick={() => isFreePlan ? addToast('Chunked copy requires Pro plan or higher', 'error') : updateSettings({ exportMode: 'chunked' })}",
  "active={exportMode === 'chunked'} disabled={isFreePlan} onClick={() => isFreePlan ? addToast('Chunked copy requires Pro plan or higher', 'error') : updateSettings({ exportMode: 'chunked' })}"
);

fs.writeFileSync(path, code);
