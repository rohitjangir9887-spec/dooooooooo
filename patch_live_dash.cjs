const fs = require('fs');
let code = fs.readFileSync('src/components/LiveDashboard.tsx', 'utf8');

code = code.replace(
  'const openJobModal = useTaskStore(state => state.openJobModal);',
  'const openJobModal = useTaskStore(state => state.setJobsListOpen);'
);

fs.writeFileSync('src/components/LiveDashboard.tsx', code);
