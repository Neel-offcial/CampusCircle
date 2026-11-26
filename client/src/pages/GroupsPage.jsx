import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Users, Plus, ShieldCheck, Lock, Globe, MessageSquare, FileText, ArrowRight, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function GroupsPage() {
  const { onOpenCreateGroup } = useOutletContext();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups?my=true');
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Enrolled Groups
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Groups you have created or joined for academic coordination
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/explore"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Explore All Groups
          </Link>
          <button
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Plus size={15} />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Users size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Groups Joined Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            You haven't joined any groups yet. Explore available campus groups or start your own study circle.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/explore"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 hover:bg-indigo-700"
            >
              Browse Groups
            </Link>
            <button
              onClick={onOpenCreateGroup}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                    {group.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {group.isPrivate ? (
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]" title="Private Group">
                        <Lock size={12} />
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]" title="Public Group">
                        <Globe size={12} />
                      </span>
                    )}
                    {group.myRole === 'admin' && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {group.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <Users size={13} /> {group.memberCount} members
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <FileText size={13} /> {group.assignmentCount} files
                  </span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
