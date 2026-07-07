# 스컬 킹 점수 계산 규칙

> 개발용 규칙 명세 초안\
> 이 문서는 스컬 킹 점수 계산기의 계산 엔진 구현 기준을 정의한다.\
> 점수 계산 로직은 React/Next.js UI와 분리된 순수 TypeScript 함수로
> 구현한다.

## 1. 범위

초기 버전은 기본 점수 계산과 다음 보너스를 지원한다.

-   일반 색상 14 카드 보너스
-   검은색 14 카드 보너스
-   해적이 인어를 포획한 경우
-   스컬 킹이 해적을 포획한 경우
-   인어가 스컬 킹을 포획한 경우
-   상급자 규칙의 약탈품(Loot) 동맹 보너스

초기 버전에서는 Rascal Scoring, Kraken, White Whale 등 점수 계산 구조를
별도로 확장해야 하는 규칙은 제외한다.

## 2. 게임 및 라운드

게임은 10라운드 동안 진행한다.

현재 라운드 번호를 `round`라고 한다.

각 플레이어는 라운드 시작 시 획득할 것으로 예상하는 트릭 수를 선언한다.
이를 `bid`라고 한다.

라운드 종료 후 실제 획득한 트릭 수를 `tricks`라고 한다.

기본 제약은 다음과 같다.

``` text
1 <= round <= 10
0 <= bid <= round
0 <= tricks <= round
```

## 3. 계산 단위

점수는 플레이어 한 명씩 독립적으로 계산하지 않는다.

약탈품 보너스는 두 플레이어의 비드 성공 여부에 의존하므로 한 라운드의
모든 플레이어 정보를 입력받아 라운드 전체를 계산한다.

``` ts
calculateSkullKingRound(
  input: SkullKingRoundInput
): SkullKingRoundResult
```

전체 계산 흐름은 다음과 같다.

``` text
라운드 전체 입력
    ↓
모든 플레이어의 비드 성공 여부 판정
    ↓
기본 비드 점수 계산
    ↓
포획 및 14 카드 보너스 계산
    ↓
약탈품 동맹 조건 확인
    ↓
플레이어별 최종 라운드 점수 계산
    ↓
라운드 전체 결과 반환
```

## 4. 입력 타입

``` ts
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
```

`LootAlliance.playerId`는 약탈품 카드를 낸 플레이어를 의미한다.

`LootAlliance.partnerId`는 해당 약탈품 카드가 포함된 트릭을 획득한
플레이어를 의미한다.

## 5. 비드 성공 판정

플레이어의 비드 성공 여부는 다음 조건으로 판정한다.

``` text
bid == tricks
```

이를 별도 순수 함수로 구현한다.

``` ts
function isBidSuccess(
  player: SkullKingPlayerRoundInput
): boolean;
```

## 6. 일반 비드 점수

`bid >= 1`인 경우 일반 비드 규칙을 적용한다.

### 6.1 비드 성공

``` text
bid == tricks
```

이면 기본 비드 점수는 다음과 같다.

``` text
bidScore = bid × 20
```

예시:

``` text
bid = 3
tricks = 3

bidScore = 3 × 20 = 60
```

### 6.2 비드 실패

``` text
bid != tricks
```

이면 다음과 같이 계산한다.

``` text
difference = |bid - tricks|
bidScore = difference × -10
```

예시:

``` text
bid = 3
tricks = 1

difference = |3 - 1| = 2
bidScore = 2 × -10 = -20
```

## 7. 0 비드 점수

`bid == 0`인 경우 0 비드 전용 규칙을 적용한다.

### 7.1 0 비드 성공

``` text
bid == 0
tricks == 0
```

이면:

``` text
bidScore = round × 10
```

예시:

``` text
round = 7
bid = 0
tricks = 0

bidScore = 7 × 10 = 70
```

### 7.2 0 비드 실패

``` text
bid == 0
tricks > 0
```

이면:

``` text
bidScore = round × -10
```

실제 획득한 트릭 수와 관계없이 라운드 번호를 기준으로 감점한다.

예시:

``` text
round = 7
bid = 0
tricks = 3

bidScore = 7 × -10 = -70
```

## 8. 보너스 적용 조건

14 카드 및 캐릭터 포획 보너스는 플레이어가 자신의 비드를 정확히 맞힌
경우에만 최종 점수에 적용한다.

``` text
bid == tricks
```

비드에 실패하면 해당 보너스 점수는 최종 라운드 점수에 적용하지 않는다.

보너스 입력 정보 자체는 결과 설명 또는 디버깅을 위해 유지할 수 있지만,
적용 점수는 `0`으로 처리한다.

## 9. 14 카드 보너스

### 9.1 일반 색상 14 카드

일반 색상 14 카드 한 장당 10점을 얻는다.

``` text
standardFourteens × 10
```

