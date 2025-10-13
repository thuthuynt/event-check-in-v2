import { useState, useRef, useEffect } from "react";
import { PhotoCapture } from "./PhotoCapture";
import { SignaturePad } from "./SignaturePad";

interface Participant {
  id: number;
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

interface CheckInProcessProps {
  participant: Participant;
  onComplete: () => void;
  onCancel: () => void;
}

type CheckInStep = 'photo' | 'signature' | 'confirm' | 'processing';

export function CheckInProcess({ participant, onComplete, onCancel }: CheckInProcessProps) {
  const [currentStep, setCurrentStep] = useState<CheckInStep>('photo');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = (photoData: string) => {
    setPhoto(photoData);
    setCurrentStep('signature');
  };

  const handleSignatureCapture = (signatureData: string) => {
    setSignature(signatureData);
    setCurrentStep('confirm');
  };

  const handleConfirmCheckIn = async () => {
    if (!photo || !signature) {
      setError('Please capture both photo and signature');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          participant_id: participant.id,
          photo: photo,
          signature: signature,
          checkin_by: 'System', // Default value since staff name is not required
          note: note.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep('processing');
        // Show success for 2 seconds then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError('Failed to complete check-in. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setCurrentStep('photo');
  };

  const handleRetakeSignature = () => {
    setSignature(null);
    setCurrentStep('signature');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'photo':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Capture Photo</h3>
              <p className="text-sm text-gray-600">
                Take a clear photo of {participant.first_name} {participant.last_name}
              </p>
            </div>

            <PhotoCapture onCapture={handlePhotoCapture} />
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Digital Signature</h3>
              <p className="text-sm text-gray-600">
                Have {participant.first_name} {participant.last_name} sign below
              </p>
            </div>

            {photo && (
              <div className="text-center">
                <div className="inline-block relative">
                  <img
                    src={photo}
                    alt="Captured photo"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={handleRetakePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    title="Retake photo"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Photo captured ✓</p>
              </div>
            )}

            <SignaturePad onCapture={handleSignatureCapture} />
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Confirm Check-in</h3>
              <p className="text-sm text-gray-600">
                Review the information and complete the check-in
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Preview */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Photo</h4>
                {photo && (
                  <div className="relative inline-block">
                    <img
                      src={photo}
                      alt="Captured photo"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={handleRetakePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Retake photo"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Signature Preview */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Signature</h4>
                {signature && (
                  <div className="relative inline-block">
                    <img
                      src={signature}
                      alt="Captured signature"
                      className="w-32 h-20 object-contain rounded-lg border-2 border-gray-200 bg-white"
                    />
                    <button
                      onClick={handleRetakeSignature}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Retake signature"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label htmlFor="checkin-note" className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Note (Optional)
              </label>
              <textarea
                id="checkin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this check-in..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Check-in Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Participant:</strong> {participant.first_name} {participant.last_name} (Bib #{participant.bib_no})</div>
                <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Complete Check-in'}
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check-in Complete!</h3>
              <p className="text-sm text-gray-600">
                {participant.first_name} {participant.last_name} has been successfully checked in.
              </p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'photo' ? 'bg-blue-600 text-white' : 
          ['signature', 'confirm', 'processing'].includes(currentStep) ? 'bg-green-600 text-white' : 
          'bg-gray-300 text-gray-600'
        }`}>
          1
        </div>
        <div className={`w-16 h-1 ${['signature', 'confirm', 'processing'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'signature' ? 'bg-blue-600 text-white' : 
          ['confirm', 'processing'].includes(currentStep) ? 'bg-green-600 text-white' : 
          'bg-gray-300 text-gray-600'
        }`}>
          2
        </div>
        <div className={`w-16 h-1 ${['confirm', 'processing'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'confirm' ? 'bg-blue-600 text-white' : 
          currentStep === 'processing' ? 'bg-green-600 text-white' : 
          'bg-gray-300 text-gray-600'
        }`}>
          3
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}
