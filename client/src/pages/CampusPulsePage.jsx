import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  BarChart2,
  Share2,
  Bookmark,
  CheckCircle2,
  X,
  Camera,
  Search,
  Filter,
  Send,
  Coffee,
  Bell,
  Heart,
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
  Compass,
  Smile,
  Radio,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PERSONA_PRESETS = [
  'Crimson Owl', 'Onyx 17', 'Nova 42', 'Byte Runner', 'Ghost Coder',
  'Cyber Phoenix', 'Phantom 09', 'Neon Lynx', 'Solaris 88', 'Aura 99'
];

export default function CampusPulsePage() {
  const { user, isVerified } = useAuth();

  // State
  const [pulses, setPulses] = useState([]);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout & Navigation State
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [mobileTab, setMobileTab] = useState('feed'); // 'feed' | 'pulses' | 'events'

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'top'

  // Modal States
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPulseOpen, setCreatePulseOpen] = useState(false);
  const [activePulseStory, setActivePulseStory] = useState(null); // Active story viewer
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  // Post Creator State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Campus Buzz');
  const [postAlias, setPostAlias] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Pulse Creator State
  const [pulseTitle, setPulseTitle] = useState('');
  const [pulseContent, setPulseContent] = useState('');
  const [pulseTag, setPulseTag] = useState('Food Alert');
  const [pulseSticker, setPulseSticker] = useState('📍 Maggi Point');
  const [pulseAlias, setPulseAlias] = useState('');
  const [submittingPulse, setSubmittingPulse] = useState(false);

  const postImageInputRef = useRef(null);

  // Load all Campus Pulse data
  const loadPulseData = async () => {
    try {
      const [pulsesRes, eventsRes, postsRes] = await Promise.all([
        api.get('/feed/pulses'),
        api.get('/feed/events'),
        api.get(`/feed/posts?category=${selectedCategory}&sort=${sortBy}`)
      ]);
      setPulses(pulsesRes.data.pulses || []);
      setEvents(eventsRes.data.events || []);
      setPosts(postsRes.data.posts || []);
    } catch (err) {
      console.error('[CampusPulse] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPulseData();
  }, [selectedCategory, sortBy]);

  // Generate random catchy persona
  const generateRandomPersona = () => {
    const base = PERSONA_PRESETS[Math.floor(Math.random() * PERSONA_PRESETS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${base} #${num}`;
  };

  // RSVP to an Event
  const handleRsvp = async (eventId, status) => {
    try {
      const res = await api.post(`/feed/events/${eventId}/rsvp`, { status });
      setEvents((prev) =>
        prev.map((evt) =>
          evt._id === eventId
            ? {
                ...evt,
                userRsvp: res.data.userRsvp,
                goingCount: res.data.goingCount,
                interestedCount: res.data.interestedCount
              }
            : evt
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // React to a 24h Pulse
  const handleReactPulse = async (pulseId, emoji) => {
    try {
      const res = await api.post(`/feed/pulses/${pulseId}/react`, { emoji });
      setPulses((prev) =>
        prev.map((p) => (p._id === pulseId ? { ...p, reactions: res.data.reactions } : p))
      );
      if (activePulseStory && activePulseStory._id === pulseId) {
        setActivePulseStory((prev) => ({ ...prev, reactions: res.data.reactions }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote / Downvote Feed Post
  const handleVotePost = async (postId, direction) => {
    try {
      const res = await api.post(`/feed/posts/${postId}/vote`, { direction });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, score: res.data.score, upvotes: res.data.upvotes, downvotes: res.data.downvotes }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Vote on Poll
  const handleVotePoll = async (postId, optionId) => {
    try {
      const res = await api.post(`/feed/posts/${postId}/poll/vote`, { optionId });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, poll: res.data.poll } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment to Post
  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;
    try {
      const res = await api.post(`/feed/posts/${postId}/comment`, {
        text: commentInput.trim(),
        alias: postAlias || generateRandomPersona()
      });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), res.data.comment], commentCount: res.data.commentCount }
            : p
        )
      );
      setCommentInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // Create Feed Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append('title', postTitle.trim());
      formData.append('content', postContent.trim());
      formData.append('category', postCategory);
      formData.append('alias', postAlias.trim() || generateRandomPersona());

      if (showPollCreator && pollQuestion.trim()) {
        const validOpts = pollOptions.filter((o) => o.trim().length > 0);
        if (validOpts.length >= 2) {
          formData.append(
            'poll',
            JSON.stringify({ question: pollQuestion.trim(), options: validOpts })
          );
        }
      }

      if (postImage) {
        formData.append('image', postImage);
      }

      const res = await api.post('/feed/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPosts((prev) => [res.data.post, ...prev]);
      setCreatePostOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostAlias('');
      setPostImage(null);
      setPostImagePreview(null);
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Create Pulse Story
  const handleCreatePulse = async (e) => {
    e.preventDefault();
    if (!pulseContent.trim()) return;

    setSubmittingPulse(true);
    try {
      const res = await api.post('/feed/pulses', {
        title: pulseTitle.trim(),
        content: pulseContent.trim(),
        tag: pulseTag,
        sticker: pulseSticker,
        alias: pulseAlias.trim() || generateRandomPersona()
      });

      setPulses((prev) => [res.data.pulse, ...prev]);
      setCreatePulseOpen(false);
      setPulseTitle('');
      setPulseContent('');
      setPulseAlias('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to share pulse.');
    } finally {
      setSubmittingPulse(false);
    }
  };

  const activeEvent = events.length > 0 ? events[currentEventIdx % events.length] : null;

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* ============================================================== */}
      {/* 1. SOPHISTICATED HERO HEADER (ELEGANT & UN-CRAMPED) */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#120e24] via-[#1c1436] to-[#0f0c1c] border border-purple-900/30 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Flame size={13} className="text-rose-400 animate-pulse" />
              <span>Campus Pulse • Real Students. Real Rules.</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              What Happens on Campus, Stays on Campus. ⚡
            </h1>

            <p className="text-xs md:text-sm text-purple-200/80 leading-relaxed font-medium">
              Verified by <strong>@atria.edu</strong> • Masked from Faculty • Live 24h stories, fest updates, secret study hacks, and student polls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreatePostOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all flex items-center gap-2 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Drop Anonymous Buzz</span>
            </button>
            <button
              onClick={() => setCreatePulseOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-colors flex items-center gap-2 backdrop-blur-md"
            >
              <Zap size={15} className="text-amber-400 animate-bounce" />
              <span>Share 24h Pulse</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient lighting */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-60 -top-12 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* MOBILE TAB SWITCHER (VISIBLE ONLY ON MOBILE < LG) */}
      {/* ============================================================== */}
      <div className="lg:hidden flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'feed'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📰 News Feed
        </button>
        <button
          onClick={() => setMobileTab('pulses')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'pulses'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap size={13} className="text-amber-500" />
          <span>24h Pulses ({pulses.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('events')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'events'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar size={13} className="text-rose-500" />
          <span>Events ({events.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MAIN LAYOUT: LEFT SIDEBAR (PULSES & EVENTS) + CENTER (NEWSFEED) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: TOP-LEFT PULSES & BOTTOM-LEFT EVENTS */}
        {/* ============================================================ */}
        <aside
          className={`lg:col-span-4 xl:col-span-4 space-y-6 ${
            mobileTab === 'feed' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* ---------------------------------------------------------- */}
          {/* 1. TOP-LEFT: CAMPUS PULSES (DISAPPEARING 24H STORIES) */}
          {/* ---------------------------------------------------------- */}
          <div
            className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 ${
              mobileTab === 'events' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Campus Pulses
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Disappears after 24h</p>
                </div>
              </div>

              <button
                onClick={() => setCreatePulseOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold transition-colors flex items-center gap-1"
                title="Post 24h Pulse"
              >
                <Plus size={13} />
                <span>Post</span>
              </button>
            </div>

            {/* Pulses Vertical Stream */}
            {pulses.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/60 text-xs text-slate-400">
                <Coffee size={24} className="mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No active pulses</p>
                <p className="text-[11px] mt-0.5">Be the first to drop a 24h update!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
                {pulses.map((pulse) => {
                  const reactionSum = Object.values(pulse.reactions || {}).reduce((s, c) => s + c, 0);

                  return (
                    <div
                      key={pulse._id}
                      onClick={() => setActivePulseStory(pulse)}
                      className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-slate-900 to-[#1e1732] border border-purple-900/40 hover:border-rose-400/80 text-white cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm"
                    >
                      <div className="relative z-10 space-y-2">
                        {/* Tags and Expiration */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-400/15 text-amber-300 border border-amber-400/20 truncate max-w-[120px]">
                            {pulse.tag}
                          </span>
                          <span className="text-[10px] text-purple-300/70 font-mono flex items-center gap-0.5">
                            <Clock size={10} /> 24h
                          </span>
                        </div>

                        {/* Title & Excerpt */}
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                            {pulse.title || pulse.creatorAlias}
                          </h4>
                          <p className="text-[11px] text-purple-100/75 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                            {pulse.content}
                          </p>
                        </div>

                        {/* Location & Quick Reactions Bar */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                          <span className="truncate max-w-[110px] text-purple-200/80 font-medium">
                            {pulse.sticker}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {['🔥', '⚡', '👀'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReactPulse(pulse._id, emoji)}
                                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-rose-500/30 transition-colors text-[10px] font-semibold text-purple-200 flex items-center gap-0.5"
                                title={`React with ${emoji}`}
                              >
                                <span>{emoji}</span>
                                <span>{pulse.reactions?.[emoji] || 0}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Subtle hover gradient glow */}
                      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-rose-500/10 group-hover:bg-rose-500/25 blur-xl transition-colors pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* 2. BOTTOM-LEFT: HAPPENING ON CAMPUS (EVENTS & FESTS) */}
          {/* ---------------------------------------------------------- */}
          <div
            className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 ${
              mobileTab === 'pulses' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Header with Carousel Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Happening on Campus
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Fests, Tech & Contests</p>
                </div>
              </div>

              {events.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentEventIdx((prev) => (prev > 0 ? prev - 1 : events.length - 1))
                    }
                    className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    title="Previous event"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-1">
                    {(currentEventIdx % events.length) + 1}/{events.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentEventIdx((prev) => (prev + 1) % events.length)
                    }
                    className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    title="Next event"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Event Display (Interactive Featured Card) */}
            {activeEvent ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group">
                  {/* Event Thumbnail Banner */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-800">
                    <img
                      src={activeEvent.imageUrl}
                      alt={activeEvent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/30" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                        {activeEvent.category}
                      </span>
                      {activeEvent.urgency && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                          {activeEvent.urgency}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-2.5 text-white">
                      <span className="text-[10px] font-mono font-bold text-amber-300 block">
                        {activeEvent.date}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-3.5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1" title={activeEvent.title}>
                      {activeEvent.title}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                      {activeEvent.description}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <MapPin size={11} className="text-rose-500 shrink-0" />
                      <span className="truncate">{activeEvent.venue}</span>
                    </div>

                    {/* Interactive RSVP Action Capsule */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
                        👥 <strong className="text-slate-700 dark:text-slate-200">{activeEvent.goingCount || 0}</strong> going
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRsvp(activeEvent._id, 'interested')}
                          className={`px-2 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
                            activeEvent.userRsvp === 'interested'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {activeEvent.userRsvp === 'interested' ? '★ Interested' : '☆ Interested'}
                        </button>

                        <button
                          onClick={() => handleRsvp(activeEvent._id, 'going')}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shadow-sm ${
                            activeEvent.userRsvp === 'going'
                              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                          }`}
                        >
                          {activeEvent.userRsvp === 'going' ? '✓ Going' : '+ Going'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Thumb Pills for Easy Switching */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {events.map((evt, idx) => (
                    <button
                      key={evt._id}
                      onClick={() => setCurrentEventIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === (currentEventIdx % events.length)
                          ? 'w-6 bg-rose-500'
                          : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                      }`}
                      title={evt.title}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">No events currently scheduled.</div>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN: THE MAIN STUDENT NEWSFEED */}
        {/* ============================================================ */}
        <main
          className={`lg:col-span-8 xl:col-span-8 space-y-5 ${
            mobileTab !== 'feed' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Quick Composer Card (Atria Masked Trigger) */}
          <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                ⚡
              </div>
              <button
                onClick={() => setCreatePostOpen(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-400 font-medium transition-all"
              >
                What's buzzing on campus? Spills, notes, fest questions...
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCreatePostOpen(true);
                    setTimeout(() => postImageInputRef.current?.click(), 100);
                  }}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Camera size={14} className="text-rose-500" />
                  <span>Attach Media</span>
                </button>

                <button
                  onClick={() => {
                    setShowPollCreator(true);
                    setCreatePostOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors text-xs"
                >
                  <BarChart2 size={14} className="text-indigo-500" />
                  <span>Live Poll</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck size={14} />
                <span>Masked & Verified</span>
              </div>
            </div>
          </div>

          {/* Newsfeed Filter Pills & Sort Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: 'All Buzz' },
                { id: 'Campus Buzz', label: 'Campus Buzz' },
                { id: 'Tech & Hackathons', label: 'Tech & Fests' },
                { id: 'Academic SOS', label: 'Academic SOS' },
                { id: 'Lost & Found', label: 'Lost & Found' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Switcher */}
            <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  sortBy === 'top'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp size={12} />
                <span>Top Voted</span>
              </button>
            </div>
          </div>

          {/* Posts Feed Stream */}
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading campus pulse feed...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No buzz in this category yet</p>
              <p className="max-w-md mx-auto">Be the first Atria student to post! Your identity stays safely masked under a random persona.</p>
              <button
                onClick={() => setCreatePostOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
              >
                Drop First Buzz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const pollTotal = post.poll?.totalVotes || 0;
                const isCommentOpen = activeCommentPostId === post._id;

                return (
                  <article
                    key={post._id}
                    className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Upvote / Downvote Capsule (Offcampuz Style) */}
                    <div className="flex flex-col items-center justify-start py-1 shrink-0">
                      <button
                        onClick={() => handleVotePost(post._id, 1)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Upvote"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <span
                        className={`text-xs font-black font-mono my-1 ${
                          (post.score || 0) > 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : (post.score || 0) < 0
                            ? 'text-rose-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {post.score || 0}
                      </span>
                      <button
                        onClick={() => handleVotePost(post._id, -1)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Downvote"
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>

                    {/* Post Content Body */}
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Persona Header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          {/* Circular Monogram Persona Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                            {post.creatorAlias?.slice(0, 2).toUpperCase() || 'AN'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {post.creatorAlias}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-0.5">
                                <ShieldCheck size={10} /> Atria Verified
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {post.department || 'CSE Sem V'} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          {post.category}
                        </span>
                      </div>

                      {/* Post Title & Text */}
                      {post.title && (
                        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {post.title}
                        </h3>
                      )}

                      <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {post.content}
                      </p>

                      {/* Post Image Banner if uploaded */}
                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-80">
                          <img
                            src={post.imageUrl}
                            alt="Post media"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Interactive Embedded Poll */}
                      {post.poll && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <BarChart2 size={13} className="text-indigo-500" />
                              {post.poll.question}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {pollTotal} {pollTotal === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {post.poll.options?.map((opt) => {
                              const pct = pollTotal > 0 ? Math.round(((opt.votes || 0) / pollTotal) * 100) : 0;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVotePoll(post._id, opt.id)}
                                  className="w-full text-left relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-900 hover:border-indigo-400 transition-colors group"
                                >
                                  {/* Animated Percentage Bar */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-100 dark:bg-indigo-950/70 transition-all duration-500"
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

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {post.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <button
                          onClick={() => setActiveCommentPostId(isCommentOpen ? null : post._id)}
                          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-semibold"
                        >
                          <MessageSquare size={14} />
                          <span>{post.commentCount || 0} Comments</span>
                        </button>

                        <div className="flex items-center gap-3">
                          <button className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-[11px]">
                            <Share2 size={13} />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Comments Section */}
                      {isCommentOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                          {/* Comment Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add an anonymous reply..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleAddComment(post._id)}
                              className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              <Send size={13} />
                            </button>
                          </div>

                          {/* Comment List */}
                          <div className="space-y-2">
                            {(post.comments || []).map((c) => (
                              <div
                                key={c.id}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {c.authorAlias}
                                  </span>
                                  <span className="text-slate-400">
                                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-200">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DROP ANONYMOUS BUZZ POST */}
      {/* ============================================================== */}
      {createPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setCreatePostOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-rose-500" />
              Drop Campus Buzz
            </h2>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Catchy Headline (Optional)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening on campus? Spills, questions, fest updates..."
                  className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Channel / Category
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Campus Buzz">Campus Buzz</option>
                    <option value="Tech & Hackathons">Tech & Hackathons</option>
                    <option value="Lost & Found">Lost & Found</option>
                    <option value="Academic SOS">Academic SOS</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-semibold text-slate-500">
                      Anonymous Persona
                    </label>
                    <button
                      type="button"
                      onClick={() => setPostAlias(generateRandomPersona())}
                      className="text-[10px] text-indigo-600 font-semibold hover:underline"
                    >
                      🎲 Roll
                    </button>
                  </div>
                  <input
                    type="text"
                    value={postAlias}
                    onChange={(e) => setPostAlias(e.target.value)}
                    placeholder="e.g. Crimson Owl #42"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Poll Builder Section */}
              {showPollCreator && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <BarChart2 size={13} className="text-indigo-500" /> Embedded Poll
                  </span>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll Question"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="space-y-1.5">
                    {pollOptions.map((opt, i) => (
                      <input
                        key={i}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[i] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="w-full px-3 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={postImageInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) {
                        setPostImage(f);
                        setPostImagePreview(URL.createObjectURL(f));
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => postImageInputRef.current?.click()}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-slate-50 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Camera size={14} />
                    <span>{postImage ? 'Photo Attached' : 'Photo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPollCreator(!showPollCreator)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 text-xs flex items-center gap-1 font-semibold"
                  >
                    <BarChart2 size={14} />
                    <span>Poll</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20"
                >
                  {submittingPost ? 'Posting...' : 'Publish Buzz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: SHARE 24H PULSE */}
      {/* ============================================================== */}
      {createPulseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setCreatePulseOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Share 24h Campus Pulse
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Quick bulletin visible at the top-left of the campus feed. Self-destructs after 24 hours.
            </p>

            <form onSubmit={handleCreatePulse} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Location Sticker
                </label>
                <select
                  value={pulseSticker}
                  onChange={(e) => setPulseSticker(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="📍 Maggi Point / Canteen">📍 Maggi Point / Canteen</option>
                  <option value="📍 Central Library (3rd Floor)">📍 Central Library (3rd Floor)</option>
                  <option value="📍 Lab Room 326 / 508">📍 Lab Room 326 / 508</option>
                  <option value="📍 Main Quadrangle">📍 Main Quadrangle</option>
                  <option value="📍 LH-501 (5th Sem Block)">📍 LH-501 (5th Sem Block)</option>
                </select>
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  value={pulseContent}
                  onChange={(e) => setPulseContent(e.target.value)}
                  placeholder="e.g. Free coffee in Innovation Center, or anyone got past year model question papers?"
                  className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPulse}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
              >
                {submittingPulse ? 'Posting...' : 'Share Pulse Story'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: FULL PULSE STORY VIEWER */}
      {/* ============================================================== */}
      {activePulseStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setActivePulseStory(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#1a132c] to-[#281c44] border border-purple-500/40 p-6 text-white shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top timer bar */}
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 w-3/4 rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {activePulseStory.tag}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  {activePulseStory.creatorAlias}
                </h3>
              </div>
              <button
                onClick={() => setActivePulseStory(null)}
                className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="py-4">
              <p className="text-base font-bold leading-relaxed text-white">
                "{activePulseStory.content}"
              </p>
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 text-xs font-semibold text-purple-200">
                <MapPin size={12} className="text-rose-400" />
                <span>{activePulseStory.sticker}</span>
              </div>
            </div>

            {/* Quick Reactions Bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-around">
              {['🔥', '⚡', '😂', '👀'].map((emoji) => {
                const count = activePulseStory.reactions?.[emoji] || 0;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactPulse(activePulseStory._id, emoji)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-sm font-bold transition-colors"
                  >
                    <span>{emoji}</span>
                    <span className="text-[11px] font-mono text-purple-200">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
