import React, { useState, useRef, useEffect } from 'react';
import { SignaturePad } from './SignaturePad';

interface Participant {
  id: number;
  event_id: number;
  participant_id: string;
  start_time: string;
  bib_no: string;
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

interface ParticipantDetailsProps {
  participant: Participant;
  onStartCheckIn: () => void;
  onBack: () => void;
}

export function ParticipantDetails({ participant, onStartCheckIn, onBack }: ParticipantDetailsProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCheckedIn = !!participant.checkin_at;

  useEffect(() => {}, []);
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Please select an image smaller than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSignature = () => {
    setSignature(null);
  };

  const handleSignatureCapture = (signatureData: string) => {
    setSignature(signatureData);
  };

  const handleCheckIn = async () => {
    if (!photo || !signature) {
      setError('Please upload photo and signature before checking in.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participant.id,
          event_id: participant.event_id,
          photo: photo,
          signature: signature,
          checkin_by: 'admin' // You might want to get this from user context
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onBack(); // Go back to main check-in screen instead of 3-step process
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to check in participant');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not set";
    return new Date(timeString).toLocaleString();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Check-in Successful!</h2>
          <p className="text-green-600 mb-4">
            {participant.first_name} {participant.last_name} has been checked in successfully.
          </p>
          <p className="text-sm text-green-500">Returning to check-in screen...</p>
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
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">
                {participant.first_name} {participant.last_name}
              </h1>
              <p className="text-xs text-gray-500">Bib #{participant.bib_no}</p>
            </div>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Check-in Status */}
        {isCheckedIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">Already Checked In</h4>
                <p className="text-sm text-green-700">
                  Checked in at {formatTime(participant.checkin_at)} by {participant.checkin_by}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Photos and Signature */}
        {isCheckedIn && (participant.uploaded_image_url || participant.signature_url) && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Check-in Documentation</h3>
            <div className="flex flex-col items-center space-y-4">
              {participant.signature_url && (
                <div className="w-full max-w-md">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 text-center">Signature</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img 
                      src={`/api/images/${encodeURIComponent(participant.signature_url)}`}
                      alt="Participant signature" 
                      className="w-full h-32 object-contain"
                      onLoad={() => console.log("Signature loaded successfully:", participant.signature_url)}
                      onError={(e) => {
                        console.error("Failed to load signature:", participant.signature_url);
                        console.error("Constructed URL:", `/api/images/${encodeURIComponent(participant.signature_url)}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              {participant.uploaded_image_url && (
                <div className="w-full max-w-sm">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 text-center">Photo</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={`/api/images/${encodeURIComponent(participant.uploaded_image_url)}`}
                      alt="Participant check-in photo" 
                      className="w-full aspect-[3/4] object-cover"
                      onLoad={() => console.log("Image loaded successfully:", participant.uploaded_image_url)}
                      onError={(e) => {
                        console.error("Failed to load image:", participant.uploaded_image_url);
                        console.error("Constructed URL:", `/api/images/${encodeURIComponent(participant.uploaded_image_url)}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Race Information */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Race Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Bib Number:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.bib_no}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">T-shirt Size:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.tshirt_size || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Start Time:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.start_time || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Name on Bib:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.name_on_bib || participant.full_name}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Phone:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Email:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.email || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">ID/Passport:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.id_card_passport || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Birth Year:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.birthday_year || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Nationality:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.nationality || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Contact Name:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.emergency_contact_name || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Contact Phone:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participant.emergency_contact_phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        {(participant.blood_type || participant.medical_information || participant.medicines_using) && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Information</h3>
            <div className="space-y-2 text-sm">
              {participant.blood_type && (
                <div>
                  <span className="text-gray-700 font-medium">Blood Type:</span>
                  <span className="ml-2 text-gray-900 font-semibold">{participant.blood_type}</span>
                </div>
              )}
              {participant.medical_information && (
                <div>
                  <span className="text-gray-700 font-medium">Medical Info:</span>
                  <span className="ml-2 text-gray-900 font-semibold">{participant.medical_information}</span>
                </div>
              )}
              {participant.medicines_using && (
                <div>
                  <span className="text-gray-700 font-medium">Medicines:</span>
                  <span className="ml-2 text-gray-900 font-semibold">{participant.medicines_using}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check-in Process */}
        {!isCheckedIn && (
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Photo Upload</h3>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  📷 Upload Photo
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Choose from gallery or take a new photo
                </p>
                {photo && (
                  <div className="space-y-3">
                    <img src={photo} alt="Participant photo" className="w-full rounded-md" />
                    <button
                      onClick={() => {
                        setPhoto(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <SignaturePad onCapture={handleSignatureCapture} />
              {signature && (
                <div className="text-center mt-3">
                  <p className="text-sm text-green-600">✓ Signature captured</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Check-in Button */}
            <button
              onClick={handleCheckIn}
              disabled={!photo || !signature || isSubmitting}
              className="w-full bg-indigo-600 text-white py-4 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Checking In...' : 'Complete Check-in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}