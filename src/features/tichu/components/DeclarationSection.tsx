"use client";

import { createTichuDeclaration } from "../factories";

import type {
  TichuDeclaration,
  TichuDeclarationType,
  TichuPlayer,
} from "../types";

type DeclarationSectionProps = {
  players: TichuPlayer[];
  declarations: TichuDeclaration[];
  onChange: (
    declarations: TichuDeclaration[],
  ) => void;
};

const DECLARATION_OPTIONS: {
  label: string;
  value: TichuDeclarationType;
}[] = [
  {
    label: "스몰 티츄",
    value: "small-tichu",
  },
  {
    label: "그랜드 티츄",
    value: "grand-tichu",
  },
];

export default function DeclarationSection({
  players,
  declarations,
  onChange,
}: DeclarationSectionProps) {
  function getPlayerDeclaration(
    playerId: string,
  ) {
    return declarations.find(
      (declaration) =>
        declaration.playerId === playerId,
    );
  }

  function removePlayerDeclaration(
    playerId: string,
  ) {
    onChange(
      declarations.filter(
        (declaration) =>
          declaration.playerId !== playerId,
      ),
    );
  }

  function updateDeclarationType(
    player: TichuPlayer,
    type: TichuDeclarationType,
  ) {
    const currentDeclaration =
      getPlayerDeclaration(player.id);

    if (currentDeclaration?.type === type) {
      removePlayerDeclaration(player.id);
      return;
    }

    const nextDeclaration =
      createTichuDeclaration(
        player.id,
        player.teamId,
        type,
        currentDeclaration?.success ?? null,
      );

    if (!currentDeclaration) {
      onChange([
        ...declarations,
        nextDeclaration,
      ]);
      return;
    }

    onChange(
      declarations.map((declaration) =>
        declaration.playerId === player.id
          ? nextDeclaration
          : declaration,
      ),
    );
  }

  function updateDeclarationSuccess(
    playerId: string,
    success: boolean,
  ) {
    onChange(
      declarations.map((declaration) =>
        declaration.playerId === playerId
          ? {
              ...declaration,
              success,
            }
          : declaration,
      ),
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h3 className="text-base font-semibold leading-normal text-board-text">
          티츄 선언
        </h3>

        <p className="mt-1 text-sm leading-normal text-board-disabled-text">
          선언한 플레이어와 성공 여부를
          선택해주세요.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {players.map((player) => {
          const declaration =
            getPlayerDeclaration(player.id);

          return (
            <article
              key={player.id}
              className="rounded-2xl bg-board-bg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold leading-normal text-board-text">
                    {player.name}
                  </p>

                  <p className="mt-0.5 text-sm text-board-disabled-text">
                    {player.seat}번 자리 ·{" "}
                    {player.teamId}팀
                  </p>
                </div>

                {declaration && (
                  <button
                    type="button"
                    onClick={() =>
                      removePlayerDeclaration(
                        player.id,
                      )
                    }
                    className="text-sm font-semibold text-board-danger transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-danger"
                  >
                    초기화
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {DECLARATION_OPTIONS.map(
                  (option) => {
                    const isSelected =
                      declaration?.type ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          updateDeclarationType(
                            player,
                            option.value,
                          )
                        }
                        className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary ${
                          isSelected
                            ? "bg-board-primary text-white"
                            : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  },
                )}
              </div>

              {declaration && (
                <div className="mt-4">
                  <p className="text-sm font-semibold leading-normal text-board-text">
                    선언 결과
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={
                        declaration.success === true
                      }
                      onClick={() =>
                        updateDeclarationSuccess(
                          player.id,
                          true,
                        )
                      }
                      className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary ${
                        declaration.success === true
                          ? "bg-board-primary text-white"
                          : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
                      }`}
                    >
                      성공
                    </button>

                    <button
                      type="button"
                      aria-pressed={
                        declaration.success === false
                      }
                      onClick={() =>
                        updateDeclarationSuccess(
                          player.id,
                          false,
                        )
                      }
                      className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary ${
                        declaration.success === false
                          ? "bg-board-primary text-white"
                          : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
                      }`}
                    >
                      실패
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}