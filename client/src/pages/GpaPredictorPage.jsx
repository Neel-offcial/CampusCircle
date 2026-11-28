import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calculator,
  Award,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  History,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Check,
  HelpCircle,
  Layers,
  Lock,
  Zap,
  Target
} from 'lucide-react';
import api from '../services/api';

export default function GpaPredictorPage() {
  const [courses, setCourses] = useState([]);
  const [pastSemesters, setPastSemesters] = useState([
    { semester: 'Sem 1', sgpa: 8.20, credits: 20 },
    { semester: 'Sem 2', sgpa: 8.45, credits: 20 },
    { semester: 'Sem 3', sgpa: 8.60, credits: 22 },
    { semester: 'Sem 4', sgpa: 8.52, credits: 22 }
  ]);
  const [targetGpa, setTargetGpa] = useState(8.5);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isPortalSynced, setIsPortalSynced] = useState(true);
  const [globalSeeInput, setGlobalSeeInput] = useState(42);

  const loadGpaProfile = async () => {
    try {
      const res = await api.get('/gpa');
      const loadedCourses = res.data.courses || [];
      setCourses(loadedCourses);
      if (res.data.pastSemesters && res.data.pastSemesters.length > 0) {
        setPastSemesters(res.data.pastSemesters);
      }
      setTargetGpa(res.data.targetGpa || 8.5);
      setIsPortalSynced(res.data.isPortalSynced ?? true);
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error('Failed to load GPA profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGpaProfile();
  }, []);

  // Real-time client side recalculation with exact VTU / Atria 2-IA evaluation rules
  function recalculateLocally(currentCourses, currentPastSemesters) {
    let totalCurrentCredits = 0;
    let weightedPointsSum = 0;

    const subjects = currentCourses.map((c) => {
      const credits = Number(c.credits) || 3;
      totalCurrentCredits += credits;

      const maxIa = Number(c.maxIa) || 60;
      const ia1 = Number(c.ia1 !== undefined ? c.ia1 : 0);
      const ia2 = Number(c.ia2 !== undefined ? c.ia2 : (maxIa === 40 ? 30 : 44));

      // EXACT EVALUATION FORMULA:
      // IA 1 and IA 2 are conducted for 60 marks (or 40 marks).
      // Sum of both is divided by 4: (IA1 + IA2) / 4 (scales max 120 marks to 30).
      // If conducted for 40 marks: ((IA1 + IA2) / 80) * 30.
      let scaledTestMarks;
      if (maxIa === 60) {
        scaledTestMarks = (ia1 + ia2) / 4;
      } else {
        scaledTestMarks = ((ia1 + ia2) / (2 * maxIa)) * 30;
      }
      scaledTestMarks = Number(scaledTestMarks.toFixed(2));

      // Assignment marks out of 20
      const assignmentMarks = Math.min(Math.max(Number(c.assignment !== undefined ? c.assignment : 18), 0), 20);

      // Total Internal (CIE) out of 50 marks (STRICTLY COMPUTED, NON-EDITABLE BY USER)
      const totalCie = Number(Math.min(scaledTestMarks + assignmentMarks, 50).toFixed(1));

      // Estimated SEE marks out of 50
      const userProjectedSee = Math.min(Math.max(Number(c.projectedSee !== undefined ? c.projectedSee : 40), 0), 50);

      // Total Course Score out of 100 = CIE (50) + SEE (50)
      const finalProjectedTotal = Number(Math.min(totalCie + userProjectedSee, 100).toFixed(1));

      // Passing criteria: SEE >= 18/50 and finalProjectedTotal >= 40
      let projectedGradePoint = 10;
      let gradeLabel = 'O';
      if (userProjectedSee < 18 || finalProjectedTotal < 40) {
        projectedGradePoint = 0;
        gradeLabel = 'F';
      } else if (finalProjectedTotal < 50) {
        projectedGradePoint = 4;
        gradeLabel = 'P';
      } else if (finalProjectedTotal < 55) {
        projectedGradePoint = 5;
        gradeLabel = 'C';
      } else if (finalProjectedTotal < 60) {
        projectedGradePoint = 6;
        gradeLabel = 'B';
      } else if (finalProjectedTotal < 70) {
        projectedGradePoint = 7;
        gradeLabel = 'B+';
      } else if (finalProjectedTotal < 80) {
        projectedGradePoint = 8;
        gradeLabel = 'A';
      } else if (finalProjectedTotal < 90) {
        projectedGradePoint = 9;
        gradeLabel = 'A+';
      }

      weightedPointsSum += projectedGradePoint * credits;

      const calculateNeededSee = (targetScore) => {
        const needed = targetScore - totalCie;
        if (needed > 50) return { marks: null, possible: false, message: 'Unachievable with current CIE' };
        if (needed <= 18) return { marks: 18, possible: true, message: 'Pass cutoff (18/50)' };
        return { marks: Math.ceil(needed), possible: true, message: `${Math.ceil(needed)}/50 needed in finals` };
      };

      return {
        code: c.code,
        name: c.name,
        credits,
        maxIa,
        ia1,
        ia1IsSynced: c.ia1IsSynced ?? true,
        ia2,
        ia2IsSynced: c.ia2IsSynced ?? false,
        attendancePct: c.attendancePct || 80,
        scaledTestMarks,
        assignmentMarks,
        assignmentIsSynced: c.assignmentIsSynced ?? false,
        totalCie,
        userProjectedSee,
        finalProjectedTotal,
        projectedGradePoint,
        gradeLabel,
        seeRequirement: {
          gradeO: calculateNeededSee(90),
          gradeAplus: calculateNeededSee(80),
          gradeA: calculateNeededSee(70)
        }
      };
    });

    const predictedSgpa = totalCurrentCredits > 0
      ? Number((weightedPointsSum / totalCurrentCredits).toFixed(2))
      : 0;

    let totalPastCredits = 0;
    let totalPastWeighted = 0;
    currentPastSemesters.forEach((sem) => {
      const cr = Number(sem.credits) || 20;
      const sg = Number(sem.sgpa) || 8.0;
      totalPastCredits += cr;
      totalPastWeighted += cr * sg;
    });

    const previousCgpa = totalPastCredits > 0
      ? Number((totalPastWeighted / totalPastCredits).toFixed(2))
      : predictedSgpa;

    const totalOverallCredits = totalPastCredits + totalCurrentCredits;
    const predictedCgpa = totalOverallCredits > 0
      ? Number(((totalPastWeighted + weightedPointsSum) / totalOverallCredits).toFixed(2))
      : predictedSgpa;

    setAnalysis({
      totalCredits: totalCurrentCredits,
      predictedSgpa,
      previousCgpa,
      predictedCgpa,
      cgpaChange: Number((predictedCgpa - previousCgpa).toFixed(2)),
      subjects
    });
  }

  const handleCourseChange = (idx, field, value) => {
    const updated = [...courses];
    updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
    setCourses(updated);
    recalculateLocally(updated, pastSemesters);
  };

  const handleToggleMaxIa = (idx) => {
    const updated = [...courses];
    const currentMax = Number(updated[idx].maxIa) || 60;
    updated[idx].maxIa = currentMax === 60 ? 40 : 60;
    setCourses(updated);
    recalculateLocally(updated, pastSemesters);
  };

  const handleQuickApplyGlobalSee = (seeScore) => {
    setGlobalSeeInput(seeScore);
    const updated = courses.map((c) => ({
      ...c,
      projectedSee: seeScore
    }));
    setCourses(updated);
    recalculateLocally(updated, pastSemesters);
  };

  const handlePastSemChange = (idx, field, value) => {
    const updated = [...pastSemesters];
    updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
    setPastSemesters(updated);
    recalculateLocally(courses, updated);
  };

  const handleSyncPortal = async () => {
    setSyncing(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/gpa/sync-portal', {});
      setCourses(res.data.courses || []);
      setAnalysis(res.data.analysis);
      setIsPortalSynced(true);
      setSuccessMsg('✓ Live marks downloaded & synced from Atria Digital Campus!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to sync portal marks.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAndCalculate = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/gpa', {
        courses,
        pastSemesters,
        targetGpa,
        isPortalSynced
      });
      setAnalysis(res.data.analysis);
      setSuccessMsg('Academic marks & What-If calculations saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading GPA analysis engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Dual Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={24} className="text-indigo-600" />
            GPA & 2-IA Performance Predictor
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Official Atria Portal Marks (Locked) + Predicted What-If Inputs (IA-2, Assignment, Estimated SEE)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync from Portal Action Button */}
          <button
            onClick={handleSyncPortal}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Downloading Portal Data...' : '⚡ Sync Atria ERP Portal'}</span>
          </button>

          {/* Save Profile Button */}
          <button
            onClick={handleSaveAndCalculate}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Profile & Targets'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DUAL-COLOR VERIFICATION SYSTEM LEGEND & FORMULA CALLOUT */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Dual-Color Verification System
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Official VTU Scheme
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Differentiate locked portal marks from what-if estimations. Final CIE / 50 is auto-computed and locked.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Legend 1: Downloaded Portal Data */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold text-[11px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>🔵 Downloaded Portal Data (Locked)</span>
            </div>

            {/* Legend 2: Predicted What-If Value */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/70 border-2 border-dashed border-amber-400 dark:border-amber-500 text-amber-950 dark:text-amber-200 font-black text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>🟠 Predicted What-If Inputs</span>
            </div>
          </div>
        </div>

        {/* Evaluation Formula Card */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
              CIE FORMULA
            </span>
            <span>
              Scaled IA (out of 30) = <strong>(IA1 + IA2) / 4</strong> <span className="text-slate-400">[for Max IA 60]</span> + <strong>Assignment (20)</strong> = <strong>CIE / 50</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-slate-500">
            <Lock size={12} className="text-amber-500" />
            <span>Total CIE (50) is non-editable. Enter Estimated SEE (50) to project GPA.</span>
          </div>
        </div>
      </div>

      {/* Top Prediction Summary Cards (Projected SGPA & Trajectory) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Projected SGPA */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] border border-indigo-200 text-indigo-950 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Projected SGPA (Sem V)</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white">Live</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedSgpa || 8.86}</span>
            <span className="text-xs font-bold text-emerald-700">/ 10.0</span>
          </div>
          <p className="text-[11px] text-indigo-800/80 mt-1">
            Real-time VTU formula combining portal IA-1 + what-if IA-2 + estimated SEE
          </p>
        </div>

        {/* Card 2: Projected Cumulative CGPA */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#fef9c3] to-[#fef08a] border border-amber-200 text-amber-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Cumulative CGPA</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedCgpa || 8.53}</span>
            <span className="text-xs font-bold text-emerald-700">
              {analysis?.cgpaChange >= 0 ? `▲ +${analysis?.cgpaChange}` : `▼ ${analysis?.cgpaChange}`}
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1">Across all 5 completed & projected semesters</p>
        </div>

        {/* Card 3: Prior Accredited CGPA */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#ffe4e6] to-[#fecdd3] border border-rose-200 text-rose-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Previous CGPA (Sem 1 to 4)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.previousCgpa || 8.45}</span>
            <span className="text-xs font-bold text-slate-600">84 Credits</span>
          </div>
          <p className="text-[11px] text-rose-800/80 mt-1">Accredited record from prior completed semesters</p>
        </div>

        {/* Card 4: Portal Sync Tag */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Atria Portal Link</span>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck size={20} className="text-emerald-500" />
              <span className="text-sm font-black text-slate-900 dark:text-white">ERP Verified ✓</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">atriadigitalcampus.com/EDUApp</p>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {courses.length} courses loaded
          </span>
        </div>
      </div>

      {/* INTERACTIVE ESTIMATED SEE PRESET TOOLBAR */}
      <div className="p-4 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
              Quick-Estimate Semester Finals (SEE out of 50)
            </span>
            <span className="text-[10px] text-amber-800/80 dark:text-amber-400">
              Apply estimated exam score across all subjects at once, or fine-tune individually below.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500">Presets:</span>
          {[
            { label: '35 / 50 (B+)', val: 35 },
            { label: '40 / 50 (A)', val: 40 },
            { label: '44 / 50 (A+)', val: 44 },
            { label: '48 / 50 (O)', val: 48 }
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => handleQuickApplyGlobalSee(preset.val)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                globalSeeInput === preset.val
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-100/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: CURRENT SEMESTER 5 COURSE-WISE MARKS TABLE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              Semester V Course Breakdown (Official Portal vs. What-If)
            </h2>
            <p className="text-xs text-slate-400">
              IA1 is locked from portal. You only enter remaining IA2 & Assignment + Estimated SEE. Final CIE / 50 is strictly auto-calculated.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl self-start sm:self-auto">
            VTU 2-IA Model: Max 50 CIE + 50 SEE
          </span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-2">Course Name</th>
              <th className="py-3 px-2 text-center">Max IA</th>
              <th className="py-3 px-2 text-center">Credits</th>
              <th className="py-3 px-2 text-center bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-t-xl">
                🔵 IA-1 (Portal)
              </th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-t-xl">
                🟠 Remaining IA-2
              </th>
              <th className="py-3 px-2 text-center">Scaled IA / 30</th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                🟠 Assign (20)
              </th>
              <th className="py-3 px-2 text-center bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200">
                🔒 Total CIE / 50
              </th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-t-xl">
                🟠 Estimated SEE / 50
              </th>
              <th className="py-3 px-2 text-center">Total / 100</th>
              <th className="py-3 px-2 text-center">Grade</th>
              <th className="py-3 px-2 text-left">Target SEE Requirement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((course, idx) => {
              const pred = analysis?.subjects?.[idx];
              const maxIa = Number(course.maxIa) || 60;
              const ia1Val = course.ia1 !== undefined ? course.ia1 : 0;
              const ia2Val = course.ia2 !== undefined ? course.ia2 : (maxIa === 40 ? 30 : 44);
              const assignVal = course.assignment !== undefined ? course.assignment : 18;
              const projSeeVal = course.projectedSee !== undefined ? course.projectedSee : 40;

              // Formula: (ia1 + ia2) / 4 for 60 marks, or ((ia1 + ia2) / (2 * maxIa)) * 30
              const scaledIa = maxIa === 60
                ? ((Number(ia1Val) + Number(ia2Val)) / 4).toFixed(1)
                : (((Number(ia1Val) + Number(ia2Val)) / (2 * maxIa)) * 30).toFixed(1);

              return (
                <tr key={course.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Course Details */}
                  <td className="py-3 px-2">
                    <span className="font-bold text-slate-900 dark:text-white block">{course.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{course.code}</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {course.conducted > 0 ? `${course.present}/${course.conducted} (${course.attendancePct}%)` : ''}
                      </span>
                    </div>
                  </td>

                  {/* Max IA Toggle / Indicator */}
                  <td className="py-3 px-2 text-center">
                    <button
                      type="button"
                      title="Click to toggle between 60 and 40 Max IA"
                      onClick={() => handleToggleMaxIa(idx)}
                      className="px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      {maxIa}
                    </button>
                  </td>

                  {/* Credits */}
                  <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                    {course.credits}
                  </td>

                  {/* COLOR 1: DOWNLOADED OFFICIAL PORTAL DATA (BLUE) */}
                  <td className="py-3 px-2 text-center bg-blue-50/30 dark:bg-blue-950/20">
                    {course.ia1IsSynced ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-mono font-black text-xs shadow-xs">
                          {ia1Val} <span className="text-[9px] font-normal opacity-70">/ {maxIa}</span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-0.5">
                          <Check size={9} /> Portal
                        </span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max={maxIa}
                        value={ia1Val}
                        onChange={(e) => handleCourseChange(idx, 'ia1', e.target.value)}
                        className="w-14 px-1.5 py-1 text-center rounded-xl bg-slate-50 border border-slate-300 font-bold text-xs"
                      />
                    )}
                  </td>

                  {/* COLOR 2: PREDICTED WHAT-IF VALUE: REMAINING IA-2 (AMBER DASHED) */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    {course.ia2IsSynced ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-mono font-black text-xs">
                          {ia2Val} <span className="text-[9px] font-normal opacity-70">/ {maxIa}</span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-0.5">
                          <Check size={9} /> Portal
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max={maxIa}
                          value={ia2Val}
                          onChange={(e) => handleCourseChange(idx, 'ia2', e.target.value)}
                          className="w-14 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 dark:border-amber-500 font-black text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                        />
                        <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 mt-0.5">
                          ✨ What-If
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Scaled IA Average (out of 30) */}
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {scaledIa} <span className="text-[9px] text-slate-400 font-normal">/ 30</span>
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {maxIa === 60 ? 'sum/4' : 'sum/80*30'}
                      </span>
                    </div>
                  </td>

                  {/* COLOR 2: PREDICTED WHAT-IF ASSIGNMENT (AMBER DASHED) */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    {course.assignmentIsSynced ? (
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
                        {assignVal} / 20
                      </span>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={assignVal}
                          onChange={(e) => handleCourseChange(idx, 'assignment', e.target.value)}
                          className="w-12 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 dark:border-amber-500 font-bold text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">/ 20</span>
                      </div>
                    )}
                  </td>

                  {/* STRICTLY COMPUTED & LOCKED TOTAL CIE / 50 (NON-EDITABLE) */}
                  <td className="py-3 px-2 text-center bg-slate-50/80 dark:bg-slate-800/60">
                    <div className="inline-flex flex-col items-center">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-black text-xs flex items-center gap-1 shadow-xs">
                        <Lock size={10} className="text-indigo-500 shrink-0" />
                        {pred ? pred.totalCie : 42} <span className="text-[9px] font-normal opacity-70">/ 50</span>
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5">
                        Locked (Auto)
                      </span>
                    </div>
                  </td>

                  {/* COLOR 2: OPTION TO ENTER ESTIMATED SEE MARKS (OUT OF 50) */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="inline-flex flex-col items-center">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={projSeeVal}
                        onChange={(e) => handleCourseChange(idx, 'projectedSee', e.target.value)}
                        className="w-14 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 dark:border-amber-500 font-black text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                      />
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {projSeeVal < 18 ? (
                          <span className="text-rose-500 font-black">{'<18 (Fail)'}</span>
                        ) : (
                          'out of 50'
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Final Total Course Marks out of 100 */}
                  <td className="py-3 px-2 text-center">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                      {pred ? pred.finalProjectedTotal : 82} <span className="text-[9px] text-slate-400 font-normal">/ 100</span>
                    </span>
                  </td>

                  {/* Projected Grade */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                        pred?.gradeLabel === 'O'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : pred?.gradeLabel === 'A+'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : pred?.gradeLabel === 'A'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : pred?.gradeLabel === 'B+'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : pred?.gradeLabel === 'B'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {pred ? pred.gradeLabel : 'A+'} ({pred ? pred.projectedGradePoint : 9})
                    </span>
                  </td>

                  {/* Requirements for Grade Target */}
                  <td className="py-3 px-2">
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-purple-600 dark:text-purple-400">Grade O:</span>
                        <span className="text-slate-500 font-medium">
                          {pred?.seeRequirement?.gradeO?.message || 'Need 48/50 in SEE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Grade A+:</span>
                        <span className="text-slate-500 font-medium">
                          {pred?.seeRequirement?.gradeAplus?.message || 'Need 38/50 in SEE'}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION: PAST SEMESTERS RECORD (Sem 1 to 4) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Past Semesters Accredited Record (Sem 1 to 4)
            </h2>
            <p className="text-xs text-slate-400">
              Input your official VTU SGPAs from prior marks cards to calculate your baseline CGPA.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl">
            Previous CGPA: {analysis?.previousCgpa || 8.45}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pastSemesters.map((sem, idx) => (
            <div
              key={sem.semester}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {sem.semester}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Completed</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    SGPA (0 - 10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={sem.sgpa}
                    onChange={(e) => handlePastSemChange(idx, 'sgpa', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs text-center font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={sem.credits}
                    onChange={(e) => handlePastSemChange(idx, 'credits', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs text-center font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
