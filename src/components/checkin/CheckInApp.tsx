import { useState, useEffect } from 'react';
import { SearchComponent } from './SearchComponent';
import { StatsPanel } from './StatsPanel';
import { CheckInProcess } from './CheckInProcess';
import { ParticipantDetails } from './ParticipantDetails';
import { CreateParticipantModal } from './CreateParticipantModal';

interface Event {
  id: number;
  event_name: string;
  event_start_date: string;
  participant_count: number;
}

interface Participant {
  id: number;
  event_id: number;
  participant_id: string;
  start_time: string;
  bib_no: string;
  category: string;
  age_group: string;
  id_card_passport: string;
  last_name: string;
  first_name: string;
  tshirt_size: string;
  birthday_year: number;
  nationality: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  medical_information: string;
  medicines_using: string;
  parent_full_name: string;
  parent_date_of_birth: string;
  parent_email: string;
  parent_id_card_passport: string;
  parent_relationship: string;
  full_name: string;
  name_on_bib: string;
  signature_url: string;
  uploaded_image_url: string;
  checkin_at: string;
  checkin_by: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface CheckInAppProps {
  event: Event;
  initialStats: Stats;
  apiToken: string;
}

export function CheckInApp({ event, initialStats, apiToken }: CheckInAppProps) {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const participantsPerPage = 10;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setIsAuthenticated(true);
    loadAllParticipants();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const loadAllParticipants = async () => {
    try {
      const response = await fetch(`/api/participants/search?event_id=${event.id}&q=`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setAllParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/stats?event_id=${event.id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (query: string) => {
    // Ensure query is always a string and handle null/undefined
    const safeQuery = query || '';
    setSearchQuery(safeQuery);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSelectParticipant = async (participantId: number) => {
    try {
      const response = await fetch(`/api/participants/${participantId}?event_id=${event.id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setSelectedParticipant(data);
      setShowCheckIn(false);
    } catch (error) {
      console.error('Error loading participant details:', error);
    }
  };

  const handleStartCheckIn = () => {
    setShowCheckIn(true);
  };

  const handleCheckInComplete = async () => {
    setShowCheckIn(false);
    setSelectedParticipant(null);
    setSearchQuery('');
    await loadStats(); // Refresh stats
    await loadAllParticipants(); // Refresh participant list
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/export-participants?event_id=${event.id}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participants_event_${event.id}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to export participants');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Network error or server unreachable.');
    }
  };

  // Get current participants to display
  const getCurrentParticipants = () => {
    if (!searchQuery || searchQuery.length < 2) {
      return allParticipants;
    }
    
    try {
      // Filter allParticipants based on search query
      return allParticipants.filter(participant => {
        if (!participant) return false;
        
        const searchTerm = searchQuery.toLowerCase().trim();
        if (!searchTerm) return true;
        
        return (
          (participant.bib_no?.toLowerCase() || '').includes(searchTerm) ||
          (participant.first_name?.toLowerCase() || '').includes(searchTerm) ||
          (participant.last_name?.toLowerCase() || '').includes(searchTerm) ||
          (participant.full_name?.toLowerCase() || '').includes(searchTerm) ||
          (participant.name_on_bib?.toLowerCase() || '').includes(searchTerm) ||
          (participant.phone?.toLowerCase() || '').includes(searchTerm) ||
          (participant.email?.toLowerCase() || '').includes(searchTerm) ||
          (participant.id_card_passport?.toLowerCase() || '').includes(searchTerm)
        );
      });
    } catch (error) {
      console.error('Error filtering participants:', error);
      return allParticipants;
    }
  };

  const totalParticipants = getCurrentParticipants().length;
  const totalPages = Math.ceil(totalParticipants / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const currentParticipants = getCurrentParticipants().slice(startIndex, endIndex);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {event.event_name}
              </h1>
              <p className="text-xs text-gray-500">
                {new Date(event.event_start_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                title="Create New Participant"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => window.location.href = `/stats/${event.id}`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Stats"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <div className="relative group">
                <button
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                  title="Export Data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export to CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export to Excel
                    </button>
                  </div>
                </div>
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
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b">
        <SearchComponent
          onSearch={handleSearch}
          searchResults={[]}
          onSelectParticipant={() => {}}
          loading={false}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {selectedParticipant ? (
          // Participant Details View
          <div className="h-full">
            {showCheckIn ? (
              <CheckInProcess
                participant={selectedParticipant}
                onComplete={handleCheckInComplete}
                onCancel={() => setShowCheckIn(false)}
              />
            ) : (
              <ParticipantDetails
                participant={selectedParticipant}
                onStartCheckIn={handleStartCheckIn}
                onBack={() => setSelectedParticipant(null)}
              />
            )}
          </div>
        ) : (
          // Participants List View
          <div className="bg-white">
            <div className="px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchQuery.length >= 2 ? `Participants (${totalParticipants} found)` : 'All Participants'}
                </h2>
                <span className="text-sm text-gray-500">
                  {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {currentParticipants.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏃‍♂️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery.length >= 2 ? 'No matching participants' : 'No participants found'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery.length >= 2 ? 'Try a different search term' : 'No participants available for this event.'}
                  </p>
                </div>
              )}
              {currentParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectParticipant(participant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {participant.bib_no}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1">
                            {/* Full Name and Name on Bib */}
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {participant.full_name || `${participant.first_name} ${participant.last_name}`}
                              </p>
                              {participant.name_on_bib && participant.name_on_bib !== participant.full_name && (
                                <span className="text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                  "{participant.name_on_bib}"
                                </span>
                              )}
                            </div>
                            
                            {/* Phone and Email */}
                            <div className="flex items-center space-x-2">
                              {participant.phone && (
                                <span className="text-xs text-gray-900">
                                  {participant.phone}
                                </span>
                              )}
                              {participant.email && (
                                <span className="text-xs text-gray-900">
                                  {participant.email}
                                </span>
                              )}
                            </div>
                            
                            {/* ID */}
                            {participant.id_card_passport && (
                              <p className="text-xs text-gray-900">
                                {participant.id_card_passport}
                              </p>
                            )}
                            
                            {/* Status */}
                            <div className="mt-1">
                              {participant.checkin_at ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Checked In
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Participant Modal */}
      {showCreateModal && (
        <CreateParticipantModal
          eventId={event.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAllParticipants(); // Refresh the participant list
            loadStats(); // Refresh stats
          }}
        />
      )}
    </div>
  );
}