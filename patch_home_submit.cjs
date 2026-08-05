const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

const submitOld = `
      const owner = parts[0];
      const repo = parts[1];
      handleNavigateRepo(owner, repo);
    } else {
      setError("Invalid GitHub repository URL. Example: https://github.com/facebook/react");
    }
  };
`;

const submitNew = `
      const owner = parts[0];
      const repo = parts[1];
      
      const { incrementUsage, addToast, userProfile } = useAppStore.getState();
      if (!incrementUsage('repos')) {
        addToast(\`Daily limit reached for your \${userProfile.planId} plan. Upgrade to continue.\`, 'error');
        navigate('/plans');
        return;
      }
      
      navigate(\`/\${owner}/\${repo}\`);
    } else {
      setError("Invalid GitHub repository URL. Example: https://github.com/facebook/react");
    }
  };
`;

code = code.replace(submitOld, submitNew);
// Note: we already have handleNavigateRepo in Home.tsx. But wait! I replaced navigate(owner, repo) in handleSubmit with handleNavigateRepo. Let me just replace the exact code that is there now.

fs.writeFileSync(path, code);
