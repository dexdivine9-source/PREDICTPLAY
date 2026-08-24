"use client";

import { useState } from "react";
// import { Button } from "@/components/ui/button";
const Button = (props: any) => <button {...props} />;
import { registerEvidenceAction } from "@/app/evidence-actions";
import { EvidencePhase } from "@/lib/types";
// Mocking storage import for now since we don't have firebase client setup in this specific sandbox test
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "@/lib/firebase"; 

interface EvidenceUploadProps {
  matchId: string;
  userId: string;
  phase: EvidencePhase;
  onSuccess?: () => void;
}

export function EvidenceUpload({ matchId, userId, phase, onSuccess }: EvidenceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Simulate Firebase Storage Upload
      const storagePath = `evidence/${matchId}/${userId}/${Date.now()}_${file.name}`;
      
      /* In a real app:
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      */
      
      // Call server action to register the evidence
      await registerEvidenceAction(matchId, phase, storagePath);
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to upload evidence");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-lg">{phase === "START" ? "Match Lobby Screenshot" : "Match Result Screenshot"}</h3>
      <p className="text-sm text-muted-foreground">
        Upload a clear screenshot. Must include both usernames and {phase === "START" ? "game ID" : "final score"}. Max 5MB.
      </p>
      
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
      />
      
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      
      <Button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Submit Evidence"}
      </Button>
    </div>
  );
}
