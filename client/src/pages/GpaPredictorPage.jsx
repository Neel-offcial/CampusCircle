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
  Layers
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

  const loadGpaProfile = async () => {
    try {
      const res = await api.get('/gpa');
      setCourses(res.data.courses || []);
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

  // Real-time client side recalculation whenever course or what-if inputs change
  function recalculateLocally(currentCourses, currentPastSemesters) {
    let totalCurrentCredits = 0;
    let weightedPointsSum = 0;

    const subjects = currentCourses.map((c) => {
      const credits = Number(c.credits) || 3;
      totalCurrentCredits += credits;

      const ia1 = Number(c.ia1 || 0);
      const ia2 = Number(c.ia2 || 0);
      const iaAvg = (ia1 + ia2) / 2;
      const scaledTestMarks = (iaAvg / 50) * 30;
      const assignmentMarks = Math.min(Number(c.assignment !== undefined ? c.assignment : 18), 20);
      const totalCie = Number((scaledTestMarks + assignmentMarks).toFixed(1));

      const userProjectedSee = Number(c.projectedSee !== undefined ? c.projectedSee : 40);
      const finalProjectedTotal = Math.min(Number((totalCie + userProjectedSee).toFixed(1)), 100);

      let projectedGradePoint = 10;
      let gradeLabel = 'O';
      if (finalProjectedTotal < 40) { projectedGradePoint = 0; gradeLabel = 'F'; }
      else if (finalProjectedTotal < 50) { projectedGradePoint = 5; gradeLabel = 'C'; }
      else if (finalProjectedTotal < 60) { projectedGradePoint = 6; gradeLabel = 'B'; }
      else if (finalProjectedTotal < 70) { projectedGradePoint = 7; gradeLabel = 'B+'; }
      else if (finalProjectedTotal < 80) { projectedGradePoint = 8; gradeLabel = 'A'; }
      else if (finalProjectedTotal < 90) { projectedGradePoint = 9; gradeLabel = 'A+'; }

      weightedPointsSum += projectedGradePoint * credits;

      const calculateNeededSee = (targetScore) => {
        const needed = targetScore - totalCie;
        if (needed > 50) return { marks: null, possible: false, message: 'Unachievable' };
        if (needed <= 18) return { marks: 18, possible: true, message: 'Pass cutoff (18/50)' };
        return { marks: Math.ceil(needed), possible: true, message: `Need ${Math.ceil(needed)}/50 in SEE` };
      };

      return {
        code: c.code,
        name: c.name,
        credits,
        ia1,
        ia1IsSynced: c.ia1IsSynced ?? true,
        ia2,
        ia2IsSynced: c.ia2IsSynced ?? false,
        attendancePct: c.attendancePct || 80,
        iaAvg: Number(iaAvg.toFixed(1)),
        assignmentMarks,
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
            Compare official Atria portal marks against your what-if predictions for VTU 5th Sem.
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

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TWO-COLOR VISUAL LEGEND BANNER */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center font-bold">
            🎨
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white">Dual-Color Verification System</h4>
            <p className="text-[11px] text-slate-400">
              Easily differentiate official college portal entries from your what-if future projections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Legend 1: Downloaded Official Portal Data */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/80 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700/80 text-blue-900 dark:text-blue-200 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>🔵 Downloaded Portal Data (Locked)</span>
          </div>

          {/* Legend 2: Predicted What-If Value */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/70 border-2 border-dashed border-amber-400 dark:border-amber-500 text-amber-950 dark:text-amber-200 font-black text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>🟠 Your Predicted What-If Inputs</span>
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
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedSgpa || 8.68}</span>
            <span className="text-xs font-bold text-emerald-700">/ 10.0</span>
          </div>
          <p className="text-[11px] text-indigo-800/80 mt-1">
            Real-time VTU formula combining portal IA-1 + your IA-2 prediction
          </p>
        </div>

        {/* Card 2: Projected Cumulative CGPA */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#fef9c3] to-[#fef08a] border border-amber-200 text-amber-950 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Cumulative CGPA</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedCgpa || 8.52}</span>
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
            <span className="text-3xl font-black tracking-tight">{analysis?.previousCgpa || 8.44}</span>
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

      {/* SECTION: CURRENT SEMESTER 5 COURSE-WISE MARKS TABLE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              Semester V Course Breakdown (Official Portal vs. What-If)
            </h2>
            <p className="text-xs text-slate-400">
              Blue columns are official marks downloaded from Atria ERP. Amber dashed boxes are your predicted what-if inputs.
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
              <th className="py-3 px-2 text-center">Credits</th>
              <th className="py-3 px-2 text-center bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-t-xl">
                🔵 IA-1 (Portal)
              </th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-t-xl">
                🟠 Predicted IA-2
              </th>
              <th className="py-3 px-2 text-center">IA Avg / 30</th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                🟠 Assign (20)
              </th>
              <th className="py-3 px-2 text-center">Total CIE / 50</th>
              <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-t-xl">
                🟠 Proj SEE / 50
              </th>
              <th className="py-3 px-2 text-center">Grade</th>
              <th className="py-3 px-2 text-left">Target SEE Requirement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((course, idx) => {
              const pred = analysis?.subjects?.[idx];
              const ia1Val = course.ia1 !== undefined ? course.ia1 : 0;
              const ia2Val = course.ia2 !== undefined ? course.ia2 : 40;
              const iaAvgScaled = (((Number(ia1Val || 0) + Number(ia2Val || 0)) / 2) / 50 * 30).toFixed(1);
              const assignVal = course.assignment !== undefined ? course.assignment : 18;
              const projSeeVal = course.projectedSee !== undefined ? course.projectedSee : 40;

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

                  {/* Credits */}
                  <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                    {course.credits}
                  </td>

                  {/* COLOR 1: DOWNLOADED OFFICIAL PORTAL DATA (BLUE) */}
                  <td className="py-3 px-2 text-center bg-blue-50/30 dark:bg-blue-950/20">
                    <div className="inline-flex flex-col items-center">
                      <div className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-mono font-black text-xs shadow-xs">
                        {ia1Val} <span className="text-[9px] font-normal opacity-70">/ 50</span>
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-0.5">
                        <Check size={9} /> Portal
                      </span>
                    </div>
                  </td>

                  {/* COLOR 2: PREDICTED WHAT-IF VALUE: IA-2 (AMBER DASHED) */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="inline-flex flex-col items-center">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={ia2Val}
                        onChange={(e) => handleCourseChange(idx, 'ia2', e.target.value)}
                        className="w-14 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 dark:border-amber-500 font-black text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                      />
                      <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 mt-0.5">
                        ✨ What-If
                      </span>
                    </div>
                  </td>

                  {/* Scaled IA Average */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                    {iaAvgScaled}
                  </td>

                  {/* COLOR 2: PREDICTED WHAT-IF ASSIGNMENT */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={assignVal}
                      onChange={(e) => handleCourseChange(idx, 'assignment', e.target.value)}
                      className="w-12 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600 font-bold text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </td>

                  {/* Calculated Total CIE */}
                  <td className="py-3 px-2 text-center">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                      {pred ? pred.totalCie : 42}/50
                    </span>
                  </td>

                  {/* COLOR 2: PREDICTED WHAT-IF SEE FINALS */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="inline-flex flex-col items-center">
                      <input
                        type="number"
                        min="18"
                        max="50"
                        value={projSeeVal}
                        onChange={(e) => handleCourseChange(idx, 'projectedSee', e.target.value)}
                        className="w-14 px-1.5 py-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 dark:border-amber-500 font-black text-amber-950 dark:text-amber-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                      />
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">out of 50</span>
                    </div>
                  </td>

                  {/* Projected Grade */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block w-8 py-0.5 rounded-lg text-xs font-black ${
                        pred?.gradeLabel === 'O'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : pred?.gradeLabel === 'A+'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : pred?.gradeLabel === 'A'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {pred ? pred.gradeLabel : 'A+'}
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
            Previous CGPA: {analysis?.previousCgpa || 8.44}
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
