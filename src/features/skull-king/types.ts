// string을 PlayerId로 저장해둠(나중에 자주 사용해서)
export type PlayerId = string;

// 보너스 점수를 저장하는 타입. 이 점수는 bid와 tricks가 일치해야 받을 수 있음
export type SkullKingBonusInput = {
  standardFourteensCount: number;       // 일반 색깔(보라, 초록, 노랑)의 14 개수
  blackFourteenCaptured: boolean;       // 검정색의 14 획득 여부
  mermaidsCapturedByPirate: number;     // 해적으로 잡은 인어 개수
  piratesCapturedBySkullKing: number;   // 스컬킹으로 잡은 해적 개수
  skullKingCapturedByMermaid: boolean;  // 인어로 잡은 스컬킹 여부(스컬킹이 하나라서 boolean을 사용)
};

// 각 라운드에 대한 각 플레이어의 정보를 저장하는 타입
export type SkullKingPlayerRoundInput = {
  playerId: PlayerId;           // 플레이어의 아이디(혹은 이름)
  bid: number;                  // 각 라운드에서 몇 승을 할 지 베팅하는 승수를 저장하는 숫자
  tricks: number;               // 각 라운드에서 몇 승을 했는지를 나타내는 승수를 저장하는 숫자
  bonuses: SkullKingBonusInput; // 보너스 점수를 저장
};

// 약탈품 카드를 얻었을 때 약탈품을 낸 사람과 가져간 사람이 동맹이 되고, 그 동맹을 나타내는 타입
export type LootAlliance = {
  receiverId: PlayerId;
  giverId: PlayerId;
};

// 각 라운드에 대한 정보들을 저장해두는 타입
export type SkullKingRoundInput = {
  round: number;                        // 각 라운드가 몇 라운드인지 나타내는 숫자
  players: SkullKingPlayerRoundInput[]; // 모든 플레이어들의 라운드 정보를 저장해두는 배열
  lootAlliances: LootAlliance[];        // 각 라운드의 모든 동맹을 나타내는 배열
};

// 플레이어마다 각 라운드 결과를 저장해두는 타입
export type SkullKingPlayerRoundResult = {
  round : number;         // 라운드 수
  playerId: PlayerId;     // 플레이어 아이디(혹은 이름)
  bidSuccess: boolean;    // 승수 예측 성공 여부
  bidScore: number;       // 승수 예측으로 얻은 점수
  captureBonus: number;   // 카드 획득으로 얻은 보너스 점수
  lootBonus: number;      // 약탈품 카드로 얻은 보너스 점수
  totalBonus: number;     // 총 보너스 점수의 합
  roundScore: number;     // 이번 라운드의 모든 점수의 합
};

// 각 라운드의 모든 플레이어의 결과를 저장해두는 타입
export type SkullKingRoundResult = {
  round: number;                          // 라운드 수(1 ~ 10)
  players: SkullKingPlayerRoundResult[];  // 각 플레이어의 라운드 결과
};

// 한 게임의 모든 라운드에 대한 인풋을 저장해두는 타입
export type SkullKingGameInput = {
  rounds: SkullKingRoundInput[]; 
};

// 한 게임에서 한 플레이어의 모든 라운드 결과를 저장해두는 타입
export type SkullKingGamePlayerResult = {
  playerId: PlayerId;
  roundResults: SkullKingPlayerRoundResult[];
  totalScore: number;
};

// 한 게임의 결과를 저장해두는 타입
export type SkullKingGameResult = {
  players: SkullKingGamePlayerResult[];  
};

// 플레이어의 아이디와 이름을 저장해두는 타입
export type Player = {
  id: PlayerId;   // 플레이어를 식별할 아이디
  name: string;   // 실제 화면에 보여줄 이름
};

// 플레이어의 라운드 값과 아이디, 이름 등을 저장해두는 타입
export type RoundPlayer = {
  player: Player;
  value: SkullKingPlayerRoundInput;
};

// 게임 상태를 저장해두는 타입
export type SkullKingGameState = {
  players: RoundPlayer[];
  currentRound: number;
  roundResults: SkullKingRoundResult[];
  lootAlliances: LootAlliance[];
  isGameStarted: boolean;
  isGameFinished: boolean;
};