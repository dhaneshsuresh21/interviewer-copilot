'use client';

import { Loader2, LucideIcon, Sparkles } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

interface StreamingPanelProps {
  icon: LucideIcon;
  title: string;
  iconColor: string;
  accentColor?: string;
  isLoading: boolean;
  content: string;
  emptyMessage: string;
  children?: ReactNode;
}

// Simple markdown-like parser for AI responses
function parseContent(text: string): ReactNode[] {
  if (!text) return [];
  
  const elements: ReactNode[] = [];
  const lines = text.split('\n');
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag 
          key={`list-${elements.length}`} 
          className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1.5 my-3 text-gray-300`}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed pl-1">
              {formatInlineText(item)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }
    
    // Headers (## or bold at start)
    if (/^#{1,3}\s/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^(#{1,3})/)?.[1].length || 2;
      const text = trimmed.replace(/^#{1,3}\s*/, '');
      const sizes = { 1: 'text-base', 2: 'text-sm', 3: 'text-sm' };
      elements.push(
        <h3 key={`h-${i}`} className={`${sizes[level as 1|2|3]} font-semibold text-white mt-4 mb-2 first:mt-0`}>
          {text}
        </h3>
      );
      continue;
    }
    
    // Bullet list
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*•]\s*/, ''));
      continue;
    }
    
    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+[.)]\s*/, ''));
      continue;
    }
    
    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-gray-300 leading-relaxed my-2 first:mt-0">
        {formatInlineText(trimmed)}
      </p>
    );
  }
  
  flushList();
  return elements;
}

// Format inline text (bold, italic, code)
function formatInlineText(text: string): ReactNode {
  // Split by bold (**text**) and inline code (`code`)
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining) {
    // Check for bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    
    // Find which comes first
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : -1;
    
    if (boldIndex === -1 && codeIndex === -1) {
      // No more formatting
      parts.push(remaining);
      break;
    }
    
    // Process whichever comes first
    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      if (boldIndex > 0) {
        parts.push(remaining.slice(0, boldIndex));
      }
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch![1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch![0].length);
    } else if (codeIndex !== -1) {
      if (codeIndex > 0) {
        parts.push(remaining.slice(0, codeIndex));
      }
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs font-mono text-blue-300">
          {codeMatch![1]}
        </code>
      );
      remaining = remaining.slice(codeIndex + codeMatch![0].length);
    }
  }
  
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function StreamingPanel({
  icon: Icon,
  title,
  iconColor,
  accentColor = 'purple',
  isLoading,
  content,
  emptyMessage,
  children,
}: StreamingPanelProps) {
  const parsedContent = useMemo(() => parseContent(content), [content]);
  
  const gradients: Record<string, string> = {
    purple: 'from-purple-500/10 to-transparent',
    blue: 'from-blue-500/10 to-transparent',
    yellow: 'from-yellow-500/10 to-transparent',
    green: 'from-green-500/10 to-transparent',
  };
  
  const borders: Record<string, string> = {
    purple: 'border-purple-500/30',
    blue: 'border-blue-500/30',
    yellow: 'border-yellow-500/30',
    green: 'border-green-500/30',
  };

  return (
    <div className={`bg-gray-800/80 backdrop-blur rounded-xl border ${content ? borders[accentColor] : 'border-gray-700/50'} flex flex-col h-full overflow-hidden shadow-lg transition-all duration-300`}>
      {/* Header with gradient */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-700/50 shrink-0 bg-gradient-to-r ${gradients[accentColor]}`}>
        <div className={`p-1.5 rounded-lg bg-gray-700/50`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5">
            <Sparkles className={`w-3 h-3 ${iconColor} animate-pulse`} />
            <span className="text-xs text-gray-400">Thinking...</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !content ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradients[accentColor]} flex items-center justify-center mx-auto`}>
                  <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                </div>
                <div className={`absolute inset-0 w-12 h-12 rounded-full border-2 ${borders[accentColor]} animate-ping mx-auto opacity-20`} />
              </div>
              <p className="text-xs text-gray-500">Analyzing response...</p>
            </div>
          </div>
        ) : content ? (
          <div className="p-4">
            {children || (
              <div className="prose prose-invert prose-sm max-w-none">
                {parsedContent}
                {isLoading && (
                  <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle rounded-sm" />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-2">
              <div className={`w-10 h-10 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto`}>
                <Icon className={`w-5 h-5 text-gray-600`} />
              </div>
              <p className="text-gray-500 text-sm">{emptyMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
