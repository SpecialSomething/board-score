"use client";

import type { SkullKingPlayerRoundInput } from "../types";

import {
  MAX_STANDARD_FOURTEENS,
  MAX_MERMAIDS_CAPTURED_BY_PIRATE,
  MAX_PIRATES_CAPTURED_BY_SKULL_KING,
} from "../constants";

type PlayerRoundFormProps = {
  playerName: string;                                   // 실제 화면에서 보여줄 플레이어의 이름
  round: number;                                        // bid와 tricks 입력 범위에 사용될 현재 라운드 수 
  value: SkullKingPlayerRoundInput;                     // 현재 플레이어의 입력값
  onChange: (value: SkullKingPlayerRoundInput) => void; // 입력값이 바뀔 때 부모에게 새 값을 전달
  disabled?: boolean;                                   // 계산 완료 후 입력을 잠그는 용도
};

type NumberBonusKey =
  | "standardFourteensCount"
  | "mermaidsCapturedByPirate"
  | "piratesCapturedBySkullKing";

type BooleanBonusKey =
  | "blackFourteenCaptured"
  | "skullKingCapturedByMermaid";

export default function PlayerRoundForm({
  playerName,
  round,
  value,
  onChange,
  disabled = false,
}: PlayerRoundFormProps) {
  // 최댓값과 최솟값을 제한하는 함수
  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // UpdateNumberBonus를 간단히 만들, key값에 따라 서로 다른 최댓값을 리턴하는 함수
  function getBonusMax(key: NumberBonusKey): number {
    switch (key) {
        case "standardFourteensCount":
            return MAX_STANDARD_FOURTEENS;

        case "mermaidsCapturedByPirate":
            return MAX_MERMAIDS_CAPTURED_BY_PIRATE;

        case "piratesCapturedBySkullKing":
            return MAX_PIRATES_CAPTURED_BY_SKULL_KING;
    }
  }
  function updateBid(bid: number) {
    onChange({
      ...value,
      bid: clamp(bid, 0, round),
    });
  }

  function updateTricks(tricks: number) {
    onChange({
      ...value,
      tricks: clamp(tricks, 0, round),
    });
  }

  function updateNumberBonus(
    key: NumberBonusKey,
    amount: number
  ) {
    onChange({
      ...value,
      bonuses: {
        ...value.bonuses,
        [key]: clamp(amount, 0, getBonusMax(key)),
      },
    });
  }

  function updateBooleanBonus(
    key: BooleanBonusKey,
    checked: boolean
  ) {
    onChange({
      ...value,
      bonuses: {
        ...value.bonuses,
        [key]: checked,
      },
    });
  }

  return (
    <section>
      <h3>{playerName}</h3>

      <div>
        <label>
          예측 트릭
          <input
            type="number"
            min={0}
            max={round}
            value={value.bid}
            disabled={disabled}
            onChange={(event) =>
              updateBid(Number(event.target.value))
            }
          />
        </label>

        <label>
          실제 트릭
          <input
            type="number"
            min={0}
            max={round}
            value={value.tricks}
            disabled={disabled}
            onChange={(event) =>
              updateTricks(Number(event.target.value))
            }
          />
        </label>
      </div>

      <fieldset disabled={disabled}>
        <legend>보너스</legend>

        <label>
          일반색 14 카드
          <input
            type="number"
            min={0}
            max={MAX_STANDARD_FOURTEENS}
            value={value.bonuses.standardFourteensCount}
            onChange={(event) =>
              updateNumberBonus(
                "standardFourteensCount",
                Number(event.target.value)
              )
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={value.bonuses.blackFourteenCaptured}
            onChange={(event) =>
              updateBooleanBonus(
                "blackFourteenCaptured",
                event.target.checked
              )
            }
          />
          검은색 14 획득
        </label>

        <label>
          해적으로 포획한 인어
          <input
            type="number"
            min={0}
            max={MAX_MERMAIDS_CAPTURED_BY_PIRATE}
            value={value.bonuses.mermaidsCapturedByPirate}
            onChange={(event) =>
              updateNumberBonus(
                "mermaidsCapturedByPirate",
                Number(event.target.value)
              )
            }
          />
        </label>

        <label>
          스컬 킹으로 포획한 해적
          <input
            type="number"
            min={0}
            max={MAX_PIRATES_CAPTURED_BY_SKULL_KING}
            value={value.bonuses.piratesCapturedBySkullKing}
            onChange={(event) =>
              updateNumberBonus(
                "piratesCapturedBySkullKing",
                Number(event.target.value)
              )
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              value.bonuses.skullKingCapturedByMermaid
            }
            onChange={(event) =>
              updateBooleanBonus(
                "skullKingCapturedByMermaid",
                event.target.checked
              )
            }
          />
          인어로 스컬 킹 포획
        </label>
      </fieldset>
    </section>
  );
}