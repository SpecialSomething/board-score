"use client";

import {useState} from "react";

import { Player } from "../types";

type GameSetupProps = {
    onStart: (players: Player[]) => void;
};

export default function GameSetup({
    onStart
}: GameSetupProps) {
    const [playerCount, setPlayerCount] = useState(2);
    const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);

    function handleStart() {
        const players: Player[] = playerNames.map((name, index) => ({
            id: `player-${index + 1}`,
            name: name.trim(),
        }));
        onStart(players);
        console.log(playerNames);
    }

    return (
      <main>
        <h1>스컬 킹</h1>
    
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
    
        <button
          type="button"
          onClick={handleStart}
        >
          게임 시작
        </button>
      </main>
    );
}