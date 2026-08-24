export type GameType = "DLS" | "eFootball";
export type MatchState = 
  | "OPEN" 
  | "PLAYER_JOINED" 
  | "AWAITING_START_EVIDENCE" 
  | "START_EVIDENCE_PROCESSING" 
  | "START_EVIDENCE_VERIFIED" 
  | "READY_TO_PLAY" 
  | "IN_PROGRESS" 
  | "AWAITING_END_EVIDENCE" 
  | "END_EVIDENCE_PROCESSING" 
  | "EVIDENCE_CROSS_CHECK" 
  | "AUTO_VERIFIED" 
  | "MANUAL_REVIEW" 
  | "DISPUTED" 
  | "COMPLETED" 
  | "CANCELLED";

export type VerificationStatus = "PENDING" | "PROCESSING" | "VERIFIED" | "REJECTED" | "MANUAL_REVIEW";
export type EvidencePhase = "START" | "END" | "PROFILE";
export type AnalysisStatus = "PENDING" | "QUEUED" | "COMPLETE" | "FAILED";

export interface PlayerProfile {
  userId: string;
  game?: GameType;
  gameUsername?: string;
  verificationStatus?: VerificationStatus;
  profileEvidenceId?: string;
  profileHash?: string;
  trustScore?: number;
  lastVerificationAt?: any; // Firestore Timestamp
  createdAt?: any;
  updatedAt?: any;
}

export interface Match {
  matchId: string;
  creatorId: string;
  player1Id: string;
  player2Id?: string;
  game: GameType;
  stake?: number;
  state: MatchState;
  
  // Reported by clients (untrusted)
  p1Score1?: number;
  p1Score2?: number;
  p2Score1?: number;
  p2Score2?: number;

  // Verified outcomes (trusted)
  verifiedScoreP1?: number;
  verifiedScoreP2?: number;
  verifiedOutcome?: "p1" | "p2" | "draw";
  verificationConfidence?: number;
  resolutionReason?: string;

  // Timestamps
  matchJoinedAt?: any;
  analysisStartedAt?: any;
  analysisCompletedAt?: any;
  resolvedAt?: any;
  createdAt: any;
}

export interface MatchEvidenceSession {
  matchId: string;
  game: GameType;
  player1Id: string;
  player2Id: string;
  status: string;
  startEvidenceDeadline?: any;
  endEvidenceDeadline?: any;
}

export interface MatchEvidence {
  evidenceId: string;
  matchId: string;
  userId: string;
  type: string; // SCREENSHOT
  phase: EvidencePhase;
  attemptNumber: number;
  supersedesEvidenceId?: string;

  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  imageHash?: string;
  perceptualHash?: string;

  uploadedAt: any;
  requestedBy?: string;
  requestedAt?: any;

  analysisStatus: AnalysisStatus;
  aiPayload?: any; // The rich JSON output
  flags?: string[];
}

export interface AdminAction {
  actionId: string;
  adminId: string;
  matchId: string;
  action: string;
  previousState?: string;
  newState?: string;
  previousScore?: any;
  newScore?: any;
  reason?: string;
  createdAt: any;
}

export interface PlayerRiskEvent {
  eventId: string;
  userId: string;
  matchId?: string;
  evidenceId?: string;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  source: string;
  createdAt: any;
}
