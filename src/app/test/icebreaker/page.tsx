'use client';

import { useState, useEffect } from 'react';

interface TestData {
  icebreakerUrl: string;
  users: { id: string; name: string }[];
  event: { id: string };
}

export default function IcebreakerTestPage() {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loggedInAs, setLoggedInAs] = useState<string | null>(null);
  const [eventIdInput, setEventIdInput] = useState('');

  // URLパラメータからeventIdを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (eventId) {
      setEventIdInput(eventId);
      loadExistingEvent(eventId);
    }
  }, []);

  // 本番環境では表示しない
  if (process.env.NODE_ENV === 'production') {
    return <div className="p-8">This page is disabled in production.</div>;
  }

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test/setup-icebreaker', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestData(data);
        setLoggedInAs(null);
        // URLにeventIdを追加（共有しやすく）
        const newUrl = `${window.location.pathname}?eventId=${data.event.id}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        alert('Setup failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Setup failed: ' + e);
    }
    setLoading(false);
  };

  const loadExistingEvent = async (eventId: string) => {
    setLoadingEvent(true);
    try {
      const res = await fetch(`/api/test/setup-icebreaker?eventId=${eventId}`);
      const data = await res.json();
      if (data.success) {
        setTestData(data);
        setLoggedInAs(null);
        // URLを更新
        const newUrl = `${window.location.pathname}?eventId=${eventId}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        alert('Event not found: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Failed to load event: ' + e);
    }
    setLoadingEvent(false);
  };

  const handleLogin = async (userId: string, userName: string) => {
    try {
      const res = await fetch('/api/test/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setLoggedInAs(userName);
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Login failed: ' + e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/test/login', { method: 'DELETE' });
    setLoggedInAs(null);
  };

  const copyShareUrl = () => {
    if (testData) {
      const url = `${window.location.origin}/test/icebreaker?eventId=${testData.event.id}`;
      navigator.clipboard.writeText(url);
      alert('URLをコピーしました！他のブラウザでこのURLを開いてください。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ice Breaker テスト</h1>

        {/* Setup or Join */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Step 1: テストデータ</h2>

          <div className="space-y-4">
            {/* 新規作成 */}
            <div>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? '作成中...' : '新規テストデータを作成'}
              </button>
            </div>

            {/* または */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* 既存イベントに参加 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                既存のEvent IDで参加
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventIdInput}
                  onChange={(e) => setEventIdInput(e.target.value)}
                  placeholder="Event IDを入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => loadExistingEvent(eventIdInput)}
                  disabled={loadingEvent || !eventIdInput}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {loadingEvent ? '読込中...' : '参加'}
                </button>
              </div>
            </div>
          </div>

          {testData && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">準備完了!</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Event ID: <code className="bg-gray-200 px-1 text-xs">{testData.event.id}</code>
                  </p>
                </div>
                <button
                  onClick={copyShareUrl}
                  className="text-sm bg-white px-3 py-1 rounded border border-green-300 hover:bg-green-100"
                >
                  URLをコピー
                </button>
              </div>
              <button
                onClick={async () => {
                  await fetch(`/api/test/setup-icebreaker?eventId=${testData.event.id}`, { method: 'PUT' });
                  alert('セッションをリセットしました。ページをリロードしてください。');
                }}
                className="w-full text-sm bg-red-50 text-red-600 px-3 py-2 rounded border border-red-200 hover:bg-red-100"
              >
                🔄 セッションをリセット（別のゲームを始める）
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Login */}
        {testData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Step 2: ログイン</h2>
            <p className="text-sm text-gray-600 mb-4">
              このブラウザ窓でログインするユーザーを選択
            </p>

            {loggedInAs && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-blue-800">
                  ログイン中: <strong>{loggedInAs}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:underline"
                >
                  ログアウト
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {testData.users.map((user, i) => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id, user.name)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    loggedInAs === user.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {i % 2 === 0 ? '男性' : '女性'} / {['Leader', 'Supporter', 'Analyst', 'Entertainer'][i % 4]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Go to Icebreaker */}
        {testData && loggedInAs && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Step 3: Ice Breakerへ</h2>
            <a
              href={testData.icebreakerUrl}
              className="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
            >
              Ice Breaker を開く
            </a>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">テスト手順</h3>
          <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
            <li>1つ目のブラウザで「新規テストデータを作成」をクリック</li>
            <li>「URLをコピー」をクリック</li>
            <li>他の3つのブラウザでコピーしたURLを開く</li>
            <li>各ブラウザで異なるユーザーを選んでログイン</li>
            <li>「Ice Breakerを開く」をクリック</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
