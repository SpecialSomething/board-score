import type { 
    SkullKingBonusInput,
    SkullKingPlayerRoundInput,
    LootAlliance,
    PlayerId,
    SkullKingRoundInput,
    SkullKingPlayerRoundResult,
    SkullKingRoundResult
} from "./types";

// 베팅한 승수와 실제 이긴 승수가 같은지를 나타내는 함수
function isBidSuccess(
    player: SkullKingPlayerRoundInput
): boolean {
    return player.bid === player.tricks;
}

// 베팅한 승수에 따라 점수를 계산하는 함수
function calculateBidScore(
    round : number,
    player: SkullKingPlayerRoundInput
): number {
    if (player.bid === 0) {    // 0승을 걸었을 경우
        return player.tricks === 0 ? round * 10 : round * -10; 
        // 맞추면 round 수 * 10점, 틀릴경우 round 수 * -10점을 함
    }
    
    // 이하는 0승이 아닌 승수를 걸었을 경우
    if (player.bid === player.tricks) {   // 승수를 맞췄을 경우
        return player.bid * 20;    // 걸었던 승수 * 20점을 함
    }

    // 승수를 틀렸을 경우 
    // 걸었던 승수와 실제 이긴 승수의 차이 * -10점을 함 
    return Math.abs(player.bid - player.tricks) * -10;    
}

// 획득한 보너스(약탈품 제외)를 계산하는 함수. 
// 걸었던 승수와 실제 이긴 승수가 같아야 획득 가능함(다를 경우는 획득하지 못함)
function calculateCaptureBonus(
    bonuses : SkullKingBonusInput
): number {
    return (
        bonuses.standardFourteens * 10 +                // 일반 색깔(보라, 노랑, 초록) 14 개수 하나당 10점
        bonuses.blackFourteens * 20 +                   // 검정색 14를 얻을 경우 20점
        bonuses.mermaidsCapturedByPirate * 20 +         // 해적으로 인어를 잡을 경우 하나당 20점
        bonuses.piratesCapturedBySkullKing * 30 +       // 스컬킹으로 해적을 잡을 경우 하나당 30점
        (bonuses.skullKingCapturedByMermaid ? 40 : 0)   // 인어로 스컬킹을 잡을 경우 40점
    );
}

// 플레이어의 map을 미리 만들어 두는 함수
// 플레이어를 찾을 때 유용하게 쓰여서 만듦
function createPlayerMap(
    players: SkullKingPlayerRoundInput[]
): Map<PlayerId, SkullKingPlayerRoundInput> {
    const playerMap = new Map<PlayerId, SkullKingPlayerRoundInput>();

    for (const player of players) {
        playerMap.set(player.playerId, player);
    }

    return playerMap;
}

// 약탈품 보너스를 계산하는 함수. 약탈품을 얻음으로서 생성된 두 명으로 이루어진 동맹에 대해
// 두 명 모두 승수 맞추기를 성공하면 두 명 모두 20점을 얻게 됨
function calculateLootBonuses(
    players: SkullKingPlayerRoundInput[],
    alliances: LootAlliance[]
): Map<PlayerId, number> {
    // <플레이어, 획득 점수> map을 저장하는 변수. 이것을 마지막에 return하게 됨
    const lootBonuses = new Map<PlayerId, number>(); 
    // 플레이어 정보 map을 저장하는 변수
    const playerMap = createPlayerMap(players);
    
    // lootBonuses를 <플레이어 id, 0>으로 초기화 함
    for (const player of players) {
        lootBonuses.set(player.playerId, 0);
    }

    // alliences에 저장된 동맹 정보를 for문으로 순회함
    for (const alliance of alliances) {
        // playerMap에서 플레이어의 정보를 찾아 player, partner에 할당함
        const player = playerMap.get(alliance.playerId);
        const partner = playerMap.get(alliance.partnerId);

        // 두 명 다 못 찾았으면 넘어감
        if (!player || !partner) {
            continue;
        }

        // 다 찾았을 경우 두 명 다 승수 맞추기를 성공했는지 확인함
        if (isBidSuccess(player) && isBidSuccess(partner)) {
            // 둘 다 맞추기를 성공했으면 lootBonuses에 20점을 더함
            lootBonuses.set(
                player.playerId,
                (lootBonuses.get(player.playerId) ?? 0) + 20    
                // (a ?? 0) 문법은 맨 처음 0으로 초기화 했지만
                // 일반적으로 typescript에서 이 사실을 모르기 때문에
                // a가 몇인지 모르면 0으로 생각하라는 문법임
            );
            lootBonuses.set(
                partner.playerId,
                (lootBonuses.get(partner.playerId) ?? 0) + 20
            );
        }
    }
    
    return lootBonuses;
}

