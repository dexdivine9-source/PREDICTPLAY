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
  Check
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
  const [isSuccessVerified, setIsSuccessVerified] = useState(false);

  // Pre-fill existing data from profile
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
      if (profile.is_verified) {
        setIsSuccessVerified(true);
      }
    }
  }, [profile]);

  // Checklist counts
  const checkUsername = Boolean(gameUsername.trim());
  const checkScreenshot = Boolean(screenshotUrl.trim() || screenshotFile);
  const checkTracker = Boolean(trackerId.trim());
  const checkTeam = Boolean(team.trim());

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

      if (res.isVerified) {
        setIsSuccessVerified(true);
        setStatusMessage({
          type: "success",
          text: "Congratulations! Your profile is now verified.",
        });
      } else if (isPartialSave) {
        setStatusMessage({
          type: "success",
          text: "Progress saved successfully! Complete all 4 steps to get verified.",
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
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-pp-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-pp-surface border border-pp-border rounded-2xl max-w-md w-full">
          <p className="text-pp-text-muted mb-4">Please sign in to verify your profile.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2.5 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark transition-all text-sm uppercase"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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

      {/* Verified celebratory card */}
      {isSuccessVerified && (
        <div className="mb-8 p-6 bg-pp-primary/10 border border-pp-primary/40 rounded-2xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pp-primary/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-pp-primary text-black flex items-center justify-center shadow-lg shadow-pp-primary/30 flex-shrink-0">
                <Check size={26} className="stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Verified Player Profile</h3>
                  <span className="px-2 py-0.5 bg-pp-primary text-black text-[10px] font-black uppercase rounded">
                    Active
                  </span>
                </div>
                <p className="text-xs text-pp-text-muted mt-0.5">
                  You are authorized to create challenges, join competitive matches, and place predictions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/matches"
                className="w-full sm:w-auto px-5 py-2.5 bg-pp-primary text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-pp-primary-dark transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pp-primary/20"
              >
                <span>Find Matches</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Progress Bar */}
      <div className="mb-8 p-5 bg-pp-surface border border-pp-border rounded-2xl">
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
                <span>Submit & Verify Profile</span>
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
  );
}
