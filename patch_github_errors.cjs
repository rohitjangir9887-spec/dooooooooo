const fs = require('fs');
const path = 'src/lib/github.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'if (res.status === 404) throw new Error("Repository does not exist (404) or is private.");',
  'if (res.status === 404) throw new Error("Repository not found (404). It might not exist or could be private.");'
);
code = code.replace(
  'if (res.status === 403) throw new Error("GitHub API rate limit exceeded (403).");',
  'if (res.status === 403) throw new Error("GitHub API rate limit hit! Please try again later.");'
);
code = code.replace(
  'if (res.status === 401) throw new Error("Private repository or unauthorized.");',
  'if (res.status === 401) throw new Error("Access denied (401). Private repositories are not accessible.");'
);
code = code.replace(
  'if (!res.ok) throw new Error("Failed to fetch repository tree.");',
  'if (!res.ok) {\n    if (res.status === 404) throw new Error("Repository branch or tree not found (404).");\n    if (res.status === 403) throw new Error("GitHub API rate limit hit!");\n    if (res.status === 409) throw new Error("Empty repository. No files found.");\n    throw new Error("Failed to fetch repository tree.");\n  }'
);
code = code.replace(
  'if (data.truncated) {',
  'if (data.tree.length === 0) throw new Error("Empty repository.");\n  if (data.truncated) {'
);
code = code.replace(
  'if (!res.ok) throw new Error("Failed to fetch file content.");',
  'if (!res.ok) throw new Error("Failed to fetch file content. Network or missing file.");'
);

fs.writeFileSync(path, code);
