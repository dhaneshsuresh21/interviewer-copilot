'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, StarOff, X, Save } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  role: string;
  company?: string;
  experienceLevel: string;
  requiredSkills: string[];
  jobDescription?: string;
  isDefault: boolean;
}

interface TemplateManagerProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export default function TemplateManager({ onSelectTemplate, onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const url = editingTemplate.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/templates/${editingTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/templates`;
      
      const method = editingTemplate.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });

      if (res.ok) {
        await loadTemplates();
        setEditingTemplate(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${id}`, {
        method: 'DELETE'
      });
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      role: '',
      company: '',
      experienceLevel: 'mid',
      requiredSkills: [],
      jobDescription: '',
      isDefault: false
    });
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-white">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Interview Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Create Button */}
          {!isCreating && !editingTemplate && (
            <button
              onClick={handleCreateNew}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus size={20} />
              Create New Template
            </button>
          )}

          {/* Edit/Create Form */}
          {(isCreating || editingTemplate) && (
            <div className="mb-6 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {isCreating ? 'Create Template' : 'Edit Template'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate?.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Senior Engineer - Tech Corp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <input
                      type="text"
                      value={editingTemplate?.role || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, role: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                    <input
                      type="text"
                      value={editingTemplate?.company || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, company: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
                  <select
                    value={editingTemplate?.experienceLevel || 'mid'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, experienceLevel: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editingTemplate?.requiredSkills?.join(', ') || ''}
                    onChange={(e) => setEditingTemplate({ 
                      ...editingTemplate, 
                      requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Description (optional)</label>
                  <textarea
                    value={editingTemplate?.jobDescription || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, jobDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Brief job description..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={editingTemplate?.isDefault || false}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-300">Set as default template</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveTemplate}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Save size={18} />
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreating(false);
                    }}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates List */}
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      {template.isDefault && (
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p><span className="text-gray-500">Role:</span> {template.role}</p>
                      {template.company && <p><span className="text-gray-500">Company:</span> {template.company}</p>}
                      <p><span className="text-gray-500">Level:</span> {template.experienceLevel}</p>
                      <p><span className="text-gray-500">Skills:</span> {template.requiredSkills.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && !isCreating && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">No templates yet</p>
                <p className="text-sm">Create your first template to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
