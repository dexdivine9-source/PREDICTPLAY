"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Clock, 
  User, 
  Gamepad2, 
  Users, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  ChevronRight,
  Maximize2,
  Shield,
  FileCheck2
} from "lucide-react";
import Link from "next/link";
import { 
  checkIsAdminAction, 
  getPendingVerificationsAction, 
  adminApproveVerificationAction, 
  adminRejectVerificationAction 
} from "@/app/admin-actions";

interface VerificationItem {
  id: string;
  userId: string;
  username: string;
  gameUsername: string;
  trackerId: string;
  team: string;
  gameProfileScreenshotUrl: string;
  isVerified: boolean;
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminVerificationsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"PENDING" | "VERIFIED" | "REJECTED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const checkAdminAndLoad = async () => {
    try {
      const adminRes = await checkIsAdminAction();
      setIsAdmin(adminRes.isAdmin);

      if (adminRes.isAdmin) {
        await loadVerifications(filter);
      }
    } catch (err: any) {
      console.error("Admin check error:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadVerifications = async (selectedFilter: "PENDING" | "VERIFIED" | "REJECTED" | "ALL") => {
    setRefreshing(true);
    setStatusMessage(null);
    try {
      const data = await getPendingVerificationsAction(selectedFilter);
      setItems(data);
    } catch (err: any) {
      console.error("Error loading verifications:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to load verifications" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const handleFilterChange = (newFilter: "PENDING" | "VERIFIED" | "REJECTED" | "ALL") => {
    setFilter(newFilter);
    loadVerifications(newFilter);
  };

  const handleApprove = async (item: VerificationItem) => {
    setActionLoadingId(item.userId);
    setStatusMessage(null);
    try {
      await adminApproveVerificationAction(item.userId);
      setStatusMessage({
        type: "success",
        text: `Player ${item.username} (@${item.gameUsername}) approved successfully!`,
      });
      // Remove from list or reload
      setItems((prev) => prev.filter((i) => i.userId !== item.userId));
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to approve verification.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (item: VerificationItem) => {
    setRejectingItem(item);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setActionLoadingId(rejectingItem.userId);
    setStatusMessage(null);

    try {
      await adminRejectVerificationAction(rejectingItem.userId, rejectionReason);
      setStatusMessage({
        type: "success",
        text: `Player ${rejectingItem.username} rejected.`,
      });
      setItems((prev) => prev.filter((i) => i.userId !== rejectingItem.userId));
      setRejectingItem(null);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to reject verification.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.username.toLowerCase().includes(q) ||
      item.gameUsername.toLowerCase().includes(q) ||
      item.trackerId.toLowerCase().includes(q) ||
      item.team.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-pp-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-pp-text-muted">Loading Admin Portal...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-pp-surface border border-pp-border rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-pp-text-muted mb-6 leading-relaxed">
            You must be logged in as an authorized administrator to access the Player Verification review panel.
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 bg-pp-bg border border-pp-border text-white font-bold rounded-xl hover:bg-pp-surface transition-all text-xs uppercase"
            >
              Return Home
            </Link>
            <Link
              href="/login"
              className="flex-1 py-3 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark transition-all text-xs uppercase"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-pp-primary uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>Admin Review Center</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Player Verifications
          </h1>
          <p className="text-sm text-pp-text-muted mt-1">
            Review submitted game profiles, tracker IDs, and screenshot evidence to grant verified status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadVerifications(filter)}
            disabled={refreshing}
            className="px-4 py-2.5 bg-pp-surface border border-pp-border hover:border-pp-primary/40 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-pp-primary" : "text-pp-text-muted"} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex items-center gap-3 mb-8 border-b border-pp-border pb-4">
        <Link
          href="/admin/verifications"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-pp-primary text-black transition-all flex items-center gap-2 shadow-md shadow-pp-primary/20"
        >
          <FileCheck2 size={16} />
          <span>Player Verifications</span>
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-pp-text-muted hover:text-white hover:bg-pp-surface transition-all flex items-center gap-2 border border-transparent"
        >
          <Shield size={16} />
          <span>Manage Admins</span>
        </Link>
      </div>

      {/* Status toast message */}
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

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(["PENDING", "VERIFIED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                filter === tab
                  ? "bg-pp-primary text-black border-pp-primary shadow-md shadow-pp-primary/20"
                  : "bg-pp-surface border-pp-border text-pp-text-muted hover:text-white hover:border-slate-600"
              }`}
            >
              {tab === "PENDING" && "⏳ Pending Review"}
              {tab === "VERIFIED" && "✓ Approved"}
              {tab === "REJECTED" && "✕ Rejected"}
              {tab === "ALL" && "All Submissions"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pp-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player or team..."
            className="w-full pl-10 pr-4 py-2 bg-pp-surface border border-pp-border rounded-xl text-xs text-white placeholder:text-pp-text-muted focus:outline-none focus:border-pp-primary transition-colors"
          />
        </div>
      </div>

      {/* Verification Queue List */}
      {filteredItems.length === 0 ? (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-pp-bg border border-pp-border flex items-center justify-center text-pp-text-muted mx-auto mb-3">
            <CheckCircle2 size={28} className="text-pp-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Queue is Clear</h3>
          <p className="text-xs text-pp-text-muted max-w-sm mx-auto">
            {filter === "PENDING"
              ? "There are no pending player verifications waiting for review right now."
              : "No verification records found for this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const isActing = actionLoadingId === item.userId;

            return (
              <div
                key={item.userId}
                className="bg-pp-surface border border-pp-border rounded-2xl p-5 sm:p-6 transition-all hover:border-pp-primary/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left info column */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center font-black text-lg text-pp-primary flex-shrink-0">
                    {item.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-white">{item.username}</h3>
                      <span className="text-xs text-pp-text-muted font-mono">({item.userId.slice(0, 8)})</span>

                      {/* Status Tag */}
                      {item.isVerified ? (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-black uppercase rounded-md">
                          Verified
                        </span>
                      ) : item.verificationStatus === "REJECTED" ? (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase rounded-md">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-md">
                          Pending Review
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Gamepad2 size={14} className="text-pp-primary flex-shrink-0" />
                        <span className="text-pp-text-muted">Game:</span>
                        <strong className="text-white">{item.gameUsername || "—"}</strong>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users size={14} className="text-pp-primary flex-shrink-0" />
                        <span className="text-pp-text-muted">Team:</span>
                        <strong className="text-white">{item.team || "—"}</strong>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-300">
                        <LinkIcon size={14} className="text-pp-primary flex-shrink-0" />
                        <span className="text-pp-text-muted">Tracker:</span>
                        <strong className="text-white font-mono text-[11px] truncate max-w-[140px]" title={item.trackerId}>
                          {item.trackerId || "—"}
                        </strong>
                      </div>
                    </div>

                    {/* Rejection reason notice if applicable */}
                    {item.rejectionReason && (
                      <div className="mt-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-lg inline-block">
                        <strong>Reason:</strong> {item.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right actions column */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  
                  {/* Screenshot Thumbnail & View Button */}
                  {item.gameProfileScreenshotUrl ? (
                    <div className="flex items-center gap-2 bg-pp-bg border border-pp-border rounded-xl p-1.5 pr-3">
                      <div
                        onClick={() => setPreviewScreenshotUrl(item.gameProfileScreenshotUrl)}
                        className="w-12 h-10 rounded-lg overflow-hidden bg-black/40 border border-pp-border cursor-pointer relative group flex-shrink-0"
                      >
                        <img
                          src={item.gameProfileScreenshotUrl}
                          alt="Screenshot thumbnail"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={14} className="text-white" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotUrl(item.gameProfileScreenshotUrl)}
                        className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-1"
                      >
                        <span>View Evidence</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-pp-text-muted italic px-3 py-2 bg-pp-bg rounded-xl border border-pp-border">
                      No screenshot
                    </span>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={isActing || item.isVerified}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm shadow-green-600/20"
                    >
                      <Check size={14} />
                      <span>{item.isVerified ? "Approved" : "Approve"}</span>
                    </button>

                    <button
                      onClick={() => openRejectModal(item)}
                      disabled={isActing}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-pp-bg hover:bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {previewScreenshotUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewScreenshotUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-pp-surface border border-pp-border rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-pp-border pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Eye size={16} className="text-pp-primary" />
                Game Profile Screenshot Verification Evidence
              </h3>

              <div className="flex items-center gap-2">
                <a
                  href={previewScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-pp-bg border border-pp-border hover:border-pp-primary/40 text-pp-text-muted hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Open Full Tab</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  onClick={() => setPreviewScreenshotUrl(null)}
                  className="p-1.5 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={previewScreenshotUrl}
                alt="Verification screenshot evidence"
                className="max-h-[72vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setRejectingItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-pp-surface border border-pp-border rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRejectingItem(null)}
              className="absolute top-4 right-4 p-1.5 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <ShieldAlert size={20} />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Reject Verification
            </h3>
            <p className="text-xs text-pp-text-muted mt-1 mb-4">
              Rejecting verification for <strong>{rejectingItem.username}</strong> (@{rejectingItem.gameUsername}).
              Provide a reason so the player knows what to correct.
            </p>

            {/* Preset shortcuts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "Screenshot blurry / unreadable",
                "Gamertag mismatch",
                "Invalid tracker link",
                "Team name mismatch",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="px-2.5 py-1 bg-pp-bg border border-pp-border hover:border-red-400/40 text-[11px] text-pp-text-muted hover:text-white rounded-lg transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (e.g. Screenshot is blurry, gamertag does not match profile)..."
              rows={3}
              className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-white placeholder:text-pp-text-muted focus:outline-none focus:border-red-400 text-xs mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
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
