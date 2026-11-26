import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Tag,
  Search,
  Plus,
  MessageSquare,
  Lock,
  Sparkles,
  Zap,
  Star,
  Clock,
  ShieldCheck,
  Send,
  X,
  FileCode,
  Layers,
  Paperclip,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Eye,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MarketplacePage() {
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Create Listing Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Projects');
  const [newPrice, setNewPrice] = useState('');
  const [newPriceType, setNewPriceType] = useState('fixed');
  const [newDelivery, setNewDelivery] = useState('⚡ Within 24-48 Hours');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [submittingListing, setSubmittingListing] = useState(false);

  // Inquiries & Blind Chat State
  const [inboxOpen, setInboxOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [convoMessages, setConvoMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load Listings
  const loadListings = async () => {
    try {
      const res = await api.get(`/marketplace/listings?category=${selectedCategory}&search=${searchQuery}&sort=${sortBy}`);
      setListings(res.data.listings || []);
    } catch (err) {
      console.error('[Marketplace] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Active Inquiries / Conversations
  const loadConversations = async () => {
    try {
      const res = await api.get('/marketplace/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('[Marketplace] Convos error:', err);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Open / Start an Anonymous Inquiry with Seller
  const handleStartInquiry = async (listing) => {
    try {
      const res = await api.post(`/marketplace/listings/${listing._id}/inquire`, {
        initialMessage: `Hi! I am interested in your listing: "${listing.title}". Is it available?`
      });
      loadConversations();
      // Open active chat drawer
      openConversation(res.data.conversation._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start inquiry.');
    }
  };

  // Open an existing conversation
  const openConversation = async (conversationId) => {
    try {
      const res = await api.get(`/marketplace/conversations/${conversationId}/messages`);
      setActiveConvo(res.data);
      setConvoMessages(res.data.messages || []);
      setInboxOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open conversation.');
    }
  };

  // Send message in blind relay chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConvo) return;

    setChatSending(true);
    try {
      const res = await api.post(`/marketplace/conversations/${activeConvo.conversationId}/messages`, {
        content: chatInput.trim()
      });
      setConvoMessages((prev) => [...prev, res.data.message]);
      setChatInput('');
      loadConversations();
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (activeConvo) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convoMessages, activeConvo]);

  // Handle Post Listing Submit
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmittingListing(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      formData.append('category', newCategory);
      formData.append('price', newPrice);
      formData.append('priceType', newPriceType);
      formData.append('deliveryTime', newDelivery);
      formData.append('description', newDescription.trim());
      formData.append('tags', newTags);
      if (newAlias.trim()) formData.append('sellerAlias', newAlias.trim());
      if (newImage) formData.append('image', newImage);

      await api.post('/marketplace/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewTags('');
      setNewImage(null);
      loadListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish gig.');
    } finally {
      setSubmittingListing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* CATCHY HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#12192e] via-[#1a233d] to-[#0e1424] border border-blue-900/40 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag size={13} className="text-blue-400" />
            <span>CampusCircle Marketplace • Student Gig & Project Exchange</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Late-Night Project Panic? We've Got You Covered. 🤝
          </h1>

          <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed font-medium">
            100% Anonymous Peer Trading • Verified <strong>@atria.edu</strong> Students • Full-Stack Mini Projects, Handwritten VTU Records, Hardware Lab Kits, and Solved Question Banks.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Post a Project or Gig</span>
            </button>

            <button
              onClick={() => setInboxOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <Lock size={13} className="text-emerald-400" />
              <span>Confidential Inquiries</span>
              {conversations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-[10px] font-mono font-bold">
                  {conversations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* THREE VALUE PILLARS (Privacy, Viva-Safe, Direct Trade) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Blind In-App Chat Relay
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Neither party sees real names, emails, or USNs. Chat happens masked as <code className="text-indigo-600 font-mono">Buyer #402</code> ↔ <code className="text-indigo-600 font-mono">Seller #819</code>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              100% Viva-Ready Code
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Mini-projects come structured for Atria/VTU evaluation with IEEE base paper summaries, system architecture, and viva question banks.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <Zap size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Zero Commission / Peer Trade
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Direct student-to-student exchange. Pay via UPI, barter for another subject's notes, or share freely with classmates.
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Gigs & Items' },
            { id: 'Projects', label: '💻 Projects & Code' },
            { id: 'Records', label: '✍️ Records & Drafting' },
            { id: 'Hardware', label: '🔌 Hardware & Kits' },
            { id: 'Notes', label: '📚 Topper Notes' },
            { id: 'Gigs', label: '🛠️ Student Services' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, records, or kits..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* MARKETPLACE LISTINGS GRID */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading marketplace listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No listings found in this category. Be the first to post a project, record service, or lab kit!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
            >
              <div>
                {/* Cover Image Banner */}
                {item.imageUrl ? (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* Price Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-md">
                        {item.price > 0 ? `₹${item.price}` : 'Free / Barter'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-blue-300 border border-white/10">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-blue-900/30 to-indigo-900/30 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.category}
                      </span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {item.price > 0 ? `₹${item.price}` : 'Quote / Free'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      {item.sellerAlias}
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star size={11} fill="currentColor" /> {item.sellerRating || 4.9}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock size={11} className="text-blue-500" />
                    <span>{item.deliveryTime}</span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleStartInquiry(item)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock size={12} className="text-blue-400 dark:text-white" />
                  <span>Inquire / Chat Anonymously</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: POST A PROJECT OR GIG */}
      {/* ============================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-600" />
              List an Academic Project, Gig or Record Service
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Your real student name is never revealed. Buyers will only see your custom alias.
            </p>

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Complete React Sem 5 Lab Mini-Project (Hospital Management)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Projects">Projects & Source Code</option>
                    <option value="Records">Handwritten Records & Observation</option>
                    <option value="Hardware">Hardware & Lab Kits (Arduino/Sensors)</option>
                    <option value="Notes">Topper Notes & Solved Question Banks</option>
                    <option value="Gigs">Student Freelance Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price in INR (₹)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 350 (0 for Free/Barter)"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Turnaround / Delivery
                  </label>
                  <input
                    type="text"
                    value={newDelivery}
                    onChange={(e) => setNewDelivery(e.target.value)}
                    placeholder="e.g. ⚡ Within 24 Hours"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Confidential Alias
                  </label>
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="e.g. @code_ninja_v"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & What's Included
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail the deliverable, tech stack, documentation, or hardware condition..."
                  className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. React, Node.js, VTU Format, BRALB507"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cover Photo / Project Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingListing}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  {submittingListing ? 'Publishing...' : 'Publish to Student Marketplace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER / MODAL 2: CONFIDENTIAL INBOX & BLIND CHAT RELAY */}
      {/* ============================================================== */}
      {inboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl h-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden relative">
            <button
              onClick={() => {
                setInboxOpen(false);
                setActiveConvo(null);
              }}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            {/* Left Sidebar: Conversations List */}
            <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-emerald-500" /> Masked Inquiries
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">End-to-End Anonymous Relay</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active inquiries. Click "Inquire" on any marketplace listing to start.
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = activeConvo?.conversationId === c._id;
                    return (
                      <div
                        key={c._id}
                        onClick={() => openConversation(c._id)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-blue-600'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                            {c.counterpartyAlias}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {c.listingTitle}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {c.lastMessage}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active Blind Relay Messages */}
            <div className="w-2/3 flex flex-col justify-between bg-white dark:bg-slate-900">
              {activeConvo ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Chat with {activeConvo.counterpartyAlias}
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {activeConvo.myRole === 'seller' ? 'You: Seller' : 'You: Buyer'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                        Item: {activeConvo.listingTitle} ({activeConvo.listingPrice > 0 ? `₹${activeConvo.listingPrice}` : 'Barter'})
                      </p>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {convoMessages.map((m, i) => {
                      const isMine = m.senderId === user?._id;
                      return (
                        <div
                          key={m.id || i}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {m.senderAlias} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <input
                      type="text"
                      placeholder={`Reply as ${activeConvo.myAlias}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs">
                  <Lock size={36} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Confidential Student Relay</p>
                  <p className="max-w-xs mt-1">
                    Select an inquiry from the left or browse listings to inquire about a project or record drafting service.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
