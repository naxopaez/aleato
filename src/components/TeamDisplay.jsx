import React from 'react';
import './TeamDisplay.css';

const TeamDisplay = ({ teams }) => {
  if (!teams || teams.length === 0) {
    return null;
  }

  const teamColors = [
    '#3B82F6',
    '#6366F1',
    '#0EA5E9',
    '#14B8A6',
    '#10B981',
    '#8B5CF6',
    '#F97316',
    '#F43F5E',
    '#64748B',
    '#22C55E'
  ];

  return (
    <div className="teams-display">
      {teams.map((team, index) => (
        <div
          key={team.name}
          className="team-card"
          style={{
            '--team-color': teamColors[index % teamColors.length],
            animationDelay: `${index * 0.08}s`
          }}
        >
          <div className="team-card-header">
            <h3>{team.name}</h3>
            <span className="team-count">{team.players.length} jugadores</span>
          </div>
          <ul>
            {team.players.map((player, playerIndex) => (
              <li key={`${team.name}-${playerIndex}`}>{player}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TeamDisplay;
