# PredictPlay

> **Predict the players. Verify the match. Settle the market.**

PredictPlay is a verified competitive-gaming and prediction platform for **Dream League Soccer (DLS)** and **eFootball**.

The platform allows players to establish a verified game identity, create and play matches, submit start/end match evidence, and participate in prediction markets around verified matches.

---

## The Core Problem: Trust

If people are going to predict the outcome of a game, how do we know the players actually played the match and that the reported result is legitimate?

PredictPlay addresses this with a **layered evidence and verification system** rather than trusting a player-submitted score alone.

---

## 1. Product Vision

PredictPlay is not simply a betting interface. It is a **trust layer** around competitive DLS/eFootball matches.

The long-term system connects:

```
Verified Player Identity
        ↓
Verified Match
        ↓
Start Evidence
        ↓
Gameplay
        ↓
End Evidence
        ↓
Evidence Analysis
        ↓
Match Verification
        ↓
Prediction Market Settlement
        ↓
Player Reputation
```

The long-term goal is to create a trusted network of:

- Verified players
- Verified matches
- Match histories
- Player reputations
- Prediction markets
- Predictor performance
- Evidence integrity signals

---

## 2. Core Product Principles

### 2.1 The game remains the game

DLS and eFootball remain responsible for the actual gameplay. PredictPlay does not need to control the gameplay itself.

PredictPlay provides:
- Player identity
- Match organization
- Evidence collection
- Verification
- Prediction markets
- Reputation
- Settlement
- Auditability

### 2.2 Screenshots are evidence, not absolute truth

A screenshot can potentially be edited, reused, taken from another match, taken from another account, or manipulated.

Therefore, PredictPlay must **never rely on a single screenshot as absolute proof**. Evidence is evaluated using multiple signals.

### 2.3 AI is an investigator, not the financial authority

AI/image analysis may:
- Extract OCR
- Detect game identity
- Detect usernames
- Detect scores
- Identify inconsistencies
- Identify possible reuse
- Produce confidence/risk signals

**AI must not directly control wallets or settlement.** Trusted backend logic remains responsible for financial state.

### 2.4 The client is untrusted

The browser must never be trusted to directly modify:
- Wallet balances
- Prediction balances
- Market settlement
- Transaction ledger
- Verified scores
- Reputation
- Evidence verification status
- Settlement state

Sensitive mutations must happen through trusted server-side logic.

---

## 3. Main User Types

### Players

Players:
- Create accounts
- Select DLS or eFootball
- Verify their game profile
- Create matches
- Accept matches
- Submit start evidence
- Play matches
- Submit end evidence
- Build reputation
- Participate in competitive play

### Predictors

Predictors:
- Browse markets
- Analyze players
- Predict match outcomes
- Use virtual PTS
- Receive payouts when predictions are correct

A predictor does not need to participate in the match.

### Administrators

Administrators handle exceptions such as:
- Suspicious evidence
- Contradictory results
- Manual verification
- Cancellations
- Refunds
- Suspicious accounts
- Exceptional settlement cases

The goal is to avoid requiring administrators to manually approve every normal match.

---

## 4. Core Match Lifecycle

```
OPEN
  ↓
PLAYER_JOINED
  ↓
AWAITING_START_EVIDENCE
  ↓
START_EVIDENCE_COMPLETE
  ↓
IN_PROGRESS
  ↓
AWAITING_END_EVIDENCE
  ↓
EVIDENCE_PROCESSING
  ↓
AUTO_VERIFIED
  ↓
COMPLETED
  ↓
PREDICTION_SETTLEMENT
```

**Exceptional paths:**

```
EVIDENCE_PROCESSING → MANUAL_REVIEW → COMPLETED
                                    ↓
                                 CANCELLED → REFUND
```

Clients must not be allowed to arbitrarily change match states.

---

## 5. Player Registration & Game Profile Verification

During onboarding, a user selects **DLS** or **eFootball**, then submits a screenshot of their in-game profile.

The profile verification system attempts to establish:
- Game
- Game username/gamertag
- Visible profile information
- Evidence ownership
- Evidence reuse

**Profile flow:**

```
CREATE ACCOUNT
      ↓
SELECT GAME
      ↓
ENTER GAMERTAG
      ↓
UPLOAD PROFILE SCREENSHOT
      ↓
EVIDENCE ANALYSIS
      ↓
PROFILE VERIFIED / REVIEW / REJECTED
```

**Profile states:** `PENDING` → `PROCESSING` → `VERIFIED` / `REJECTED` / `MANUAL_REVIEW`

> The client must never be allowed to mark a profile as verified.

