import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  status: 'loading' | 'ready' | 'empty' | 'error';
  emptyText?: string;
  errorText?: string;
  body?: ReactNode;
};

export function CapabilityCard({ title, description, status, emptyText, errorText, body }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {status === 'loading' && <p role="status">Loading...</p>}
        {status === 'empty' && <p>{emptyText ?? `No ${title.toLowerCase()} found.`}</p>}
        {status === 'error' && <div role="alert">{errorText ?? `Unable to load ${title.toLowerCase()}.`}</div>}
        {status === 'ready' && body}
      </div>
    </section>
  );
}
