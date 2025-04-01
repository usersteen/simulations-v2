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
  
  // Check localStorage on mount
  useEffect(() => {
    const added = localStorage.getItem('frameAdded') === 'true';
    setIsAdded(added);
  }, []);

  const handleAddFrame = useCallback(async () => {
    try {
      const result = await sdk.actions.addFrame() as AddFrameResult;
      
      if (result?.added) {
        setIsAdded(true);
        localStorage.setItem('frameAdded', 'true');
        if (result.notificationDetails) {
          onSuccess?.(result.notificationDetails);
        } else {
          onSuccess?.();
        }
      } else if (result?.reason === 'invalid_domain_manifest') {
        onError?.('Invalid frame configuration. Please verify your manifest.');
      }
      // Don't show error for user rejection - it's a normal user action
    } catch (error) {
      console.error('Error adding frame:', error);
      // Only show technical errors to user
      if (!(error instanceof Error && error.message.includes('RejectedByUser'))) {
        onError?.(error instanceof Error ? error.message : 'Failed to add frame');
      }
    }
  }, [onSuccess, onError]);

  return (
    <button
      onClick={handleAddFrame}
      disabled={isAdded}
      className={`w-full bg-transparent text-white border border-white font-mono text-[13px] py-2 
        ${isAdded 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-white hover:text-black transition-colors'
        }`}
    >
      {isAdded ? 'Frame Added' : 'Add Frame'}
    </button>
  );
}