"use server";

/**
 * Gemini Vision Analysis Module for PredictPlay
 *
 * SECURITY CONTRACT:
 * - AI extracts ONLY observable visual facts.
 * - AI never decides who won, who settles, or who gets paid.
 * - The deterministic verification engine (verifyMatchAction) is the sole authority.
 * - If Gemini fails for any reason, analysisStatus is set to FAILED. No silent fallback.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { normalizeGame } from "@/lib/game-utils";

export interface AiPayload {
  game: string;
  gameConfidence: number;
  visiblePlayerNames: string[];
  playerNameConfidence: number;
  visibleOpponentNames: string[];
  opponentNameConfidence: number;
  score: {
    player1: number | null;
    player2: number | null;
  };
  scoreConfidence: number;
  screenType:
    | "PROFILE"
    | "MATCH_START"
    | "IN_GAME"
    | "FINAL_RESULT"
    | "UNKNOWN";
  screenTypeConfidence: number;
  uiConsistency: number;
  possibleManipulation: boolean;
  manipulationSignals: string[];
  notes: string[];
}

export interface AnalysisResult {
  success: true;
  payload: AiPayload;
  imageHash: string;
}

export interface AnalysisFailure {
  success: false;
  reason: string;
}

export type GeminiAnalysisOutcome = AnalysisResult | AnalysisFailure;

const ANALYSIS_PROMPT = `You are an evidence-analysis system for a gaming prediction platform.
You MUST analyze this screenshot and return ONLY a structured JSON object.
You MUST NOT decide who won, who should be paid, or what the outcome of the match should be.
Your job is ONLY to extract visible facts from the screenshot.

Analyze the following:

1. GAME: Is this DLS (Dream League Soccer) or eFootball? Look for game UI, logos, and style.
2. PLAYER NAMES: What usernames/gamertags are visible? List all visible player names.
3. OPPONENT NAMES: What opponent usernames are visible?
4. SCORE: What score is shown? Extract player1 score and player2 score as integers. 
   - player1 is the score on the LEFT or for the home team.
   - player2 is the score on the RIGHT or for the away team.
   - If no score is visible, return null for both.
5. SCREEN TYPE: 
   - "PROFILE": Profile/account screen
   - "MATCH_START": Pre-match lobby or team selection screen
   - "IN_GAME": Mid-game screenshot  
   - "FINAL_RESULT": End-of-match result screen showing final score
   - "UNKNOWN": Cannot determine
6. UI CONSISTENCY: How consistent and authentic does the UI look? (0.0 to 1.0)
7. MANIPULATION: Are there signs of image editing, overlays, score tampering, or digital manipulation?
   List any suspicious signals.

Return ONLY valid JSON matching exactly this schema. No extra text before or after the JSON.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    game: { type: Type.STRING },
    gameConfidence: { type: Type.NUMBER },
    visiblePlayerNames: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    playerNameConfidence: { type: Type.NUMBER },
    visibleOpponentNames: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    opponentNameConfidence: { type: Type.NUMBER },
    score: {
      type: Type.OBJECT,
      properties: {
        player1: { type: Type.NUMBER, nullable: true },
        player2: { type: Type.NUMBER, nullable: true },
      },
      required: ["player1", "player2"],
    },
    scoreConfidence: { type: Type.NUMBER },
    screenType: { type: Type.STRING },
    screenTypeConfidence: { type: Type.NUMBER },
    uiConsistency: { type: Type.NUMBER },
    possibleManipulation: { type: Type.BOOLEAN },
    manipulationSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "game",
    "gameConfidence",
    "visiblePlayerNames",
    "playerNameConfidence",
    "visibleOpponentNames",
    "opponentNameConfidence",
    "score",
    "scoreConfidence",
    "screenType",
    "screenTypeConfidence",
    "uiConsistency",
    "possibleManipulation",
    "manipulationSignals",
    "notes",
  ],
};

/**
 * Validates that an AI response conforms to the AiPayload schema.
 * Returns the validated payload or throws a descriptive error.
 */
