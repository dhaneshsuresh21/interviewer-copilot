'use client';

import { useState, useEffect } from 'react';
import { StickyNote, Flag, Star, Trash2, Plus, X } from 'lucide-react';

interface Note {
  id?: string;
  content: string;
  type: 'note' | 'flag' | 'highlight';
  timestamp: number;
}

interface NotesPanelProps {
  sessionId?: string;
}

export default function NotesPanel({ sessionId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'flag' | 'highlight'>('note');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadNotes();
    }
  }, [sessionId]);

  const loadNotes = async () => {
    if (!sessionId) return;
    
    // Validate sessionId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      console.error('Invalid session ID format');
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        console.error('Failed to load notes:', res.statusText);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note: Note = {
      content: newNote.trim(),
      type: noteType,
      timestamp: Date.now()
    };

    setNewNote('');

    // Save to backend if session exists
    if (sessionId) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note)
        });
        
        if (res.ok) {
          await loadNotes(); // Reload to get ID and ensure sync
        } else {
          console.error('Failed to save note:', res.statusText);
          // Add locally as fallback
          setNotes([...notes, note]);
        }
      } catch (error) {
        console.error('Failed to save note:', error);
        // Add locally as fallback
        setNotes([...notes, note]);
      }
    } else {
      // Add locally if no session
      setNotes([...notes, note]);
    }
  };

  const handleDeleteNote = async (noteId: string, index: number) => {
    // Delete from backend first if it has an ID
    if (noteId && sessionId) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notes/${noteId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          // Remove locally only after successful backend deletion
          setNotes(notes.filter((_, i) => i !== index));
        } else {
          console.error('Failed to delete note:', res.statusText);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    } else {
      // Remove locally if no ID (not saved to backend yet)
      setNotes(notes.filter((_, i) => i !== index));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flag':
        return <Flag size={16} className="text-red-400" />;
      case 'highlight':
        return <Star size={16} className="text-yellow-400" />;
      default:
        return <StickyNote size={16} className="text-blue-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flag':
        return 'border-red-500/30 bg-red-500/10';
      case 'highlight':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all z-40"
      >
        <StickyNote size={20} />
        <span className="font-medium">Notes</span>
        {notes.length > 0 && (
          <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
            {notes.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl z-40 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <StickyNote size={20} className="text-blue-400" />
          <h3 className="font-semibold text-white">Interview Notes</h3>
          {notes.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
              {notes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.map((note, index) => (
          <div
            key={note.id || index}
            className={`p-3 rounded-lg border ${getTypeColor(note.type)}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {getIcon(note.type)}
                <span className="text-xs text-gray-400">
                  {new Date(note.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => handleDeleteNote(note.id!, index)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-200">{note.content}</p>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <StickyNote size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs">Add notes during the interview</p>
          </div>
        )}
      </div>

      {/* Add Note Form */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setNoteType('note')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              noteType === 'note'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <StickyNote size={16} />
            Note
          </button>
          <button
            onClick={() => setNoteType('flag')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              noteType === 'flag'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flag size={16} />
            Flag
          </button>
          <button
            onClick={() => setNoteType('highlight')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              noteType === 'highlight'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Star size={16} />
            Highlight
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
