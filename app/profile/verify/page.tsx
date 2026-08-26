"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  Gamepad2, 
  Users, 
  ArrowRight, 
  Save, 
  Sparkles, 
  Loader2, 
  Check, 
  Clock, 
  ExternalLink, 
  Eye, 
  Edit3, 
  X,
  Swords,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { saveVerificationAction, linkDlsTrackerAction } from "@/app/profile-actions";

export default function ProfileVerifyPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();

  // Form states
  const [gameUsername, setGameUsername] = useState("");
  const [trackerId, setTrackerId] = useState("");
  const [team, setTeam] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  
  // UI states
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerMessage, setTrackerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEditingVerified, setIsEditingVerified] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Sync state from profile
  useEffect(() => {
    if (profile) {
      if (profile.game_username || profile.gamertag || profile.username) {
        setGameUsername(profile.game_username || profile.gamertag || profile.username || "");
      }
      if (profile.tracker_id) {
        setTrackerId(profile.tracker_id);
      }
      if (profile.team || profile.tracker_team_name) {
        setTeam(profile.team || profile.tracker_team_name || "");
      }
      if (profile.game_profile_screenshot_url) {
        setScreenshotUrl(profile.game_profile_screenshot_url);
      }
    }
  }, [profile]);

  // Requirement completion flags
  const checkUsername = Boolean((gameUsername || "").trim());
  const checkScreenshot = Boolean((screenshotUrl || "").trim() || screenshotFile);
  const checkTracker = Boolean((trackerId || "").trim());
  const checkTeam = Boolean((team || "").trim());

  const completedCount = [checkUsername, checkScreenshot, checkTracker, checkTeam].filter(Boolean).length;
  const isAllComplete = completedCount === 4;

  const handleScreenshotUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error("Please log in first.");

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files (JPEG, PNG, WebP) are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Screenshot must be under 5MB.");
    }

    setUploadingScreenshot(true);
    try {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `verification/${user.id}/${Date.now()}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.warn("Storage upload notice:", uploadError.message);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("evidence")
        .getPublicUrl(storagePath);

      const url = publicUrlData?.publicUrl || storagePath;
      setScreenshotUrl(url);
      return url;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleTrackerLookup = async () => {
    if (!trackerId.trim() || trackerLoading) return;
    setTrackerLoading(true);
    setTrackerMessage(null);

    try {
      const res = await linkDlsTrackerAction(trackerId.trim());
      if (res.success && res.profile) {
        setTrackerMessage({
          type: "success",
          text: `Found team: "${res.profile.teamName}" (Div ${res.profile.division || 1}, ${res.profile.winRate}% win rate)`,
        });
        if (!team.trim() && res.profile.teamName) {
          setTeam(res.profile.teamName);
        }
        if (!gameUsername.trim() && res.profile.teamName) {
          setGameUsername(res.profile.teamName.slice(0, 20));
        }
      } else {
        setTrackerMessage({
          type: "error",
          text: res.error || "Tracker linked as custom ID. You can enter your team manually.",
        });
      }
    } catch {
      setTrackerMessage({
        type: "error",
        text: "Could not auto-fetch tracker details. You can enter your team name manually.",
      });
    } finally {
      setTrackerLoading(false);
    }
  };

  const handleSubmit = async (isPartialSave = false) => {
    if (!user || saving) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      let finalScreenshotUrl = screenshotUrl;

      // If a new screenshot file was selected, upload it first
      if (screenshotFile) {
        finalScreenshotUrl = await handleScreenshotUpload(screenshotFile);
        setScreenshotFile(null);
      }

      const res = await saveVerificationAction({
        gameUsername: gameUsername.trim(),
        gameProfileScreenshotUrl: finalScreenshotUrl,
        trackerId: trackerId.trim(),
        team: team.trim(),
        allowPartial: isPartialSave,
      });

      await refreshProfile();
      setIsEditingVerified(false);

      if (res.isVerified) {
        setStatusMessage({
          type: "success",
          text: "Profile verification updated successfully!",
        });
      } else if (isPartialSave) {
        setStatusMessage({
          type: "success",
          text: "Progress saved successfully! Complete all 4 steps to submit for review.",
        });
      } else {
        setStatusMessage({
          type: "success",
          text: "Verification submitted! Your profile is now under admin review.",
        });
      }
    } catch (err: any) {
      console.error("Verification save error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save verification. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-pp-primary mb-3" size={32} />
        <p className="text-xs text-pp-text-muted font-bold uppercase tracking-wider">Checking verification status...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-pp-surface border border-pp-border rounded-2xl max-w-md w-full shadow-2xl">
          <ShieldCheck size={36} className="text-pp-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">Sign In Required</h2>
          <p className="text-pp-text-muted mb-6 text-xs">Please sign in with Google to verify your game profile.</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark transition-all text-xs uppercase tracking-wider"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const isVerified = Boolean(profile?.is_verified);
  const isRejected = profile?.verification_status === "REJECTED";
  const isUnderReview = !isVerified && (profile?.verification_status === "PENDING" || (completedCount === 4 && Boolean(profile?.game_profile_screenshot_url)));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-pp-surface border-2 border-pp-primary flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)]">
            <ShieldCheck className="text-pp-primary" size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Profile Verification
            </h1>
            <p className="text-xs sm:text-sm text-pp-text-muted">
              Verify your in-game identity to unlock matchmaking, entry stakes, and predictions.
            </p>
          </div>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 1: ALREADY VERIFIED (Celebratory view - Form is hidden by default) */}
      {/* ========================================================================= */}
      {isVerified && !isEditingVerified && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Verified Hero Card */}
          <div className="bg-pp-surface border-2 border-pp-primary/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(57,255,20,0.15)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pp-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 border-b border-pp-border pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pp-primary text-black flex items-center justify-center shadow-lg shadow-pp-primary/30 flex-shrink-0">
                  <Check size={32} className="stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">You&apos;re verified ✅</h2>
                    <span className="px-2 py-0.5 bg-pp-primary text-black text-[10px] font-black uppercase rounded-md shadow-sm">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-pp-text-muted mt-1">
                    Your profile has been fully authenticated. You are eligible to compete and predict in all markets.
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs relative z-10 mb-6">
              <div className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Gamepad2 size={16} className="text-pp-primary" />
                  <span className="text-pp-text-muted uppercase font-bold">Game Username</span>
                </div>
                <strong className="text-white text-sm">{profile?.game_username || profile?.gamertag || gameUsername || "—"}</strong>
              </div>

              <div className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-pp-primary" />
                  <span className="text-pp-text-muted uppercase font-bold">Team Name</span>
                </div>
                <strong className="text-white text-sm">{profile?.team || profile?.tracker_team_name || team || "—"}</strong>
              </div>

              <div className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LinkIcon size={16} className="text-pp-primary" />
                  <span className="text-pp-text-muted uppercase font-bold">Tracker ID</span>
                </div>
                <strong className="text-white font-mono text-xs truncate max-w-[150px]">{profile?.tracker_id || trackerId || "—"}</strong>
              </div>

              <div className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Trophy size={16} className="text-pp-primary" />
                  <span className="text-pp-text-muted uppercase font-bold">Evidence Score</span>
                </div>
                <strong className="text-pp-primary font-mono text-sm">100% (Trusted)</strong>
              </div>
            </div>

            {/* Screenshot proof preview if available */}
            {(profile?.game_profile_screenshot_url || screenshotUrl) && (
              <div className="p-4 bg-pp-bg/80 border border-pp-border rounded-xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setPreviewScreenshotUrl(profile?.game_profile_screenshot_url || screenshotUrl)}
                    className="w-12 h-10 rounded-lg overflow-hidden bg-black/40 border border-pp-border cursor-pointer relative group flex-shrink-0"
                  >
                    <img
                      src={profile?.game_profile_screenshot_url || screenshotUrl}
                      alt="Verified screenshot"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={14} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Verified Profile Screenshot</span>
                    <span className="text-[10px] text-green-400 font-medium">✓ Authenticated & On Record</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewScreenshotUrl(profile?.game_profile_screenshot_url || screenshotUrl)}
                  className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-1"
                >
                  <span>View Proof</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            )}

            {/* Quick Action Navigation */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/matches"
                className="flex-1 py-3.5 px-4 bg-pp-primary text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-pp-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20"
              >
                <Swords size={16} />
                <span>Find Matches</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/matches/create"
                className="flex-1 py-3.5 px-4 bg-pp-bg border border-pp-border hover:border-pp-primary/40 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-pp-surface transition-all flex items-center justify-center gap-2"
              >
                <span>Create Challenge</span>
              </Link>
            </div>
          </div>

          {/* Edit Trigger Toggle */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsEditingVerified(true)}
              className="text-xs text-pp-text-muted hover:text-white font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Edit3 size={13} />
              <span>Need to change your verified gamertag or screenshot? Edit details</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 2: REJECTION NOTICE (If admin rejected) */}
      {/* ========================================================================= */}
      {isRejected && !isVerified && (
        <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl flex-shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wide">
                Verification Needs Attention
              </h3>
              <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                {profile?.rejection_reason
                  ? `Admin note: "${profile.rejection_reason}"`
                  : "Your previous submission did not meet verification criteria."}
              </p>
              <p className="text-[11px] text-red-300/70 mt-1">
                Please update your fields or upload a clearer screenshot below and submit again for review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 3: UNDER REVIEW NOTICE (If submitted and pending admin approval) */}
      {/* ========================================================================= */}
      {isUnderReview && !isRejected && (
        <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                  Verification Under Review
                </h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded">
                  Pending Admin Approval
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Your game profile evidence is currently in the review queue. An administrator will review and activate your verification shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 4: SUBMISSION / EDIT FORM (Shown when unverified or when editing) */}
      {/* ========================================================================= */}
      {(!isVerified || isEditingVerified) && (
        <div className="space-y-6">
          {/* Header if editing */}
          {isEditingVerified && (
            <div className="flex items-center justify-between p-4 bg-pp-surface border border-pp-border rounded-xl">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 size={14} className="text-pp-primary" />
                Editing Verified Profile
              </span>
              <button
                type="button"
                onClick={() => setIsEditingVerified(false)}
                className="text-xs text-pp-text-muted hover:text-white font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Requirements Progress Bar */}
          <div className="p-5 bg-pp-surface border border-pp-border rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-pp-primary" />
                Verification Requirements
              </span>
              <span className="text-xs font-mono font-bold text-pp-primary">
                {completedCount} of 4 Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-pp-bg rounded-full overflow-hidden mb-4 border border-pp-border">
              <div
                className="h-full bg-pp-primary transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>

            {/* Checklist Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                checkUsername ? "bg-pp-primary/10 border-pp-primary/40 text-white font-medium" : "bg-pp-bg border-pp-border text-pp-text-muted"
              }`}>
                <CheckCircle2 size={14} className={checkUsername ? "text-pp-primary flex-shrink-0" : "text-pp-text-muted flex-shrink-0"} />
                <span className="truncate">1. Game Username</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                checkScreenshot ? "bg-pp-primary/10 border-pp-primary/40 text-white font-medium" : "bg-pp-bg border-pp-border text-pp-text-muted"
              }`}>
                <CheckCircle2 size={14} className={checkScreenshot ? "text-pp-primary flex-shrink-0" : "text-pp-text-muted flex-shrink-0"} />
                <span className="truncate">2. Screenshot</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                checkTracker ? "bg-pp-primary/10 border-pp-primary/40 text-white font-medium" : "bg-pp-bg border-pp-border text-pp-text-muted"
              }`}>
                <CheckCircle2 size={14} className={checkTracker ? "text-pp-primary flex-shrink-0" : "text-pp-text-muted flex-shrink-0"} />
                <span className="truncate">3. Tracker ID</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                checkTeam ? "bg-pp-primary/10 border-pp-primary/40 text-white font-medium" : "bg-pp-bg border-pp-border text-pp-text-muted"
              }`}>
                <CheckCircle2 size={14} className={checkTeam ? "text-pp-primary flex-shrink-0" : "text-pp-text-muted flex-shrink-0"} />
                <span className="truncate">4. Team Name</span>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 sm:p-8 space-y-6">
            
            {/* Field 1: Game Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Gamepad2 size={15} className="text-pp-primary" />
                <span>1. Game Username <span className="text-pp-primary font-black">*</span></span>
              </label>
              <p className="text-[11px] text-pp-text-muted mb-2">
                Your primary in-game player name or gamertag (e.g. striker_99).
              </p>
              <input
                type="text"
                value={gameUsername}
                onChange={(e) => setGameUsername(e.target.value)}
                required
                maxLength={30}
                placeholder="Enter in-game username"
                disabled={saving}
                className="w-full bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary transition-colors text-sm"
              />
            </div>

            {/* Field 2: Game Profile Screenshot Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UploadCloud size={15} className="text-pp-primary" />
                <span>2. Game Profile Screenshot Upload <span className="text-pp-primary font-black">*</span></span>
              </label>
              <p className="text-[11px] text-pp-text-muted mb-2">
                Upload a clear in-game profile screenshot showing your gamertag, team, and rank/stats (Max 5MB).
              </p>

              <div className="border-2 border-dashed border-pp-border hover:border-pp-primary/50 rounded-xl p-5 bg-pp-bg/60 transition-all">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setScreenshotFile(file);
                    }}
                    disabled={uploadingScreenshot || saving}
                    className="w-full text-xs text-pp-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pp-primary file:text-black hover:file:bg-pp-primary-dark cursor-pointer bg-pp-surface rounded-lg border border-pp-border p-2"
                  />
                </div>

                {(screenshotFile || screenshotUrl) && (
                  <div className="mt-3 pt-3 border-t border-pp-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <CheckCircle2 size={14} />
                      <span>
                        {screenshotFile ? `Ready to upload: ${screenshotFile.name}` : "Screenshot attached on record"}
                      </span>
                    </div>
                    {screenshotUrl && !screenshotFile && (
                      <a
                        href={screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pp-primary hover:underline text-[11px] font-bold"
                      >
                        View Image ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Field 3: Tracker ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <LinkIcon size={15} className="text-pp-primary" />
                <span>3. Tracker ID <span className="text-pp-primary font-black">*</span></span>
              </label>
              <p className="text-[11px] text-pp-text-muted mb-2">
                Paste your DLS Live tracker link or ID (e.g. tracker.ftgames.com/?idx=... or code).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackerId}
                  onChange={(e) => setTrackerId(e.target.value)}
                  required
                  placeholder="tracker.ftgames.com/?idx=... or ID"
                  disabled={saving || trackerLoading}
                  className="flex-1 bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary transition-colors text-sm font-mono text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleTrackerLookup}
                  disabled={trackerLoading || !trackerId.trim() || saving}
                  className="px-4 py-3 bg-pp-primary/10 border border-pp-primary/40 text-pp-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-pp-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                >
                  {trackerLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Fetch / Link</span>
                  )}
                </button>
              </div>

              {trackerMessage && (
                <div
                  className={`mt-2 p-3 rounded-xl text-xs leading-relaxed ${
                    trackerMessage.type === "success"
                      ? "bg-pp-primary/10 border border-pp-primary/30 text-pp-primary font-medium"
                      : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                  }`}
                >
                  {trackerMessage.text}
                </div>
              )}
            </div>

            {/* Field 4: Team */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users size={15} className="text-pp-primary" />
                <span>4. Team Name <span className="text-pp-primary font-black">*</span></span>
              </label>
              <p className="text-[11px] text-pp-text-muted mb-2">
                Your competitive club or team name.
              </p>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                required
                maxLength={40}
                placeholder="e.g. Apex FC or Madrid Kings"
                disabled={saving}
                className="w-full bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary transition-colors text-sm"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-pp-border flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={saving || !isAllComplete}
                className="flex-1 py-3.5 bg-pp-primary text-black font-extrabold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Verification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>{isEditingVerified ? "Save & Update Verification" : "Submit for Verification Review"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="py-3.5 px-5 bg-pp-bg border border-pp-border hover:border-slate-500 text-slate-300 hover:text-white font-bold rounded-xl hover:bg-pp-surface active:scale-[0.99] transition-all uppercase text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2"
              >
                <Save size={16} />
                <span>Save Progress</span>
              </button>
            </div>

          </div>
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
                Verified Screenshot Evidence
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
                alt="Verification screenshot"
                className="max-h-[72vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
