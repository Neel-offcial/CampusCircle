import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Compass, Users, Lock, Globe, Plus, Search, KeyRound, Check } from 'lucide-react';
import api from '../services/api';

export default function ExploreGroupsPage() {
  const { onOpenCreateGroup } = useOutletContext();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const categories = ['All', 'Academic', 'Laboratory', 'Study Group', 'Club', 'Project Team'];

  const loadExploreGroups = async () => {
    try {
      const res = await api.get(`/groups?category=${selectedCategory}&search=${encodeURIComponent(search)}`);
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error('Failed to search groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExploreGroups();
  }, [selectedCategory, search]);

  const handleJoin = async (group) => {
    if (group.isPrivate && joiningGroupId !== group._id) {
      setJoiningGroupId(group._id);
      setAccessCodeInput('');
      setErrorMsg('');
      return;
    }

    try {
      await api.post(`/groups/${group._id}/join`, {
        accessCode: accessCodeInput
      });
      navigate(`/groups/${group._id}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join group.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Compass size={24} className="text-indigo-600" />
            Explore Campus Groups
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Discover active classes, lab cohorts, and clubs across your college
          </p>
        </div>
        <button
          onClick={onOpenCreateGroup}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
        >
          <Plus size={15} />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Filter Category Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading directory...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No groups match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <div
              key={group._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                    {group.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    {group.isPrivate ? <Lock size={13} title="Private Group" /> : <Globe size={13} title="Public Group" />}
                    <span>{group.isPrivate ? 'Passkey' : 'Open'}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {group.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {group.description || 'College collaboration group.'}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{group.memberCount} members enrolled</span>
                  <span>{group.assignmentCount} files shared</span>
                </div>

                {group.isMember ? (
                  <button
                    onClick={() => navigate(`/groups/${group._id}`)}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={14} className="text-emerald-500" />
                    <span>Already a Member • Open</span>
                  </button>
                ) : joiningGroupId === group._id ? (
                  <div className="space-y-2 animate-in fade-in">
                    <input
                      type="text"
                      value={accessCodeInput}
                      onChange={(e) => setAccessCodeInput(e.target.value)}
                      placeholder="Enter Group Passkey (e.g. HACK26)"
                      className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                    {errorMsg && <p className="text-[10px] text-rose-500">{errorMsg}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setJoiningGroupId(null)}
                        className="w-1/3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJoin(group)}
                        className="w-2/3 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-semibold"
                      >
                        Confirm Join
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(group)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{group.isPrivate ? 'Enter Passkey to Join' : 'Join Group'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
