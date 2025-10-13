import React, { useState, useEffect } from 'react';
import { StatsPanel } from '@/components/checkin/StatsPanel';

interface Event {
  id: number;
  event_name: string;
  event_start_date: string;
  event_end_date?: string;
  location?: string;
  description?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
  check_in_rate: number;
}

export function StatsApp() {
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const eventId = window.location.pathname.split('/').pop();
    if (eventId) {
      loadEventAndStats(parseInt(eventId));
    }
  }, []);

  const loadEventAndStats = async (eventId: number) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Load event details
      const eventResponse = await fetch(`/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!eventResponse.ok) {
        throw new Error('Failed to load event');
      }

      const eventData = await eventResponse.json();
      setEvent(eventData);

      // Load stats
      const statsResponse = await fetch(`/api/stats?event_id=${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to load stats');
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const handleBack = () => {
    const eventId = window.location.pathname.split('/').pop();
    window.location.href = `/checkin/${eventId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !event || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load event data'}</p>
          <button
            onClick={() => window.location.href = '/events'}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">
                {event.event_name} - Statistics
              </h1>
              <p className="text-xs text-gray-500">
                {new Date(event.event_start_date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-4">
        <StatsPanel stats={stats} />
        
        {/* Additional Stats Details */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Event Name:</span>
              <span className="ml-2 font-medium">{event.event_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Start Date:</span>
              <span className="ml-2 font-medium">
                {new Date(event.event_start_date).toLocaleDateString()}
              </span>
            </div>
            {event.event_end_date && (
              <div>
                <span className="text-gray-500">End Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(event.event_end_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {event.location && (
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-medium">{event.location}</span>
              </div>
            )}
            {event.description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <span className="ml-2 font-medium">{event.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleBack}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            Back to Check-in
          </button>
          <button
            onClick={() => window.location.href = '/events'}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
          >
            All Events
          </button>
        </div>
      </div>
    </div>
  );
}
