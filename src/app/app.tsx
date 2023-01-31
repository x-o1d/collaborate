// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useCallback, useEffect, useState } from 'react';
import { Player, PlayerData } from './components/player';

const toRadian = (degrees: number) => (degrees / 180) * Math.PI;

export const ARENA_SIZE = 400;
const SIM_SPEED = 10; // value from 1-100
const PLAYER_RANGE = 30;
const PLAYER_SPEED = 5;
const PLAYER_RANDOMNESS = 0.2; // probability a player would change direction
const MAX_CHANGE_DIRECTION = toRadian(120);
const HIT_PROBABILITY = 0.3;
const HIT_HEALTH_COST = 5;

const players = Array(8)
  .fill({})
  .map((_, index) => {
    return {
      id: index,
      state: 0,
      direction: toRadian(Math.random() * 360),
      health: 100,
      team: index % 2,
      location: {
        x: Math.floor(
          Math.random() * (ARENA_SIZE - 2 * PLAYER_RANGE) + PLAYER_RANGE
        ),
        y: Math.floor(
          Math.random() * (ARENA_SIZE - 2 * PLAYER_RANGE) + PLAYER_RANGE
        ),
      },
    } as PlayerData;
  });

export function App() {
  const [render, setRender] = useState(false);

  const searchForOpponents = useCallback(() => {
    players.forEach((player) => {
      if (player.health <= 0) return;
      if (player.state === 0) {
        // move player in it's current direction
        player.location.x += Math.sin(player.direction) * PLAYER_SPEED;
        player.location.y += Math.cos(player.direction) * PLAYER_SPEED;

        // keep player within boundary
        if (player.location.x < PLAYER_RANGE) player.location.x = PLAYER_RANGE;
        if (player.location.y < PLAYER_RANGE) player.location.y = PLAYER_RANGE;
        if (player.location.x > ARENA_SIZE - PLAYER_RANGE)
          player.location.x = ARENA_SIZE - PLAYER_RANGE;
        if (player.location.y > ARENA_SIZE - PLAYER_RANGE)
          player.location.y = ARENA_SIZE - PLAYER_RANGE;

        // change player direction
        if (Math.random() < PLAYER_RANDOMNESS) {
          player.direction += (Math.random() - 0.5) * MAX_CHANGE_DIRECTION;
          player.direction = player.direction % (2 * Math.PI);
        }
      }
    });
  }, []);

  const callForHelp = useCallback(
    (
      id: number,
      location: Location,
      enemyLocation: Location,
      health: number,
      enemyHealth: number
    ) => {},
    []
  );

  const checkAndFire = useCallback(() => {
    players.forEach((player1) => {
      players.forEach((player2) => {
        if (player1.id === player2.id) return;
        if (player1.health <= 0) return;
        if (player1.team === player2.team) return;

        if (
          Math.abs(player1.location.x - player2.location.x) < PLAYER_RANGE &&
          Math.abs(player1.location.y - player2.location.y) < PLAYER_RANGE
        ) {
          const hit = Math.random() < HIT_PROBABILITY;
          if (hit && player2.health > 0) {
            player1.state = 1;
            player2.health -= HIT_HEALTH_COST;
            player1.shoot = Math.atan(
              (player2.location.y - player1.location.y) /
                (player2.location.x - player1.location.x)
            );
          } else {
            player1.shoot = undefined;
          }
        } else {
          player1.state = 0;
        }
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      searchForOpponents();
      checkAndFire();
      setRender((r) => !r);
    }, 300 / SIM_SPEED);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        border: '1px solid black',
        width: ARENA_SIZE,
        height: ARENA_SIZE,
      }}
    >
      {/* <div
        style={{
          position: 'fixed',
          top: 100,
          left: 100,
        }}
      >
        <svg width={100} height={100}>
          <line x1={0} y1={0} x2={100} y2={100} stroke={'blue'} />
        </svg>
      </div> */}

      {players.map((player) => (
        <Player key={player.id} playerData={player} />
      ))}
    </div>
  );
}

export default App;
