'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/magicui';
import { formatDate, formatTime, getAreaLabel, isWithin48Hours } from '@/lib/utils';
import { Plus, Calendar, MapPin, Users, AlertCircle, Star } from 'lucide-react';
import type { Event } from '@/types/database';

interface AdminClientProps {
  events: Event[];
}

const areaOptions = [
  { value: 'shibuya', label: '渋谷' },
  { value: 'ebisu', label: '恵比寿' },
  { value: 'roppongi', label: '六本木' },
  { value: 'ginza', label: '銀座' },
  { value: 'shinjuku', label: '新宿' },
];

// Check if event needs urgent matching (within 48 hours and not matched)
function needsUrgentMatching(event: Event): boolean {
  return isWithin48Hours(event.event_date) && event.status !== 'matched';
}

// Sort events: urgent first, then by date
function sortEvents(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const aUrgent = needsUrgentMatching(a);
    const bUrgent = needsUrgentMatching(b);

    // Urgent events first
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    // Then sort by date (closest event first for urgent, newest first for others)
    const dateA = new Date(a.event_date).getTime();
    const dateB = new Date(b.event_date).getTime();
    if (aUrgent && bUrgent) {
      return dateA - dateB; // Closest urgent event first
    }
    return dateB - dateA; // Newest event first for non-urgent
  });
}

export function AdminClient({ events: initialEvents }: AdminClientProps) {
  const [events, setEvents] = useState(() => sortEvents(initialEvents));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newEvent, setNewEvent] = useState({
    date: '',
    time: '19:00',
    area: 'shibuya',
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventDate = new Date(`${newEvent.date}T${newEvent.time}:00`);

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_date: eventDate.toISOString(),
          area: newEvent.area,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setEvents(sortEvents([data.event, ...events]));
      setShowCreateForm(false);
      setNewEvent({ date: '', time: '19:00', area: 'shibuya' });
    } catch (error) {
      console.error('Create event error:', error);
      alert('イベントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">
              unplanned
            </Link>
            <span className="text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">イベント管理</h1>
          <div className="flex gap-2">
            <Link href="/admin/reviews">
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                レビュー管理
              </Button>
            </Link>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              イベント作成
            </Button>
          </div>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <Card className="mb-8 relative overflow-hidden">
            <BorderBeam size={250} duration={12} delay={0} />
            <CardHeader>
              <h2 className="font-semibold">新規イベント作成</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="開催日"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="開始時刻"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="エリア"
                    value={newEvent.area}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, area: e.target.value })
                    }
                    options={areaOptions}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={loading}>
                    作成
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Events list */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-neutral-600">
                イベントがありません
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const isUrgent = needsUrgentMatching(event);
              return (
                <Card key={event.id} className={isUrgent ? 'border-orange-300 bg-orange-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {isUrgent && (
                          <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-2">
                            <AlertCircle className="w-4 h-4" />
                            要マッチング（48時間以内）
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-2">
                          <span className="flex items-center gap-1 text-sm text-neutral-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.event_date)} {formatTime(event.event_date)}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-neutral-600">
                            <MapPin className="w-4 h-4" />
                            {getAreaLabel(event.area)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              event.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : event.status === 'matched'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {event.status === 'open'
                              ? '受付中'
                              : event.status === 'matched'
                              ? 'マッチング済'
                              : '終了'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant={isUrgent ? 'primary' : 'outline'} size="sm">
                            <Users className="w-4 h-4 mr-2" />
                            {isUrgent ? 'マッチングする' : 'エントリー一覧'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