---

## 6. Match Evidence System

Every verified match uses an evidence session.

```
PLAYER PROFILE
      ↓
START EVIDENCE
      ↓
MATCH
      ↓
END EVIDENCE
```

Both players are expected to submit evidence.

### Start Evidence

Players are instructed to capture the game immediately before kickoff. The evidence should ideally show:
- Game UI
- Player identity
- Opponent
- Teams
- Match setup
- 0–0 score where available

### End Evidence

Players are instructed to capture the final result screen immediately after the match. The evidence should ideally show:
- Game UI
- Player identity
- Opponent
- Final score
- Recognizable result screen

---

## 7. Evidence Data

Evidence records contain trusted metadata:

```ts
{
  evidenceId: string
  matchId: string
  userId: string
  type: "START" | "END"
  imageUrl: string
  uploadedAt: Timestamp
  imageHash: string           // SHA-256
  perceptualHash: string
  ocrText: string
  detectedGame: string
  detectedUsername: string
  detectedOpponent: string
  detectedScore: string
  analysisStatus: string
  verificationStatus: string
  confidenceScore: number
  flags: string[]
}
```

The client must not be allowed to set trusted analysis fields.

**Example flags:**
- `DUPLICATE_IMAGE`
- `REUSED_EVIDENCE`
- `POSSIBLE_EDIT`
- `UNSUPPORTED_GAME`
- `IDENTITY_MISMATCH`
- `SCORE_UNREADABLE`
- `MATCH_MISMATCH`

A single flag should not automatically mean that a player cheated.

---

## 8. Evidence Fingerprinting

Uploaded evidence is fingerprinted with at minimum:
- SHA-256 hash
- Perceptual hash
- MIME type
- Dimensions
- File size
- Server-side upload timestamp

This enables detection of:
- Exact duplicate screenshots
- Near-duplicate screenshots
- Previously submitted evidence
- Evidence reused across accounts
- Evidence reused across matches

Original evidence is **immutable after submission**. If new evidence is required, create a new evidence record rather than overwriting the old one.

---

## 9. Evidence Analysis Pipeline

The selected MVP pipeline is **Auto-analyze + verify, manual payout** — evidence is analyzed automatically and normal matches can progress through deterministic verification, while financial settlement remains behind a trusted/manual payout gate during the MVP.

```
SCREENSHOT UPLOAD
        ↓
IMAGE VALIDATION
        ↓
HASH / FINGERPRINT
        ↓
OCR
        ↓
GAME DETECTION
        ↓
IDENTITY EXTRACTION
        ↓
SCORE EXTRACTION
        ↓
DUPLICATE DETECTION
        ↓
CROSS-EVIDENCE COMPARISON
        ↓
DETERMINISTIC VERIFICATION
        ↓
AUTO VERIFIED / MANUAL REVIEW
        ↓
TRUSTED SETTLEMENT
```

> Expensive AI/image processing must not occur inside the wallet settlement transaction.

---

## 10. Cross-Player Verification

PredictPlay compares the evidence submitted by both players.

**Consistent example (strong signal):**

| | Player A | Player B |
|---|---|---|
| **START** | David_7 vs TimiLegend · 0–0 | David_7 vs TimiLegend · 0–0 |
| **END** | David_7 3–1 TimiLegend | David_7 3–1 TimiLegend |

**Inconsistent example → DISPUTED / MANUAL_REVIEW:**

| | Player A | Player B |
|---|---|---|
| **END** | David_7 3–1 TimiLegend | David_7 1–3 TimiLegend |

---

## 11. Verification Engine

The verification engine combines multiple signals:

```json
{
  "identityConsistency": true,
  "gameConsistency": true,
  "startEvidenceConsistency": true,
  "endEvidenceConsistency": true,
  "scoreConsistency": true,
  "evidenceReuseDetected": false,
  "manipulationFlags": [],
  "confidenceScore": 97,
  "recommendation": "AUTO_VERIFY"
}
```

**Possible recommendations:** `AUTO_VERIFY` · `REQUEST_MORE_EVIDENCE` · `MANUAL_REVIEW` · `REJECT`

**Hard failures override confidence:**
- Contradictory final scores → no automatic verification
- Wrong game → no automatic verification
- Identity mismatch → no automatic verification
- Missing required evidence → no automatic verification

---

## 12. Anti-Rigging Strategy

PredictPlay is designed to make fraud **difficult, expensive, detectable, and resolvable**.

**Potential attacks:**
- Fake profile / fake screenshot / edited screenshot
- Reused screenshot / another player's screenshot
- Fake score
- Two-account manipulation / collusion
- Replayed server action / evidence deletion
- Timestamp manipulation / prediction manipulation

