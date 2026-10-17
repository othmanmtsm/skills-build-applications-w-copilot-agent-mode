import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityResponse = { activities: Array<{ type?: string; minutes?: number; points?: number }> };

export default function Activities() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [activities, setActivities] = useState<Array<{ type?: string; minutes?: number; points?: number }>>([]);

  useEffect(() => {
    let active = true;
    getJson<ActivityResponse>('/api/activities')
      .then((payload) => {
        if (!active) return;
        const nextActivities = payload.activities ?? [];
        setActivities(nextActivities);
        setStatus(nextActivities.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      status={status}
      emptyText="No activities found."
      errorText="Unable to load activities."
      body={activities.length > 0 ? <ul>{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`}>{activity.type} ({activity.minutes ?? 0} min)</li>)}</ul> : null}
    />
  );
}
