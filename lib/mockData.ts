export const USERS = [
  {
    id: "PP019283",
    username: "David_7",
    avatar: "https://picsum.photos/seed/david7/200/200",
    country: "US",
    dlsRating: 1428,
    eFootballRating: 1512,
    matches: 87,
    wins: 61,
    losses: 26,
    winRate: 70.1,
    form: ["W", "W", "W", "W", "L"],
    ranking: 3,
    reputation: 98
  },
  {
    id: "PP019284",
    username: "TimiLegend",
    avatar: "https://picsum.photos/seed/timi/200/200",
    country: "NG",
    dlsRating: 1412,
    eFootballRating: 1380,
    matches: 120,
    wins: 80,
    losses: 40,
    winRate: 66.7,
    form: ["L", "W", "W", "L", "W"],
    ranking: 4,
    reputation: 95
  },
  {
    id: "PP019285",
    username: "Prime_Messi",
    avatar: "https://picsum.photos/seed/messi/200/200",
    country: "AR",
    dlsRating: 1580,
    eFootballRating: 1620,
    matches: 210,
    wins: 175,
    losses: 35,
    winRate: 83.3,
    form: ["W", "W", "W", "W", "W"],
    ranking: 1,
    reputation: 100
  },
  {
    id: "PP019286",
    username: "eFootballPro",
    avatar: "https://picsum.photos/seed/efootpro/200/200",
    country: "JP",
    dlsRating: 1300,
    eFootballRating: 1598,
    matches: 190,
    wins: 150,
    losses: 40,
    winRate: 78.9,
    form: ["W", "L", "W", "W", "W"],
    ranking: 2,
    reputation: 99
  },
  {
    id: "PP019287",
    username: "KingDLS",
    avatar: "https://picsum.photos/seed/kingdls/200/200",
    country: "BR",
    dlsRating: 1350,
    eFootballRating: 1200,
    matches: 65,
    wins: 40,
    losses: 25,
    winRate: 61.5,
    form: ["L", "L", "W", "W", "L"],
    ranking: 5,
    reputation: 90
  },
  {
    id: "PP019288",
    username: "Ronaldo_10",
    avatar: "https://picsum.photos/seed/ronaldo10/200/200",
    country: "PT",
    dlsRating: 1362,
    eFootballRating: 1400,
    matches: 90,
    wins: 55,
    losses: 35,
    winRate: 61.1,
    form: ["W", "L", "L", "W", "W"],
    ranking: 6,
    reputation: 92
  }
];

export const OPEN_CHALLENGES = [
  {
    id: "CHAL001",
    game: "DLS",
    host: USERS[4], // KingDLS
    entryFee: 100,
    format: "1v1",
    timePosted: "2m ago"
  },
  {
    id: "CHAL002",
    game: "eFootball",
    host: USERS[5], // Ronaldo_10
    entryFee: 500,
    format: "1v1",
    timePosted: "5m ago"
  }
];

export const LIVE_MATCHES = [
  {
    id: "PP48291",
    game: "DLS",
    player1: USERS[0], // David_7
    player2: USERS[1], // TimiLegend
    status: "LIVE",
    score1: 2,
    score2: 1,
    time: "65'",
    predictionsCount: 3245,
    totalPool: 125430
  },
  {
    id: "PP48292",
    game: "eFootball",
    player1: USERS[2], // Prime_Messi
    player2: USERS[3], // eFootballPro
    status: "LIVE",
    score1: 0,
    score2: 0,
    time: "15'",
    predictionsCount: 8912,
    totalPool: 450000
  }
];

export const UPCOMING_MATCHES = [
  {
    id: "PP48293",
    game: "DLS",
    player1: USERS[4], // KingDLS
    player2: USERS[5], // Ronaldo_10
    status: "UPCOMING",
    startTime: "Starts in 15:32",
    predictionsCount: 1102,
    totalPool: 45200
  }
];

export const RECENT_ACTIVITY = [
  {
    id: "ACT1",
    user: USERS[0],
    action: "won a match against",
    target: USERS[4].username,
    time: "10m ago"
  },
  {
    id: "ACT2",
    user: USERS[2],
    action: "backed David_7 in",
    target: "David_7 vs TimiLegend",
    time: "15m ago"
  },
  {
    id: "ACT3",
    user: USERS[3],
    action: "reached Top 2 Global Ranking",
    target: "",
    time: "1h ago"
  }
];
