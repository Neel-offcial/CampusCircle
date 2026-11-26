import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Download,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  BookOpen,
  FolderOpen,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all' (every group across campus) or 'my' (enrolled groups only)
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [search, setSearch] = useState('');

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/my?scope=${scope}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [scope]);

  const handleToggleComplete = async (assignmentId) => {
    try {
      const res = await api.post(`/assignments/${assignmentId}/toggle-complete`);
      setAssignments(prev =>
        prev.map(a => a._id === assignmentId ? { ...a, isCompleted: res.data.isCompleted } : a)
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Deadline calculation helper
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { label: 'Overdue', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' };
    }
    if (diffDays === 0) {
      return { label: 'Due Today', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };
    }
    if (diffDays === 1) {
      return { label: 'Due Tomorrow', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };
    }
    if (diffDays <= 3) {
      return { label: `Due in ${diffDays} days`, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' };
    }
    return { label: `Due ${due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  };

  const filteredAssignments = assignments.filter(item => {
    if (statusFilter === 'pending' && item.isCompleted) return false;
    if (statusFilter === 'completed' && !item.isCompleted) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.groupName?.toLowerCase().includes(q) ||
        item.facultyName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck size={24} className="text-indigo-600" />
            Central Assignments & Task Tracker
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Aggregated course assignments and lab submissions across all college groups
          </p>
        </div>

        {/* Scope Switcher: All Campus Groups vs My Enrolled */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              scope === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Campus Assignments
          </button>
          <button
            onClick={() => setScope('my')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              scope === 'my'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            My Enrolled Groups
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === f
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'all' ? 'All Tasks' : f} ({assignments.filter(a => f === 'all' ? true : f === 'completed' ? a.isCompleted : !a.isCompleted).length})
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, title or group..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No assignments match your filter or search query.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((item) => {
            const deadlineStatus = getDeadlineStatus(item.deadline);

            return (
              <div
                key={item._id}
                className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(item._id)}
                    className="mt-1 flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                    title="Toggle Personal Task Completion"
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 size={22} className="text-emerald-500" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        {item.subject}
                      </span>

                      {/* Group Link Pill */}
                      <Link
                        to={`/groups/${item.groupId}`}
                        className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <span>{item.groupName}</span>
                        <ArrowRight size={10} />
                      </Link>

                      {deadlineStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${deadlineStatus.color}`}>
                          <Clock size={11} /> {deadlineStatus.label}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm font-bold text-slate-900 dark:text-white ${item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      {item.facultyName && <span>Faculty: {item.facultyName}</span>}
                      <span>Shared by: {item.uploaderName}</span>
                      {item.fileName && <span className="font-mono text-[10px]">📎 {item.fileName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
                  <a
                    href={item.fileUrl}
                    download={item.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
