import {
  MAX_MERMAIDS_CAPTURED_BY_PIRATE,
  MAX_PIRATES_CAPTURED_BY_SKULL_KING,
  MAX_STANDARD_FOURTEENS,
} from "../constants";

import type { SkullKingBonusInput } from "../types";

import NumberSelector from "./NumberSelector";

import BinarySelector from "./BinarySelector";

type BonusSectionProps = {
  value: SkullKingBonusInput;
  onChange: (value: SkullKingBonusInput) => void;
  disabled?: boolean;
};

export default function BonusSection({
  value,
  onChange,
  disabled = false,
}: BonusSectionProps) {
  return (
    <div className="flex flex-col gap-4 pt-3">
      <section className="flex flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3">
        <h4 className="text-base font-semibold">14 카드</h4>
        <NumberSelector
          label="일반색 14"
          value={value.standardFourteensCount}
          max={MAX_STANDARD_FOURTEENS}
          onChange={(standardFourteensCount) =>
            onChange({
              ...value,
              standardFourteensCount,
            })
          }
          disabled={disabled}
        />
        <div>
          <p className="mb-2 text-base font-semibold">검은색 14</p>
          <BinarySelector
            value={value.blackFourteenCaptured}
            onChange={(blackFourteenCaptured) =>
              onChange({
                ...value,
                blackFourteenCaptured,
              })
            }
            disabled={disabled}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3">
        <h4 className="text-base font-semibold">특수 포획</h4>
        <NumberSelector
          label="해적 → 인어"
          value={value.mermaidsCapturedByPirate}
          max={MAX_MERMAIDS_CAPTURED_BY_PIRATE}
          onChange={(mermaidsCapturedByPirate) =>
            onChange({
              ...value,
              mermaidsCapturedByPirate,
            })
          }
          disabled={disabled}
        />
        <NumberSelector
          label="스컬 킹 → 해적"
          value={value.piratesCapturedBySkullKing}
          max={MAX_PIRATES_CAPTURED_BY_SKULL_KING}
          onChange={(piratesCapturedBySkullKing) =>
            onChange({
              ...value,
              piratesCapturedBySkullKing,
            })
          }
          disabled={disabled}
        />
        <div>
          <p className="mb-2 text-base font-semibold">인어 → 스컬 킹</p>
          <BinarySelector
            value={value.skullKingCapturedByMermaid}
            onChange={(skullKingCapturedByMermaid) =>
              onChange({
                ...value,
                skullKingCapturedByMermaid,
              })
            }
            disabled={disabled}
          />
        </div>
      </section>
    </div>
  );
}
