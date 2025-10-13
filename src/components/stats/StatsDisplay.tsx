import { useState, useEffect } from 'react';
import { getStats } from '@/lib/api';

interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface StatsDisplayProps {
  stats: Stats;
  eventId: number;
}

export function StatsDisplay({ stats: initialStats, eventId }: StatsDisplayProps) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const result = await getStats(eventId, baseUrl, token);
      if (result.success) {
        setStats(result.stats);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const checkInPercentage = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Event Statistics</h2>
        <button
          onClick={refreshStats}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Participants */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Participants</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Checked In</p>
              <p className="text-3xl font-bold text-green-600">{stats.checked_in}</p>
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Remaining</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.remaining}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Check-in Progress</h3>
          <span className="text-2xl font-bold text-indigo-600">{checkInPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${checkInPercentage}%` }}
          ></div>
        </div>
        
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          <span>0</span>
          <span>{stats.total} participants</span>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Check-in Status Distribution</h3>
        
        <div className="space-y-4">
          {/* Checked In Bar */}
          <div className="flex items-center">
            <div className="w-24 text-sm font-medium text-gray-700">Checked In</div>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${stats.total > 0 ? (stats.checked_in / stats.total) * 100 : 0}%` }}
                >
                  <span className="text-white text-xs font-medium">{stats.checked_in}</span>
                </div>
              </div>
            </div>
            <div className="w-16 text-sm text-gray-500 text-right">
              {stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0}%
            </div>
          </div>

          {/* Remaining Bar */}
          <div className="flex items-center">
            <div className="w-24 text-sm font-medium text-gray-700">Remaining</div>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${stats.total > 0 ? (stats.remaining / stats.total) * 100 : 0}%` }}
                >
                  <span className="text-white text-xs font-medium">{stats.remaining}</span>
                </div>
              </div>
            </div>
            <div className="w-16 text-sm text-gray-500 text-right">
              {stats.total > 0 ? Math.round((stats.remaining / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
