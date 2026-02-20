export interface InterviewerSession {
  username: string;
  name: string;
  loginTime: number;
}

export function getSession(): InterviewerSession | null {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem('interviewer-session');
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function setSession(session: InterviewerSession): void {
  localStorage.setItem('interviewer-session', JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem('interviewer-session');
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getInterviewerName(): string {
  const session = getSession();
  return session?.name || '';
}
