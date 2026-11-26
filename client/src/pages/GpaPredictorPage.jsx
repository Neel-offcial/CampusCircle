import React, { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Award, Save, Sparkles, CheckCircle2, AlertCircle, Info, BookOpen, History } from 'lucide-react';
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
  const [successMsg, setSuccessMsg] = useState('');

  const loadGpaProfile = async () => {
    try {
      const res = await api.get('/gpa');
      setCourses(res.data.courses || []);
      if (res.data.pastSemesters && res.data.pastSemesters.length > 0) {
        setPastSemesters(res.data.pastSemesters);
      }
      setTargetGpa(res.data.targetGpa || 8.5);
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

  const handleCourseChange = (idx, field, value) => {
    const updated = [...courses];
    updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
    setCourses(updated);
  };

  const handlePastSemChange = (idx, field, value) => {
    const updated = [...pastSemesters];
    updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
    setPastSemesters(updated);
  };

  const handleSaveAndCalculate = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/gpa', {
        courses,
        pastSemesters,
        targetGpa
      });
      setAnalysis(res.data.analysis);
      setSuccessMsg('Academic marks & Past Semesters saved. GPA trajectory updated!');
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={24} className="text-indigo-600" />
            GPA & 2-IA Performance Predictor
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Strict Atria / VTU 2-IA Scheme: Avg(IA1 + IA2) scaled to 30 + Assignment (20) = Internal 50
          </p>
        </div>

        <button
          onClick={handleSaveAndCalculate}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 self-start sm:self-auto"
        >
          <Save size={14} />
          <span>{saving ? 'Calculating...' : 'Recalculate & Save Profile'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] border border-indigo-200 text-indigo-950 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Predicted SGPA (Sem V)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedSgpa || 8.68}</span>
            <span className="text-xs font-bold text-emerald-700">out of 10.0</span>
          </div>
          <p className="text-[11px] text-indigo-800/80 mt-1">
            Calculated via 2-IA scaled tests + assignments
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#fef9c3] to-[#fef08a] border border-amber-200 text-amber-950 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Projected Cumulative CGPA</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.predictedCgpa || 8.52}</span>
            <span className="text-xs font-bold text-emerald-700">
              {analysis?.cgpaChange >= 0 ? `▲ +${analysis?.cgpaChange}` : `▼ ${analysis?.cgpaChange}`}
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1">Weighted combined trajectory across all 5 semesters</p>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#ffe4e6] to-[#fecdd3] border border-rose-200 text-rose-950 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Previous CGPA (Sem 1 to 4)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black tracking-tight">{analysis?.previousCgpa || 8.44}</span>
            <span className="text-xs font-bold text-slate-600">84 Credits</span>
          </div>
          <p className="text-[11px] text-rose-800/80 mt-1">Accredited record from prior completed semesters</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Sem Credits</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {analysis?.totalCredits || 22}
            </span>
            <span className="text-xs font-medium text-slate-500">Credits</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Semester V full academic workload</p>
        </div>
      </div>

      {/* Strict Atria Formula Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100">
            Atria Institute of Technology / VTU 2022 Scheme Internal Evaluation Formula:
          </p>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100 dark:border-slate-700 mt-1">
            Internal CIE (50) = [ (IA-1 + IA-2) / 2 × 30/50 ] + Assignment (20)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            • Passing cutoff for Semester End Exam (SEE) is <strong>18/50 (36%)</strong>.
          </p>
        </div>
      </div>

      {/* SECTION 1: PAST SEMESTERS RECORD (Sem 1 to 4) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Past Semesters Academic Record (Sem 1 to 4)
            </h2>
            <p className="text-xs text-slate-400">
              Input your official VTU SGPAs and credit allocations from prior marks cards to calculate your baseline CGPA.
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

      {/* SECTION 2: CURRENT SEMESTER 5 COURSE-WISE MARKS TABLE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              Semester V Marks (IA-1, IA-2 & Assignment)
            </h2>
            <p className="text-xs text-slate-400">
              Edit your marks to simulate your internal CIE and see minimum Semester End Exam (SEE) marks required for grades.
            </p>
          </div>
          <button
            onClick={handleSaveAndCalculate}
            disabled={saving}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Update Projections
          </button>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-2">Course Name</th>
              <th className="py-3 px-2 text-center">Credits</th>
              <th className="py-3 px-2 text-center">IA-1 (50)</th>
              <th className="py-3 px-2 text-center">IA-2 (50)</th>
              <th className="py-3 px-2 text-center">IA Avg / 30</th>
              <th className="py-3 px-2 text-center">Assign (20)</th>
              <th className="py-3 px-2 text-center">Total CIE (50)</th>
              <th className="py-3 px-2 text-center">Need for Grade O (90+)</th>
              <th className="py-3 px-2 text-center">Need for Grade A+ (80+)</th>
              <th className="py-3 px-2 text-center">Projected Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((course, idx) => {
              const pred = analysis?.subjects?.[idx];
              const ia1Val = course.ia1 !== undefined ? course.ia1 : course.cie1;
              const ia2Val = course.ia2 !== undefined ? course.ia2 : course.cie2;
              const iaAvgScaled = (((Number(ia1Val || 0) + Number(ia2Val || 0)) / 2) / 50 * 30).toFixed(1);

              return (
                <tr key={course.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-2">
                    <span className="font-bold text-slate-900 dark:text-white block">{course.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{course.code}</span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{course.credits}</td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={ia1Val}
                      onChange={(e) => handleCourseChange(idx, 'ia1', e.target.value)}
                      className="w-14 px-1.5 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={ia2Val}
                      onChange={(e) => handleCourseChange(idx, 'ia2', e.target.value)}
                      className="w-14 px-1.5 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-semibold text-slate-500">
                    {iaAvgScaled}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={course.assignment}
                      onChange={(e) => handleCourseChange(idx, 'assignment', e.target.value)}
                      className="w-14 px-1.5 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold">
                      {pred ? pred.totalCie : 42}/50
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-[11px] font-bold ${
                      pred?.seeRequirement?.gradeO?.possible ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>
                      {pred?.seeRequirement?.gradeO?.message || 'Need 48/50'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {pred?.seeRequirement?.gradeAplus?.message || 'Need 38/50'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs">
                      {pred?.gradeLabel || 'A+'} ({pred?.projectedGradePoint || 9} GP)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 3: 5-SEMESTER GPA TRAJECTORY VISUALIZER */}
      {analysis?.semestersTrend && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                Semester-wise GPA Trajectory
              </h2>
              <p className="text-xs text-slate-400">Historical performance vs Sem 5 predicted graduation trajectory</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Past Semesters
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Sem 5 Prediction
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            {analysis.semestersTrend.map((item) => {
              const heightPct = Math.max(Math.min((item.gpa / 10) * 100, 100), 20);
              const barHeightPx = Math.round((heightPct / 100) * 140);

              return (
                <div key={item.name} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300">
                    {item.gpa.toFixed(2)}
                  </span>
                  <div className="w-full max-w-[60px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${
                        item.isPredicted
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-gradient-to-t from-indigo-600 to-indigo-500'
                      }`}
                      style={{ height: `${barHeightPx}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
