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
    console.log('🔍 Starting frame addition process...', {
      currentUrl: window.location.href,
      currentHostname: window.location.hostname,
      currentProtocol: window.location.protocol
    });
    
    try {
      // 1. Verify frame context is initialized
      const context = await sdk.context;
      console.log('📱 Checking frame context...', {
        context,
        clientInfo: context?.client
      });

      if (!context?.client) {
        const error = 'Frame context not initialized';
        console.error('❌ Context Error:', error);
        onError?.(error);
        return;
      }

      // 2. Verify manifest is accessible
      console.log('📄 Checking manifest accessibility...');
      try {
        const manifestUrl = `${window.location.origin}/.well-known/farcaster.json`;
        console.log('📄 Attempting to fetch manifest from:', manifestUrl);
        const manifestResponse = await fetch(manifestUrl);
        console.log('📄 Manifest response:', {
          status: manifestResponse.status,
          ok: manifestResponse.ok,
          url: manifestResponse.url
        });

        if (!manifestResponse.ok) {
          const error = 'Unable to access frame manifest';
          console.error('❌ Manifest Error:', error);
          onError?.(error);
          return;
        }

        const manifest = await manifestResponse.json();
        console.log('📄 Manifest content:', manifest);

        // Add validation for domain match
        const currentDomain = window.location.hostname;
        console.log('📄 Validating domains:', {
          currentDomain,
          manifestDomain: manifest.frame.homeUrl
        });

        if (!manifest.frame || !manifest.accountAssociation) {
          const error = 'Invalid manifest structure';
          console.error('❌ Manifest Structure Error:', error);
          onError?.(error);
          return;
        }
      } catch (manifestError) {
        console.error('❌ Manifest Check Error:', manifestError);
        onError?.('Error checking frame manifest');
        return;
      }

      // 3. Attempt to add frame
      console.log('➕ Attempting to add frame...');
      const result = await sdk.actions.addFrame() as AddFrameResult;
      console.log('✨ Add frame result:', result);
      
      if (!result.added) {
        const errorMessage = result.reason === 'invalid_domain_manifest' 
          ? 'Invalid frame configuration. Please verify your manifest.' 
          : result.reason === 'rejected_by_user'
          ? 'Frame addition was rejected by user'
          : 'Failed to add frame';
        console.error('❌ Add Frame Error:', {
          reason: result.reason,
          message: errorMessage
        });
        onError?.(errorMessage);
        return;
      }

      // 4. Success handling
      console.log('✅ Frame added successfully!', {
        hasNotifications: !!result.notificationDetails
      });
      
      setIsAdded(true);
      localStorage.setItem('frameAdded', 'true');
      if (result.notificationDetails) {
        onSuccess?.(result.notificationDetails);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      // 5. Detailed error logging
      console.error('❌ Unexpected Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add frame';
      onError?.(errorMessage);
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