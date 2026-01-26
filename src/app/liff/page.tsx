'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { Loader2 } from 'lucide-react';

type LiffStatus = 'initializing' | 'logging_in' | 'authenticating' | 'redirecting' | 'error';

export default function LiffPage() {
  const [status, setStatus] = useState<LiffStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Initialize LIFF
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        // Check if running in LIFF browser
        if (!liff.isInClient()) {
          // Not in LINE app, redirect to normal login
          window.location.href = '/api/auth/line';
          return;
        }

        // Check if logged in
        if (!liff.isLoggedIn()) {
          setStatus('logging_in');
          liff.login();
          return;
        }

        // Get access token and authenticate
        setStatus('authenticating');
        const accessToken = liff.getAccessToken();

        if (!accessToken) {
          throw new Error('Failed to get access token');
        }

        // Call our auth API with the LIFF access token
        const response = await fetch('/api/auth/liff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const data = await response.json();

        // Redirect based on user status
        setStatus('redirecting');
        window.location.href = data.redirectUrl;
      } catch (err) {
        console.error('LIFF initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    initLiff();
  }, []);

  const statusMessages: Record<LiffStatus, string> = {
    initializing: 'LIFFを初期化中...',
    logging_in: 'LINEにログイン中...',
    authenticating: '認証中...',
    redirecting: 'リダイレクト中...',
    error: 'エラーが発生しました',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        {status !== 'error' ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B] mx-auto mb-4" />
            <p className="text-neutral-600">{statusMessages[status]}</p>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-red-500">{statusMessages[status]}</p>
            <p className="text-sm text-neutral-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF5252] transition-colors"
            >
              再試行
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
