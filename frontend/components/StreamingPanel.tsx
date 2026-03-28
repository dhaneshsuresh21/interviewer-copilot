'use client';

import { Loader2, LucideIcon, Sparkles } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

// ─── Pre-compiled regexes (compiled once at module load) ────────────────────
const RE_HEADING   = /^(#{1,3})\s+(.*)/;
const RE_BULLET    = /^[-*•]\s+(.*)/;
const RE_NUMBERED  = /^\d+[.)]\s+(.*)/;
const RE_BOLD      = /\*\*(.+?)\*\*/g;
const RE_CODE      = /`([^`]+)`/g;

// ─── Lookup maps (allocated once, never re-created) ─────────────────────────
const GRADIENTS: Record<string, string> = {
  purple: 'from-purple-500/10 to-transparent',
  blue:   'from-blue-500/10 to-transparent',
  yellow: 'from-yellow-500/10 to-transparent',
  green:  'from-green-500/10 to-transparent',
};

const BORDERS: Record<string, string> = {
  purple: 'border-purple-500/30',
  blue:   'border-blue-500/30',
  yellow: 'border-yellow-500/30',
  green:  'border-green-500/30',
};

const HEADING_SIZES: Record<1 | 2 | 3, string> = {
  1: 'text-base',
  2: 'text-sm',
  3: 'text-sm',
};

// ─── Inline formatter ────────────────────────────────────────────────────────
function formatInlineText(text: string): ReactNode {
  // Fast path — skip regex work if no markers present
  if (!text.includes('**') && !text.includes('`')) return text;

  const parts: ReactNode[] = [];
  // Reset lastIndex (global regexes are stateful)
  RE_BOLD.lastIndex = 0;
  RE_CODE.lastIndex = 0;

  let pos = 0;

  // Collect all matches with their positions in one pass
  const matches: Array<{ index: number; len: number; node: ReactNode }> = [];

  let m: RegExpExecArray | null;
  RE_BOLD.lastIndex = 0;
  while ((m = RE_BOLD.exec(text)) !== null) {
    matches.push({
      index: m.index,
      len:   m[0].length,
      node:  <strong key={`b${m.index}`} className="font-semibold text-white">{m[1]}</strong>,
    });
  }
  RE_CODE.lastIndex = 0;
  while ((m = RE_CODE.exec(text)) !== null) {
    matches.push({
      index: m.index,
      len:   m[0].length,
      node:  <code key={`c${m.index}`} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs font-mono text-blue-300">{m[1]}</code>,
    });
  }

  // Sort by position so we walk the string left-to-right once
  matches.sort((a, b) => a.index - b.index);

  for (const match of matches) {
    if (match.index < pos) continue; // overlapping — skip
    if (match.index > pos) parts.push(text.slice(pos, match.index));
    parts.push(match.node);
    pos = match.index + match.len;
  }
  if (pos < text.length) parts.push(text.slice(pos));

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ─── Block parser ─────────────────────────────────────────────────────────────
function parseContent(text: string): ReactNode[] {
  if (!text) return [];

  const elements: ReactNode[] = [];
  const lines    = text.split('\n');
  let listItems: string[]        = [];
  let listType:  'ul' | 'ol' | null = null;

  const flushList = () => {
    if (!listItems.length || !listType) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag
        key={`list-${elements.length}`}
        className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1.5 my-3 text-gray-300`}
      >
        {listItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed pl-1">
            {formatInlineText(item)}
          </li>
        ))}
      </Tag>
    );
    listItems = [];
    listType  = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) { flushList(); continue; }

    let hm: RegExpMatchArray | null;
    if ((hm = trimmed.match(RE_HEADING))) {
      flushList();
      const level = Math.min(hm[1].length, 3) as 1 | 2 | 3;
      elements.push(
        <h3 key={`h-${i}`} className={`${HEADING_SIZES[level]} font-semibold text-white mt-4 mb-2 first:mt-0`}>
          {hm[2]}
        </h3>
      );
      continue;
    }

    let bm: RegExpMatchArray | null;
    if ((bm = trimmed.match(RE_BULLET))) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(bm[1]);
      continue;
    }

    let nm: RegExpMatchArray | null;
    if ((nm = trimmed.match(RE_NUMBERED))) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(nm[1]);
      continue;
    }

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

// ─── Component ───────────────────────────────────────────────────────────────
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
  // Only parse once streaming finishes — zero parsing cost while characters arrive
  const parsedContent = useMemo(
    () => (isLoading ? [] : parseContent(content)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading], // re-run only when streaming ends, not on every character
  );

  const gradient = GRADIENTS[accentColor] ?? GRADIENTS.purple;
  const border   = BORDERS[accentColor]   ?? BORDERS.purple;

  return (
    <div className={`bg-gray-800/80 backdrop-blur rounded-xl border ${content ? border : 'border-gray-700/50'} flex flex-col h-full overflow-hidden shadow-lg transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-700/50 shrink-0 bg-gradient-to-r ${gradient}`}>
        <div className="p-1.5 rounded-lg bg-gray-700/50">
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !content ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto`}>
                  <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                </div>
                <div className={`absolute inset-0 w-12 h-12 rounded-full border-2 ${border} animate-ping mx-auto opacity-20`} />
              </div>
              <p className="text-xs text-gray-500">Analyzing response...</p>
            </div>
          </div>
        ) : content ? (
          <div className="p-4">
            {children ?? (
              <div className="prose prose-invert prose-sm max-w-none">
                {isLoading ? (
                  // Raw text during streaming — no parsing, no extra nodes
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {content}
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle rounded-sm" />
                  </p>
                ) : (
                  <>{parsedContent}</>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">{emptyMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}