**Defenses:**
- Verified game profiles
- Immutable evidence
- Cryptographic hashes
- Perceptual hashes
- OCR / game detection / identity matching
- Cross-player evidence comparison
- Score consistency checks
- Timing checks
- Evidence reuse detection
- Behavioral history
- Dispute history
- Manual review

No single technique guarantees authenticity. The objective is to create enough independent evidence and economic/account-level friction that manipulation becomes harder, more detectable, more costly, and easier to investigate.

---

## 13. Player Trust & Reputation

Players gradually develop a reputation profile:

```ts
{
  trustScore: number
  successfulMatches: number
  disputedMatches: number
  cancelledMatches: number
  evidenceFailures: number
  suspiciousEvidenceCount: number
  lastVerificationAt: Timestamp
}
```

**Example player profile:**

```
DAVID_7
DLS VERIFIED PLAYER

Matches:       127
Wins:           91
Losses:         26
Draws:          10

Win Rate:     71.6%
Reputation:   1,942

Evidence Integrity: 98%
Disputes:            2
```

Trust-related fields must only be modified by trusted backend logic.

---

## 14. Prediction Markets

When a match is available for prediction, spectators can predict: **PLAYER 1** · **PLAYER 2** · **DRAW**

The market maintains:
- `totalPool`
- `p1Pool` / `p2Pool` / `drawPool`
- `status`
- `winningOutcome`

**Example market:**

```
David_7 vs TimiLegend

David       62%
Timi        31%
Draw         7%

Pool: 9,420 PTS
```

Predictions are placed using virtual **PTS**.

---

## 15. Virtual PTS Economy

PredictPlay uses a closed virtual points economy. New users receive an initial balance (e.g. **1,000 PTS**).

**PTS can be used for:** match stakes · predictions · future competitions

**PTS can be earned from:** winning matches · winning predictions · future tournaments

Every financial movement must be recorded in the transaction ledger:

```
+1000  INITIAL_BALANCE
 -200  PREDICTION
 +360  PREDICTION_PAYOUT
 -100  MATCH_STAKE
 +200  MATCH_WIN
```

---

## 16. Secure Backend Architecture

Sensitive operations use:
- **Next.js Server Actions**
- **Firebase Admin SDK**
- **Firestore transactions**

The browser is not trusted with financial state.

```
CLIENT
  ↓
SERVER ACTION
  ↓
VALIDATION
  ↓
FIREBASE ADMIN SDK
  ↓
FIRESTORE TRANSACTION
```

**Sensitive state includes:**
wallets · markets · predictions · transactions · reputation · verified scores · settlement · trusted evidence analysis · verification state

---

## 17. Settlement

Prediction settlement must happen only after a trusted verified result exists.

```
MATCH
  ↓
EVIDENCE
  ↓
VERIFICATION
  ↓
VERIFIED RESULT
  ↓
SECURE SETTLEMENT
  ↓
WALLET PAYOUT
  ↓
TRANSACTION LEDGER
```

The client must never directly specify the winning outcome, payout, wallet balance, or settlement status. The verified score is the authoritative result used by the settlement engine.

---

## 18. Prediction Payout Formula

The market uses pooled prediction stakes:

```
winningPool      = pool for winning outcome
nonWinningPool   = totalPool - winningPool
share            = predictionAmount / winningPool
payout           = predictionAmount + floor(share × nonWinningPool)
```

**Example:**

| | |
|---|---|
| Total pool | 10,000 PTS |
| P1 pool | 6,000 PTS |
| P2 pool | 4,000 PTS |
| **P1 wins** | |
| User prediction | 1,000 PTS |
| Share | 1,000 / 6,000 = 0.1666… |
| Profit | 0.1666… × 4,000 ≈ 666 PTS |
| **Total payout** | **1,666 PTS** |

The settlement engine also accounts for: no winning predictions · rounding remainder · missing wallets · cancellation/refunds · duplicate settlement attempts · transaction limits.

---

## 19. Closed-Economy Accounting

The system preserves accounting integrity:

```
USER WALLET → PREDICTION → MARKET POOL → WINNING PREDICTOR WALLET
```

No points should disappear accidentally. For edge cases (no winning prediction, rounding remainder, cancelled match), the system uses an explicit **treasury/refund mechanism** rather than silently leaving points stranded.

---

## 20. Admin / Manual Review

The admin system is an **exception-handling layer**, not the normal match engine.

**Admin view example:**

