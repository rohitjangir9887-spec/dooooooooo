const fs = require('fs');
const path = 'src/components/ExportModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const formatNumStr = `{charCount > 1000000 ? (charCount / 1000000).toFixed(1) + 'M' : charCount > 1000 ? (charCount / 1000).toFixed(1) + 'K' : charCount} chars`;

const oldBtn = `<button onClick={() => handleCopy()} className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>`;
const newBtn = `<div className="flex items-center gap-3">
                        <button onClick={() => handleCopy()} className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <span className="text-sm text-neutral-500 font-medium">${formatNumStr}</span>
                      </div>`;

code = code.replace(oldBtn, newBtn);

fs.writeFileSync(path, code);
