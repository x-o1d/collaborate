import { Location } from './player';

export type FireProps = {
  color: string;
  location: Location;
  shoot?: Location;
};

export function Fire({ color, location, shoot }: FireProps) {
  if (!shoot) {
    return <div></div>;
  } else {
    const deltaX = shoot.x - location.x + (Math.random() * 4 - 2);
    const deltaY = shoot.y - location.y + (Math.random() * 4 - 2);
    return (
      <div style={{ position: 'fixed' }}>
        <svg width={100} height={100}>
          <line
            x1={50}
            y1={50}
            x2={50 + deltaX}
            y2={50 + deltaY}
            stroke={color}
          />
        </svg>
      </div>
    );
  }
}
