import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  apiPath: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, apiPath, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getJson<Record<string, T[]>>(apiPath).then((data) => {
      if (!Array.isArray(data[dataKey])) throw new Error(`Invalid response for ${title}.`);
      if (active) setItems(data[dataKey]);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : `Unable to load ${title}.`);
    });
    return () => { active = false; };
  }, [apiPath, dataKey, title]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {items === undefined && !error && <p role="status">Loading {title.toLowerCase()}...</p>}
    {error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {items?.length === 0 && <p>{emptyMessage}</p>}
    {items && items.length > 0 && <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
