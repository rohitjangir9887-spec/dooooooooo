const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const navigate = useNavigate();',
  `const navigate = useNavigate();
  const handleNavigateRepo = (owner: string, repo: string) => {
    if (!useAppStore.getState().incrementUsage('repos')) {
      useAppStore.getState().addToast(\`Daily limit reached for your plan. Upgrade to continue.\`, 'error');
      navigate('/settings');
      return;
    }
    navigate(\`/\${owner}/\${repo}\`);
  };`
);

// We must revert the previous patch to navigate first, or just replace `navigate(` with `handleNavigateRepo(` where appropriate.

code = code.replace(/navigate\(\`\/\$\{parts\[0\]\}\/\$\{parts\[1\]\}\`\);/g, 'handleNavigateRepo(parts[0], parts[1]);');
code = code.replace(/navigate\(\`\/\$\{owner\}\/\$\{repo\}\`\);/g, 'handleNavigateRepo(owner, repo);');
code = code.replace(/navigate\(\`\/\$\{item\.owner\}\/\$\{item\.repo\}\`\)/g, 'handleNavigateRepo(item.owner, item.repo)');
code = code.replace(/navigate\(\`\/\$\{fav\.owner\}\/\$\{fav\.repo\}\`\)/g, 'handleNavigateRepo(fav.owner, fav.repo)');

// Revert that extra block we inserted previously
code = code.replace(/if \(\!incrementUsage\('repos'\)\) \{\n\s*addToast\(\`Daily limit reached.*?\n\s*navigate\('\/settings'\);\n\s*return;\n\s*\}/g, '');

fs.writeFileSync(path, code);