function validateAiPayload(raw: unknown): AiPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("AI response is not an object");
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.game !== "string" || r.game.trim() === "") {
    throw new Error("AI response missing required field: game");
  }
  if (typeof r.gameConfidence !== "number") {
    throw new Error("AI response missing required field: gameConfidence");
  }
  if (!Array.isArray(r.visiblePlayerNames)) {
    throw new Error("AI response missing required field: visiblePlayerNames");
  }
  if (typeof r.playerNameConfidence !== "number") {
    throw new Error("AI response missing required field: playerNameConfidence");
  }
  if (!Array.isArray(r.visibleOpponentNames)) {
    throw new Error("AI response missing required field: visibleOpponentNames");
  }
  if (typeof r.opponentNameConfidence !== "number") {
    throw new Error("AI response missing required field: opponentNameConfidence");
  }
  if (typeof r.score !== "object" || r.score === null) {
    throw new Error("AI response missing required field: score");
  }
  const score = r.score as Record<string, unknown>;
  const p1 = score.player1;
  const p2 = score.player2;
  if (p1 !== null && typeof p1 !== "number") {
    throw new Error("AI response invalid score.player1");
  }
  if (p2 !== null && typeof p2 !== "number") {
    throw new Error("AI response invalid score.player2");
  }
  if (typeof r.scoreConfidence !== "number") {
    throw new Error("AI response missing required field: scoreConfidence");
  }
  const validScreenTypes = ["PROFILE", "MATCH_START", "IN_GAME", "FINAL_RESULT", "UNKNOWN"];
  if (typeof r.screenType !== "string" || !validScreenTypes.includes(r.screenType)) {
    throw new Error(`AI response invalid screenType: ${r.screenType}`);
  }
  if (typeof r.screenTypeConfidence !== "number") {
    throw new Error("AI response missing required field: screenTypeConfidence");
  }
  if (typeof r.uiConsistency !== "number") {
    throw new Error("AI response missing required field: uiConsistency");
  }
  if (typeof r.possibleManipulation !== "boolean") {
    throw new Error("AI response missing required field: possibleManipulation");
  }
  if (!Array.isArray(r.manipulationSignals)) {
    throw new Error("AI response missing required field: manipulationSignals");
  }
  if (!Array.isArray(r.notes)) {
    throw new Error("AI response missing required field: notes");
  }

  // Normalize game field to canonical value
  const normalizedGame = normalizeGame(r.game as string) ?? r.game as string;

  return {
    game: normalizedGame,
    gameConfidence: r.gameConfidence as number,
    visiblePlayerNames: r.visiblePlayerNames as string[],
    playerNameConfidence: r.playerNameConfidence as number,
    visibleOpponentNames: r.visibleOpponentNames as string[],
    opponentNameConfidence: r.opponentNameConfidence as number,
    score: {
      player1: score.player1 as number | null,
      player2: score.player2 as number | null,
    },
    scoreConfidence: r.scoreConfidence as number,
    screenType: r.screenType as AiPayload["screenType"],
    screenTypeConfidence: r.screenTypeConfidence as number,
    uiConsistency: r.uiConsistency as number,
    possibleManipulation: r.possibleManipulation as boolean,
    manipulationSignals: r.manipulationSignals as string[],
    notes: r.notes as string[],
  };
}

/**
 * Computes a deterministic SHA-256 hash of image bytes.
 * Returns hex string.
 */
async function computeSha256(imageBytes: Buffer): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(imageBytes).digest("hex");
}

/**
 * Calls Gemini Vision API with real image bytes.
 * Returns structured AiPayload or a failure record.
 * NEVER falls back to mock data.
 */
export async function analyzeImageWithGemini(
  imageBytes: Buffer,
  mimeType: string,
  storagePath: string
): Promise<GeminiAnalysisOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reason: "GEMINI_API_KEY environment variable is not configured",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const imageBase64 = imageBytes.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
                data: imageBase64,
              },
            },
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1, // Low temperature for deterministic fact extraction
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return {
        success: false,
        reason: "Gemini returned empty response for storage path: " + storagePath,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        reason: "Gemini returned invalid JSON: " + rawText.slice(0, 200),
      };
    }

    const payload = validateAiPayload(parsed);
    const imageHash = await computeSha256(imageBytes);

    return {
      success: true,
      payload,
      imageHash,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      reason: "Gemini API call failed: " + msg,
    };
  }
}
