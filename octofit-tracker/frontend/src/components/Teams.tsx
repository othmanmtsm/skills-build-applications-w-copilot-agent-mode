import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamResponse = { teams: Array<{ name?: string; members?: string[] }> };

export default function Teams() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [teams, setTeams] = useState<Array<{ name?: string; members?: string[] }>>([]);

  useEffect(() => {
    let active = true;
    getJson<TeamResponse>('/api/teams')
      .then((payload) => {
        if (!active) return;
        const nextTeams = payload.teams ?? [];
        setTeams(nextTeams);
        setStatus(nextTeams.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      status={status}
      emptyText="No teams found."
      errorText="Unable to load teams."
      body={teams.length > 0 ? <ul>{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`}>{team.name} {team.members?.length ? `(${team.members.length})` : ''}</li>)}</ul> : null}
    />
  );
}
