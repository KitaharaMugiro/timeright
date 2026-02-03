'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/magicui';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatDate, formatTime, getAreaLabel, isWithin48Hours, AREA_OPTIONS } from '@/lib/utils';
import { Plus, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';
import type { Event } from '@/types/database';

type EventTab = 'upcoming' | 'matched' | 'closed';

const EVENT_TABS: { id: EventTab; label: string }[] = [
  { id: 'upcoming', label: '受付中' },
  { id: 'matched', label: 'マッチング済' },
  { id: 'closed', label: '終了' },
];

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

function needsUrgentMatching(event: Event): boolean {
  return isWithin48Hours(event.event_date) && event.status === 'open';
}

function sortEvents(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const aUrgent = needsUrgentMatching(a);
    const bUrgent = needsUrgentMatching(b);
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    const dateA = new Date(a.event_date).getTime();
    const dateB = new Date(b.event_date).getTime();
    // 緊急または受付中（open）の場合は開催日が近い順（昇順）
    if (aUrgent && bUrgent) {
      return dateA - dateB;
    }
    if (a.status === 'open' && b.status === 'open') {
      return dateA - dateB;
    }
    // その他（matched, closed）は新しい順（降順）
    return dateB - dateA;
  });
}

export function AdminClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>('upcoming');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabCounts, setTabCounts] = useState({ upcoming: 0, matched: 0, closed: 0 });

  const [newEvent, setNewEvent] = useState({
    date: '',
    time: '19:00',
    area: 'shibuya',
  });

  const fetchEvents = useCallback(async (tab: EventTab, page: number = 1) => {
    setLoadingEvents(true);
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      const response = await fetch(`/api/admin/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      setEvents(sortEvents(data.events || []));
      setPagination(data.pagination || null);
      setTabCounts(data.counts || { upcoming: 0, matched: 0, closed: 0 });
      setCurrentPage(page);
    } catch (error) {
      console.error('Fetch events error:', error);
      setEvents([]);
      setPagination(null);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(activeTab, 1);
  }, [activeTab, fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

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

      await fetchEvents(activeTab, 1);
      setShowCreateForm(false);
      setNewEvent({ date: '', time: '19:00', area: 'shibuya' });
    } catch (error) {
      console.error('Create event error:', error);
      alert('イベントの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">イベント管理</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          イベント作成
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="mb-6 relative overflow-hidden glass-card border-slate-700">
          <BorderBeam size={250} duration={12} delay={0} />
          <CardHeader>
            <h2 className="font-semibold text-white">新規イベント作成</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="開催日"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
                <Input
                  label="開始時刻"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  required
                />
                <Select
                  label="エリア"
                  value={newEvent.area}
                  onChange={(e) => setNewEvent({ ...newEvent, area: e.target.value })}
                  options={AREA_OPTIONS}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>
                  作成
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {EVENT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                activeTab === tab.id ? 'bg-rose-600' : 'bg-slate-700'
              }`}
            >
              {tabCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {loadingEvents ? (
          <Card className="glass-card border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              読み込み中...
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card className="glass-card border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              {activeTab === 'upcoming' && 'マッチング待ちのイベントはありません'}
              {activeTab === 'matched' && 'マッチング済みのイベントはありません'}
              {activeTab === 'closed' && '終了したイベントはありません'}
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            const isUrgent = needsUrgentMatching(event);
            return (
              <Card
                key={event.id}
                className={`glass-card border-slate-700 ${isUrgent ? 'border-warning/30 bg-warning/5' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      {isUrgent && (
                        <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
                          <AlertCircle className="w-4 h-4" />
                          要マッチング（48時間以内）
                        </div>
                      )}
                      <div className="flex items-center gap-4 mb-2">
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.event_date)} {formatTime(event.event_date)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          {getAreaLabel(event.area)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            event.status === 'open'
                              ? 'bg-success/10 text-success'
                              : event.status === 'matched'
                                ? 'bg-info/10 text-info'
                                : 'bg-slate-800 text-slate-400'
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
                          {isUrgent ? 'マッチングする' : '詳細'}
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loadingEvents}
            onClick={() => fetchEvents(activeTab, currentPage - 1)}
          >
            前へ
          </Button>
          <span className="text-sm text-slate-400">
            {currentPage} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === pagination.totalPages || loadingEvents}
            onClick={() => fetchEvents(activeTab, currentPage + 1)}
          >
            次へ
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
