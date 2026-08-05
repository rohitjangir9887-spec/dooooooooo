const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

const target = `{selectedFile && owner && repo && repoInfo ? (
            <FileViewer 
              file={selectedFile} 
              owner={owner} 
              repo={repo} 
              branch={repoInfo.default_branch}
              onClose={() => navigate(\`/\${owner}/\${repo}\`)}
            />
          ) : repoInfo ? (
            <RepoInfoView info={repoInfo} readme={readme} />
          ) : null}`;

const replacement = `<AnimatePresence mode="wait">
            {selectedFile && owner && repo && repoInfo ? (
              <motion.div 
                key="fileviewer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <FileViewer 
                  file={selectedFile} 
                  owner={owner} 
                  repo={repo} 
                  branch={repoInfo.default_branch}
                  onClose={() => navigate(\`/\${owner}/\${repo}\`)}
                />
              </motion.div>
            ) : repoInfo ? (
              <motion.div 
                key="repoinfo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <RepoInfoView info={repoInfo} readme={readme} />
              </motion.div>
            ) : null}
          </AnimatePresence>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Explorer.tsx', code);
