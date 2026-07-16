"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { loadSkullKingGame } from "@/features/skull-king/storage";

import type { SkullKingGameState } from "@/features/skull-king/types";

import Header from "@/components/Header";

const GAME_ROUTE = "/games/skull-king";
const NEW_GAME_ROUTE = "/games/skull-king?new=1";
const CARD_CLASS = "block w-full overflow-hidden rounded-2xl p-5 shadow-[0_4px_4px_rgba(0,0,0,0.05)]";

type GameCardProps = {
  name: string;
  koreanName: string;
  detail: string;
  href?: string;
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

function RecentGameCard({ game }: { game: SkullKingGameState }) {
  return (
    <Link
      href={GAME_ROUTE}
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

export default function Home() {
  const [recentGame, setRecentGame] = useState<SkullKingGameState | null>(null);

  useEffect(() => {
    const savedGame = loadSkullKingGame();

    if (savedGame?.isGameStarted && !savedGame.isGameFinished) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentGame(savedGame);
    }
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <Header />

      {recentGame && (
        <section className="mt-6" aria-labelledby="recent-games-heading">
          <h2 id="recent-games-heading" className="text-xl leading-normal text-board-text">최근 게임</h2>
          <div className="mt-4"><RecentGameCard game={recentGame} /></div>
        </section>
      )}

      <section className="mt-6" aria-labelledby="available-games-heading">
        <h2 id="available-games-heading" className="text-xl leading-normal text-board-text">플레이할 게임</h2>
        <div className="mt-5 flex flex-col gap-6">
          <GameCard name="Skull King" koreanName="스컬킹" detail="2 ~ 8인" href={NEW_GAME_ROUTE} />
          <GameCard name="Tichu" koreanName="티츄" detail="Coming Soon" />
          <GameCard name="Wizard" koreanName="위자드" detail="Coming Soon" />
        </div>
      </section>
    </main>
  );
}
