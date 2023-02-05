// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useCallback, useEffect, useRef, useState } from 'react';
import { Player, PlayerData } from './components/player';
import './app.css';

const toRadian = (degrees: number) => (degrees / 180) * Math.PI;

export const ARENA_SIZE = 600;
const NUM_PLAYERS = 4;
const PLAYER_RANGE = 50;
const PLAYER_SPEED = 5;
const PLAYER_RANDOMNESS = 0.2; // probability a player would change direction
const MAX_CHANGE_DIRECTION = toRadian(120);
const HIT_PROBABILITY = 0.5;
const HIT_HEALTH_COST = 2;

const TOTAL_GAMES = 100;
const GAME_SPEED = 15;
const GAME_LENGTH = 20000;

export const teams = [
  {
    name: 'amused',
    color: 'rgb(10, 120, 76)',
    wins: 0,
  },
  {
    name: 'sportsbet',
    color: 'rgb(255, 0, 0)',
    wins: 0,
  },
];

// initialize players object
const resetPlayers = (iteration: number) =>
  Array(NUM_PLAYERS * 2)
    .fill({})
    .map((_, index) => {
      return {
        id: parseInt(iteration + 1 + '' + index),
        state: -1,
        direction: toRadian(Math.random() * 360),
        health: 100,
        alive: true,
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
  const [gameCount, setGameCount] = useState(0);
  const [players, setPlayers] = useState(() => resetPlayers(0));

  const [collaborate, setCollaborate] = useState([1, 0]);

  const gameRunning = useRef(false);
  const gameStartedAt = useRef(new Date().getTime());
  const wins = useRef(new Array<number>());
  const winReason = useRef(new Array<string>());

  const searchForOpponents = useCallback(() => {
    players.forEach((player: PlayerData) => {
      if (!player.alive) return;
      if (player.state < 0) {
        // move player in it's current direction
        player.location.x += Math.cos(player.direction) * PLAYER_SPEED;
        player.location.y += Math.sin(player.direction) * PLAYER_SPEED;

        let boundaryReached = false;
        // keep player within boundary
        if (player.location.x < PLAYER_RANGE) {
          player.location.x = PLAYER_RANGE;
          boundaryReached = true;
        }
        if (player.location.y < PLAYER_RANGE) {
          player.location.y = PLAYER_RANGE;
          boundaryReached = true;
        }
        if (player.location.x > ARENA_SIZE - PLAYER_RANGE) {
          player.location.x = ARENA_SIZE - PLAYER_RANGE;
          boundaryReached = true;
        }
        if (player.location.y > ARENA_SIZE - PLAYER_RANGE) {
          player.location.y = ARENA_SIZE - PLAYER_RANGE;
          boundaryReached = true;
        }

        if (boundaryReached) {
          player.direction += Math.PI;
        }

        // variable to find closest enemy
        let minDistance = ARENA_SIZE;
        let minIndex = undefined;
        // check if opponent engaged with teammade
        player.assist = undefined;
        // find the closest enemy thats engages with a teammate
        players.forEach((player2: PlayerData, index) => {
          // ignore self
          if (player.id === player2.id) return;
          // igonre team members
          if (player.team === player2.team) return;
          // ignore dead opponents
          if (!player2.alive) return;
          // player is engaged with teammate
          if (player2.state >= 0) {
            const distance = Math.sqrt(
              Math.pow(player.location.x - player2.location.x, 2) +
                Math.pow(player.location.y - player2.location.y, 2)
            );
            // if distance is smaller than the closest opponent already found
            if (distance < minDistance) {
              if (
                distance > PLAYER_RANGE &&
                distance < PLAYER_RANGE * 5 * collaborate[player.team]
              ) {
                minDistance = distance;
                minIndex = index;
              }
            }
          }
        });

        if (minIndex !== undefined) {
          player.assist = players[minIndex].location;
          player.seekState = players[minIndex].id;
        }

        // assist team mate
        if (player.assist) {
          player.direction = Math.atan2(
            player.assist.y - player.location.y,
            player.assist.x - player.location.x
          );
          // change direction randomly
        } else {
          player.assist = undefined;
          player.seekState = -1;
          if (Math.random() < PLAYER_RANDOMNESS) {
            const directionChange = boundaryReached ? 1 : 0.5;
            player.direction +=
              (Math.random() - directionChange) * MAX_CHANGE_DIRECTION;
          }
        }
        player.direction = player.direction % (2 * Math.PI);
      }
    });
  }, [players, collaborate]);

  const checkAndFire = useCallback(() => {
    players.forEach((player1) => {
      // ignore inactive
      if (!player1.alive) return;
      let shotFired = false;
      players.forEach((player2) => {
        // a player gets only one shot per turn
        if (shotFired) return;
        // ignore inactive
        if (!player2.alive) return;
        // ignore self
        if (player1.id === player2.id) return;
        // no friendly fire
        if (player1.team === player2.team) return;

        // if the engaged opponent is dead resort to exploring
        // if (player2.health <= 0 && player1.state === player2.id) {
        //   player1.state = -1;
        //   player1.shoot = undefined;
        //   return;
        // }

        const distance = Math.sqrt(
          Math.pow(player1.location.x - player2.location.x, 2) +
            Math.pow(player1.location.y - player2.location.y, 2)
        );

        if (distance < PLAYER_RANGE) {
          // player engages with the opponent
          player1.state = player2.id;
          player1.assist = undefined;
          const hit = Math.random() < HIT_PROBABILITY;
          if (hit) {
            player2.health -= HIT_HEALTH_COST;
            // draw the firing line
            player1.shoot = player2.location;
            shotFired = true;
          } else {
            player1.shoot = undefined;
          }
        } else {
          player1.state = -1;
          player1.shoot = undefined;
        }
      });
    });
  }, [players]);

  const removePlayers = useCallback(() => {
    players.forEach((player1) => {
      if (player1.health <= 0) {
        player1.alive = false;
        player1.shoot = undefined;
        player1.assist = undefined;
        player1.state = -1;
        player1.seekState = -1;
        players.forEach((player2) => {
          if (player2.state === player1.id) {
            player2.state = -1;
            player2.shoot = undefined;
          }
          if (player2.seekState === player1.id) {
            player2.seekState = -1;
            player2.state = -1;
            player2.assist = undefined;
          }
        });
      }
    });
  }, [players]);

  const checkEndGame = useCallback(() => {
    let endGame = true;
    const gameTime = new Date().getTime() - gameStartedAt.current;

    const teamHealth = [0, 0];
    players.forEach((player) => {
      teamHealth[player.team] += player.health;
    });

    if (teamHealth[0] <= 0) {
      wins.current.push(1);
      teams[1].wins++;
      winReason.current.push('by killing everyone!');
    } else if (teamHealth[1] <= 0) {
      wins.current.push(0);
      teams[0].wins++;
      winReason.current.push('by killing everyone!');
    } else if (gameTime >= GAME_LENGTH) {
      if (teamHealth[0] > teamHealth[1]) {
        wins.current.push(0);
        teams[0].wins++;
        winReason.current.push('on timeout');
      } else if (teamHealth[1] > teamHealth[0]) {
        wins.current.push(1);
        teams[1].wins++;
        winReason.current.push('on timeout');
      }
    } else {
      endGame = false;
    }

    if (endGame) {
      // disable game loop
      gameRunning.current = false;
      /*
       * if games++ is used here the local state will not be updated
       * games++ returns it's current value before incrementing
       * ++games increments first and then returns the incremented value
       *
       * incrementing gameCount causes the useEffect to be called
       * again, this clears the old timer and starts a new game
       */
      setGameCount((gameCount) => ++gameCount);
    }
  }, [players]);

  const startGames = () => {
    gameRunning.current = !gameRunning.current;
  };

  // game loop
  useEffect(() => {
    // if gameCount == 0 wait for the start game button
    if (gameCount !== 0 && gameCount < TOTAL_GAMES) {
      // wait for one second before starting the next game
      setTimeout(() => {
        setPlayers(() => resetPlayers(gameCount));
        gameStartedAt.current = new Date().getTime();
        gameRunning.current = true;
      }, 1000);
    }
  }, [gameCount]);

  // game loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameRunning.current) {
        searchForOpponents();
        checkAndFire();
        checkEndGame();
        removePlayers();
        setRender((r) => !r);
      }
    }, 300 / GAME_SPEED);
    // when game ends clear interval
    return () => clearInterval(interval);
  }, [checkAndFire, checkEndGame, searchForOpponents, removePlayers]);

  return (
    <>
      <div
        style={{
          border: '1px solid black',
          width: ARENA_SIZE,
          height: ARENA_SIZE,
        }}
      >
        {players.map((player) => (
          <Player key={player.id} playerData={player} />
        ))}
      </div>
      <div className="description">
        <div>
          When collaboration is at max, a player responds to an assist call
          within five times it's firing range.
        </div>
        <div>
          When collaboration is at min, a player responds to an assist call only
          within it's firing range.
        </div>
        <div>A red line is a shot by the sportsbet team</div>
        <div>A green line is a shot by the sportsbet team</div>
        <div>A blue line is a player responding to an assist call</div>
      </div>
      <div className="wins">
        {teams.map((team, index) => (
          <div key={index} style={{ color: team.color }}>
            {`Team ${team.name} wins: ${(team.wins / gameCount) * 100}%`}
          </div>
        ))}
        <div className="controls">
          <div>Collaborate amused</div>
          <input
            disabled={gameRunning.current}
            type="range"
            value={collaborate[0] * 100}
            min="0"
            max="100"
            onChange={(e) => {
              setCollaborate([parseInt(e.target.value) / 100, collaborate[1]]);
            }}
          />
          <div>Collaborate sportsbet</div>
          <input
            disabled={gameRunning.current}
            type="range"
            value={collaborate[1] * 100}
            min="0"
            max="100"
            onChange={(e) => {
              setCollaborate([collaborate[0], parseInt(e.target.value) / 100]);
            }}
          />
        </div>
        <div className="button" onClick={() => startGames()}>
          Start game
        </div>
      </div>
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: 300,
          padding: 10,
        }}
      >
        {wins.current.map((win, index) => (
          <div
            key={index}
          >{`Team ${teams[win].name} won ${winReason.current[index]}`}</div>
        ))}
      </div>
    </>
  );
}

export default App;
