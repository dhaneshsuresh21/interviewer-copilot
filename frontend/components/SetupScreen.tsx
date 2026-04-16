'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/lib/store';
import {
  Briefcase, User, Building2, Award, AlertCircle, Play, Sparkles,
  BarChart3, FileText, LogOut, Mail, Phone, Upload, X, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import TemplateManager from './TemplateManager';
import { getInterviewerName, clearSession } from '@/lib/auth';
import type { InterviewSession } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function SetupScreen() {
  const { setInterviewContext, setInterviewActive, setInterviewState } = useInterviewStore();
  const router = useRouter();

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior' | 'lead'>('mid');
  const [jobDescription, setJobDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Past interview state
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const interviewerName = getInterviewerName();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  // Lookup past sessions debounced by 600ms after email/phone change
  const triggerLookup = useCallback((email: string, phone: string) => {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    // Clear any pending loading timer
    if ((triggerLookup as any).loadingTimer) {
      clearTimeout((triggerLookup as any).loadingTimer);
      (triggerLookup as any).loadingTimer = null;
    }
    lookupTimerRef.current = setTimeout(async () => {
      const emailTrim = email.trim();
      const phoneTrim = phone.trim();
      
      // Only show loading if there's actual input to lookup and after a short delay
      if (emailTrim || phoneTrim) {
        // Add a small delay to prevent flicker on fast typing
        const loadingTimer = setTimeout(() => setLookupLoading(true), 200);
        // Store timer ID so we can cancel if needed
        (triggerLookup as any).loadingTimer = loadingTimer;
      }
      
      try {
        if (!emailTrim && !phoneTrim) {
          setPastSessions([]);
          setLookupLoading(false);
          return;
        }
        const params = new URLSearchParams();
        if (emailTrim) params.set('email', emailTrim.toLowerCase());
        if (phoneTrim) params.set('phone', phoneTrim);
        const res = await fetch(`${BACKEND_URL}/api/candidates/lookup?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPastSessions(data.sessions || []);
        }
      } catch {
        // silently ignore network errors on lookup
      } finally {
        setLookupLoading(false);
        // Clear loading timer
        if ((triggerLookup as any).loadingTimer) {
          clearTimeout((triggerLookup as any).loadingTimer);
          (triggerLookup as any).loadingTimer = null;
        }
      }
    }, 600);
  }, []);

  const handleEmailChange = (val: string) => {
    setCandidateEmail(val);
    triggerLookup(val, candidatePhone);
    // Clear error after a short delay to avoid flicker
    if (errors.candidateEmail) {
      setTimeout(() => setErrors(prev => ({ ...prev, candidateEmail: '' })), 100);
    }
  };

  const handlePhoneChange = (val: string) => {
    setCandidatePhone(val);
    triggerLookup(candidateEmail, val);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current); };
  }, []);

  // Resume upload
  const handleFileSelect = async (file: File) => {
    setResumeFile(file);
    setResumeError('');
    setResumeText('');
    setResumeLoading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch(`${BACKEND_URL}/api/resume/parse`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setResumeText(data.text || '');
    } catch (e: any) {
      setResumeError(e.message);
      setResumeFile(null);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeText('');
    setResumeError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!candidateName.trim()) {
      newErrors.candidateName = 'Candidate name is required';
    } else if (candidateName.trim().length < 2) {
      newErrors.candidateName = 'Name must be at least 2 characters';
    }

    if (!candidateEmail.trim()) {
      newErrors.candidateEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail.trim())) {
      newErrors.candidateEmail = 'Enter a valid email address';
    }

    if (!candidatePhone.trim()) {
      newErrors.candidatePhone = 'Phone number is required';
    }

    if (!role.trim()) {
      newErrors.role = 'Role is required';
    } else if (role.trim().length < 3) {
      newErrors.role = 'Role must be at least 3 characters';
    }

    if (!company.trim()) {
      newErrors.company = 'Company name is required';
    } else if (company.trim().length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    }

    if (!skills.trim()) {
      newErrors.skills = 'At least one skill is required';
    } else {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length === 0) {
        newErrors.skills = 'At least one skill is required';
      } else if (skillList.some(s => s.length < 2)) {
        newErrors.skills = 'Each skill must be at least 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartInterview = () => {
    if (!validate()) return;

    const requiredSkills = skills.split(',').map(s => s.trim()).filter(Boolean);

    setInterviewContext({
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail.trim().toLowerCase(),
      candidatePhone: candidatePhone.trim(),
      role: role.trim(),
      company: company.trim(),
      requiredSkills,
      experienceLevel,
      jobDescription: jobDescription.trim() || undefined,
      candidateResume: resumeText || undefined,
    });

    setInterviewState('ASKING_QUESTION');
    setInterviewActive(true);
  };

  const handleSelectTemplate = (template: any) => {
    setRole(template.role);
    setCompany(template.company || '');
    setExperienceLevel(template.experienceLevel);
    setSkills(template.requiredSkills.join(', '));
    setJobDescription(template.jobDescription || '');
  };

  const inputClasses = (hasError: boolean) => `
    w-full px-4 py-3 
    bg-gray-800 border rounded-lg 
    text-white placeholder-gray-500
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-colors
    ${hasError ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'}
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">{interviewerName}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <FileText size={18} />
              <span className="text-sm font-medium">Templates</span>
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <BarChart3 size={18} />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-red-900/30 hover:border-red-700 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Copilot</h1>
          <p className="text-gray-400">Configure the interview details to get started</p>
        </div>

        {/* Past Interview Warning Banner */}
        {pastSessions.length > 0 && (
          <div className={`mb-4 rounded-xl border px-5 py-4 bg-amber-900/30 border-amber-600/50`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Past interview{pastSessions.length > 1 ? 's' : ''} detected within the last 6 months
                </p>
                <ul className="mt-1.5 space-y-1">
                  {pastSessions.map(s => (
                    <li key={s.id} className="text-xs text-amber-200/80">
                      {new Date(s.startTime).toLocaleDateString()} — <span className="font-medium">{s.role}</span> at {s.company}
                      {s.interviewerRecommendation && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-800/50 text-amber-300 font-medium capitalize">
                          {s.interviewerRecommendation.replace('_', ' ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-8 shadow-xl">
          <div className="space-y-5">
            {/* Candidate Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 text-blue-400" />
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (errors.candidateName) setErrors(prev => ({ ...prev, candidateName: '' }));
                }}
                className={inputClasses(!!errors.candidateName)}
                placeholder="John Doe"
              />
              {errors.candidateName && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.candidateName}
                </p>
              )}
            </div>

            {/* Email & Phone Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={inputClasses(!!errors.candidateEmail)}
                  placeholder="john@example.com"
                />
                {errors.candidateEmail && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.candidateEmail}
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 text-teal-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={inputClasses(!!errors.candidatePhone)}
                  placeholder="+1 555 000 0000"
                />
                {errors.candidatePhone && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.candidatePhone}
                  </p>
                )}
              </div>
            </div>

            {/* Role & Company Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                  }}
                  className={inputClasses(!!errors.role)}
                  placeholder="Senior Engineer"
                />
                {errors.role && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.role}
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Building2 className="w-4 h-4 text-green-400" />
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors(prev => ({ ...prev, company: '' }));
                  }}
                  className={inputClasses(!!errors.company)}
                  placeholder="Acme Corp"
                />
                {errors.company && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.company}
                  </p>
                )}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Experience Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'junior', label: 'Junior', sub: '0-2 yrs' },
                  { value: 'mid', label: 'Mid', sub: '3-5 yrs' },
                  { value: 'senior', label: 'Senior', sub: '6-10 yrs' },
                  { value: 'lead', label: 'Lead', sub: '10+ yrs' },
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setExperienceLevel(level.value as any)}
                    className={`py-3 px-2 rounded-lg border text-center transition-all ${
                      experienceLevel === level.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-sm font-medium">{level.label}</div>
                    <div className="text-xs opacity-70">{level.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Required Skills
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => {
                  setSkills(e.target.value);
                  if (errors.skills) setErrors(prev => ({ ...prev, skills: '' }));
                }}
                className={inputClasses(!!errors.skills)}
                placeholder="React, TypeScript, Node.js, System Design"
              />
              {errors.skills ? (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.skills}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500">Separate skills with commas</p>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Job Description <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={3}
                className={`${inputClasses(false)} resize-none`}
                placeholder="Brief job description or key responsibilities..."
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Resume <span className="text-gray-500">(optional — PDF or TXT, max 5 MB)</span>
              </label>

              {resumeFile ? (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-indigo-500/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-sm text-white truncate">{resumeFile.name}</span>
                    {resumeLoading && (
                      <span className="text-xs text-gray-400 animate-pulse shrink-0">Parsing…</span>
                    )}
                    {!resumeLoading && resumeText && (
                      <span className="text-xs text-green-400 shrink-0">✓ Extracted</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={removeResume}
                    className="ml-3 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-6 bg-gray-800 border-2 border-dashed border-gray-600 hover:border-indigo-500/60 rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-500" />
                  <p className="text-sm text-gray-400">
                    Drag & drop or <span className="text-indigo-400 font-medium">browse</span>
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {resumeError && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {resumeError}
                </p>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={resumeLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 px-6 rounded-lg font-semibold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Interview
            </button>
          </div>
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplates && (
        <TemplateManager
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
