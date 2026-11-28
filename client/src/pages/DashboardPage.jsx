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
  AlertTriangle,
  Flame,
  Zap,
  ShoppingBag,
  MessageSquare,
  MapPin,
  Coffee,
  Utensils,
  ShieldCheck,
  Layers,
  ChevronLeft,
  Upload
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExamScheduleModal from '../components/ExamScheduleModal';
import SuperAdminModal from '../components/SuperAdminModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [gpaData, setGpaData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [pulses, setPulses] = useState([]);
  const [listings, setListings] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const isAdmin =
    user?.role === 'admin' ||
    user?.username === 'neel_dev' ||
    user?.username === 'neel' ||
    user?.username === 'neel_cse22' ||
    user?.email?.includes('neel');

  // What-If Bunk Planner State
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [whatIfMissCount, setWhatIfMissCount] = useState(1);
  const [whatIfAttendCount, setWhatIfAttendCount] = useState(1);
  const [whatIfMode, setWhatIfMode] = useState('bunk'); // 'bunk' | 'attend'

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [attRes, gpaRes, assRes, timeRes, pulsesRes, listingsRes] = await Promise.all([
          api.get('/attendance'),
          api.get('/gpa'),
          api.get('/assignments/my'),
          api.get('/attendance/timetable'),
          api.get('/feed/pulses').catch(() => ({ data: { pulses: [] } })),
          api.get('/marketplace/listings').catch(() => ({ data: { listings: [] } }))
        ]);

        setAttendance(attRes.data);
        setGpaData(gpaRes.data);
        setAssignments(assRes.data.assignments || []);
        setTimetable(timeRes.data.timetable);
        setPulses(pulsesRes.data?.pulses || []);
        setListings(listingsRes.data?.listings || []);

        // Default subject for what-if calculator
        const allSubs = [
          ...(attRes.data?.theory || []),
          ...(attRes.data?.laboratory || [])
        ];
        if (allSubs.length > 0) {
          setSelectedSubjectCode(allSubs[0].code);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const overallAttendance = attendance?.overall?.percentage || 78.9;
  const totalPresent = attendance?.overall?.totalPresent || 60;
  const totalConducted = attendance?.overall?.totalConducted || 76;
  const belowTargetCount = attendance?.overall?.belowTargetCount || 0;

  const predictedSgpa = gpaData?.analysis?.predictedSgpa || 8.59;
  const predictedCgpa = gpaData?.analysis?.predictedCgpa || 8.48;
  const previousCgpa = gpaData?.analysis?.previousCgpa || 8.45;

  const pendingAssignments = assignments.filter((a) => !a.isCompleted);
  const pendingAssignmentsCount = pendingAssignments.length;

  // Average CIE from subjects
  const gpaSubjects = gpaData?.analysis?.subjects || [];
  const avgCie =
    gpaSubjects.length > 0
      ? (
          gpaSubjects.reduce((sum, s) => sum + (s.totalCie || 40), 0) /
          gpaSubjects.length
        ).toFixed(1)
      : '42.1';

  // All attendance subjects pool
  const allSubjects = [
    ...(attendance?.theory || []),
    ...(attendance?.laboratory || [])
  ];
  const selectedSubject = allSubjects.find((s) => s.code === selectedSubjectCode) || allSubjects[0];

  // What-If Calculation
  let projectedPercentage = selectedSubject?.percentage || 75;
  if (selectedSubject) {
    const p = selectedSubject.present || 0;
    const c = selectedSubject.conducted || 0;
    if (whatIfMode === 'bunk') {
      projectedPercentage = c + whatIfMissCount > 0 ? ((p / (c + whatIfMissCount)) * 100).toFixed(1) : 0;
    } else {
      projectedPercentage = c + whatIfAttendCount > 0 ? (((p + whatIfAttendCount) / (c + whatIfAttendCount)) * 100).toFixed(1) : 0;
    }
  }

  // Today's schedule
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = dayNames[new Date().getDay()] || 'Friday';
  const todayClasses =
    timetable?.days?.find((d) => d.day === todayDay)?.classes ||
    timetable?.days?.find((d) => d.day === 'Monday')?.classes ||
    [];

  // Find next upcoming class (or current)
  const nextClass = todayClasses.find((c) => !c.isBreak) || todayClasses[0];
  const nextClassSubject = nextClass
    ? allSubjects.find(
        (s) =>
          s.code === nextClass.code ||
          s.code.includes(nextClass.code?.slice(0, 5))
      )
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ============================================================== */}
      {/* 1. SMART ACADEMIC COMMAND HERO BANNER */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#110e23] via-[#1a1435] to-[#0f0c1c] border border-purple-900/30 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            {/* Live Context Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <MapPin size={12} className="text-indigo-400" />
                Atria CSE • Sem V • Sec C (Batch B1)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                {todayDay} • Active Schedule
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! ⚡
            </h1>

            <p className="text-xs md:text-sm text-purple-200/80 leading-relaxed font-medium">
              Academic analytics, 2-IA internal marks, VTU attendance tracker, and confidential student hub.
            </p>
          </div>

          {/* Quick Actions & Live Next Class Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {nextClass && (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-xs space-y-1.5 max-w-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1">
                    <Clock size={11} /> Next Up: {nextClass.start}
                  </span>
                  {nextClassSubject && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        nextClassSubject.percentage >= 75
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      {nextClassSubject.percentage}%
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white line-clamp-1">{nextClass.subject}</h4>
                <p className="text-[10px] text-purple-200/70">
                  {nextClass.faculty} • Room {nextClass.room || '501'}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 shrink-0">
              <Link
                to="/feed"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <Flame size={14} className="animate-pulse" />
                <span>Campus Pulse</span>
              </Link>
              <Link
                to="/marketplace"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={14} className="text-amber-400" />
                <span>Student Gigs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-60 -top-12 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* LIVE EXAM COUNTDOWN HERO BANNER (IA & LAB IA) */}
      {/* ============================================================== */}
      <div
        onClick={() => setShowExamModal(true)}
        className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/30 dark:border-rose-500/40 shadow-sm cursor-pointer hover:border-rose-500 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-rose-500/20">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                Approaching in 4 Days (Dec 4)
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                IA-2: AI Concepts (BAICB501) • 09:30 AM (LH-501)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Modules 1 & 2 • <strong>Batch {user?.batch || 'B1'} Lab IA:</strong> React & Node Lab on Dec 2 (Lab 326)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAdminModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-xs hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all flex items-center gap-1.5"
            >
              <Upload size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Upload Timetable/Calendar (Admin)</span>
            </button>
          )}

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 flex items-center gap-1.5"
          >
            <Calendar size={14} />
            <span>View Date-Sheet & Portions</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TOP BENTO METRICS GRID (4 TILES) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tile 1: Subject Attendance Radar (No Useless Averages) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={15} className="text-rose-500" /> Subject Attendance Radar
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              1 Shortage Alert ⚠️
            </span>
          </div>

          <div className="my-1 space-y-2">
            {/* The Critical Shortage Warning */}
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  AI Concepts (BAICB501)
                </span>
                <span className="text-xs font-black text-rose-600">71.4%</span>
              </div>
              <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
                Must attend next <strong className="underline">2 classes</strong> to cross 75%!
              </p>
            </div>

            {/* Quick Safe Courses */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>IDA (90%): <strong className="text-emerald-600">+2 Bunks</strong></span>
              <span>CNS (75%): <strong className="text-amber-600">0 Bunks</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Under VTU: 75% per course</span>
            <Link
              to="/attendance"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Planner</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Tile 2: Predicted SGPA & Academic Trend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-emerald-500" /> Projected SGPA
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
              Sem V Model
            </span>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {predictedSgpa}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                ▲ +{(predictedCgpa - previousCgpa).toFixed(2)} CGPA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Cumulative CGPA on track for <strong>{predictedCgpa}</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Target 8.5+ Cleared</span>
            <Link
              to="/gpa-predictor"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Simulator</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Tile 3: VTU CIE Target Predictor (No Useless Averages) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <GraduationCap size={15} className="text-purple-500" /> CIE Target Predictor
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-mono">
              Target: 40/50
            </span>
          </div>

          <div className="my-1 space-y-2">
            <p className="text-[11px] text-slate-500 leading-tight">
              Scores needed in upcoming <strong>IA-2</strong> to hit target:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Computer Networks</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Need 18 / 20 in IA-2</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">AI Concepts</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Need 15 / 20 in IA-2</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">Min 20/50 for SEE Cleared</span>
            <Link
              to="/gpa-predictor"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Simulator</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Tile 4: Pending Assignments & Lab Records */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCheck size={15} className="text-amber-500" /> Assignments
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              {pendingAssignmentsCount} Pending
            </span>
          </div>

          <div className="my-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {assignments.length - pendingAssignmentsCount} / {assignments.length || 3}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Completed submissions in enrolled groups
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> 1 Due this week
            </span>
            <Link
              to="/assignments"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Submit</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MIDDLE SECTION: TODAY'S TIMELINE + WHAT-IF BUNK CALCULATOR */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 cols): Today's Schedule Timeline with Breaks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={16} className="text-rose-500" />
                  <span>Today's Class Schedule ({todayDay})</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Atria Digital Campus Timetable • Effective Aug 2026
                </p>
              </div>

              <Link
                to="/attendance"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Week →
              </Link>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-3">
              {todayClasses.map((item, idx) => {
                if (item.isBreak) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-semibold"
                    >
                      <Coffee size={16} className="text-amber-600 shrink-0" />
                      <div className="flex items-center justify-between flex-1">
                        <span>{item.subject}</span>
                        <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                          {item.start} – {item.end}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Match attendance record
                const subAtt = allSubjects.find(
                  (s) =>
                    s.code === item.code ||
                    s.code.includes(item.code?.slice(0, 5))
                );

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 text-center shrink-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block font-mono">
                          {item.start}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">{item.end}</span>
                      </div>

                      <div className="w-1 h-9 rounded-full bg-indigo-500 shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded font-mono">
                            {item.code}
                          </span>
                          {item.batch && (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                              {item.batch}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {item.subject}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.faculty} {item.room ? `• Room ${item.room}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Status Pill */}
                    {subAtt ? (
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black block font-mono ${
                            subAtt.percentage >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {subAtt.percentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {subAtt.percentage >= 75 ? 'Safe ✓' : 'Must Attend ⚠️'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0">Regular</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT (5 cols): What-If Bunk & Attendance Recovery Planner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    What-If Bunk Calculator
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">VTU 75% Risk Simulator</p>
                </div>
              </div>
            </div>

            {/* Subject Dropdown Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Select Component / Subject
              </label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                {allSubjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code}) — {s.percentage}%
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher: Bunk vs Attend */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                onClick={() => setWhatIfMode('bunk')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  whatIfMode === 'bunk'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                If I Miss Classes
              </button>
              <button
                onClick={() => setWhatIfMode('attend')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  whatIfMode === 'attend'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                If I Attend Classes
              </button>
            </div>

            {/* Class Count Step Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Number of Future Classes: {whatIfMode === 'bunk' ? whatIfMissCount : whatIfAttendCount}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const currentVal = whatIfMode === 'bunk' ? whatIfMissCount : whatIfAttendCount;
                  return (
                    <button
                      key={num}
                      onClick={() =>
                        whatIfMode === 'bunk'
                          ? setWhatIfMissCount(num)
                          : setWhatIfAttendCount(num)
                      }
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                        currentVal === num
                          ? whatIfMode === 'bunk'
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      +{num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculation Result Callout */}
            {selectedSubject && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  parseFloat(projectedPercentage) >= 75
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Current: {selectedSubject.percentage}%</span>
                  <span className="font-bold text-xs uppercase tracking-wider">
                    ➔ Projected:{' '}
                    <strong className="text-base font-black font-mono">
                      {projectedPercentage}%
                    </strong>
                  </span>
                </div>

                <div className="text-[11px] leading-relaxed">
                  {whatIfMode === 'bunk' ? (
                    parseFloat(projectedPercentage) >= 75 ? (
                      <p>
                        🎉 <strong>Safe Bunk!</strong> Missing {whatIfMissCount}{' '}
                        {whatIfMissCount === 1 ? 'class' : 'classes'} still leaves you at{' '}
                        {projectedPercentage}%, above the VTU 75% cutoff.
                      </p>
                    ) : (
                      <p>
                        🚨 <strong>Shortage Alert!</strong> Missing {whatIfMissCount}{' '}
                        {whatIfMissCount === 1 ? 'class' : 'classes'} drops you to{' '}
                        {projectedPercentage}%. You risk detention.
                      </p>
                    )
                  ) : (
                    <p>
                      📈 <strong>Recovery On Track!</strong> Attending {whatIfAttendCount}{' '}
                      consecutive {whatIfAttendCount === 1 ? 'class' : 'classes'} boosts your
                      percentage to {projectedPercentage}%.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Anonymous Pulse Snippet */}
          {pulses.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-900/40 shadow-sm flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Campus Pulse • Live
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {pulses[0].title || pulses[0].content}
                  </p>
                </div>
              </div>
              <Link
                to="/feed"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0"
              >
                Watch →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM SECTION: CIE ASSESSMENT DONUT & MARKETPLACE GIGS */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CIE Assessment Breakdown */}
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                VTU CIE Internal Strength
              </h3>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                CIE Average: {avgCie} / 50 Marks
              </p>
            </div>
            <Link
              to="/gpa-predictor"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              CIE Simulator →
            </Link>
          </div>

          <div className="space-y-3">
            {gpaSubjects.slice(0, 4).map((s) => (
              <div key={s.code} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                    {s.name}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {s.totalCie} / 50
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(s.totalCie / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace & Academic Gigs Spotlight */}
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-rose-500" /> Academic Gigs & Records
                </h3>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Peer Code, Lab Kits & Handwritten Notes
                </p>
              </div>
              <Link
                to="/marketplace"
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Browse All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {listings.slice(0, 2).map((l) => (
                <div
                  key={l._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                      {l.category} • {l.deliveryTime}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {l.title}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 font-mono">
                    ₹{l.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Blind In-App Relay • 100% Anonymous</span>
            <Link
              to="/marketplace"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Post a Gig →
            </Link>
          </div>
        </div>
      </div>

      {/* Live Exam & IA Date-Sheet Modal */}
      <ExamScheduleModal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        user={user}
      />

      {/* Super Admin Modal for Timetable & Calendar Upload */}
      <SuperAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        initialTab="upload"
      />
    </div>
  );
}