### 9.2 검은색 14 카드

검은색 14 카드 한 장당 20점을 얻는다.

``` text
blackFourteens × 20
```

## 10. 캐릭터 포획 보너스

### 10.1 해적이 인어를 포획

포획한 인어 한 장당 20점을 얻는다.

``` text
mermaidsCapturedByPirate × 20
```

### 10.2 스컬 킹이 해적을 포획

포획한 해적 한 장당 30점을 얻는다.

``` text
piratesCapturedBySkullKing × 30
```

### 10.3 인어가 스컬 킹을 포획

인어가 스컬 킹을 포획한 경우 40점을 얻는다.

``` text
skullKingCapturedByMermaid ? 40 : 0
```

## 11. 포획 및 14 카드 보너스 계산

다음 함수는 한 플레이어가 획득한 14 카드 및 캐릭터 포획 보너스의
원점수를 계산한다.

``` ts
function calculateCaptureBonus(
  bonuses: SkullKingBonusInput
): number;
```

계산식은 다음과 같다.

``` text
captureBonus =
    standardFourteens × 10
  + blackFourteens × 20
  + mermaidsCapturedByPirate × 20
  + piratesCapturedBySkullKing × 30
  + (skullKingCapturedByMermaid ? 40 : 0)
```

이 함수는 비드 성공 여부를 판정하지 않는다.

비드 성공 여부에 따른 실제 보너스 적용은 라운드 전체 계산 함수에서
처리한다.

## 12. 약탈품 동맹

약탈품 카드를 낸 플레이어와 그 카드가 포함된 트릭을 획득한 플레이어는
약탈품 동맹을 맺는다.

두 플레이어가 모두 자신의 비드를 정확히 맞힌 경우 두 플레이어는 각각
20점의 약탈품 보너스를 얻는다.

``` text
player.bid == player.tricks
AND
partner.bid == partner.tricks
```

조건을 만족하면:

``` text
player lootBonus += 20
partner lootBonus += 20
```

한 명이라도 비드에 실패하면 두 플레이어 모두 해당 동맹에서 약탈품
보너스를 얻지 못한다.

### 예시: 양쪽 모두 성공

``` text
A: bid = 2, tricks = 2
B: bid = 3, tricks = 3

A lootBonus += 20
B lootBonus += 20
```

### 예시: 한쪽 실패

``` text
A: bid = 2, tricks = 2
B: bid = 3, tricks = 4

A lootBonus += 0
B lootBonus += 0
```

## 13. 약탈품 예외 및 검증

같은 플레이어를 약탈품 동맹의 양쪽에 지정할 수 없다.

``` text
playerId != partnerId
```

약탈품 카드를 낸 플레이어 자신이 해당 트릭을 획득한 경우 동맹이 형성되지
않으므로 약탈품 보너스를 적용하지 않는다.

`playerId`와 `partnerId`는 모두 현재 라운드의 `players`에 존재해야 한다.

동일한 약탈품 동맹 입력이 중복 저장되지 않도록 검증한다.

한 라운드에 여러 약탈품 동맹이 존재할 수 있으므로 `lootAlliances`는
배열로 관리한다.

## 14. 약탈품 보너스 계산

약탈품 보너스는 플레이어 간 관계를 확인해야 하므로 개별 플레이어 계산
함수에서 처리하지 않는다.

``` ts
function calculateLootBonuses(
  players: SkullKingPlayerRoundInput[],
  alliances: LootAlliance[]
): Map<PlayerId, number>;
```

함수의 처리 순서는 다음과 같다.

``` text
1. 모든 플레이어의 약탈품 보너스를 0으로 초기화
2. 각 약탈품 동맹을 순회
3. playerId와 partnerId에 해당하는 플레이어 검색
4. 양쪽 플레이어의 비드 성공 여부 확인
5. 양쪽 모두 성공한 경우 각각 20점 추가
6. 플레이어별 누적 약탈품 보너스 반환
```

## 15. 결과 타입

``` ts
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
```

`captureBonus`는 실제 최종 점수에 적용된 14 카드 및 캐릭터 포획
보너스이다.

`lootBonus`는 실제 적용된 약탈품 보너스이다.

`totalBonus`는 다음과 같다.

``` text
totalBonus = captureBonus + lootBonus
```

`roundScore`는 다음과 같다.

``` text
roundScore = bidScore + totalBonus
```

## 16. 라운드 전체 계산 함수

핵심 계산 함수는 다음과 같다.

``` ts
function calculateSkullKingRound(
  input: SkullKingRoundInput
): SkullKingRoundResult;
```

계산 순서는 다음과 같다.

