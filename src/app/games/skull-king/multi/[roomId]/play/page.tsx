"use client";

import { useCallback, useEffect, useMemo, useState, useRef, } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  advanceRoomToScoringIfReady,
  getRoundBids,
  getRoomBids,
  submitBid,
  type SkullKingBid,
} from "@/features/skull-king/multiplayer/bids";

import {
  getSkullKingRoom,
  getSkullKingRoomPlayers,
  advanceSkullKingRoom,
} from "@/features/skull-king/multiplayer/rooms";

import {
  loadMultiplayerSession,
} from "@/features/skull-king/multiplayer/session";

import type {
  SkullKingRoom,
  SkullKingRoomPlayer,
  LocalSkullKingMultiplayerSession,
  SkullKingRoundSubmission,
} from "@/features/skull-king/multiplayer/types";

import {
  getRoundSubmissions,
  submitRoundSubmission,
  getRoomSubmissions,
} from "@/features/skull-king/multiplayer/round-submissions";

import BonusSection from "@/features/skull-king/components/BonusSection";

import type { 
    SkullKingBonusInput,
    SkullKingRoundResult,
} from "@/features/skull-king/types";

import NumberSelector from "@/features/skull-king/components/NumberSelector";

import { calculateSkullKingRound } from "@/features/skull-king/calculator";

export default function SkullKingMultiplayerPlayPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  // 서버 데이터
  const [session, setSession] =
    useState<LocalSkullKingMultiplayerSession | null>(null);
  const [room, setRoom] =
    useState<SkullKingRoom | null>(null);
  const [players, setPlayers] =
    useState<SkullKingRoomPlayer[]>([]);
  const [bids, setBids] =
    useState<SkullKingBid[]>([]);
  const [allBids, setAllBids] =
    useState<SkullKingBid[]>([]);
  const [
    allRoundSubmissions,
    setAllRoundSubmissions,
  ] = useState<SkullKingRoundSubmission[]>([]);
  const [roundSubmissions, setRoundSubmissions] =
    useState<SkullKingRoundSubmission[]>([]);


  // 입력값
  const [selectedBid, setSelectedBid] = useState(0);
  const [tricks, setTricks] = useState(0);
  const bidInitializedRef = useRef(false);
  const roundResultInitializedRef = useRef(false);
  const [
    standardFourteensCount,
    setStandardFourteensCount,
  ] = useState(0);
  const [
    blackFourteenCaptured,
    setBlackFourteenCaptured,
  ] = useState(false);
  const [
    mermaidsCapturedByPirate,
    setMermaidsCapturedByPirate,
  ] = useState(0);
  const [
    piratesCapturedBySkullKing,
    setPiratesCapturedBySkullKing,
  ] = useState(0);
  const [
    skullKingCapturedByMermaid,
    setSkullKingCapturedByMermaid,
  ] = useState(false);


  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] =
    useState(false);
  const [
    isSubmittingRoundResult,
    setIsSubmittingRoundResult,
  ] = useState(false);
  const [
    isAdvancingRound,
    setIsAdvancingRound,
  ] = useState(false);

  /**
   * 브라우저에 저장된 멀티플레이 세션을
   * 컴포넌트 마운트 후 불러옵니다.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSession(loadMultiplayerSession());
      setIsSessionLoaded(true);
    }, 0);

    return () => {
        window.clearTimeout(timeoutId);
    };
  }, []);

  /**
   * 방, 플레이어, 현재 라운드 예측 정보를 불러옵니다.
   */
  const loadGameData = useCallback(
    async () => {
      if (!roomId) {
        return;
      }

      try {

        const nextRoom =
          await getSkullKingRoom(roomId);

        if (!nextRoom) {
          throw new Error("방을 찾을 수 없습니다.");
        }

        const nextPlayers =
          await getSkullKingRoomPlayers(roomId);

        let nextBids: SkullKingBid[] = [];
        let nextRoundSubmissions: SkullKingRoundSubmission[] = [];
        let nextAllBids: SkullKingBid[] = [];
        let nextAllRoundSubmissions: SkullKingRoundSubmission[] = [];

        if (
          nextRoom.status === "bidding" ||
          nextRoom.status === "scoring" ||
          nextRoom.status === "finished"
        ) {
          [
            nextAllBids,
            nextAllRoundSubmissions,
          ] = await Promise.all([
            getRoomBids(roomId),
            getRoomSubmissions(roomId),
          ]);
        }
        if (
          nextRoom.status === "bidding" ||
          nextRoom.status === "scoring"
        ) {
          nextBids = await getRoundBids(
            roomId,
            nextRoom.currentRound,
          );
        }

        if (nextRoom.status === "scoring") {
          nextRoundSubmissions =
            await getRoundSubmissions(
              roomId,
              nextRoom.currentRound,
            );
        }

        setRoom(nextRoom);
        setPlayers(nextPlayers);
        setBids(nextBids);
        setRoundSubmissions(nextRoundSubmissions);
        setAllBids(nextAllBids);
        setAllRoundSubmissions(nextAllRoundSubmissions);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "게임 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [roomId],
  );

  /**
   * 첫 화면 진입 시 데이터를 불러옵니다.
   */
  useEffect(() => {
    if (!isSessionLoaded || !session) {
      return;
    }

    void loadGameData();
  }, [
    isSessionLoaded,
    session,
    loadGameData,
  ]);

  /**
   * 다른 플레이어의 제출 상태와 방 상태를
   * 주기적으로 확인합니다.
   */
  useEffect(() => {
    if (!isSessionLoaded || !session) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadGameData();
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    isSessionLoaded,
    session,
    loadGameData,
  ]);

  /**
   * 현재 사용자가 제출한 예측입니다.
   */
  const playerId = session?.playerId;
  const currentRound = room?.currentRound;

  const myBid = useMemo(() => {
    if (!playerId || currentRound === undefined) {
      return null;
    }

    return (
      bids.find(
        (bid) =>
          bid.player_id === playerId &&
          bid.round === currentRound,
      ) ?? null
    );
  }, [bids, playerId, currentRound]);

  const submittedBid = myBid?.bid;

  useEffect(() => {
    if (submittedBid === undefined) {
      return;
    }
  
    if (bidInitializedRef.current) {
      return;
    }
  
    setSelectedBid(submittedBid);
    bidInitializedRef.current = true;
  }, [submittedBid]);

  /**
   * 현재 사용자가 제출한 라운드 결과입니다.
   */
  const myRoundSubmission = useMemo(() => {
    if (!session) {
      return null;
    }
  
    return (
      roundSubmissions.find(
        (submission) =>
          submission.playerId ===
          session.playerId,
      ) ?? null
    );
  }, [roundSubmissions, session]);

  const bonusValue: SkullKingBonusInput = {
    standardFourteensCount,
    blackFourteenCaptured,
    mermaidsCapturedByPirate,
    piratesCapturedBySkullKing,
    skullKingCapturedByMermaid,
  };

  /**
   * 플레이어 ID별 제출 여부를 빠르게 확인하기 위한 Set입니다.
   */
  const submittedPlayerIds = useMemo(
    () =>
      new Set(
        bids.map((bid) => bid.player_id),
      ),
    [bids],
  );

  const submittedRoundResultPlayerIds =
    useMemo(
      () =>
        new Set(
          roundSubmissions.map(
            (submission) =>
              submission.playerId,
          ),
        ),
      [roundSubmissions],
    );

  const allPlayersSubmitted =
    players.length >= 2 &&
    bids.length === players.length;

  const allRoundResultsSubmitted =
    players.length >= 2 &&
    roundSubmissions.length === players.length;

  const currentRoundResult =
    useMemo<SkullKingRoundResult | null>(() => {
      if (
        !room ||
        !allRoundResultsSubmitted
      ) {
        return null;
      }
  
      const bidByPlayerId = new Map(
        bids.map((bid) => [
          bid.player_id,
          bid.bid,
        ]),
      );
  
      const submissionByPlayerId = new Map(
        roundSubmissions.map(
          (submission) => [
            submission.playerId,
            submission,
          ],
        ),
      );
  
      const hasCompleteData = players.every(
        (player) =>
          bidByPlayerId.has(player.id) &&
          submissionByPlayerId.has(player.id),
      );
  
      if (!hasCompleteData) {
        return null;
      }
  
      return calculateSkullKingRound({
        round: room.currentRound,
  
        players: players.map((player) => {
          const bid =
            bidByPlayerId.get(player.id);
  
          const submission =
            submissionByPlayerId.get(
              player.id,
            );
  
          if (
            bid === undefined ||
            !submission
          ) {
            throw new Error(
              "점수 계산에 필요한 데이터가 없습니다.",
            );
          }
  
          return {
            playerId: player.id,
            bid,
            tricks: submission.tricks,
  
            bonuses: {
              standardFourteensCount:
                submission.standardFourteensCount,
  
              blackFourteenCaptured:
                submission.blackFourteenCaptured,
  
              mermaidsCapturedByPirate:
                submission.mermaidsCapturedByPirate,
  
              piratesCapturedBySkullKing:
                submission.piratesCapturedBySkullKing,
  
              skullKingCapturedByMermaid:
                submission.skullKingCapturedByMermaid,
            },
          };
        }),
  
        lootAlliances: [],
      });
    }, [
      room,
      players,
      bids,
      roundSubmissions,
      allRoundResultsSubmitted,
    ]);

  const roundResultByPlayerId =
    useMemo(() => {
      return new Map(
        currentRoundResult?.players.map(
          (result) => [
            result.playerId,
            result,
          ],
        ) ?? [],
      );
    }, [currentRoundResult]);

  const totalScores = useMemo(() => {
    const scoreByPlayerId = new Map(
      players.map((player) => [
        player.id,
        0,
      ]),
    );
  
    if (!room) {
      return scoreByPlayerId;
    }
  
    for (
      let round = 1;
      round <= room.currentRound;
      round += 1
    ) {
      const roundBids = allBids.filter(
        (bid) => bid.round === round,
      );
  
      const submissions =
        allRoundSubmissions.filter(
          (submission) =>
            submission.round === round,
        );
  
      const hasCompleteRound =
        roundBids.length === players.length &&
        submissions.length ===
          players.length;
  
      if (!hasCompleteRound) {
        continue;
      }
  
      const bidByPlayerId = new Map(
        roundBids.map((bid) => [
          bid.player_id,
          bid.bid,
        ]),
      );
  
      const submissionByPlayerId = new Map(
        submissions.map((submission) => [
          submission.playerId,
          submission,
        ]),
      );
  
      const result =
        calculateSkullKingRound({
          round,
  
          players: players.map(
            (player) => {
              const bid =
                bidByPlayerId.get(player.id);
  
              const submission =
                submissionByPlayerId.get(
                  player.id,
                );
  
              if (
                bid === undefined ||
                !submission
              ) {
                throw new Error(
                  "누적 점수 계산에 필요한 데이터가 없습니다.",
                );
              }
  
              return {
                playerId: player.id,
                bid,
                tricks: submission.tricks,
  
                bonuses: {
                  standardFourteensCount:
                    submission.standardFourteensCount,
  
                  blackFourteenCaptured:
                    submission.blackFourteenCaptured,
  
                  mermaidsCapturedByPirate:
                    submission.mermaidsCapturedByPirate,
  
                  piratesCapturedBySkullKing:
                    submission.piratesCapturedBySkullKing,
  
                  skullKingCapturedByMermaid:
                    submission.skullKingCapturedByMermaid,
                },
              };
            },
          ),
  
          lootAlliances: [],
        });
  
      for (
        const playerResult of
          result.players
      ) {
        const previousScore =
          scoreByPlayerId.get(
            playerResult.playerId,
          ) ?? 0;
  
        scoreByPlayerId.set(
          playerResult.playerId,
          previousScore +
            playerResult.roundScore,
        );
      }
    }
  
    return scoreByPlayerId;
  }, [
    room,
    players,
    allBids,
    allRoundSubmissions,
  ]);

  const currentRanking = useMemo(() => {
    return players
      .map((player) => ({
        player,
        totalScore:
          totalScores.get(player.id) ?? 0,
      }))
      .sort(
        (left, right) =>
          right.totalScore -
          left.totalScore,
      );
  }, [players, totalScores]);

  const submittedTricks =
    myRoundSubmission?.tricks;
  
  const submittedStandardFourteensCount =
    myRoundSubmission?.standardFourteensCount;
  
  const submittedBlackFourteenCaptured =
    myRoundSubmission?.blackFourteenCaptured;
  
  const submittedMermaidsCapturedByPirate =
    myRoundSubmission?.mermaidsCapturedByPirate;
  
  const submittedPiratesCapturedBySkullKing =
    myRoundSubmission?.piratesCapturedBySkullKing;
  
  const submittedSkullKingCapturedByMermaid =
    myRoundSubmission?.skullKingCapturedByMermaid;
  
  useEffect(() => {
    if (
      submittedTricks === undefined ||
      submittedStandardFourteensCount === undefined ||
      submittedBlackFourteenCaptured === undefined ||
      submittedMermaidsCapturedByPirate === undefined ||
      submittedPiratesCapturedBySkullKing === undefined ||
      submittedSkullKingCapturedByMermaid === undefined
    ) {
      return;
    }
    if (roundResultInitializedRef.current) {
      return;
    }
  
    setTricks(submittedTricks);
  
    setStandardFourteensCount(
      submittedStandardFourteensCount,
    );
  
    setBlackFourteenCaptured(
      submittedBlackFourteenCaptured,
    );
  
    setMermaidsCapturedByPirate(
      submittedMermaidsCapturedByPirate,
    );
  
    setPiratesCapturedBySkullKing(
      submittedPiratesCapturedBySkullKing,
    );
  
    setSkullKingCapturedByMermaid(
      submittedSkullKingCapturedByMermaid,
    );

    roundResultInitializedRef.current = true;
  }, [
    submittedTricks,
    submittedStandardFourteensCount,
    submittedBlackFourteenCaptured,
    submittedMermaidsCapturedByPirate,
    submittedPiratesCapturedBySkullKing,
    submittedSkullKingCapturedByMermaid,
  ]);

  useEffect(() => {
    bidInitializedRef.current = false;
    roundResultInitializedRef.current = false;

    if (myRoundSubmission) {
      return;
    }
    setSelectedBid(0);
  
    setTricks(0);
    setStandardFourteensCount(0);
    setBlackFourteenCaptured(false);
    setMermaidsCapturedByPirate(0);
    setPiratesCapturedBySkullKing(0);
    setSkullKingCapturedByMermaid(false);
  }, [
    room?.currentRound,
    myRoundSubmission,
  ]);

  const handleSubmitBid = async () => {
    if (!room || !session) {
      return;
    }

    if (room.status !== "bidding") {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await submitBid({
        roomId: room.id,
        playerId: session.playerId,
        round: room.currentRound,
        bid: selectedBid,
      });

      const nextBids = await getRoundBids(
        room.id,
        room.currentRound,
      );

      setBids(nextBids);

      bidInitializedRef.current = true;

      await advanceRoomToScoringIfReady({
        roomId: room.id,
        round: room.currentRound,
        playerCount: players.length,
      });

      await loadGameData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "예측을 제출하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBonusChange = (
    nextBonus: SkullKingBonusInput,
  ) => {
    setStandardFourteensCount(
      nextBonus.standardFourteensCount,
    );
  
    setBlackFourteenCaptured(
      nextBonus.blackFourteenCaptured,
    );
  
    setMermaidsCapturedByPirate(
      nextBonus.mermaidsCapturedByPirate,
    );
  
    setPiratesCapturedBySkullKing(
      nextBonus.piratesCapturedBySkullKing,
    );
  
    setSkullKingCapturedByMermaid(
      nextBonus.skullKingCapturedByMermaid,
    );
  }

  const handleSubmitRoundResult =
    async () => {
      if (!room || !session) {
        return;
      }
  
      if (room.status !== "scoring") {
        return;
      }
  
      try {
        setIsSubmittingRoundResult(true);
        setErrorMessage(null);
  
        await submitRoundSubmission({
          roomId: room.id,
          playerId: session.playerId,
          round: room.currentRound,
          tricks,
          standardFourteensCount,
          blackFourteenCaptured,
          mermaidsCapturedByPirate,
          piratesCapturedBySkullKing,
          skullKingCapturedByMermaid,
        });
  
        const nextSubmissions =
          await getRoundSubmissions(
            room.id,
            room.currentRound,
          );
  
        setRoundSubmissions(
          nextSubmissions,
        );
        roundResultInitializedRef.current = true;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "라운드 결과를 제출하지 못했습니다.",
        );
      } finally {
        setIsSubmittingRoundResult(false);
      }
    };
  
  const handleAdvanceRound =
    async () => {
      if (!room || !session) {
        return;
      }
  
      if (
        session.playerId !==
        room.hostPlayerId
      ) {
        return;
      }
  
      if (
        room.status !== "scoring" ||
        !allRoundResultsSubmitted
      ) {
        return;
      }
  
      try {
        setIsAdvancingRound(true);
        setErrorMessage(null);
  
        await advanceSkullKingRoom({
          roomId: room.id,
          hostPlayerId:
            session.playerId,
          currentRound:
            room.currentRound,
        });
  
        await loadGameData();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : room.currentRound >= 10
              ? "게임을 종료하지 못했습니다."
              : "다음 라운드로 넘어가지 못했습니다.",
        );
      } finally {
        setIsAdvancingRound(false);
      }
    };

  if (!isSessionLoaded) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <p className="text-sm text-board-text-muted">
          세션을 확인하고 있습니다.
        </p>
      </main>
    );
  }

  if (
    !session ||
    session.roomId !== roomId
  ) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-board-text">
          이 방에 참가한 기록을 찾을 수 없습니다.
        </p>

        <button
          type="button"
          onClick={() =>
            router.replace(
              "/games/skull-king/multi",
            )
          }
          className="rounded-xl bg-board-primary px-4 py-3 font-semibold text-white"
        >
          멀티플레이로 돌아가기
        </button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <p className="text-sm text-board-text-muted">
          게임 정보를 불러오고 있습니다.
        </p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4">
        <p className="text-board-text">
          방 정보를 찾을 수 없습니다.
        </p>

        {errorMessage && (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </main>
    );
  }

  if (room.status === "waiting") {
    router.replace(
      `/games/skull-king/multi/${room.id}`,
    );

    return null;
  }

  if (room.status === "finished") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-4">
        <h1 className="text-2xl font-bold text-board-text">
          게임 종료
        </h1>

        <p className="text-board-text-muted">
          최종 결과 화면은 다음 단계에서
          구현할 수 있습니다.
        </p>
      </main>
    );
  }

  if (
    room.status === "scoring" &&
    allRoundResultsSubmitted &&
    currentRoundResult
  ) {
        return (
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
        <header>
          <p className="text-sm font-semibold text-board-primary">
            {room.currentRound}라운드
          </p>
    
          <h1 className="mt-1 text-2xl font-bold text-board-text">
            라운드 결과
          </h1>
        </header>
    
        <section className="mt-6 rounded-2xl border border-board-border bg-white p-5">
          <h2 className="font-semibold text-board-text">
            이번 라운드 점수
          </h2>
    
          <div className="mt-4 space-y-3">
            {players.map((player) => {
              const result =
                roundResultByPlayerId.get(player.id);
    
              const bid = bids.find(
                (b) => b.player_id === player.id,
              );
    
              const submission =
                roundSubmissions.find(
                  (s) => s.playerId === player.id,
                );
    
              if (!result || !bid || !submission) {
                return null;
              }
    
              const isMe =
                player.id === session.playerId;
    
              return (
                <div
                  key={player.id}
                  className="rounded-xl bg-board-secondary p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {player.name}
                        {isMe && (
                          <span className="ml-1 text-xs text-board-text-muted">
                            (나)
                          </span>
                        )}
                      </p>
    
                      <p className="mt-1 text-sm text-board-text-muted">
                        예측 {bid.bid}
                        {" · "}
                        실제 {submission.tricks}
                      </p>
                    </div>
    
                    <span className="text-xl font-bold text-board-primary">
                      {result.roundScore > 0
                        ? `+${result.roundScore}`
                        : result.roundScore}
                    </span>
                  </div>
    
                  <div className="mt-3 flex justify-between text-sm text-board-text-muted">
                    <span>
                      예측 점수 {result.bidScore}
                    </span>
    
                    <span>
                      보너스 {result.totalBonus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
    
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <h2 className="font-semibold text-board-text">
            현재 순위
          </h2>
        
          <div className="mt-4 space-y-2">
            {currentRanking.map(
              (
                { player, totalScore },
                index,
              ) => {
                const rank = getRank(
                  currentRanking,
                  index,
                );
        
                const isMe =
                  player.id ===
                  session.playerId;
        
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-8 shrink-0 text-sm font-bold text-board-primary">
                        {rank}위
                      </span>
        
                      <span className="truncate font-medium text-board-text">
                        {player.name}
        
                        {isMe && (
                          <span className="ml-1 text-xs text-board-text-muted">
                            (나)
                          </span>
                        )}
                      </span>
                    </div>
        
                    <strong className="shrink-0 text-board-text">
                      {formatScore(totalScore)}
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        </section>
    
        {session.playerId === room.hostPlayerId ? (
          <button
            type="button"
            onClick={handleAdvanceRound}
            disabled={isAdvancingRound}
            className="mt-6 w-full rounded-xl bg-board-primary px-4 py-3 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdvancingRound
              ? room.currentRound >= 10
                ? "종료 중..."
                : "다음 라운드 준비 중..."
              : room.currentRound >= 10
                ? "게임 종료"
                : "다음 라운드"}
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-board-text-muted">
            방장이 다음 라운드를 시작할 때까지 기다리는 중입니다.
          </p>
        )}
      </main>
    );
  }

  if (room.status === "scoring") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
        <header>
          <p className="text-sm font-semibold text-board-primary">
            {room.currentRound}라운드
          </p>
  
          <h1 className="mt-1 text-2xl font-bold text-board-text">
            결과 입력
          </h1>
  
          <p className="mt-2 text-sm text-board-text-muted">
            이번 라운드의 획득 트릭과
            보너스를 입력하세요.
          </p>
        </header>
  
        <section className="mt-6 rounded-2xl border border-board-border bg-board-surface p-5">
          <div>
            <p className="text-sm font-medium text-board-text">
              예측
            </p>
        
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(
                { length: room.currentRound + 1 },
                (_, value) => {
                  const isMyBid =
                    value === myBid?.bid;
        
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled
                      aria-label={
                        isMyBid
                          ? `내 예측 ${value}`
                          : undefined
                      }
                      className={`flex size-[35px] items-center justify-center rounded-xl text-base font-semibold ${
                        isMyBid
                          ? "bg-board-primary text-white"
                          : "bg-board-disabled text-board-disabled-text"
                      }`}
                    >
                      {value}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        
          <div className="mt-5">
            <NumberSelector
              label="실제"
              value={tricks}
              max={room.currentRound}
              onChange={setTricks}
              disabled={isSubmittingRoundResult}
            />
          </div>
        </section>
  
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <h2 className="font-semibold text-board-text">
            보너스
          </h2>
  
          <BonusSection
            value={bonusValue}
            onChange={handleBonusChange}
            disabled={isSubmittingRoundResult}
          />
  
          <button
            type="button"
            onClick={
              handleSubmitRoundResult
            }
            disabled={
              isSubmittingRoundResult
            }
            className="mt-6 w-full rounded-xl bg-board-primary px-4 py-3 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingRoundResult
              ? "제출 중..."
              : myRoundSubmission
                ? "결과 수정"
                : "결과 제출"}
          </button>
  
          {myRoundSubmission && (
            <p className="mt-3 text-center text-sm text-board-text-muted">
              결과를 제출했습니다. 모든
              플레이어가 제출하기 전까지
              수정할 수 있습니다.
            </p>
          )}
        </section>
  
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <h2 className="font-semibold text-board-text">
            예측 결과
          </h2>
  
          <div className="mt-4 space-y-2">
            {players.map((player) => {
              const playerBid = bids.find(
                (bid) =>
                  bid.player_id ===
                  player.id,
              );
  
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
                >
                  <span className="font-medium text-board-text">
                    {player.name}
                  </span>
  
                  <span className="font-semibold text-board-primary">
                    예측{" "}
                    {playerBid?.bid ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
  
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-board-text">
              결과 제출 현황
            </h2>
  
            <span className="text-sm font-medium text-board-text-muted">
              {roundSubmissions.length}/
              {players.length}
            </span>
          </div>
  
          <div className="mt-4 space-y-2">
            {players.map((player) => {
              const hasSubmitted =
                submittedRoundResultPlayerIds.has(
                  player.id,
                );
  
              const isMe =
                player.id ===
                session.playerId;
  
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
                >
                  <span className="font-medium text-board-text">
                    {player.name}
  
                    {isMe && (
                      <span className="ml-1 text-xs text-board-text-muted">
                        (나)
                      </span>
                    )}
                  </span>
  
                  <span
                    className={
                      hasSubmitted
                        ? "text-sm font-semibold text-board-primary"
                        : "text-sm text-board-text-muted"
                    }
                  >
                    {hasSubmitted
                      ? "제출 완료"
                      : "입력 중"}
                  </span>
                </div>
              );
            })}
          </div>
  
          {allRoundResultsSubmitted && (
            <p className="mt-4 text-center text-sm font-semibold text-board-primary">
              모든 플레이어가 결과를
              제출했습니다.
            </p>
          )}
        </section>
  
        {errorMessage && (
          <p className="mt-4 text-center text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
      <header>
        <p className="text-sm font-semibold text-board-primary">
          {room.currentRound}라운드
        </p>

        <h1 className="mt-1 text-2xl font-bold text-board-text">
          예측 입력
        </h1>

        <p className="mt-2 text-sm text-board-text-muted">
          이번 라운드에 획득할 트릭 수를
          선택하세요.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-board-border bg-white p-5">
        <h2 className="font-semibold text-board-text">
          내 예측
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(
            {
              length:
                room.currentRound + 1,
            },
            (_, bid) => (
              <button
                key={bid}
                type="button"
                onClick={() =>
                  setSelectedBid(bid)
                }
                disabled={
                  isSubmitting ||
                  allPlayersSubmitted
                }
                className={`flex size-[35px] items-center justify-center rounded-xl text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedBid === bid
                    ? "bg-board-primary text-white"
                    : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
                }`}
              >
                {bid}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmitBid}
          disabled={
            isSubmitting ||
            allPlayersSubmitted
          }
          className="mt-5 w-full rounded-xl bg-board-primary px-4 py-3 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "제출 중..."
            : myBid
              ? "예측 수정"
              : "예측 제출"}
        </button>

        {myBid && (
          <p className="mt-3 text-center text-sm text-board-text-muted">
            현재 제출한 예측:{" "}
            <strong className="text-board-primary">
              {myBid.bid}
            </strong>
          </p>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-board-text">
            제출 현황
          </h2>

          <span className="text-sm font-medium text-board-text-muted">
            {bids.length}/{players.length}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {players.map((player) => {
            const hasSubmitted =
              submittedPlayerIds.has(
                player.id,
              );

            const isMe =
              player.id === session.playerId;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
              >
                <span className="font-medium text-board-text">
                  {player.name}
                  {isMe && (
                    <span className="ml-1 text-xs text-board-text-muted">
                      (나)
                    </span>
                  )}
                </span>

                <span
                  className={
                    hasSubmitted
                      ? "text-sm font-semibold text-board-primary"
                      : "text-sm text-board-text-muted"
                  }
                >
                  {hasSubmitted
                    ? "제출 완료"
                    : "입력 중"}
                </span>
              </div>
            );
          })}
        </div>

        {allPlayersSubmitted && (
          <p className="mt-4 text-center text-sm font-medium text-board-primary">
            모든 플레이어가 제출했습니다.
          </p>
        )}
      </section>

      {errorMessage && (
        <p className="mt-4 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </main>
  );
}

function getRank(
  ranking: {
    totalScore: number;
  }[],
  index: number,
) {
  if (index === 0) {
    return 1;
  }

  if (
    ranking[index].totalScore ===
    ranking[index - 1].totalScore
  ) {
    return getRank(
      ranking,
      index - 1,
    );
  }

  return index + 1;
}

function formatScore(
  score: number,
) {
  if (score > 0) {
    return `+${score}`;
  }

  return `${score}`;
}