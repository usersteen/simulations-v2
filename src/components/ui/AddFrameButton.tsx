import { useEffect, useState, useCallback } from 'react';
import sdk from "@farcaster/frame-sdk";

type FrameNotificationDetails = {
  url: string;
  token: string;
};

type AddFrameResult = {
  added: boolean;
  notificationDetails?: FrameNotificationDetails;
  reason?: 'invalid_domain_manifest' | 'rejected_by_user';
};

interface AddFrameButtonProps {
  onSuccess?: (notificationDetails?: FrameNotificationDetails) => void;
  onError?: (error: string) => void;
}

export function AddFrameButton({ onSuccess, onError }: AddFrameButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [hasAttemptedThisSession, setHasAttemptedThisSession] = useState(false);
  
  // Check localStorage on mount
  useEffect(() => {
    const added = localStorage.getItem('frameAdded') === 'true';
    const attempted = sessionStorage.getItem('frameAttempted') === 'true';
    setIsAdded(added);
    setHasAttemptedThisSession(attempted);
  }, []);

  const handleAddFrame = useCallback(async () => {
    // If we've already attempted in this session, don't try again
    if (hasAttemptedThisSession) {
      console.log('Already attempted to add frame this session');
      return;
    }

    try {
      // Mark that we've attempted in this session
      setHasAttemptedThisSession(true);
      sessionStorage.setItem('frameAttempted', 'true');

      const result = await sdk.actions.addFrame() as AddFrameResult;
      
      if (result?.added) {
        setIsAdded(true);
        localStorage.setItem('frameAdded', 'true');
        if (result.notificationDetails) {
          onSuccess?.(result.notificationDetails);
        } else {
          onSuccess?.();
        }
      } else {
        // Don't show error for rejected_by_user if we've already attempted this session
        if (result?.reason === 'rejected_by_user' && hasAttemptedThisSession) {
          return;
        }
        
        const errorMessage = result?.reason === 'invalid_domain_manifest' 
          ? 'Invalid frame configuration. Please verify your manifest.' 
          : result?.reason === 'rejected_by_user'
          ? 'Frame addition was rejected'
          : 'Failed to add frame';
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error('Error adding frame:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add frame';
      onError?.(errorMessage);
    }
  }, [hasAttemptedThisSession, onSuccess, onError]);

  return (
    <button
      onClick={handleAddFrame}
      disabled={isAdded || hasAttemptedThisSession}
      className={`w-full bg-transparent text-white border border-white font-mono text-[13px] py-2 
        ${(isAdded || hasAttemptedThisSession)
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-white hover:text-black transition-colors'
        }`}
    >
      {isAdded ? 'Frame Added' : hasAttemptedThisSession ? 'Already Attempted' : 'Add Frame'}
    </button>
  );
}