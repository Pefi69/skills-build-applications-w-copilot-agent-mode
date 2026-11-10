import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<Entry>
    title="Leaderboard"
    description="Compare team point totals."
    apiPath="/api/leaderboard"
    dataKey="leaderboard"
    emptyMessage="No leaderboard rankings yet."
    renderItem={(entry) => `#${entry.rank} ${entry.teamName}: ${entry.totalPoints} points`}
  />;
}
