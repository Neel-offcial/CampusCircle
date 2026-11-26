import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  FileCheck,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [gpaData, setGpaData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [attRes, gpaRes, assRes, confRes, timeRes] = await Promise.all([
          api.get('/attendance'),
          api.get('/gpa'),
          api.get('/assignments/my'),
          api.get('/confessions?filter=recent'),
          api.get('/attendance/timetable')
        ]);

        setAttendance(attRes.data);
        setGpaData(gpaRes.data);
        setAssignments(assRes.data.assignments || []);
        setConfessions(confRes.data.confessions || []);
        setTimetable(timeRes.data.timetable);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const overallAttendance = attendance?.overall?.percentage || 84.5;
  const predictedSgpa = gpaData?.analysis?.predictedSgpa || 8.68;
  const predictedCgpa = gpaData?.analysis?.predictedCgpa || 8.52;
  const pendingAssignmentsCount = assignments.filter(a => !a.isCompleted).length;

  // Find today's classes
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = dayNames[new Date().getDay()] || 'Monday';
  const todayClasses = timetable?.days?.find(d => d.day === todayDay)?.classes || timetable?.days?.[0]?.classes || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Good morning, {user?.fullName?.split(' ')[0] || 'Student'} • Academic Analytics & Group Hub
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/gpa-predictor"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <TrendingUp size={14} />
            <span>Predicted SGPA: {predictedSgpa}</span>
          </Link>
          <Link
            to="/attendance"
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Clock size={14} />
            <span>Attendance: {overallAttendance}%</span>
          </Link>
        </div>
      </div>

      {/* TOP 3 PASTEL METRIC CARDS (Matching User's Scholarly UI screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Course / Semester Progress - Soft Yellow */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#fef9c3] to-[#fef08a] border border-amber-200 text-amber-950 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800/80 flex items-center gap-1.5">
              <GraduationCap size={16} /> Course Progress
            </span>
            <span className="w-6 h-1 rounded-full bg-amber-400/60"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">75%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                ▲ 12%
              </span>
            </div>
            <p className="text-xs font-medium text-amber-900/70 mt-1">
              {attendance?.overall?.totalConducted || 22} classes conducted in Semester V
            </p>
          </div>
          <Link
            to="/attendance"
            className="pt-3 border-t border-amber-200/60 text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center justify-between group"
          >
            <span>See Timetable & Schedule</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Attendance Rate - Soft Pink */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#ffe4e6] to-[#fecdd3] border border-rose-200 text-rose-950 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800/80 flex items-center gap-1.5">
              <Clock size={16} /> Attendance Rate
            </span>
            <span className="w-6 h-1 rounded-full bg-rose-400/60"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">{overallAttendance}%</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                overallAttendance >= 75 ? 'text-emerald-700 bg-emerald-100/70' : 'text-rose-700 bg-rose-100/70'
              }`}>
                {overallAttendance >= 75 ? '✓ Target Met' : '⚠ Below 75%'}
              </span>
            </div>
            <p className="text-xs font-medium text-rose-900/70 mt-1">
              Synced from Atria EDU ERP • {attendance?.overall?.belowTargetCount || 0} subjects at risk
            </p>
          </div>
          <Link
            to="/attendance"
            className="pt-3 border-t border-rose-200/60 text-xs font-bold text-rose-900 hover:text-rose-950 flex items-center justify-between group"
          >
            <span>Open Attendance Planner</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Assignments & Tasks - Soft Purple/Violet */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] border border-indigo-200 text-indigo-950 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800/80 flex items-center gap-1.5">
              <FileCheck size={16} /> Assignments
            </span>
            <span className="w-6 h-1 rounded-full bg-indigo-400/60"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {assignments.length > 0 ? `${Math.round(((assignments.length - pendingAssignmentsCount) / assignments.length) * 100)}%` : '64%'}
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded-md">
                {pendingAssignmentsCount} pending
              </span>
            </div>
            <p className="text-xs font-medium text-indigo-900/70 mt-1">
              Across your enrolled academic study groups
            </p>
          </div>
          <Link
            to="/assignments"
            className="pt-3 border-t border-indigo-200/60 text-xs font-bold text-indigo-900 hover:text-indigo-950 flex items-center justify-between group"
          >
            <span>View All Assignments</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* MIDDLE SECTION: GPA Trend Graph & CIE Breakdown Donut & Current Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): GPA Chart & CIE Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* Average GPA Trend Bar Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Academic Performance & GPA Trend
                </h2>
                <p className="text-xs text-slate-400">Past semesters vs. Semester V predicted performance</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-slate-500">Completed SGPAs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-indigo-500 to-rose-400"></span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Predicted SGPA</span>
                </div>
              </div>
            </div>

            {/* Custom Bar Graph */}
            <div className="relative pt-6 pb-2">
              {/* Dotted Target Line */}
              <div className="absolute top-10 left-8 right-0 border-b-2 border-dashed border-indigo-300/60 dark:border-indigo-700/60 flex items-center justify-end pr-2 z-10">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 -translate-y-1/2">
                  Target GPA 8.5+
                </span>
              </div>

              {/* Bars */}
              <div className="h-56 flex items-end justify-between px-4 sm:px-10 gap-3 border-b border-slate-100 dark:border-slate-800 pt-8">
                {(gpaData?.analysis?.semestersTrend || [
                  { name: 'Sem 1', gpa: 8.20, isPredicted: false },
                  { name: 'Sem 2', gpa: 8.45, isPredicted: false },
                  { name: 'Sem 3', gpa: 8.60, isPredicted: false },
                  { name: 'Sem 4', gpa: 8.52, isPredicted: false },
                  { name: 'Sem 5 (Pred)', gpa: 8.68, isPredicted: true }
                ]).map((item, idx) => {
                  const barHeightPx = Math.round(((item.gpa - 6) / 4) * 120 + 35);
                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center max-w-[64px] group">
                      <div className="w-full flex flex-col items-center justify-end">
                        {item.isPredicted && (
                          <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider mb-0.5 animate-pulse">
                            PRED
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform mb-1.5">
                          {item.gpa}
                        </span>
                        <div
                          style={{ height: `${Math.max(barHeightPx, 30)}px` }}
                          className={`w-full rounded-2xl transition-all duration-300 ${
                            item.isPredicted
                              ? 'bg-gradient-to-t from-rose-400 via-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/50'
                              : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                          }`}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold text-center whitespace-nowrap mt-2 ${
                        item.isPredicted ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'
                      }`}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Cumulative CGPA: <strong className="text-slate-900 dark:text-white">{predictedCgpa}</strong></span>
              <Link to="/gpa-predictor" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
                Customize CIE & SEE Marks Simulator →
              </Link>
            </div>
          </div>

          {/* CIE Marks Summary & Assignment Completion Donut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* CIE Summary Widget */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    CIE Assessment Status
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                    VTU Best 2 of 3
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">CIE-1 Average</span>
                      <strong className="text-slate-900 dark:text-white">40.2 / 50</strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">CIE-2 Average</span>
                      <strong className="text-slate-900 dark:text-white">42.8 / 50</strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Assignments & Quizzes</span>
                      <strong className="text-slate-900 dark:text-white">18.5 / 20</strong>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                Strong internal base! Average CIE is <strong>44.1 / 50</strong>.
              </p>
            </div>

            {/* Assignment Completion Donut Widget */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assignment Distribution
                </h3>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {assignments.length} Tasks
                </span>
              </div>
              <div className="flex items-center justify-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Concentric Progress SVG */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4"></circle>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="64, 100" strokeLinecap="round"></circle>
                    <circle cx="18" cy="18" r="10" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3"></circle>
                    <circle cx="18" cy="18" r="10" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="30, 100" strokeLinecap="round"></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">64%</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Done</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-around text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Completed
                </span>
                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Schedule & Current Assignments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Current Assignments List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Assignments
              </h2>
              <Link to="/assignments" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                All Tasks
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md inline-block mb-1">
                        {item.subject}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        Due: {item.deadline ? new Date(item.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Next Week'}
                      </p>
                    </div>
                    {item.isCompleted ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={14} />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" title="Pending"></span>
                    )}
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No assignments due right now.</p>
              )}
            </div>
          </div>

          {/* Today's Schedule (From Student-Hub timetable) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Schedule
                </h2>
                <p className="text-[11px] text-slate-400">{todayDay} • Atria Campus Timetable</p>
              </div>
              <Link to="/attendance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Week →
              </Link>
            </div>

            <div className="space-y-2.5">
              {todayClasses.slice(0, 4).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="w-12 text-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{c.start}</span>
                    <span className="text-[9px] text-slate-400 block">{c.end}</span>
                  </div>
                  <div className="w-1 h-8 rounded-full bg-indigo-500/80 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{c.subject}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {c.faculty} {c.room ? `• Room ${c.room}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous Confession Mini-Widget */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-300" /> Campus Confessions
              </span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-indigo-200">
                100% Anonymous
              </span>
            </div>
            {confessions[0] ? (
              <div>
                <p className="text-xs italic text-slate-200 leading-relaxed mb-3">
                  "{confessions[0].content}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-indigo-300">
                  <span>— {confessions[0].tag}</span>
                  <Link to="/confessions" className="font-bold underline text-white">
                    Read Feed →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300">Join the discussion on the confession board!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
