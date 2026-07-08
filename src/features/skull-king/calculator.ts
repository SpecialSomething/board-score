import type { 
    SkullKingBonusInput,
    SkullKingPlayerRoundInput,
    LootAlliance,
    PlayerId
} from "./types";

// 베팅한 승수와 실제 이긴 승수가 같은지를 나타내는 함수
function isBidSuccess(
    player: SkullKingPlayerRoundInput
): boolean {
    return player.bid === player.tricks;
}

// 베팅한 승수에 따라 점수를 계산하는 함수
function calculateBidScore(
    round: number,
    bid: number,
    tricks: number
): number {
    if (bid === 0) {    // 0승을 걸었을 경우
        return tricks === 0 ? round * 10 : round * -10; 
        // 맞추면 round 수 * 10점, 틀릴경우 round 수 * -10점을 함
    }
    
    // 이하는 0승이 아닌 승수를 걸었을 경우
    if (bid === tricks) {   // 승수를 맞췄을 경우
        return bid * 20;    // 걸었던 승수 * 20점을 함
    }

    // 승수를 틀렸을 경우 
    return Math.abs(bid - tricks) * -10;    // 걸었던 승수와 실제 이긴 승수의 차이 * -10점을 함 
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

// 약탈품 보너스를 계산하는 함수. 약탈품을 얻음으로서 생성된 두 명으로 이루어진 동맹에 대해
// 두 명 모두 승수 맞추기를 성공하면 두 명 모두 20점을 얻게 됨
function calculateLootBonuses(
    players: SkullKingPlayerRoundInput[],
    alliances: LootAlliance[]
): Map<PlayerId, number> {
    // <플레이어, 획득 점수> map을 저장하는 변수. 이것을 마지막에 return하게 됨
    const lootBonuses = new Map<PlayerId, number>(); 
    
    // lootBonuses를 <플레이어 id, 0>으로 초기화 함
    for (const player of players) {
        lootBonuses.set(player.playerId, 0);
    }

    // alliences에 저장된 동맹 정보를 for문으로 순회함
    for (const alliance of alliances) {
        // 플레이어들 중 동맹 정보에 있는 플레이어 아이디와 일치하는 플레이어를 player에 저장함
        const player = players.find(
            (p) => p.playerId === alliance.playerId
        );
        
        // 같은 방법으로 partner에도 저장을 함
        const partner = players.find(
            (p) => p.playerId === alliance.partnerId
        );

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