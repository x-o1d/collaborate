import { teams } from '../app';
import { Fire } from './fire';
import './player.css';

export type Location = {
  x: number;
  y: number;
};

export type PlayerData = {
  id: number;
  alive: boolean;
  state: number; // -1 - exploring, n>=0 - engaged with enemy with id n
  seekState: number;
  direction: number;
  health: number;
  team: number;
  location: Location;
  shoot?: Location;
  assist?: Location;
  distance?: number;
};

export type PlayerProps = {
  playerData: PlayerData;
};

// Note: passing props like this could make it difficult to
// control how the component is rerendered
export function Player({ playerData }: PlayerProps) {
  const backgroundColor = teams[playerData.team].color;
  if (!playerData.alive) {
    return <></>;
  } else {
    return (
      <div
        className="player"
        style={{
          top: playerData.location.y - 50,
          left: playerData.location.x - 50,
        }}
      >
        <Fire
          color={'blue'}
          location={playerData.location}
          shoot={playerData.assist}
        />
        <Fire
          color={backgroundColor}
          location={playerData.location}
          shoot={playerData.shoot}
        />
        <div
          className="firing-radius"
          style={{
            borderWidth: playerData.alive ? 1 : 1,
          }}
        >
          <div
            className="position"
            style={{
              backgroundColor,
              opacity: playerData.alive ? playerData.health / 100 : 0,
              borderWidth: playerData.alive ? 0 : 2,
            }}
          />
        </div>
      </div>
    );
  }
}
