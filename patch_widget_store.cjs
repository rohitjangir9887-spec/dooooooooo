const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundTasksWidget.tsx', 'utf8');

code = code.replace(
  'const [isOpen, setIsOpen] = useState(false);',
  'const isOpen = useTaskStore(state => state.isJobsListOpen);\n  const setIsOpen = useTaskStore(state => state.setJobsListOpen);'
);

fs.writeFileSync('src/components/BackgroundTasksWidget.tsx', code);
