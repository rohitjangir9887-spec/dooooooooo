const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

const lastPart = `          )}
        </div>
      </motion.div>
    </div>
  );
}`;

const replaceWith = `          )}
        </div>
        
        <div className="w-full mt-8">
          <LiveDashboard />
        </div>
        
      </motion.div>
    </div>
  );
}`;

code = code.replace(lastPart, replaceWith);

code = code.replace(
  'className="w-full max-w-2xl z-10 flex flex-col items-center"',
  'className="w-full max-w-4xl z-10 flex flex-col items-center"'
);

fs.writeFileSync(path, code);
