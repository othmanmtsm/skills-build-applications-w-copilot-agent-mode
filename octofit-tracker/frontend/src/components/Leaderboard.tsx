import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardResponse = { leaderboard: Array<{ teamName?: string; totalPoints?: number; rank?: number }> };

export default function Leaderboard() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [leaderboard, setLeaderboard] = useState<Array<{ teamName?: string; totalPoints?: number; rank?: number }>>([]);

  useEffect(() => {
    let active = true;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((payload) => {
        if (!active) return;
        const nextLeaderboard = payload.leaderboard ?? [];
        setLeaderboard(nextLeaderboard);
        setStatus(nextLeaderboard.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      status={status}
      emptyText="No leaderboard found."
      errorText="Unable to load leaderboard."
      body={leaderboard.length > 0 ? <ul>{leaderboard.map((entry, index) => <li key={`${entry.teamName ?? 'team'}-${index}`}>{entry.teamName}: {entry.totalPoints}</li>)}</ul> : null}
    />
  );
}
