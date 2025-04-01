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
  const [isFrameContext, setIsFrameContext] = useState(false);
  
  // Check if we're in a frame context and localStorage on mount
  useEffect(() => {
    const checkContext = async () => {
      try {
        const context = await sdk.context;
        setIsFrameContext(!!context?.client);
        
        // Only check localStorage if we're in a frame context
        if (context?.client) {
          const added = localStorage.getItem('frameAdded') === 'true';
          setIsAdded(added);
        }
      } catch (error) {
        console.log('Not in frame context');
        setIsFrameContext(false);
      }
    };
    
    checkContext();
  }, []);

  const handleAddFrame = useCallback(async () => {
    if (!isFrameContext) {
      console.log('Cannot add frame outside of frame context');
      return;
    }

    try {
      const result = await sdk.actions.addFrame() as AddFrameResult;
      console.log('Add frame result:', result);
      
      if (result?.added) {
        setIsAdded(true);
        localStorage.setItem('frameAdded', 'true');
        if (result.notificationDetails) {
          onSuccess?.(result.notificationDetails);
        } else {
          onSuccess?.();
        }
      } else {
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
  }, [isFrameContext, onSuccess, onError]);

  // Don't render the button if we're not in a frame context
  if (!isFrameContext) {
    return null;
  }

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