import type {
  Player,
  SkullKingRoundResult,
} from "../types";

type ScoreBoardProps = {
  players: Player[];
  result: SkullKingRoundResult;
};

export default function ScoreBoard({
  players,
  result,
}: ScoreBoardProps) {
  function getPlayerName(playerId: string): string {
    return (
      players.find((player) => player.id === playerId)?.name ??
      playerId
    );
  }

  return (
    <section>
      <h2>{result.round}라운드 결과</h2>

      {result.players.map((playerResult) => (
        <article key={playerResult.playerId}>
          <h3>{getPlayerName(playerResult.playerId)}</h3>

          <p>
            비드 성공: {playerResult.bidSuccess ? "성공" : "실패"}
          </p>
          <p>비드 점수: {playerResult.bidScore}점</p>
          <p>포획 보너스: {playerResult.captureBonus}점</p>
          <p>약탈품 보너스: {playerResult.lootBonus}점</p>
          <p>총 보너스: {playerResult.totalBonus}점</p>
          <p>라운드 점수: {playerResult.roundScore}점</p>
        </article>
      ))}
    </section>
  );
}