// input 값이 범위에 맞는 input인지 확인하고 아닐경우 오류를 띄우는 함수
// 검증할 내용
// 1. round 검증
//   1-1. round는 1 이상 10 이하여야 함
// 2. 플레이어 검증
//   2-1. 플레이어의 id는 unique해야 함
//   2-2. bid는 0 이상 round 수 이하여야 함
//   2-3. tricks는 0 이상 round 수 이하여야 함
// 3. 동맹 검증
//   3-1. 동맹은 최대 2개여야 함
//   3-2. playerId가 실제 플레이어 목록에 존재해야 함
//   3-3. partnerId가 실제 플에이어 목록에 존재해야 함
//   3-4. playerId와 partnerId가 같지 않아야 함
function validateRoundInput(
    input : SkullKingRoundInput
): void {
    // 1-1. round는 1 이상 10 이하여야 함 -> 아닐 경우 오류!
    if (input.round < 1 || input.round > 10) {
        throw new Error("Invalid round");
    }

    // 플레이어의 id를 저장하는 변수
    const playerIds = new Set<PlayerId>();
    
    // 모든 플레이어를 순회함
    for (const player of input.players) {
        // 2-1. 플레이어의 id는 unique해야 함 -> 중복되면 오류!
        if (playerIds.has(player.playerId)) {
            throw new Error("Duplicate playerId");
        }

        // 플레이어의 id를 저장해 둠
        playerIds.add(player.playerId);

        // 2-2. bid는 0 이상 round 수 이하여야 함 -> 아닐 경우 오류!
        if (player.bid < 0 || player.bid > input.round) {
            throw new Error("Invalid bid");
        }

        // 2-3. tricks는 0 이상 round 수 이하여야 함 -> 아닐 경우 오류!
        if (player.tricks < 0 || player.tricks > input.round) {
            throw new Error("Invalid tricks");
        }
    }

    // 3-1. 동맹은 최대 2개여야 함 -> 아닐 경우 오류! 
    if (input.lootAlliances.length > 2) {
        throw new Error("Too many loot alliances");
    }

    // 모든 동맹을 순회함
    for (const alliance of input.lootAlliances) {
        // 3-2. playerId가 실제 플레이어 목록에 존재해야 함 -> 없을 경우 오류!
        if (!playerIds.has(alliance.playerId)) {
            throw new Error("Invalid loot alliance playerId");
        }
        
        // 3-3. partnerId가 실제 플에이어 목록에 존재해야 함 -> 없을 경우 오류!
        if (!playerIds.has(alliance.partnerId)) {
            throw new Error("Invalid loot alliance partnerId");
        }

        // 3-4. playerId와 partnerId가 같지 않아야 함 -> 같을 경우 오류!
        if (alliance.playerId === alliance.partnerId) {
            throw new Error("Loot alliance cannot be self alliance");
        }
    }
}

// 실제 각 라운드 점수를 계산하는 계산기
export function calculateSkullKingRound(
    input : SkullKingRoundInput
): SkullKingRoundResult {
    // input이 올바른지 확인
    validateRoundInput(input);

    // 현재 라운드로 초기화
    const round = input.round;

    // 이번 라운드의 약탈품 보너스 점수 계산
    const lootbonuses : Map<PlayerId, number> = calculateLootBonuses(
        input.players,
        input.lootAlliances
    );

    // 모든 플레이어를 순회하며 계산하여 return 형식에 맞춰 만듦
    // () => {}는 함수로써 기능을 하고,
    // map() 함수는 괄호 안의 것들을 모아 리스트로 만들어 줌
    const players : SkullKingPlayerRoundResult[] = input.players.map((player) => {

        // 플레이어의 아이디 저장
        const playerId : PlayerId = player.playerId;

        // 승수 예측 성공 여부 저장
        const bidSuccess : boolean = isBidSuccess(player);
        
        // 승수 예측에 따른 점수 계산 및 저장
        const bidScore : number = calculateBidScore(round, player);
        
        // 보너스 획득 점수 계산 및 저장
        // 승수 예측 성공시에만 점수를 얻음
        const captureBonus : number = bidSuccess ? 
        calculateCaptureBonus(player.bonuses) : 
        0;

        // 약탈품 보너스 점수 저장
        const lootBonus : number = lootbonuses.get(player.playerId) ?? 0;
        
        // 최종 보너스 점수 계산 및 저장
        const totalBonus : number = captureBonus + lootBonus;

        // 최종 라운드 점수 계산 및 저장
        const roundScore : number = bidScore + totalBonus;

        return {
            round,
            playerId,
            bidSuccess,
            bidScore,
            captureBonus,
            lootBonus,
            totalBonus,
            roundScore
        }
    });
    return {round, players};
}