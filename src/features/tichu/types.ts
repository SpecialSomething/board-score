// 티츄 팀 ID
export type TichuTeamId = 1 | 2;

// 플레이어 자리
export type TichuSeat = 1 | 2 | 3 | 4;

// 팀별 값을 저장하는 공통 타입
export type TichuTeamValues<T> = Record<TichuTeamId, T>;

// 티츄 플레이어
export type TichuPlayer = {
  id: string;
  name: string;
  teamId: TichuTeamId;
  seat: TichuSeat;
};

// 티츄 선언 종류
export type TichuDeclarationType =
  | "small-tichu"
  | "grand-tichu";

// 티츄 선언
export type TichuDeclaration = {
  playerId: string;
  teamId: TichuTeamId;
  type: TichuDeclarationType;
  success: boolean | null;
};

// 한 라운드 입력값
export type TichuRoundInput = {
  round: number;

  cardScores: TichuTeamValues<number>;

  oneTwoTeamId: TichuTeamId | null;

  declarations: TichuDeclaration[];
};

// 한 라운드 계산 결과
export type TichuRoundResult = {
  round: number;

  cardScores: TichuTeamValues<number>;
  declarationScores: TichuTeamValues<number>;
  roundScores: TichuTeamValues<number>;

  oneTwoTeamId: TichuTeamId | null;

  declarations: TichuDeclaration[];
};

// 게임 전체 계산 결과
export type TichuGameResult = {
  totalScores: TichuTeamValues<number>;

  winnerTeamId: TichuTeamId | null;

  isFinished: boolean;
};

// 티츄의 게임 상태를 저장하는 타입
export type TichuGameState = {
  players: TichuPlayer[];
  targetScore: number;
  roundResults: TichuRoundResult[];
  isGameStarted: boolean;
  isGameFinished: boolean;
  updatedAt: number;
};