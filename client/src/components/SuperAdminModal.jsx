import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';

export default function SuperAdminModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'upload'
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    type: 'timetable', // 'timetable' | 'calendar'
    department: 'Computer Science and Engineering',
    semester: 'V',
    academicYear: '2026-27'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  async function loadAdminData() {
    setLoading(true);
    setMessage('');
    try {
      if (activeTab === 'applications') {
        const res = await api.get('/admin/cr-applications');
        setApplications(res.data.applications || []);
      } else {
        const res = await api.get('/admin/academic-documents');
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('[Admin] Load data error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/cr-applications/${id}/approve`);
      setMessage(res.data.message);
      loadAdminData();
    } catch (err) {
      setMessage('Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id) {
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/cr-applications/${id}/reject`);
      setMessage(res.data.message);
      loadAdminData();
    } catch (err) {
      setMessage('Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please choose a PDF file to upload.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadData.title || selectedFile.name);
      formData.append('type', uploadData.type);
      formData.append('department', uploadData.department);
      formData.append('semester', uploadData.semester);
      formData.append('academicYear', uploadData.academicYear);

      const res = await api.post('/admin/academic-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('✓ ' + res.data.message);
      setSelectedFile(null);
      setUploadData({ ...uploadData, title: '' });
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Super Admin Console</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Neel
                </span>
              </h2>
              <p className="text-xs text-slate-400">CR Permissions & Master Academic Document Registry</p>
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
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mt-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'applications'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={14} />
            <span>CR Applications ({applications.filter((a) => a.status === 'pending').length} Pending)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload size={14} />
            <span>Upload Circular / Timetable (PDF)</span>
          </button>
        </div>

        {message && (
          <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 text-xs font-semibold flex items-center justify-between border border-purple-200 dark:border-purple-800">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-purple-400 hover:text-purple-600">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-purple-600" />
              <span>Loading admin records...</span>
            </div>
          ) : activeTab === 'applications' ? (
            /* TAB 1: CR APPLICATIONS */
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No CR applications submitted yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app._id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {app.fullName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                          {app.usn}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Target Section: <strong>{app.department} • Sem {app.semester} • Sec {app.section}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 italic">"{app.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleApprove(app._id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 size={13} />
                            <span>Grant CR Access</span>
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleReject(app._id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                          >
                            <XCircle size={13} />
                            <span>Decline</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {app.status === 'approved' ? '✓ Section Access Active' : 'Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* TAB 2: MASTER ACADEMIC PDF UPLOADER */
            <div className="space-y-4">
              <form onSubmit={handleFileUpload} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Publish New Circular (PDF)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={uploadData.department}
                      onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="All Departments">All Departments (General Circular)</option>
                      <option value="Computer Science and Engineering">Computer Science & Engineering (CSE)</option>
                      <option value="Information Science and Engineering">Information Science & Engineering (ISE)</option>
                      <option value="Artificial Intelligence and Machine Learning">AI & Machine Learning (AIML)</option>
                      <option value="Electronics and Communication Engineering">Electronics & Communication (ECE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Document Type
                    </label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      <option value="timetable">Master Class Timetable</option>
                      <option value="calendar">VTU Academic Calendar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Semester
                    </label>
                    <select
                      value={uploadData.semester}
                      onChange={(e) => setUploadData({ ...uploadData, semester: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="All Semesters">All Semesters</option>
                      <option value="V">Semester V</option>
                      <option value="III">Semester III</option>
                      <option value="VII">Semester VII</option>
                      <option value="I">Semester I</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE Sem V Sec C Master Timetable"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Select Official PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-950 dark:file:text-purple-300 hover:file:bg-purple-200 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>{uploading ? 'Publishing Circular...' : 'Publish Official Circular'}</span>
                </button>
              </form>

              {/* Published Documents List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-purple-600" />
                  <span>Published Academic Documents ({documents.length})</span>
                </h4>

                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {doc.department} • {doc.semester} • {doc.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