``` text
1. 라운드 입력값 검증
2. 모든 플레이어의 비드 성공 여부 판정
3. 모든 플레이어의 기본 비드 점수 계산
4. 모든 플레이어의 포획 및 14 카드 보너스 원점수 계산
5. 비드 실패 플레이어의 포획 및 14 카드 보너스를 0으로 처리
6. 모든 약탈품 동맹 검증
7. 약탈품 보너스 계산
8. 플레이어별 totalBonus 계산
9. 플레이어별 roundScore 계산
10. SkullKingRoundResult 반환
```

## 17. 입력값 검증

다음 입력은 유효하지 않다.

``` text
round < 1
round > 10

bid < 0
bid > round

tricks < 0
tricks > round

standardFourteens < 0
blackFourteens < 0
mermaidsCapturedByPirate < 0
piratesCapturedBySkullKing < 0
```

추가로 다음 조건을 검증한다.

``` text
playerId는 라운드 내에서 유일해야 한다.
lootAlliances의 playerId는 players에 존재해야 한다.
lootAlliances의 partnerId는 players에 존재해야 한다.
playerId와 partnerId는 같을 수 없다.
동일한 약탈품 동맹 입력은 중복될 수 없다.
```

구현 초기에는 잘못된 입력에 대해 `Error`를 발생시키는 방식을 사용한다.

``` ts
throw new Error("Invalid Skull King round input");
```

UI 입력 검증은 별도로 수행하되 계산 엔진에서도 입력값을 검증한다.

## 18. 권장 함수 구조

``` ts
function validateRoundInput(
  input: SkullKingRoundInput
): void;

function isBidSuccess(
  player: SkullKingPlayerRoundInput
): boolean;

function calculateBidScore(
  round: number,
  bid: number,
  tricks: number
): number;

function calculateCaptureBonus(
  bonuses: SkullKingBonusInput
): number;

function calculateLootBonuses(
  players: SkullKingPlayerRoundInput[],
  alliances: LootAlliance[]
): Map<PlayerId, number>;

export function calculateSkullKingRound(
  input: SkullKingRoundInput
): SkullKingRoundResult;
```

외부에서 직접 사용할 핵심 함수는 `calculateSkullKingRound`이다.

나머지 함수는 구현 세부 사항으로 유지할 수 있다.

## 19. 테스트 필수 사례

계산 엔진 구현 후 최소한 다음 사례를 테스트한다.

``` text
1. 일반 비드 성공
   bid = 3, tricks = 3
   bidScore = 60

2. 일반 비드 미달 실패
   bid = 3, tricks = 1
   bidScore = -20

3. 일반 비드 초과 실패
   bid = 2, tricks = 4
   bidScore = -20

4. 0 비드 성공
   round = 5, bid = 0, tricks = 0
   bidScore = 50

5. 0 비드 실패
   round = 5, bid = 0, tricks = 1
   bidScore = -50

6. 일반 14 카드 보너스

7. 검은색 14 카드 보너스

8. 해적의 인어 포획 보너스

9. 스컬 킹의 해적 포획 보너스

10. 인어의 스컬 킹 포획 보너스

11. 비드 실패 시 포획 및 14 카드 보너스 미적용

12. 약탈품 동맹 양쪽 비드 성공
    양쪽 각각 +20

13. 약탈품 동맹 한쪽 비드 실패
    양쪽 +0

14. 한 플레이어가 여러 유효한 약탈품 동맹에 참여

15. 존재하지 않는 playerId가 약탈품 동맹에 포함된 경우

16. 자기 자신과 약탈품 동맹을 입력한 경우

17. 중복 playerId 입력

18. 범위를 벗어난 round, bid, tricks 입력
```

## 20. MVP 범위

초기 웹 버전은 다음 기능을 구현한다.

-   플레이어 등록
-   1\~10라운드 진행
-   플레이어별 비드 입력
-   플레이어별 실제 획득 트릭 수 입력
-   14 카드 보너스 조건 입력
-   캐릭터 포획 보너스 조건 입력
-   약탈품 동맹 입력
-   라운드 전체 점수 자동 계산
-   누적 점수 계산
-   현재 순위 표시
-   브라우저 로컬 저장

초기 MVP에서 다음 기능은 제외한다.

-   카드별 플레이 기록
-   트릭 승자 자동 판정
-   해적 특수 능력 처리
-   Rascal Scoring
-   Kraken
-   White Whale
-   온라인 멀티플레이
-   사용자 계정
-   서버 저장

## 21. 구현 원칙

점수 계산 로직은 React 컴포넌트에 작성하지 않는다.

`calculator.ts`는 브라우저 API와 React에 의존하지 않는다.

계산 함수는 가능한 한 순수 함수로 구현한다.

UI는 계산에 필요한 사실만 입력받고 실제 점수 계산은 계산 엔진에
위임한다.

게임 규칙이 변경되거나 다른 판본을 지원할 경우 계산 규칙을 UI가 아닌
계산 엔진에서 변경할 수 있어야 한다.
