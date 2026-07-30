export type SkullKingRoomStatus =
  | "waiting"
  | "bidding"
  | "playing"
  | "scoring"
  | "round-result"
  | "finished"
  | "cancelled";

export type SkullKingRoom = {
  id: string;
  code: string;
  hostPlayerId: string;
  status: SkullKingRoomStatus;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
};

export type SkullKingRoomPlayer = {
  id: string;
  roomId: string;
  name: string;
  seat: number;
  isReady: boolean;
  joinedAt: string;
};

export type SkullKingBidSubmission = {
  id: string;
  roomId: string;
  playerId: string;
  round: number;
  bid: number;
  submittedAt: string;
};

export type SkullKingRoundSubmission = {
  id: string;
  roomId: string;
  playerId: string;
  round: number;

  tricks: number;
  standardFourteensCount: number;
  blackFourteenCaptured: boolean;
  mermaidsCapturedByPirate: number;
  piratesCapturedBySkullKing: number;
  skullKingCapturedByMermaid: boolean;

  isReady: boolean;

  submittedAt: string;
  updatedAt: string;
};

export type SkullKingRoomLootAlliance = {
  id: string;
  roomId: string;
  round: number;
  giverPlayerId: string;
  receiverPlayerId: string;
  createdByPlayerId: string;
  createdAt: string;
};

export type LocalSkullKingMultiplayerSession = {
  roomId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  updatedAt: number;
};