import { RepoInfo } from '../lib/github';
import { 
  Star, GitFork, AlertCircle, Eye, Scale, Calendar, 
  Database, Github, BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';

interface RepoInfoProps {
  info: RepoInfo;
  readme: string | null;
}

export function RepoInfoView({ info, readme }: RepoInfoProps) {
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
  };

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-6">
            {info.owner.avatar_url && (
              <img 
                src={info.owner.avatar_url} 
                alt={info.owner.login} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-md border border-neutral-100 dark:border-neutral-800"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50 truncate mb-2">
                {info.name}
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
                {info.description || "No description provided."}
              </p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Stars</span>
                  <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{formatNumber(info.stargazers_count)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /> Forks</span>
                  <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{formatNumber(info.forks_count)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Issues</span>
                  <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{formatNumber(info.open_issues_count)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Watchers</span>
                  <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{formatNumber(info.subscribers_count)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {info.language && (
              <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                {info.language}
              </span>
            )}
            {info.license && (
              <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                <Scale className="w-4 h-4" />
                {info.license.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
              <Database className="w-4 h-4" />
              {formatSize(info.size)}
            </span>
            <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4" />
              Updated {formatDistanceToNow(new Date(info.updated_at))} ago
            </span>
            <a 
              href={`https://github.com/${info.owner.login}/${info.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-1.5 rounded-lg ml-auto font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>

        {/* README Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900/50">
             <BookOpen className="w-5 h-5 text-neutral-500" />
             <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">README.md</h2>
          </div>
          <div className="p-6 md:p-8">
            {readme ? (
              <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-img:rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readme}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-12">
                No README found for this repository.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
