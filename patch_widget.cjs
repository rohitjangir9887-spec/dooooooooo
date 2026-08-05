const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundTasksWidget.tsx', 'utf8');

code = code.replace(
  'const tasks = useTaskStore(state => state.tasks);',
  'const tasks = useTaskStore(state => state.tasks);\n  const openJobModal = useTaskStore(state => state.openJobModal);'
);

code = code.replace(
  /<div key=\{task.id\} className="p-3 bg-neutral-50 dark:bg-neutral-800\/50 rounded-lg border border-neutral-100 dark:border-neutral-800">/g,
  '<div key={task.id} onClick={() => openJobModal(task.id)} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">'
);

fs.writeFileSync('src/components/BackgroundTasksWidget.tsx', code);
