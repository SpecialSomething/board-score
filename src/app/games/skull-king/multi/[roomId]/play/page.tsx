"use client";

import { useCallback, useEffect, useMemo, useState, useRef, } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getRoundBids,
  getRoomBids,
  submitBid,
  updateBidReady,
  type SkullKingBid,
} from "@/features/skull-king/multiplayer/bids";

import {
  getSkullKingRoom,
  getSkullKingRoomPlayers,
  advanceSkullKingRoom,
  updateSkullKingRoomStatus,
} from "@/features/skull-king/multiplayer/rooms";

import {
  loadMultiplayerSession,
} from "@/features/skull-king/multiplayer/session";

import type {
  SkullKingRoom,
  SkullKingRoomPlayer,
  LocalSkullKingMultiplayerSession,
  SkullKingRoundSubmission,
  SkullKingRoomLootAlliance,
} from "@/features/skull-king/multiplayer/types";

import {
  getRoundSubmissions,
  submitRoundSubmission,
  getRoomSubmissions,
  updateRoundReady,
} from "@/features/skull-king/multiplayer/round-submissions";

import BonusSection from "@/features/skull-king/components/BonusSection";

import LootAllianceSection from "@/features/skull-king/components/LootAllianceSection";

import type { 
    SkullKingBonusInput,
    SkullKingRoundResult,
    LootAlliance,
    Player,
} from "@/features/skull-king/types";

import NumberSelector from "@/features/skull-king/components/NumberSelector";

import { calculateSkullKingRound } from "@/features/skull-king/calculator";

import { 
  replacePlayerLootAlliances,
  getRoomLootAlliances,
  getRoundLootAlliances,
} from "@/features/skull-king/multiplayer/loot-alliances";

import { calculateStandings } from "@/features/skull-king/standings";

import StandingsSection from "@/features/skull-king/components/StandingSection";

import PlayerName from "@/features/skull-king/components/PlayerName";

import GameResultScreen from "@/features/skull-king/components/GameResultScreen";

