"use client";

import { useState } from "react";
import { registerEvidenceAction } from "@/app/evidence-actions";
import { EvidencePhase } from "@/lib/types";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

interface EvidenceUploadProps {
  matchId: string;
  userId: string;
  phase: EvidencePhase;
  onSuccess?: () => void;
}

export function EvidenceUpload({ matchId, userId, phase, onSuccess }: EvidenceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files (JPEG, PNG, WebP) are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Construct secure storage path conforming to storage rules:
      // match /evidence/{matchId}/{userId}/{fileName}
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `evidence/${matchId}/${userId}/${Date.now()}_${sanitizedFileName}`;

      // Upload raw image bytes directly to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Call server-authoritative action to register evidence and update match lifecycle
      await registerEvidenceAction(matchId, phase, storagePath);

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Evidence upload failed:", err);
      setError(err.message || "Failed to upload evidence. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-pp-border rounded-xl p-6 bg-pp-surface/50 backdrop-blur-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-pp-primary/10 flex items-center justify-center border border-pp-primary/20">
          <UploadCloud className="text-pp-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">
            {phase === "START" ? "Pre-Match Lobby Evidence" : "Final Match Result Evidence"}
          </h3>
          <p className="text-xs text-pp-text-muted">
            {phase === "START"
              ? "Upload pre-match screenshot showing both usernames and game lobby."
              : "Upload final score screenshot showing game result clearly."} (Max 5MB)
          </p>
        </div>
      </div>

      {isSuccess ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 text-green-400">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <span className="text-sm font-bold">
            Evidence uploaded successfully! Server is queuing AI verification.
          </span>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError(null);
              }}
              disabled={isUploading}
              className="w-full text-sm text-pp-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pp-primary file:text-black hover:file:bg-pp-primary-dark cursor-pointer bg-pp-bg/50 rounded-lg border border-pp-border p-2"
            />
          </div>

          {file && (
            <div className="text-xs text-pp-text-muted flex justify-between">
              <span>Selected: <strong className="text-white">{file.name}</strong></span>
              <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-3 bg-pp-primary hover:bg-pp-primary-dark text-black font-bold rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>UPLOADING TO SECURE STORAGE...</span>
              </>
            ) : (
              <span>SUBMIT {phase} EVIDENCE</span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
