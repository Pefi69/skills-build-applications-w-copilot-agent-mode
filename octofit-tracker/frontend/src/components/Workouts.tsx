import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  return <CapabilityCard<Suggestion>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    apiPath={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    dataKey="suggestions"
    emptyMessage="No workout suggestions available."
    renderItem={(suggestion) => `${suggestion.title}: ${suggestion.reason}`}
  />;
}