import { 
  clearRecentGame,
  saveRecentGame,
} from "@/features/recent-game/storage";



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
  const [lootAlliances, setLootAlliances] =
    useState<LootAlliance[]>([]);
  const [
    roundLootAlliances,
    setRoundLootAlliances,
  ] = useState<SkullKingRoomLootAlliance[]>(
    [],
  );
  const [
    allLootAlliances,
    setAllLootAlliances,
  ] = useState<SkullKingRoomLootAlliance[]>(
    [],
  );


  // 입력값
  const [selectedBid, setSelectedBid] = useState(0);
  const [tricks, setTricks] = useState(0);
  const bidInitializedRef = useRef(false);
  const roundResultInitializedRef = useRef(false);
  const lootAlliancesInitializedRef =useRef(false);
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
        let nextRoundLootAlliances: SkullKingRoomLootAlliance[] = [];
        let nextAllLootAlliances: SkullKingRoomLootAlliance[] = [];

        if (
          nextRoom.status === "bidding" ||
          nextRoom.status === "scoring" ||
          nextRoom.status === "round-result" ||
          nextRoom.status === "finished"
        ) {
          [
            nextAllBids,
            nextAllRoundSubmissions,
            nextAllLootAlliances,
          ] = await Promise.all([
            getRoomBids(roomId),
            getRoomSubmissions(roomId),
            getRoomLootAlliances(roomId),
          ]);
        }
        if (
          nextRoom.status === "bidding" ||
          nextRoom.status === "scoring" ||
          nextRoom.status === "round-result"
        ) {
          nextBids = await getRoundBids(
            roomId,
            nextRoom.currentRound,
          );
        }

        if (
          nextRoom.status === "scoring" ||
          nextRoom.status === "round-result"
        ) {
          [
            nextRoundSubmissions,
            nextRoundLootAlliances,
          ] = await Promise.all([
            getRoundSubmissions(
              roomId,
              nextRoom.currentRound,
            ),
            getRoundLootAlliances(
              roomId,
              nextRoom.currentRound,
            ),
          ]);
        }

        setRoom(nextRoom);
        setPlayers(nextPlayers);
        setBids(nextBids);
        setRoundSubmissions(nextRoundSubmissions);
        setAllBids(nextAllBids);
        setAllRoundSubmissions(nextAllRoundSubmissions);
        setRoundLootAlliances(nextRoundLootAlliances);
        setAllLootAlliances(nextAllLootAlliances);
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

  useEffect(() => {
    window.scrollTo({
      top: 0,
    });
  }, [room?.status, room?.currentRound]);

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

  useEffect(() => {
    if (
      !isSessionLoaded ||
      !session ||
      session.roomId !== roomId
    ) {
      return;
    }
  
    saveRecentGame("skull-king-multi");
  }, [
    isSessionLoaded,
    session,
    roomId,
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

  const isBidReady = myBid?.is_ready ?? false;

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

  const isRoundReady =
  myRoundSubmission?.isReady ?? false;

  const myRoundLootAlliances =
    useMemo(() => {
      if (!session) {
        return [];
      }
  
      return roundLootAlliances.filter(
        (alliance) =>
          alliance.createdByPlayerId ===
          session.playerId,
      );
    }, [
      roundLootAlliances,
      session,
    ]);

  useEffect(() => {
    if (
      !session ||
      !myRoundSubmission ||
      lootAlliancesInitializedRef.current
    ) {
      return;
    }
  
    lootAlliancesInitializedRef.current = true;
  }, [
    session,
    myRoundSubmission,
    myRoundLootAlliances,
  ]);


  const bonusValue: SkullKingBonusInput = {
    standardFourteensCount,
    blackFourteenCaptured,
    mermaidsCapturedByPirate,
    piratesCapturedBySkullKing,
    skullKingCapturedByMermaid,
  };

  const myEstimatedScore = useMemo(() => {
    if (
      !room ||
      !session ||
      myBid === null
    ) {
      return null;
    }
  
    const result = calculateSkullKingRound({
      round: room.currentRound,
  
      players: [
        {
          playerId: session.playerId,
          bid: myBid.bid,
          tricks,
          bonuses: {
            standardFourteensCount,
            blackFourteenCaptured,
            mermaidsCapturedByPirate,
            piratesCapturedBySkullKing,
            skullKingCapturedByMermaid,
          },
        },
      ],
  
      /*
       * 약탈품 동맹 점수는 상대의 라운드 성공 여부가
       * 확정되어야 계산할 수 있으므로 예상 점수에서는 제외합니다.
       */
      lootAlliances: [],
    });
  
    return (
      result.players.find(
        (player) =>
          player.playerId === session.playerId,
      )?.roundScore ?? null
    );
  }, [
    room,
    session,
    myBid,
    tricks,
    standardFourteensCount,
    blackFourteenCaptured,
    mermaidsCapturedByPirate,
    piratesCapturedBySkullKing,
    skullKingCapturedByMermaid,
  ]);

  /**
   * 플레이어 ID별 제출 여부를 빠르게 확인하기 위한 Set입니다.
   */
  const bidReadyPlayerIds = useMemo(
    () =>
      new Set(
        bids
          .filter((bid) => bid.is_ready)
          .map((bid) => bid.player_id),
      ),
    [bids],
  );

  const readyPlayerIds = useMemo(
    () =>
      new Set(
        roundSubmissions
          .filter(
            (submission) =>
              submission.isReady,
          )
          .map(
            (submission) =>
              submission.playerId,
          ),
        ),
    [roundSubmissions],
  );

  const readyPlayerCount = readyPlayerIds.size;

  const allPlayersSubmitted =
    players.length >= 2 &&
    bids.length === players.length &&
    bids.every((bid) => bid.is_ready);

  const allPlayersReady =
    players.length >= 2 &&
    roundSubmissions.length === players.length &&
    roundSubmissions.every(
      submission => submission.isReady,
    );

  const currentRoundResult =
    useMemo<SkullKingRoundResult | null>(() => {
      if (
        !room ||
        !allPlayersReady
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
  
        lootAlliances: toCalculatorLootAlliances(roundLootAlliances,),
      });
    }, [
      room,
      players,
      bids,
      roundSubmissions,
      allPlayersReady,
      roundLootAlliances,
    ]);

  const gamePlayers = useMemo<Player[]>(
    () =>
      players.map((player) => ({
        id: player.id,
        name: player.name,
      })),
    [players],
  );

  const roundResults = useMemo<
    SkullKingRoundResult[]
  >(() => {
    if (!room) {
      return [];
    }
  
    const lastVisibleRound =
      room.status === "round-result" ||
      room.status === "finished"
        ? room.currentRound
        : room.currentRound - 1;
  
    const results: SkullKingRoundResult[] = [];
  
    for (
      let round = 1;
      round <= lastVisibleRound;
      round += 1
    ) {
      const roundBids = allBids.filter(
        (bid) =>
          bid.round === round &&
          bid.is_ready,
      );
  
      const submissions =
        allRoundSubmissions.filter(
          (submission) =>
            submission.round === round &&
            submission.isReady,
        );
  
      const roundAlliances =
        allLootAlliances.filter(
          (alliance) =>
            alliance.round === round,
        );
  
      const hasCompleteRound =
        roundBids.length === players.length &&
        submissions.length === players.length;
  
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
  
      const hasEveryPlayer = players.every(
        (player) =>
          bidByPlayerId.has(player.id) &&
          submissionByPlayerId.has(player.id),
      );
  
      if (!hasEveryPlayer) {
        continue;
      }
  
      const result = calculateSkullKingRound({
        round,
  
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
              "라운드 기록 계산에 필요한 데이터가 없습니다.",
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
  
        lootAlliances:
          toCalculatorLootAlliances(
            roundAlliances,
          ),
      });
  
      results.push(result);
    }
  
    return results;
  }, [
    room,
    players,
    allBids,
    allRoundSubmissions,
    allLootAlliances,
  ]);

  const standings = useMemo(
    () =>
      calculateStandings(
        gamePlayers,
        roundResults,
      ),
    [
      gamePlayers,
      roundResults,
    ],
  );

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

    setLootAlliances(
      toCalculatorLootAlliances(
        myRoundLootAlliances,
      ),
    );

    roundResultInitializedRef.current = true;
  }, [
    submittedTricks,
    submittedStandardFourteensCount,
    submittedBlackFourteenCaptured,
    submittedMermaidsCapturedByPirate,
    submittedPiratesCapturedBySkullKing,
    submittedSkullKingCapturedByMermaid,
    myRoundLootAlliances,
  ]);

  useEffect(() => {
    bidInitializedRef.current = false;
    roundResultInitializedRef.current = false;
    lootAlliancesInitializedRef.current = false;

    setSelectedBid(0);
    setTricks(0);
    setStandardFourteensCount(0);
    setBlackFourteenCaptured(false);
    setMermaidsCapturedByPirate(0);
    setPiratesCapturedBySkullKing(0);
    setSkullKingCapturedByMermaid(false);
    setLootAlliances([]);
  }, [
    room?.currentRound,
  ]);

  const handleToggleBidReady = async () => {
    if (!room || !session) {
      return;
    }
  
    if (room.status !== "bidding") {
      return;
    }
  
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
  
      // 이미 예측 완료한 상태라면 완료만 취소합니다.
      if (isBidReady) {
        await updateBidReady({
          roomId: room.id,
          playerId: session.playerId,
          round: room.currentRound,
          isReady: false,
        });
  
        await loadGameData();
        return;
      }
  
      // 예측 완료할 때 현재 선택값을 저장합니다.
      await submitBid({
        roomId: room.id,
        playerId: session.playerId,
        round: room.currentRound,
        bid: selectedBid,
        isReady: true,
      });
  
      bidInitializedRef.current = true;
  
      await loadGameData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "예측 상태를 변경하지 못했습니다.",
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

  const handleToggleRoundReady = async () => {
    if (!room || !session) {
      return;
    }
  
    try {
      setIsSubmittingRoundResult(true);
      setErrorMessage(null);
  
      // 이미 준비 완료 상태라면 준비만 취소합니다.
      if (isRoundReady) {
        await updateRoundReady({
          roomId: room.id,
          playerId: session.playerId,
          round: room.currentRound,
          isReady: false,
        });
  
        await loadGameData();
        return;
      }
  
      // 준비 완료할 때 현재 입력값을 저장합니다.
      await replacePlayerLootAlliances({
        roomId: room.id,
        round: room.currentRound,
        playerId: session.playerId,
        receiverIds: lootAlliances.map(
          alliance => alliance.receiverId,
        ),
      });
  
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
  
        isReady: true,
      });
  
  
      roundResultInitializedRef.current = true;
      lootAlliancesInitializedRef.current = true;

      await loadGameData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "준비 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsSubmittingRoundResult(false);
    }
  };

  const handleShowRoundResult = async () => {
    if (!room || !session) {
      return;
    }
  
    if (session.playerId !== room.hostPlayerId) {
      return;
    }
  
    if (!allPlayersReady) {
      return;
    }
  
    try {
      setIsAdvancingRound(true);
  
      await updateSkullKingRoomStatus({
        roomId: room.id,
        hostPlayerId: session.playerId,
        fromStatus: "scoring",
        toStatus: "round-result",
      });
  
      await loadGameData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "라운드 결과를 표시하지 못했습니다.",
      );
    } finally {
      setIsAdvancingRound(false);
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
        room.status !== "round-result" ||
        !allPlayersReady
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

  const handleStartScoring = async () => {
    if (!room || !session) {
      return;
    }
  
    if (session.playerId !== room.hostPlayerId) {
      return;
    }
  
    if (!allPlayersSubmitted) {
      return;
    }
  
    try {
      setIsAdvancingRound(true);
  
      await updateSkullKingRoomStatus({
        roomId: room.id,
        hostPlayerId: session.playerId,
        fromStatus: "bidding",
        toStatus: "scoring",
      });
  
      await loadGameData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "결과 입력을 시작하지 못했습니다.",
      );
    } finally {
      setIsAdvancingRound(false);
    }
  };

  const handlePlayAgain = () => {
    router.push("/games/skull-king/multi");
  };
  
  const handleGoHome = () => {
    clearRecentGame();
    router.push("/");
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
      <GameResultScreen
        players={gamePlayers}
        standings={standings}
        roundResults={roundResults}
        currentPlayerId={session.playerId}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        isPlayAgainLoading={isAdvancingRound}
      />
    );
  }

  if (
    room.status === "round-result" &&
    allPlayersReady &&
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
    
              return (
                <div
                  key={player.id}
                  className="rounded-xl bg-board-secondary p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <PlayerName
                        name={player.name}
                        isMe={player.id === session.playerId}
                        className="font-medium text-board-text"
                      />
    
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
    
        <StandingsSection
          standings={standings}
          currentPlayerId={session.playerId}
        />
    
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
                  <PlayerName
                    name={player.name}
                    isMe={player.id === session.playerId}
                    className="font-medium text-board-text"
                  />
  
                  <span className="font-semibold text-board-primary">
                    예측{" "}
                    {playerBid?.bid ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
  
        <section className="mt-6 rounded-2xl border border-board-border bg-board-surface p-5">
          <NumberSelector
            label="예측"
            value={myBid?.bid ?? 0}
            max={room.currentRound}
            onChange={() => undefined}
            readOnly
          />
        
          <div className="mt-5">
            <NumberSelector
              label="실제"
              value={tricks}
              max={room.currentRound}
              onChange={setTricks}
              disabled={isSubmittingRoundResult}
              readOnly={isRoundReady}
            />
          </div>

          {myEstimatedScore !== null && (
            <div className="mt-3 flex items-center justify-between py-2">
              <span className="font-semibold text-gray-700">
                예상 점수
              </span>
            
              <strong
                className={`text-lg font-bold ${
                  myEstimatedScore > 0
                    ? "text-board-primary"
                    : myEstimatedScore < 0
                      ? "text-red-600"
                      : "text-board-muted"
                }`}
              >
                {myEstimatedScore > 0 ? "+" : ""}
                {myEstimatedScore}점
              </strong>
            </div>
                )}
        </section>
  
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <h2 className="font-semibold text-board-text">
            보너스
          </h2>
  
          <BonusSection
            value={bonusValue}
            onChange={handleBonusChange}
            disabled={isSubmittingRoundResult}
            readOnly={isRoundReady}
          />

          <div className="mt-5">
            <LootAllianceSection
              currentPlayerId={session.playerId}
              allPlayers={players}
              lootAlliances={lootAlliances}
              onChange={setLootAlliances}
              disabled={isSubmittingRoundResult}
              readOnly={isRoundReady}
            />
          </div>
  
          <button
            type="button"
            onClick={handleToggleRoundReady}
            disabled={isSubmittingRoundResult}
            aria-pressed={isRoundReady}
            className={`w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isRoundReady
                ? "border border-board-primary bg-white text-board-primary"
                : "bg-board-primary text-white"
            }`}
          >
            {isSubmittingRoundResult
              ? isRoundReady
                ? "결과 제출 취소 중..."
                : "결과 제출 중..."
              : isRoundReady
                ? "결과 제출 완료 · 눌러서 수정"
                : "결과 제출"}
          </button>
  
          {myRoundSubmission && (
            <p className="mt-3 text-sm text-board-text-muted">
              {isRoundReady
                ? "결과 제출이 완료되었습니다. 다시 누르면 결과 제출을 취소하고 수정할 수 있습니다."
                : "입력을 확인한 뒤 결과 제출 버튼을 눌러주세요."}
            </p>
          )}
        </section>

  
        <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-board-text">
              준비 현황
            </h2>
  
            <span className="text-sm font-medium text-board-text-muted">
              {readyPlayerCount}/
              {players.length}
            </span>
          </div>
  
          <div className="mt-4 space-y-2">
            {players.map((player) => {
              const isPlayerReady =
                readyPlayerIds.has(
                  player.id,
                );
  
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
                >
                  <PlayerName
                    name={player.name}
                    isMe={player.id === session.playerId}
                    className="font-medium text-board-text"
                  />
  
                  <span
                    className={
                      isPlayerReady
                        ? "text-sm font-semibold text-board-primary"
                        : "text-sm text-board-text-muted"
                    }
                  >
                    {isPlayerReady
                      ? "준비 완료"
                      : "준비 중"}
                  </span>
                </div>
              );
            })}
          </div>
  
          {allPlayersReady && (
            session.playerId === room.hostPlayerId ? (
              <button
                type="button"
                onClick={handleShowRoundResult}
                disabled={isAdvancingRound}
                className="mt-5 w-full rounded-xl bg-board-primary px-4 py-3 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdvancingRound
                  ? "결과 불러오는 중..."
                  : "라운드 결과 보기"}
              </button>
            ) : (
              <p className="mt-4 text-sm text-board-text-muted">
                모든 플레이어가 준비를 완료했습니다.
                <br />
                방장이 라운드 결과를 확인할 때까지 기다려주세요.
              </p>
            )
          )}
        </section>

        {roundResults.length > 0 && (
          <StandingsSection
            standings={standings}
            currentPlayerId={session.playerId}
          />
        )}
  
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
        <NumberSelector
          label="내 예측"
          value={selectedBid}
          max={room.currentRound}
          onChange={setSelectedBid}
          disabled={isSubmitting}
          readOnly={isBidReady}
        />
        <button
          type="button"
          onClick={handleToggleBidReady}
          disabled={isSubmitting}
          aria-pressed={isBidReady}
          className={`mt-5 w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBidReady
              ? "border border-board-primary bg-white text-board-primary"
              : "bg-board-primary text-white"
          }`}
        >
          {isSubmitting
            ? isBidReady
              ? "예측 완료 취소 중..."
              : "예측 완료 중..."
            : isBidReady
              ? "예측 완료 · 눌러서 수정"
              : "예측 완료"}
        </button>

        <p className="mt-3 text-center text-sm text-board-text-muted">
          {isBidReady
            ? "예측이 완료되었습니다. 다시 누르면 완료를 취소하고 수정할 수 있습니다."
            : "예측값을 확인한 뒤 예측 완료 버튼을 눌러주세요."}
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-board-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-board-text">
            제출 현황
          </h2>

          <span className="text-sm font-medium text-board-text-muted">
            {bidReadyPlayerIds.size}/{players.length}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {players.map((player) => {
            const isPlayerReady =
              bidReadyPlayerIds.has(
                player.id,
              );

            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
              >
                <PlayerName
                  name={player.name}
                  isMe={player.id === session.playerId}
                  className="font-medium text-board-text"
                />

                <span
                  className={
                    isPlayerReady
                      ? "text-sm font-semibold text-board-primary"
                      : "text-sm text-board-text-muted"
                  }
                >
                  {isPlayerReady
                    ? "예측 완료"
                    : "입력 중"}
                </span>
              </div>
            );
          })}
        </div>

        {allPlayersSubmitted &&
          (session.playerId === room.hostPlayerId ? (
            <button
              type="button"
              onClick={handleStartScoring}
              disabled={isAdvancingRound}
              className="mt-4 w-full rounded-xl bg-board-primary px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdvancingRound
                ? "결과 입력 시작 중..."
                : "결과 입력 시작"}
            </button>
          ) : (
            <p className="mt-4 text-center text-sm text-board-text-muted">
              모든 플레이어가 제출했습니다.
              <br />
              방장이 결과 입력을 시작할 때까지 기다려주세요.
            </p>
          ))}
      </section>

      {roundResults.length > 0 && (
        <StandingsSection
          standings={standings}
          currentPlayerId={session.playerId}
        />
      )}

      {errorMessage && (
        <p className="mt-4 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </main>
  );
}


function toCalculatorLootAlliances(
  alliances: SkullKingRoomLootAlliance[],
): LootAlliance[] {
  return alliances.map((alliance) => ({
    giverId: alliance.giverPlayerId,
    receiverId:
      alliance.receiverPlayerId,
  }));
}