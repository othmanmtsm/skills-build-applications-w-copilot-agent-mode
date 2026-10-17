import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutResponse = { suggestions: Array<{ title?: string; reason?: string }> };

export default function Workouts() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [suggestions, setSuggestions] = useState<Array<{ title?: string; reason?: string }>>([]);

  useEffect(() => {
    let active = true;
    getJson<WorkoutResponse>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (!active) return;
        const nextSuggestions = payload.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setStatus(nextSuggestions.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      status={status}
      emptyText="No workout suggestions found."
      errorText="Unable to load workout suggestions."
      body={suggestions.length > 0 ? <ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`}>{suggestion.title}{suggestion.reason ? `: ${suggestion.reason}` : ''}</li>)}</ul> : null}
    />
  );
}
