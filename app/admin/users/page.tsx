"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Search, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Users, 
  Check, 
  X,
  FileCheck2,
  Clock,
  Swords
} from "lucide-react";
import { 
  checkIsAdminAction, 
  getUsersListAction, 
  updateUserRoleAction 
} from "@/app/admin-actions";

interface UserItem {
  id: string;
  userId: string;
  username: string;
  gamertag: string;
  role: "admin" | "player";
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "player">("all");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    user: UserItem;
    targetRole: "admin" | "player";
  } | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    setStatusMessage(null);
    try {
      const adminInfo = await checkIsAdminAction();
      setCurrentAdminId(adminInfo.userId);

      const list = await getUsersListAction(searchQuery, roleFilter);
      setUsers(list);
    } catch (err: any) {
      console.error("Error loading user list:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to load users." });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExecuteRoleChange = async () => {
    if (!confirmModal) return;
    const { user, targetRole } = confirmModal;
    setActionLoadingId(user.userId);
    setConfirmModal(null);
    setStatusMessage(null);

    try {
      await updateUserRoleAction(user.userId, targetRole);
      setStatusMessage({
        type: "success",
        text: `User ${user.username} is now ${targetRole === "admin" ? "an Admin" : "a Player"}.`,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, role: targetRole } : u))
      );
    } catch (err: any) {
      console.error("Error updating role:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update user role.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const playerCount = users.filter((u) => u.role === "player").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-pp-primary uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>Admin Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Manage Admins & Roles
          </h1>
          <p className="text-sm text-pp-text-muted mt-1">
            Promote trusted team members to administrator or demote accounts back to regular player status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="px-4 py-2.5 bg-pp-surface border border-pp-border hover:border-pp-primary/40 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-pp-primary" : "text-pp-text-muted"} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex items-center gap-3 mb-8 border-b border-pp-border pb-4 overflow-x-auto">
        <Link
          href="/admin/matches/create"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-pp-text-muted hover:text-white hover:bg-pp-surface transition-all flex items-center gap-2 border border-transparent flex-shrink-0"
        >
          <Swords size={16} />
          <span>Curate Live Match</span>
        </Link>
        <Link
          href="/admin/verifications"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-pp-text-muted hover:text-white hover:bg-pp-surface transition-all flex items-center gap-2 border border-transparent flex-shrink-0"
        >
          <FileCheck2 size={16} />
          <span>Player Verifications</span>
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-pp-primary text-black transition-all flex items-center gap-2 shadow-md shadow-pp-primary/20 flex-shrink-0"
        >
          <Shield size={16} />
          <span>Manage Admins</span>
        </Link>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
            statusMessage.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-pp-surface border border-pp-border rounded-2xl">
          <span className="text-xs text-pp-text-muted font-bold uppercase tracking-wider">Total Users</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{users.length}</div>
        </div>

        <div className="p-5 bg-pp-surface border border-amber-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Administrators</span>
            <ShieldCheck size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">{adminCount}</div>
        </div>

        <div className="p-5 bg-pp-surface border border-pp-border rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-pp-text-muted font-bold uppercase tracking-wider">Players</span>
            <Users size={16} className="text-pp-primary" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">{playerCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(["all", "admin", "player"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                roleFilter === tab
                  ? "bg-pp-primary text-black border-pp-primary shadow-md shadow-pp-primary/20"
                  : "bg-pp-surface border-pp-border text-pp-text-muted hover:text-white hover:border-slate-600"
              }`}
            >
              {tab === "all" && "All Users"}
              {tab === "admin" && "🛡️ Admins Only"}
              {tab === "player" && "👥 Players"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pp-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or ID..."
            className="w-full pl-10 pr-4 py-2 bg-pp-surface border border-pp-border rounded-xl text-xs text-white placeholder:text-pp-text-muted focus:outline-none focus:border-pp-primary transition-colors"
          />
        </form>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="p-12 text-center text-pp-text-muted">Loading user accounts...</div>
      ) : users.length === 0 ? (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-12 text-center">
          <Users size={32} className="text-pp-text-muted mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-1">No users found</h3>
          <p className="text-xs text-pp-text-muted">Try changing your search query or filter.</p>
        </div>
      ) : (
        <div className="bg-pp-surface border border-pp-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-pp-border">
            {users.map((item) => {
              const isSelf = item.userId === currentAdminId;
              const isActing = actionLoadingId === item.userId;

              return (
                <div
                  key={item.userId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-pp-bg/40 transition-colors"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center font-black text-sm text-pp-primary flex-shrink-0">
                      {item.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.username}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-pp-primary/20 text-pp-primary text-[10px] font-black uppercase rounded">
                            You
                          </span>
                        )}
                        {item.role === "admin" ? (
                          <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                            <ShieldCheck size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-pp-bg border border-pp-border text-slate-300 text-[10px] font-bold uppercase rounded-md">
                            Player
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-pp-text-muted mt-0.5">
                        <span className="font-mono text-[11px]">ID: {item.userId.slice(0, 8)}</span>
                        <span>•</span>
                        <span>
                          Status:{" "}
                          <strong className={item.isVerified ? "text-pp-primary" : "text-slate-400"}>
                            {item.isVerified ? "Verified" : item.verificationStatus}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {item.role === "player" ? (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ user: item, targetRole: "admin" })}
                        disabled={isActing}
                        className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <UserCheck size={14} />
                        <span>Promote to Admin</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ user: item, targetRole: "player" })}
                        disabled={isActing || isSelf}
                        title={isSelf ? "You cannot demote yourself" : undefined}
                        className="px-3.5 py-2 bg-pp-bg hover:bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <UserX size={14} />
                        <span>Demote to Player</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="relative max-w-md w-full bg-pp-surface border border-pp-border rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setConfirmModal(null)}
              className="absolute top-4 right-4 p-1.5 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
            >
              <X size={18} />
            </button>

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              confirmModal.targetRole === "admin"
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              {confirmModal.targetRole === "admin" ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              {confirmModal.targetRole === "admin" ? "Promote User to Admin?" : "Demote Admin to Player?"}
            </h3>
            <p className="text-xs text-pp-text-muted mt-1.5 mb-6 leading-relaxed">
              {confirmModal.targetRole === "admin" ? (
                <>
                  Are you sure you want to grant <strong>Administrator</strong> privileges to{" "}
                  <strong className="text-white">{confirmModal.user.username}</strong>? They will be able to review
                  verifications, resolve matches, and manage user roles.
                </>
              ) : (
                <>
                  Are you sure you want to remove admin privileges from{" "}
                  <strong className="text-white">{confirmModal.user.username}</strong>? They will return to standard player
                  permissions.
                </>
              )}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExecuteRoleChange}
                className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${
                  confirmModal.targetRole === "admin"
                    ? "bg-pp-primary text-black hover:bg-pp-primary-dark shadow-md shadow-pp-primary/20"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                Confirm {confirmModal.targetRole === "admin" ? "Promotion" : "Demotion"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-pp-bg border border-pp-border text-pp-text-muted hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
