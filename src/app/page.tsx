"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { loadSkullKingGame } from "@/features/skull-king/storage";
import { loadTichuGame } from "@/features/tichu/storage";

import type { SkullKingGameState } from "@/features/skull-king/types";
import type { TichuGameState } from "@/features/tichu/types";

import Header from "@/components/Header";

const SKULL_KING_ROUTE = "/games/skull-king";
const NEW_SKULL_KING_ROUTE = "/games/skull-king?new=1";

const TICHU_ROUTE = "/games/tichu";
const NEW_TICHU_ROUTE = "/games/tichu?new=1";

const CARD_CLASS = "block w-full overflow-hidden rounded-2xl p-5 shadow-[0_4px_4px_rgba(0,0,0,0.05)]";

type GameCardProps = {
  name: string;
  koreanName: string;
  detail: string;
  href?: string;
};

type RecentGame = 
  | {
      type: "skull-king";
      game: SkullKingGameState;
    }
  | {
      type: "tichu";
      game: TichuGameState;
    };

function CardContent({ name, koreanName, detail }: Omit<GameCardProps, "href">) {
  return (
    <>
      <p className="text-xl leading-normal">{name} {koreanName}</p>
      <p className="mt-5 text-xl leading-normal">{detail}</p>
    </>
  );
}

function GameCard({ name, koreanName, detail, href }: GameCardProps) {
  const content = <CardContent name={name} koreanName={koreanName} detail={detail} />;

  if (!href) {
    return (
      <article className={`${CARD_CLASS} bg-board-disabled text-board-disabled-text`}>
        {content}
      </article>
    );
  }

  return (
    <Link
      href={href}
      className={`${CARD_CLASS} border border-board-border bg-board-surface text-board-text transition-transform hover:border-board-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary active:scale-[0.99]`}
    >
      {content}
    </Link>
  );
}

function SkullKingRecentGameCard({ game }: { game: SkullKingGameState }) {
  return (
    <Link
      href={SKULL_KING_ROUTE}
      className={`${CARD_CLASS} border border-board-border bg-board-surface text-board-text transition-transform hover:border-board-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary active:scale-[0.99]`}
    >
      <p className="text-xl leading-normal">Skull King 스컬킹</p>
      <div className="mt-5 text-xl leading-normal">
        <p>Round : {game.currentRound} / 10</p>
        <p>인원 : {game.players.length}명</p>
      </div>
    </Link>
  );
}

function TichuRecentGameCard({ game }: { game: TichuGameState }) {
  const currentRound =
    game.roundResults.length + 1;

  return (
    <Link
      href={TICHU_ROUTE}
      className={`${CARD_CLASS} border border-board-border bg-board-surface text-board-text transition-transform hover:border-board-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary active:scale-[0.99]`}
    >
      <p className="text-xl leading-normal">
        Tichu 티츄
      </p>

      <div className="mt-5 text-xl leading-normal">
        <p>
          Round : {currentRound}
        </p>

        <p>
          목표 점수 : {game.targetScore}점
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [recentGame, setRecentGame] = useState<RecentGame | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const skullKingGame = loadSkullKingGame();
    const tichuGame = loadTichuGame();

    const games: RecentGame[] = [];

    if (
      skullKingGame?.isGameStarted &&
      !skullKingGame.isGameFinished
    ) {
      games.push({
        type: "skull-king",
        game: skullKingGame,
      });
    }
  
    if (
      tichuGame?.isGameStarted &&
      !tichuGame.isGameFinished
    ) {
      games.push({
        type: "tichu",
        game: tichuGame,
      });
    }

    const getUpdateAt = (
      game: { updatedAt?: number},
    ) => game.updatedAt ?? 0;
  
    const latestGame = games.sort(
      (a, b) =>
        getUpdateAt(b.game) - getUpdateAt(a.game),
    )[0];
  
    setRecentGame(latestGame ?? null);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <Header />

      {recentGame && (
        <section
          className="mt-6"
          aria-labelledby="recent-game-heading"
        >
          <h2
            id="recent-game-heading"
            className="text-xl leading-normal text-board-text"
          >
            최근 게임
          </h2>
      
          <div className="mt-4">
            {recentGame.type === "skull-king" ? (
              <SkullKingRecentGameCard
                game={recentGame.game}
              />
            ) : (
              <TichuRecentGameCard
                game={recentGame.game}
              />
            )}
          </div>
        </section>
      )}

      <section className="mt-6" aria-labelledby="available-games-heading">
        <h2 id="available-games-heading" className="text-xl leading-normal text-board-text">플레이할 게임</h2>
        <div className="mt-5 flex flex-col gap-6">
          <GameCard name="Skull King" koreanName="스컬킹" detail="2 ~ 8인" href={NEW_SKULL_KING_ROUTE} />
          <GameCard name="Tichu" koreanName="티츄" detail="4인" href={NEW_TICHU_ROUTE} />
          <GameCard name="Wizard" koreanName="위자드" detail="Coming Soon" />
        </div>
      </section>
    </main>
  );
}
