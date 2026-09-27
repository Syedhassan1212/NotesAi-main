import React, { useState, useEffect } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Clock, BookOpen, FolderGit2, ExternalLink, 
  Github, Calendar
} from 'lucide-react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function LearningPage() {
  const { openQuickAction, refreshKey, onRefresh } = useOutletContext<OutletContextType>();
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const activeSub = pathParts[3] || 'study';

  const [activeTab, setActiveTab] = useState<'study' | 'courses' | 'projects'>(
    (activeSub as any) || 'study'
  );

  useEffect(() => {
    if (pathParts[3]) {
      setActiveTab(pathParts[3] as any);
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'study' | 'courses' | 'projects') => {
    setActiveTab(tab);
    navigate(`/me/learning/${tab}`);
  };

  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);

  // Course modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cProvider, setCProvider] = useState('');
  const [cProgress, setCProgress] = useState('0');
  const [cStatus, setCStatus] = useState('In Progress');
  const [cTargetDate, setCTargetDate] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Project modal state
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pStatus, setPStatus] = useState('In Progress');
  const [pProgress, setPProgress] = useState('0');
  const [pTechStack, setPTechStack] = useState('');
  const [pRepoUrl, setPRepoUrl] = useState('');
  const [pDeployUrl, setPDeployUrl] = useState('');
  const [pDeadline, setPDeadline] = useState('');

  // Course status filter
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sessRes, courseRes, projRes] = await Promise.all([
        meApi.getStudySessions(),
        meApi.getCourses(),
        meApi.getProjects()
      ]);
      setSessions(sessRes);
      setCourses(courseRes);
      setProjects(projRes);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load learning data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Delete handlers
  const handleDeleteSession = async (id: string) => {
    try {
      await meApi.deleteStudySession(id);
      toast.success('Study session deleted');
      setSessions(prev => prev.filter(s => s.id !== id));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete session');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await meApi.deleteCourse(id);
      toast.success('Course deleted');
      setCourses(prev => prev.filter(c => c.id !== id));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await meApi.deleteProject(id);
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p.id !== id));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete project');
    }
  };

  // Quick update handlers
  const handleUpdateCourseProgress = async (id: string, delta: number) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const newProgress = Math.min(100, Math.max(0, (course.progress || 0) + delta));
    const newStatus = newProgress === 100 ? 'Completed' : (newProgress > 0 ? 'In Progress' : course.status);
    try {
      const updated = await meApi.updateCourse(id, { progress: newProgress, status: newStatus });
      setCourses(prev => prev.map(c => c.id === id ? updated : c));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update course progress');
    }
  };

  const handleUpdateProjectProgress = async (id: string, delta: number) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const newProgress = Math.min(100, Math.max(0, (project.progress || 0) + delta));
    const newStatus = newProgress === 100 ? 'Completed' : project.status;
    try {
      const updated = await meApi.updateProject(id, { progress: newProgress, status: newStatus });
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update project progress');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    try {
      await meApi.createCourse({
        name: cName,
        provider: cProvider,
        progress: parseInt(cProgress) || 0,
        status: cStatus,
        targetDate: cTargetDate || undefined,
        notes: cNotes
      });
      toast.success(`Course ${cName} saved`);
      setCourseModalOpen(false);
      setCName('');
      setCProvider('');
      setCProgress('0');
      setCNotes('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create course');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) return;
    try {
      const stack = pTechStack.split(',').map(s => s.trim()).filter(Boolean);
      await meApi.createProject({
        name: pName,
        description: pDescription,
        status: pStatus,
        progress: parseInt(pProgress) || 0,
        techStack: stack,
        repoUrl: pRepoUrl,
        deployUrl: pDeployUrl,
        deadline: pDeadline || undefined
      });
      toast.success(`Project ${pName} created`);
      setProjModalOpen(false);
      setPName('');
      setPDescription('');
      setPTechStack('');
      setPRepoUrl('');
      setPDeployUrl('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create project');
    }
  };

  // Computations
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isToday = (d: string) => {
    const dt = new Date(d);
    return dt.toDateString() === now.toDateString();
  };

  const todayMinutes = sessions
    .filter(s => isToday(s.date))
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const weekMinutes = sessions
    .filter(s => new Date(s.date) >= startOfWeek)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const monthMinutes = sessions
    .filter(s => new Date(s.date) >= startOfMonth)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  // Subject breakdown
  const subjectTotals: Record<string, number> = {};
  sessions.forEach(s => {
    const sub = s.subject || 'General';
    subjectTotals[sub] = (subjectTotals[sub] || 0) + (Number(s.duration) || 0);
  });
  const sortedSubjects = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  const activeCoursesCount = courses.filter(c => c.status === 'In Progress').length;
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;

  const filteredCourses = courses.filter(c => {
    if (courseStatusFilter === 'all') return true;
    return c.status === courseStatusFilter;
  });

  const filteredProjects = projects.filter(p => {
    if (projectStatusFilter === 'all') return true;
    return p.status === projectStatusFilter;
  });

  return (
    <div className="flex flex-col w-full"><div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline-border">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Learning & Intellectual Capital</h2>
          <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
            Study volume tracking, course curricula completion, and technical builds.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto scrollbar-none">
          {(['study', 'courses', 'projects'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3.5 py-1 rounded-full font-label-md text-label-md capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              {tab === 'study' ? 'Study Hours' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface-card p-4 rounded-xl border border-hairline-border">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Today's Deep Work</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-primary">
            {(todayMinutes / 60).toFixed(1)} hrs
          </span>
          <span className="text-[11px] text-text-tertiary block mt-0.5">{todayMinutes} minutes</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-hairline-border">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Weekly Study Volume</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {(weekMinutes / 60).toFixed(1)} hrs
          </span>
          <span className="text-[11px] text-text-tertiary block mt-0.5">{(monthMinutes / 60).toFixed(1)} hrs this month</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-hairline-border">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Active Courses</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {activeCoursesCount} <span className="text-xs font-normal text-text-tertiary">of {courses.length} enrolled</span>
          </span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-hairline-border">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Active Projects</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-purple-600 dark:text-purple-400">
            {activeProjectsCount} <span className="text-xs font-normal text-text-tertiary">in flight</span>
          </span>
        </div>
      </div>

      {/* Tab: STUDY */}
      {activeTab === 'study' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">Study Sessions & Focus Logs</h3>
            </div>
            <button
              onClick={() => openQuickAction('study')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-hairline-border text-on-surface font-label-md text-label-md transition-all"
            >
              <Plus size={15} />
              <span>Log Study Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject Distribution */}
            <div className="bg-surface-card p-5 rounded-2xl border border-hairline-border space-y-4">
              <h4 className="font-title-sm text-title-sm text-on-surface font-medium">Subject Breakdown</h4>
              {sortedSubjects.length === 0 ? (
                <p className="font-body-sm text-body-sm text-text-tertiary py-6 text-center">No study sessions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedSubjects.map(([subj, mins]) => {
                    const totalMins = sortedSubjects.reduce((acc, [, m]) => acc + m, 0);
                    const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
                    return (
                      <div key={subj} className="space-y-1">
                        <div className="flex justify-between font-body-sm text-body-sm">
                          <span className="text-on-surface font-medium">{subj}</span>
                          <span className="text-text-secondary font-code-sm text-xs">{(mins / 60).toFixed(1)}h ({pct}%)</span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sessions List */}
            <div className="lg:col-span-2 space-y-3">
              {sessions.length === 0 ? (
                <div className="bg-surface-card p-8 rounded-2xl border border-hairline-border text-center text-text-tertiary space-y-2">
                  <p className="font-body-md text-body-md">No study sessions found</p>
                  <button
                    onClick={() => openQuickAction('study')}
                    className="text-primary hover:underline font-label-md text-label-md"
                  >
                    Log your first study session
                  </button>
                </div>
              ) : (
                sessions.map(s => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-surface-card border border-hairline-border hover:border-surface-container-high transition-all flex items-start justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">{s.subject}</span>
                        {s.studyType && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20 font-code-sm text-[11px]">
                            {s.studyType}
                          </span>
                        )}
                        <span className="font-code-sm text-[11px] text-text-tertiary">
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                        {s.startTime && (
                          <span className="font-code-sm text-[11px] text-text-tertiary">
                            {s.startTime} {s.endTime ? `- ${s.endTime}` : ''}
                          </span>
                        )}
                      </div>
                      {s.notes && (
                        <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">{s.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-code-md text-code-md font-semibold text-primary">
                        {s.duration} mins
                      </span>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-text-tertiary hover:text-error transition-colors p-1 opacity-60 group-hover:opacity-100"
                        title="Delete session"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">Curricula & Courses</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-hairline-border text-xs">
                {['all', 'In Progress', 'Completed', 'Paused', 'Not Started'].map(st => (
                  <button
                    key={st}
                    onClick={() => setCourseStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md transition-all capitalize ${
                      courseStatusFilter === st 
                        ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                        : 'text-text-tertiary hover:text-on-surface'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCourseModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-hairline-border text-on-surface font-label-md text-label-md transition-all"
              >
                <Plus size={15} />
                <span>Add Course</span>
              </button>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-surface-card p-8 rounded-2xl border border-hairline-border text-center text-text-tertiary space-y-2">
              <p className="font-body-md text-body-md">No courses found matching criteria</p>
              <button
                onClick={() => setCourseModalOpen(true)}
                className="text-primary hover:underline font-label-md text-label-md"
              >
                Add your first course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => {
                const prog = course.progress || 0;
                return (
                  <div
                    key={course.id}
                    className="p-5 rounded-2xl bg-surface-card border border-hairline-border hover:border-surface-container-high transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-title-sm text-title-sm font-semibold text-on-surface leading-tight">
                            {course.name}
                          </h4>
                          {course.provider && (
                            <span className="font-body-sm text-body-sm text-text-tertiary block mt-0.5">
                              {course.provider}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-code-sm text-[11px] font-medium shrink-0 ${
                          course.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : course.status === 'In Progress'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : course.status === 'Paused'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20' 
                        }`}>
                          {course.status}
                        </span>
                      </div>

                      {course.notes && (
                        <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                          {course.notes}
                        </p>
                      )}

                      {course.targetDate && (
                        <div className="flex items-center gap-1.5 text-text-tertiary font-code-sm text-[11px]">
                          <Calendar size={13} />
                          <span>Target: {new Date(course.targetDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-hairline-border">
                      <div className="flex items-center justify-between text-xs font-code-sm">
                        <span className="text-text-tertiary">Completion</span>
                        <span className="font-semibold text-on-surface">{prog}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${prog}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateCourseProgress(course.id, -5)}
                            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                            title="-5%"
                          >
                            -5%
                          </button>
                          <button
                            onClick={() => handleUpdateCourseProgress(course.id, 5)}
                            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                            title="+5%"
                          >
                            +5%
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-text-tertiary hover:text-error transition-colors p-1 opacity-50 group-hover:opacity-100"
                          title="Delete course"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FolderGit2 size={18} className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">Technical Builds & Projects</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-hairline-border text-xs">
                {['all', 'In Progress', 'Planning', 'Idea', 'Completed', 'Archived'].map(st => (
                  <button
                    key={st}
                    onClick={() => setProjectStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md transition-all capitalize ${
                      projectStatusFilter === st 
                        ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                        : 'text-text-tertiary hover:text-on-surface'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setProjModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-hairline-border text-on-surface font-label-md text-label-md transition-all"
              >
                <Plus size={15} />
                <span>Add Project</span>
              </button>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-surface-card p-8 rounded-2xl border border-hairline-border text-center text-text-tertiary space-y-2">
              <p className="font-body-md text-body-md">No projects found matching criteria</p>
              <button
                onClick={() => setProjModalOpen(true)}
                className="text-primary hover:underline font-label-md text-label-md"
              >
                Add your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(proj => {
                const prog = proj.progress || 0;
                return (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-surface-card border border-hairline-border hover:border-surface-container-high transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-title-sm text-title-sm font-semibold text-on-surface leading-tight">
                          {proj.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md font-code-sm text-[11px] font-medium shrink-0 ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : proj.status === 'In Progress'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : proj.status === 'Planning'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                            : proj.status === 'Idea'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20' 
                        }`}>
                          {proj.status}
                        </span>
                      </div>

                      {proj.description && (
                        <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                          {proj.description}
                        </p>
                      )}

                      {/* Tech stack tags */}
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.techStack.map((tech: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/15 font-code-sm text-[11px]">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* External links */}
                      <div className="flex items-center gap-3 pt-1 text-text-tertiary text-xs">
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-on-surface transition-colors"
                          >
                            <Github size={13} />
                            <span>Code</span>
                          </a>
                        )}
                        {proj.deployUrl && (
                          <a
                            href={proj.deployUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <ExternalLink size={13} />
                            <span>Live</span>
                          </a>
                        )}
                        {proj.deadline && (
                          <span className="font-code-sm text-[11px]">
                            Due: {new Date(proj.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-hairline-border">
                      <div className="flex items-center justify-between text-xs font-code-sm">
                        <span className="text-text-tertiary">Progress</span>
                        <span className="font-semibold text-on-surface">{prog}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${prog}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateProjectProgress(proj.id, -5)}
                            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                            title="-5%"
                          >
                            -5%
                          </button>
                          <button
                            onClick={() => handleUpdateProjectProgress(proj.id, 5)}
                            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-text-secondary transition-colors"
                            title="+5%"
                          >
                            +5%
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-text-tertiary hover:text-error transition-colors p-1 opacity-50 group-hover:opacity-100"
                          title="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Add Course</h3>
              <button onClick={() => setCourseModalOpen(false)} className="text-text-tertiary hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Specialization"
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Provider / Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. Coursera, MIT"
                    value={cProvider}
                    onChange={e => setCProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Status</label>
                  <select
                    value={cStatus}
                    onChange={e => setCStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Initial Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cProgress}
                    onChange={e => setCProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={cTargetDate}
                    onChange={e => setCTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Notes / Objective</label>
                <textarea
                  rows={2}
                  value={cNotes}
                  onChange={e => setCNotes(e.target.value)}
                  placeholder="Key takeaways or syllabus notes..."
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-sm font-medium"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {projModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Add Project</h3>
              <button onClick={() => setProjModalOpen(false)} className="text-text-tertiary hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed KV Store"
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short summary of architecture or problem solved..."
                  value={pDescription}
                  onChange={e => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Status</label>
                  <select
                    value={pStatus}
                    onChange={e => setPStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Initial Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pProgress}
                    onChange={e => setPProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Go, Raft, gRPC, React"
                  value={pTechStack}
                  onChange={e => setPTechStack(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Repo URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={pRepoUrl}
                    onChange={e => setPRepoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Deployment URL</label>
                  <input
                    type="url"
                    placeholder="https://app.com..."
                    value={pDeployUrl}
                    onChange={e => setPDeployUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Deadline</label>
                <input
                  type="date"
                  value={pDeadline}
                  onChange={e => setPDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-hairline-border text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-accent-hover text-on-primary text-sm font-medium"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
