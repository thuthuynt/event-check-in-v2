interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface StatsPanelProps {
  stats: Stats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const checkInPercentage = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Participants */}
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-blue-500">Total</div>
        </div>

        {/* Checked In */}
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.checked_in}</div>
          <div className="text-xs text-green-500">Checked In</div>
        </div>

        {/* Remaining */}
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.remaining}</div>
          <div className="text-xs text-yellow-500">Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-indigo-600">{checkInPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${checkInPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}