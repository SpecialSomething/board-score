export type PlayerId = string;

export type SkullKingBonusInput = {
  standardFourteens: number;
  blackFourteens: number;
  mermaidsCapturedByPirate: number;
  piratesCapturedBySkullKing: number;
  skullKingCapturedByMermaid: boolean;
};

export type SkullKingPlayerRoundInput = {
  playerId: PlayerId;
  bid: number;
  tricks: number;
  bonuses: SkullKingBonusInput;
};

export type LootAlliance = {
  playerId: PlayerId;
  partnerId: PlayerId;
};

export type SkullKingRoundInput = {
  round: number;
  players: SkullKingPlayerRoundInput[];
  lootAlliances: LootAlliance[];
};

export type SkullKingPlayerRoundResult = {
  playerId: PlayerId;
  bidSuccess: boolean;
  bidScore: number;
  captureBonus: number;
  lootBonus: number;
  totalBonus: number;
  roundScore: number;
};

export type SkullKingRoundResult = {
  round: number;
  players: SkullKingPlayerRoundResult[];
};