```
MATCH #48291
David_7 vs TimiLegend · DLS

PROFILE EVIDENCE    Player A ✓    Player B ✓
START EVIDENCE      Player A ✓    Player B ✓
END EVIDENCE        Player A ✓    Player B ✓

AI ANALYSIS
Game detected       ✓
Identity match      ✓
Score match         ✓
Evidence reused     ✕
Confidence          61%

FLAGS
⚠ Possible mismatch
```

**Admin actions:** `VERIFY RESULT` · `CANCEL + REFUND` · `REQUEST MORE EVIDENCE`

All admin actions must be authenticated, authorized, and recorded.

---

## 21. Firestore Collections

```
users
player_profiles
player_evidence

matches
match_participants

match_evidence_sessions
match_evidence
evidence_analysis

markets
predictions

virtual_wallets
transactions
settlements

admin_actions
```

---

## 22. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI | React |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Admin SDK | Firebase Admin SDK |
| Server Logic | Next.js Server Actions |

> The architecture keeps AI/image processing **separate** from financial settlement.

---

## 23. Security Rules

The following sensitive writes must not be directly available to clients:

- `virtual_wallets`
- `markets`
- `predictions`
- `transactions`
- Player reputation
- Verified scores
- Settlement state
- Trusted evidence analysis
- Verification status

Client-uploaded evidence must also be protected so users cannot overwrite or delete another user's evidence.

---

## 24. Important Limitations

PredictPlay **cannot guarantee** that every screenshot is authentic. A sophisticated attacker may still attempt collusion, screen manipulation, fake evidence, multiple accounts, or coordinated cheating.

The objective is **not** to claim perfect fraud detection.

The objective is to create enough independent evidence and economic/account-level friction that manipulation becomes harder, more detectable, more costly, and easier to investigate.

---

## 25. MVP Scope

The first production MVP proves one complete loop:

```
SIGN UP
  ↓
GAME PROFILE VERIFICATION
  ↓
CREATE MATCH
  ↓
JOIN MATCH
  ↓
START EVIDENCE
  ↓
PLAY
  ↓
END EVIDENCE
  ↓
AUTO ANALYZE
  ↓
DETERMINISTIC VERIFICATION
  ↓
MANUAL PAYOUT GATE
  ↓
PREDICTION SETTLEMENT
  ↓
PLAYER REPUTATION
```

> Do not expand into tournaments, social feeds, advanced leaderboards, or real-money betting until this loop works reliably with real testers.

---

## 26. Long-Term Vision

Once PredictPlay has enough verified matches, it becomes a competitive gaming data and reputation network.

**Potential future features:**
- Player rankings & predictor rankings
- Player profiles & head-to-head records
- Recent form & tournaments
- Player following & challenges
- Prediction leaderboards
- Advanced market analytics
- Player performance statistics
- Trust scores
- Regional competitions

**Long-term player card:**

```
DAVID_7 · DLS

127 Matches · 91 Wins · 26 Losses · 10 Draws
71.6% Win Rate · 1,942 Reputation · 98% Evidence Integrity
```

---

## 27. Product Moat

The prediction UI itself is not the strongest moat. The potential moat is the underlying network of:

```
Verified Players
      +
Verified Matches
      +
Evidence History
      +
Player Reputation
      +
Prediction History
      +
Trust Signals
```

As the network grows, PredictPlay develops a proprietary **reputation and competitive-performance graph** for DLS/eFootball players — making the platform more valuable than a simple prediction interface.

---

## 28. Final Architecture

```
                    PREDICTPLAY
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   PLAYER IDENTITY     MATCHES        PREDICTION
        │                │                │
        ▼                ▼                │
  PROFILE EVIDENCE   START EVIDENCE       │
        │                │                │
        └────────────┬───┘                │
                     ▼                    │
                  GAMEPLAY                │
                     │                    │
                     ▼                    │
                END EVIDENCE              │
                     │                    │
                     ▼                    │
              EVIDENCE ANALYSIS           │
                     │                    │
                     ▼                    │
           CROSS-PLAYER VERIFICATION      │
                     │                    │
              ┌──────┴──────┐             │
              ▼             ▼             │
        AUTO VERIFIED   MANUAL REVIEW     │
              │             │             │
              └──────┬──────┘             │
                     ▼                    │
              VERIFIED RESULT             │
                     │                    │
                     └──────────┬─────────┘
                                ▼
                         MARKET SETTLEMENT
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
                PTS WALLET             REPUTATION
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         TRUSTED HISTORY
```

---

> **The fundamental rule of PredictPlay:**
>
> **No verified match → No prediction settlement.**
