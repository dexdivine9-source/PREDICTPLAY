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

export type VerificationStatus = "PENDING" | "PROCESSING" | "LINKED" | "VERIFIED" | "REJECTED" | "MANUAL_REVIEW";
export type EvidencePhase = "START" | "END" | "PROFILE";
export type AnalysisStatus = "PENDING" | "QUEUED" | "COMPLETE" | "FAILED";

export type UserRole = "player" | "admin";

export interface PlayerProfile {
  id?: string;
  userId: string;
  username?: string;
  referralCode?: string;
  referral_code?: string;
  role?: UserRole;
  isVerified?: boolean;
  is_verified?: boolean;
  game?: GameType;
  gameUsername?: string;
  game_username?: string;
  team?: string;
  gameProfileScreenshotUrl?: string;
  game_profile_screenshot_url?: string;
  verificationStatus?: VerificationStatus;
  verification_status?: string;
  profileEvidenceId?: string;
  profileHash?: string;
  trustScore?: number;
  trust_score?: number;
  reputation?: number;
  isAdmin?: boolean;
  is_admin?: boolean;
  rejectionReason?: string;
  rejection_reason?: string;
  lastVerificationAt?: any;
  createdAt?: any;
  updatedAt?: any;
  trackerId?: string;
  tracker_id?: string;
  trackerTeamName?: string;
  tracker_team_name?: string;
  trackerPlayed?: number;
  tracker_played?: number;
  trackerWon?: number;
  tracker_won?: number;
  trackerLost?: number;
  tracker_lost?: number;
  trackerDivision?: number;
  tracker_division?: number;
  trackerLinkedAt?: any;
  tracker_linked_at?: any;
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
  analysisFailureReason?: string;
  analysisCompletedAt?: any;
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
