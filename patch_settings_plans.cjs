const fs = require('fs');
const path = 'src/pages/Settings.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldSection = `
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Available Plans</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(PLANS).map(plan => (
                  <div key={plan.id} className={\`p-4 rounded-xl border-2 transition-all \${userProfile.planId === plan.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'}\`}>
                    <h5 className="font-bold text-lg mb-1">{plan.name}</h5>
                    <div className="text-xl font-bold mb-3">{plan.price}</div>
                    <ul className="text-sm space-y-2 mb-4 text-neutral-600 dark:text-neutral-400">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <span>{f}</span></li>
                      ))}
                    </ul>
                    {userProfile.planId !== plan.id && (
                      <button onClick={() => handlePlanChange(plan.id as PlanId)} className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                        Select Plan
                      </button>
                    )}
                    {userProfile.planId === plan.id && (
                      <div className="w-full py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold text-center">
                        Current Plan
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>`;

const newSection = `
            <div className="flex justify-end pt-2">
               <button onClick={() => navigate('/plans')} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors">
                 Manage / Upgrade Plan
               </button>
            </div>
`;

code = code.replace(oldSection, newSection);

fs.writeFileSync(path, code);
