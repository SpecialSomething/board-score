"use client";

import {useState} from "react";

import { Player } from "../types";

import { MIN_PLAYERS, MAX_PLAYERS } from "../constants";

type GameSetupProps = {
    onStart: (players: Player[]) => void;
};

export default function GameSetup({
    onStart
}: GameSetupProps) {
    const [playerCount, setPlayerCount] = useState(2);

    const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);

    const [error, setError] = useState("");

    

    function updatePlayerCount(count: number) {
        setPlayerCount(count);

        setPlayerNames((currentNames) => {
            if (count > currentNames.length) {
                return [
                    ...currentNames,
                    ...Array(count - currentNames.length).fill(""),
                ];
            }

            return currentNames.slice(0, count);
        });
    }

    function handleStart() {
        // 공백 제거
        const trimmedNames = playerNames.map((name) => name.trim());

        // 빈 이름 검사
        if (trimmedNames.some((name) => name === "")) {
            setError("모든 플레이어의 이름을 입력해주세요.");
            return;
        }

        // 중복 이름 검사
        const uniqueNames = new Set(trimmedNames);

        if (uniqueNames.size !== trimmedNames.length) {
            setError("같은 이름을 사용할 수 없습니다.");
            return;
        }

        // 오류가 없으면 오류 메세지 제거
        setError("");

        const players: Player[] = trimmedNames.map((name, index) => ({
            id: `player-${index + 1}`,
            name,
        }));
        onStart(players);
        console.log(playerNames);
    }

    return (
      <main>
        <h1>스컬 킹</h1>

        <label>
            플레이어 수

            <select
                value={playerCount}
                onChange={(event) => 
                    updatePlayerCount(Number(event.target.value))
                }
            >
                {Array.from(
                    {length: MAX_PLAYERS - MIN_PLAYERS + 1},
                    (_, index) => MIN_PLAYERS + index
                ).map((count) => (
                    <option key={count} value={count}>
                        {count}명
                    </option>
                ))}
            </select>
        </label>
    
        {playerNames.map((name, index) => (
            <label key={index}>
                플레이어 {index + 1}

                <input
                    value={name}
                    onChange={(event) => {
                        const newNames = [...playerNames];
                        newNames[index] = event.target.value;
                        setPlayerNames(newNames);
                    }}
                />
            </label>
        ))}

        {error && (
            <p>{error}</p>
        )}

        <button
          type="button"
          onClick={handleStart}
        >
          게임 시작
        </button>
      </main>
    );
}