const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Replace the history mapping block
code = code.replace(
  /history\.slice\(0, 6\)\.map\(\(item, index\) => \(\s*<button[\s\S]*?<\/button>\s*\)\)/g,
  `history.slice(0, 6).map((item, index) => (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      key={index} 
                      onClick={() => handleNavigateRepo(item.owner, item.repo)} 
                      className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl hover:bg-white dark:hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Clock className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div className="flex flex-col items-start truncate">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{item.repo}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.owner}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))`
);

// Replace the favorites mapping block
code = code.replace(
  /favorites\.map\(\(item, index\) => \(\s*<button[\s\S]*?<\/button>\s*\)\)/g,
  `favorites.map((item, index) => (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      key={index} 
                      onClick={() => handleNavigateRepo(item.owner, item.repo)} 
                      className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl hover:bg-white dark:hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        </div>
                        <div className="flex flex-col items-start truncate">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{item.repo}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.owner}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))`
);

fs.writeFileSync('src/pages/Home.tsx', code);
