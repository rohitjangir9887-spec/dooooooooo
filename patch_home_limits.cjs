const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const favorites = useAppStore((state) => state.favorites);',
  `const favorites = useAppStore((state) => state.favorites);
  const incrementUsage = useAppStore((state) => state.incrementUsage);
  const addToast = useAppStore((state) => state.addToast);
  const userProfile = useAppStore((state) => state.userProfile);`
);

code = code.replace(
  'navigate(`/${parts[0]}/${parts[1]}`);',
  `if (!incrementUsage('repos')) {
            addToast(\`Daily limit reached for your \${userProfile.planId} plan. Upgrade to continue.\`, 'error');
            navigate('/settings');
            return;
          }
          navigate(\`/\${parts[0]}/\${parts[1]}\`);`
);

fs.writeFileSync(path, code);
