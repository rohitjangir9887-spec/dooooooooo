import { useState, useMemo, useRef, useEffect } from 'react';
import { GitTreeItem } from '../lib/github';
import { 
  ChevronRight, ChevronDown, Folder, File, FileCode2, FileJson, 
  FileText, Image as ImageIcon, FileArchive, FileTerminal
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useVirtualizer } from '@tanstack/react-virtual';

interface RepoTreeProps {
  tree: GitTreeItem[];
  onSelect: (file: GitTreeItem) => void;
  selectedPath?: string;
  searchQuery?: string;
}

interface TreeNode {
  name: string;
  path: string;
  item?: GitTreeItem;
  children: { [key: string]: TreeNode };
  isFolder: boolean;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'java':
    case 'kt':
    case 'py':
    case 'rs':
    case 'go':
    case 'xml':
      return <FileCode2 className="w-4 h-4 text-blue-500" />;
    case 'json':
    case 'yml':
    case 'yaml':
      return <FileJson className="w-4 h-4 text-yellow-500" />;
    case 'md':
    case 'txt':
    case 'csv':
      return <FileText className="w-4 h-4 text-neutral-400" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    case 'zip':
    case 'tar':
    case 'gz':
      return <FileArchive className="w-4 h-4 text-red-400" />;
    case 'sh':
    case 'bash':
      return <FileTerminal className="w-4 h-4 text-green-500" />;
    default:
      return <File className="w-4 h-4 text-neutral-400" />;
  }
};

const buildTree = (items: GitTreeItem[]): TreeNode => {
  const root: TreeNode = { name: 'root', path: '', children: {}, isFolder: true };
  
  items.forEach(item => {
    const parts = item.path.split('/');
    let current = root;
    
    parts.forEach((part, i) => {
      if (!current.children[part]) {
        const isLast = i === parts.length - 1;
        current.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          item: isLast ? item : undefined,
          children: {},
          isFolder: !isLast || item.type === 'tree'
        };
      }
      current = current.children[part];
    });
  });
  
  return root;
};

const sortNodes = (a: TreeNode, b: TreeNode) => {
  if (a.isFolder && !b.isFolder) return -1;
  if (!a.isFolder && b.isFolder) return 1;
  return a.name.localeCompare(b.name);
};

interface FlatNode {
  id: string;
  node: TreeNode;
  level: number;
  isOpen: boolean;
}

export function RepoTree({ tree, onSelect, selectedPath, searchQuery }: RepoTreeProps) {
  const settings = useAppStore((state) => state.settings);
  
  const rootNode = useMemo(() => buildTree(tree), [tree]);

  const defaultExpanded = useMemo(() => {
    const set = new Set<string>();
    if (settings.autoExpandTree || searchQuery) {
      const traverse = (node: TreeNode, level: number) => {
        if (node.isFolder && (searchQuery || level < 2)) {
          set.add(node.path);
          Object.values(node.children).forEach(child => traverse(child, level + 1));
        }
      };
      Object.values(rootNode.children).forEach(child => traverse(child, 0));
    }
    return set;
  }, [rootNode, settings.autoExpandTree, searchQuery]);

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);
  
  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const flattenedTree = useMemo(() => {
    const result: FlatNode[] = [];
    const traverse = (node: TreeNode, level: number) => {
      const children = Object.values(node.children).sort(sortNodes);
      children.forEach(child => {
        const isFolder = child.isFolder;
        const isOpen = expanded.has(child.path);
        result.push({
          id: child.path,
          node: child,
          level,
          isOpen,
        });
        if (isFolder && isOpen) {
          traverse(child, level + 1);
        }
      });
    };
    traverse(rootNode, 0);
    return result;
  }, [rootNode, expanded]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flattenedTree.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="h-full w-full overflow-y-auto py-2">
      {flattenedTree.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No files found in this repository.
        </div>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const flatNode = flattenedTree[virtualRow.index];
            const { node, level, isOpen } = flatNode;
            const isSelected = selectedPath === node.path;

            const handleClick = () => {
              if (node.isFolder) toggleExpand(node.path);
              else if (node.item) onSelect(node.item);
            };

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div 
                  className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none transition-colors mx-1 rounded-md text-sm h-full
                    ${isSelected ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'}
                  `}
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                  onClick={handleClick}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {node.isFolder ? (
                      isOpen ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    ) : null}
                  </span>
                  
                  {node.isFolder ? (
                    <Folder className={`w-4 h-4 shrink-0 ${isOpen ? 'text-blue-500 fill-blue-500/20' : 'text-neutral-400 fill-neutral-400/20'}`} />
                  ) : (
                    getFileIcon(node.name)
                  )}
                  
                  <span className="truncate">{node.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
