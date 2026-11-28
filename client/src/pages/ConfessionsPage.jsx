import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Send,
  AlertCircle,
  Lock,
  Flame,
  ChevronUp,
  ChevronDown,
  Camera,
  BarChart2,
  X,
  Plus,
  Eye,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ConfessionsPage() {
  const { isVerified } = useAuth();
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('recent'); // 'recent', 'top', 'popular'
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Poll Creator State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState(null);

  const fileInputRef = useRef(null);

  const loadConfessions = async () => {
    try {
      const res = await api.get(`/confessions?filter=${filter}`);
      setConfessions(res.data.confessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfessions();
  }, [filter]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Poll Option Handlers
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx, val) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  // Submit Confession
  const handlePostConfession = async (e) => {
    e.preventDefault();

    if (!content.trim() && !imageFile && !showPollCreator) {
      setError('Please write a message, attach an image, or create a poll.');
      return;
    }

    if (!isVerified) {
      setError('You must be a verified Atria student to post confessions. Your identity is NEVER stored.');
      return;
    }

    let pollPayload = null;
    if (showPollCreator) {
      if (!pollQuestion.trim()) {
        setError('Please enter a poll question.');
        return;
      }
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        setError('Please provide at least 2 poll options.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim(),
        options: validOptions
      };
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      if (content.trim()) data.append('content', content.trim());
      if (imageFile) data.append('image', imageFile);
      if (pollPayload) data.append('poll', JSON.stringify(pollPayload));

      await api.post('/confessions', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setContent('');
      removeImage();
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setSuccess('Anonymous confession posted! Even database admins cannot trace who posted this.');
      loadConfessions();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit confession.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote / Downvote Handler
  const handleVote = async (confessionId, direction) => {
    try {
      const res = await api.post(`/confessions/${confessionId}/vote`, { direction });
      setConfessions(prev =>
        prev.map(c => (c._id === confessionId ? { ...c, score: res.data.score, upvotes: res.data.upvotes, downvotes: res.data.downvotes, userVote: res.data.userVote } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Vote on a Poll
  const handlePollVote = async (confessionId, optionId) => {
    try {
      const res = await api.post(`/confessions/${confessionId}/poll/vote`, { optionId });
      setConfessions(prev =>
        prev.map(c => (c._id === confessionId ? { ...c, poll: res.data.poll } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Reaction Handler
  const handleReact = async (confessionId, emoji) => {
    try {
      const res = await api.post(`/confessions/${confessionId}/react`, { emoji });
      setConfessions(prev =>
        prev.map(c => (c._id === confessionId ? { ...c, reactions: res.data.reactions } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-pink-500" />
            Campus Confessions & Polls
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Safe, verified, and 100% anonymous college community discussions & polls
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setFilter('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'recent'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setFilter('top')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              filter === 'top'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <ChevronUp size={14} />
            <span>Top Voted</span>
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              filter === 'popular'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
            }`}
          >
            <Flame size={13} />
            <span>Popular</span>
          </button>
        </div>
      </div>

      {/* Zero-Knowledge Privacy Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-900/40 flex items-start gap-3">
        <Lock size={18} className="text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <strong className="text-slate-900 dark:text-white block">
            Cryptographic Anonymity & Zero Author Logging:
          </strong>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            The server verifies you are an authenticated Atria student, but <strong>strips all user IDs, usernames, and IP addresses</strong> before storing the confession or image. Each post receives an un-linkable identifier like <code className="text-pink-600 font-mono">Anon #4827</code>. Even direct database inspection reveals zero author reference.
          </p>
        </div>
      </div>

      {/* Post Confession Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <form onSubmit={handlePostConfession} className="space-y-3.5">
          <textarea
            rows={3}
            maxLength={600}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an anonymous thought, campus confession, poll, or photo..."
            className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />

          {/* Attached Image Preview */}
          {imagePreview && (
            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={imagePreview}
                alt="Selected upload"
                className="h-32 object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Poll Builder Section */}
          {showPollCreator && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-indigo-500" /> Anonymous Poll Builder
                </span>
                <button
                  type="button"
                  onClick={() => setShowPollCreator(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X size={15} />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll Question (e.g. Which lab is toughest in Sem 5?)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add another option (up to 4)</span>
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} /> {success}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Image upload button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  imageFile
                    ? 'bg-pink-50 border-pink-300 text-pink-700 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Attach Photo / Image"
              >
                <Camera size={14} />
                <span>{imageFile ? 'Photo Attached' : 'Add Photo'}</span>
              </button>

              {/* Poll button */}
              <button
                type="button"
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showPollCreator
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart2 size={14} />
                <span>Create Poll</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {content.length} / 600
              </span>
              <button
                type="submit"
                disabled={submitting || (!content.trim() && !imageFile && !showPollCreator)}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs shadow-sm shadow-pink-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send size={13} />
                <span>{submitting ? 'Posting Anonymously...' : 'Post Confession'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confessions Stream */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading confessions...</div>
      ) : confessions.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No confessions posted yet. Be the first to post anonymously!
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((c) => {
            const pollTotalVotes = c.poll?.totalVotes || 0;

            return (
              <div
                key={c._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors flex gap-4"
              >
                {/* Upvote / Downvote Vertical Pillar */}
                <div className="flex flex-col items-center justify-start py-1 shrink-0">
                  <button
                    onClick={() => handleVote(c._id, 1)}
                    className={`p-1 rounded-lg transition-colors ${
                      c.userVote === 1
                        ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                    }`}
                    title="Upvote (Click again to undo)"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <span className={`text-xs font-black font-mono my-0.5 ${
                    (c.score || 0) > 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : (c.score || 0) < 0
                      ? 'text-rose-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {c.score || 0}
                  </span>
                  <button
                    onClick={() => handleVote(c._id, -1)}
                    className={`p-1 rounded-lg transition-colors ${
                      c.userVote === -1
                        ? 'text-rose-600 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 font-bold'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                    title="Downvote (Click again to undo)"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                {/* Main Confession Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-0.5 rounded-full">
                      {c.tag}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {c.content && (
                    <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-line font-medium">
                      {c.content}
                    </p>
                  )}

                  {/* Uploaded Photo Attachment */}
                  {c.imageUrl && (
                    <div
                      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer max-w-md"
                      onClick={() => setLightboxImage(c.imageUrl)}
                    >
                      <img
                        src={c.imageUrl}
                        alt="Confession attachment"
                        className="max-h-72 w-full object-cover hover:opacity-95 transition-opacity"
                      />
                    </div>
                  )}

                  {/* Interactive Poll Display */}
                  {c.poll && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <BarChart2 size={13} className="text-indigo-500" />
                          {c.poll.question}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {pollTotalVotes} {pollTotalVotes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {c.poll.options?.map((opt) => {
                          const pct = pollTotalVotes > 0 ? Math.round(((opt.votes || 0) / pollTotalVotes) * 100) : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handlePollVote(c._id, opt.id)}
                              className="w-full text-left relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-900 hover:border-indigo-400 transition-colors group"
                            >
                              {/* Background vote progress bar */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-indigo-50 dark:bg-indigo-950/60 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                                <span>{opt.text}</span>
                                <span className="font-mono text-[11px] text-slate-500 group-hover:text-indigo-600 font-bold">
                                  {pct}% ({opt.votes || 0})
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Emoji Reaction Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                    {[
                      { emoji: '❤️', label: 'Love' },
                      { emoji: '😂', label: 'Haha' },
                      { emoji: '💀', label: 'Dead' },
                      { emoji: '🫂', label: 'Hugs' },
                      { emoji: '🎯', label: 'Accurate' }
                    ].map((r) => {
                      const count = c.reactions?.[r.emoji] || 0;
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => handleReact(c._id, r.emoji)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-slate-200/60 dark:border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                          title={r.label}
                        >
                          <span>{r.emoji}</span>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
