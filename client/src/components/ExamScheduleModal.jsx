import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Edit2,
  Check,
  AlertTriangle,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import api from '../services/api';
import SuperAdminModal from './SuperAdminModal';

export default function ExamScheduleModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'lab' | 'see' | 'docs'
  const [scheduleData, setScheduleData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAdminUpload, setShowAdminUpload] = useState(false);

  const isCR = user?.role === 'cr';
  const isAdmin =
    user?.role === 'admin' ||
    user?.username === 'neel_dev' ||
    user?.username === 'neel' ||
    user?.username === 'neel_cse22' ||
    user?.email?.includes('neel');

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoading(true);
    try {
      const [resSchedule, resDocs] = await Promise.all([
        api.get('/exams/schedule'),
        api.get('/admin/academic-documents')
      ]);
      setScheduleData(resSchedule.data);
      setDocuments(resDocs.data.documents || []);
    } catch (err) {
      console.error('[ExamModal] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(labItem) {
    setEditingBatch(labItem.batch);
    setEditFormData({
      batch: labItem.batch,
      examDate: labItem.examDate,
      startTime: labItem.startTime,
      endTime: labItem.endTime,
      room: labItem.room,
      portions: labItem.portions,
      faculty: labItem.faculty,
      department: user?.department || 'Computer Science and Engineering',
      semester: user?.semester || 'V',
      section: user?.section || 'C'
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      const res = await api.put('/exams/lab-ia', editFormData);
      setFeedback('✓ ' + res.data.message);
      setEditingBatch(null);
      loadSchedule();
    } catch (err) {
      setFeedback('❌ ' + (err.response?.data?.message || 'Failed to update schedule.'));
    } finally {
      setSaving(false);
    }
  }

  const schedule = scheduleData?.schedule;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Exam & Internal Assessment Schedule
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Sem V Sec C
                </span>
              </div>
              <p className="text-xs text-slate-400">Atria Official Date-Sheet & Batch Lab Slots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mt-4 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'theory'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={13} />
            <span>Theory IA-2</span>
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'lab'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical size={13} />
            <span>Lab IA</span>
          </button>
          <button
            onClick={() => setActiveTab('see')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'see'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap size={13} />
            <span>VTU Finals</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={13} />
            <span>Timetable & Calendar</span>
          </button>
        </div>

        {feedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-xs font-semibold flex items-center justify-between border border-indigo-200 dark:border-indigo-800">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="text-indigo-400 hover:text-indigo-600">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading exam date-sheet...</div>
          ) : activeTab === 'theory' ? (
            /* TAB 1: THEORY IA */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    🚨 Upcoming Assessment
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    IA-2 Begins in 4 Days (Dec 4)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Max Marks: 25 • Duration: 1h 15m • Venue: LH-501
                  </p>
                </div>
                <span className="text-2xl">⏳</span>
              </div>

              {schedule?.theoryIa?.map((exam) => (
                <div
                  key={exam.code}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {exam.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        {exam.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Calendar size={12} /> {exam.examDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {exam.startTime} - {exam.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> Room {exam.room}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Portions:</strong> {exam.portions}
                    </p>
                  </div>

                  <a
                    href="#notes"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Opening notes and question bank for ${exam.name}`);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1 shrink-0"
                  >
                    <FileText size={13} />
                    <span>View Notes & PYQ</span>
                  </a>
                </div>
              ))}
            </div>
          ) : activeTab === 'lab' ? (
            /* TAB 2: LAB IA (BATCH WISE) */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    🧪 Batch-Specific Lab IA
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Lab IA dates are flexible and managed by Section CR / Instructors.
                  </p>
                </div>
                {(isCR || isAdmin) && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                    CR Edit Enabled
                  </span>
                )}
              </div>

              {schedule?.labIa?.map((lab) => (
                <div
                  key={lab.batch}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-800/80 border transition-all ${
                    user?.batch === lab.batch
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  {editingBatch === lab.batch ? (
                    /* INLINE EDIT FORM FOR CR */
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Editing Lab IA for Batch {lab.batch}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingBatch(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Date</label>
                          <input
                            type="date"
                            value={editFormData.examDate}
                            onChange={(e) => setEditFormData({ ...editFormData, examDate: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Room</label>
                          <input
                            type="text"
                            value={editFormData.room}
                            onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={editFormData.startTime}
                            onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">End Time</label>
                          <input
                            type="time"
                            value={editFormData.endTime}
                            onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Portions / Program List</label>
                        <input
                          type="text"
                          value={editFormData.portions}
                          onChange={(e) => setEditFormData({ ...editFormData, portions: e.target.value })}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700"
                      >
                        {saving ? 'Saving & Broadcasting...' : 'Save & Broadcast to Section C'}
                      </button>
                    </form>
                  ) : (
                    /* NORMAL CARD VIEW */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            Batch {lab.batch}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {lab.name}
                          </span>
                          {user?.batch === lab.batch && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Your Assigned Batch ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {lab.examDate}
                          </span>
                          <span>
                            {lab.startTime} - {lab.endTime}
                          </span>
                          <span>Venue: {lab.room}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          <strong>Experiments:</strong> {lab.portions}
                        </p>
                      </div>

                      {(isCR || isAdmin) && (
                        <button
                          onClick={() => startEdit(lab)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
                        >
                          <Edit2 size={12} />
                          <span>Reschedule Slot</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : activeTab === 'see' ? (
            /* TAB 3: VTU SEE FINALS */
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    Semester End Exams (SEE)
                  </span>
                  <h3 className="text-base font-black mt-0.5">Jan 12, 2027 (Commencement)</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Hall Ticket Eligibility Active
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                VTU requires a minimum of <strong>75% attendance in each individual course</strong> and passing CIE marks (minimum 20/50). Detained students will not receive admit cards.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                <p className="font-bold text-emerald-400">✓ Your Status: 5 of 6 Courses Fully Eligible</p>
                <p className="text-rose-400 font-semibold">⚠️ Attention: AI Concepts needs 2 more attendances to qualify.</p>
              </div>
            </div>
          ) : (
            /* TAB 4: OFFICIAL TIMETABLE & CALENDAR CIRCULARS */
            <div className="space-y-3">
              {isAdmin && (
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                      🛡️ Super Admin (Neel)
                    </span>
                    <p className="text-xs text-purple-900 dark:text-purple-200 font-semibold mt-0.5">
                      Upload Master Class Timetable or VTU Academic Calendar PDF
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminUpload(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Upload size={13} />
                    <span>Upload Document (PDF)</span>
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No official circulars published yet.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              doc.type === 'calendar'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {doc.type === 'calendar' ? 'VTU Academic Calendar' : 'Master Class Timetable'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {doc.academicYear || '2026-27'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Department: <strong>{doc.department}</strong> • Semester: <strong>{doc.semester}</strong>
                        </p>
                      </div>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors self-start sm:self-auto border border-slate-200 dark:border-slate-600 shadow-xs"
                      >
                        <Download size={13} />
                        <span>View / Download PDF</span>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Embedded SuperAdminModal for Direct Admin Upload */}
        <SuperAdminModal
          isOpen={showAdminUpload}
          onClose={() => {
            setShowAdminUpload(false);
            loadSchedule();
          }}
          initialTab="upload"
        />
      </div>
    </div>
  );
}
