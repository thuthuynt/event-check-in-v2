import { useState, useEffect } from 'react';
import { getEvents } from '@/lib/api';

interface Event {
  id: number;
  event_name: string;
  event_start_date: string;
  participant_count: number;
}

interface EventSelectionProps {
  events: Event[];
  apiToken: string;
}

export function EventSelection({ events: initialEvents, apiToken }: EventSelectionProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null);
    };
    
    if (showDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const token = localStorage.getItem('authToken');
      const result = await getEvents(baseUrl, token);
      if (result.success) {
        setEvents(result.events);
      }
    } catch (error) {
      console.error('Failed to refresh events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (eventId: number) => {
    window.location.href = `/checkin/${eventId}`;
  };

  const handleCreateEvent = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refreshEvents();
  };

  const handleDropdownToggle = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event card click
    setShowDropdown(showDropdown === eventId ? null : eventId);
  };

  const handleEditEvent = async (eventId: number) => {
    setShowDropdown(null);
    
    // Find the event to edit
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // For now, show a simple prompt - you can implement a proper modal later
    const newName = prompt('Edit event name:', event.event_name);
    if (!newName || newName === event.event_name) return;
    
    const newDate = prompt('Edit event date (YYYY-MM-DD):', event.event_start_date.split('T')[0]);
    if (!newDate || newDate === event.event_start_date.split('T')[0]) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/events/${eventId}/manage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: newName,
          event_start_date: newDate
        }),
      });
      
      if (response.ok) {
        alert('Event updated successfully!');
        refreshEvents();
      } else {
        const errorData = await response.json();
        alert(`Failed to update event: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Edit event error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleArchiveEvent = async (eventId: number) => {
    setShowDropdown(null);
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!confirm(`Are you sure you want to archive "${event.event_name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/events/${eventId}/manage`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        alert('Event archived successfully!');
        refreshEvents();
      } else {
        const errorData = await response.json();
        alert(`Failed to archive event: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Archive event error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <p className="text-gray-600">Select or Create an event to begin</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCreateEvent}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first event to get started.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateEvent}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Create Event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{event.event_name}</h3>
                      <p className="text-sm text-gray-500">{new Date(event.event_start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => handleDropdownToggle(event.id, e)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {showDropdown === event.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              ✏️ Edit Event
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveEvent(event.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              📦 Archive Event
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Participants</span>
                      <span className="text-sm font-medium text-gray-900">{event.participant_count}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      Start Check-in
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <CreateEventModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
          apiToken={apiToken}
        />
      )}
    </div>
  );
}

// Create Event Modal Component
interface CreateEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
  apiToken: string;
}

function CreateEventModal({ onClose, onSuccess, apiToken }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    event_name: '',
    event_start_date: '',
    participants_file: null as File | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      participants_file: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate required fields
    if (!formData.participants_file) {
      setError('Participants file is required to create an event.');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('event_name', formData.event_name);
      formDataToSend.append('event_start_date', formData.event_start_date);
      formDataToSend.append('participants_file', formData.participants_file);

      const baseUrl = window.location.origin;
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show success message with participant count
          if (result.participantCount > 0) {
            alert(`Event created successfully with ${result.participantCount} participants!`);
          } else {
            alert('Event created successfully!');
          }
          if (result.participantErrors && result.participantErrors.length > 0) {
            console.warn('Participant creation errors:', result.participantErrors);
          }
          onSuccess();
        } else {
          setError(result.message || 'Failed to create event');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Event</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="event_name" className="block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                type="text"
                id="event_name"
                name="event_name"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.event_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="event_start_date" className="block text-sm font-medium text-gray-700">
                Event Date
              </label>
              <input
                type="date"
                id="event_start_date"
                name="event_start_date"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.event_start_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="participants_file" className="block text-sm font-medium text-gray-700">
                Participants File (CSV) - Required
              </label>
              <input
                type="file"
                id="participants_file"
                name="participants_file"
                accept=".csv"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Download the template{' '}
                <a
                  href="/api/images/templates%2Ftemplate_participants.csv"
                  download="template_participants.csv"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  HERE
                </a>
                {' '}and fill it with participant data. Upload is required to create an event.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
