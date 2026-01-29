'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { ArrowLeft, Plus, X, Users, Store, Check, Trash2, UserPlus, Ban } from 'lucide-react';
import type { Event, Participation, User, Match, Guest, Gender, ParticipationMood, BudgetLevel } from '@/types/database';

interface EventDetailClientProps {
  event: Event;
  participations: (Participation & { users: User })[];
  matches: Match[];
  guests: Guest[];
}

interface TableGroup {
  id: string;
  restaurant_name: string;
  restaurant_url: string;
  reservation_name: string;
  members: string[]; // user_ids or guest:guest_id
}

type ParticipantInfo = Participation & { users: User };

// Helper to check if an ID is a guest ID
const isGuestId = (id: string) => id.startsWith('guest:');
const toGuestId = (guestId: string) => `guest:${guestId}`;
const fromGuestId = (id: string) => id.replace('guest:', '');

// Calculate age from birth date
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Personality type labels
const personalityLabels: Record<string, string> = {
  'Leader': 'リーダー',
  'Supporter': 'サポーター',
  'Analyst': 'アナリスト',
  'Entertainer': 'エンターテイナー',
};

// Mood labels
const moodLabels: Record<ParticipationMood, { label: string; emoji: string; short: string }> = {
  'lively': { label: 'ワイワイ飲み', emoji: '🎉', short: 'ワイワイ' },
  'relaxed': { label: 'まったりトーク', emoji: '☕', short: 'まったり' },
  'inspire': { label: 'インスパイア', emoji: '💡', short: 'インスパイア' },
  'other': { label: 'その他', emoji: '✏️', short: 'その他' },
};

// Budget labels
const budgetLabels: Record<BudgetLevel, { label: string; stars: string; short: string }> = {
  1: { label: 'リーズナブル', stars: '⭐', short: '⭐' },
  2: { label: 'スタンダード', stars: '⭐⭐', short: '⭐⭐' },
  3: { label: 'プレミアム', stars: '⭐⭐⭐', short: '⭐⭐⭐' },
};

export function EventDetailClient({
  event,
  participations,
  matches: initialMatches,
  guests: initialGuests,
}: EventDetailClientProps) {
  // Initialize tables from existing matches
  const initialTables: TableGroup[] = initialMatches.map((m, idx) => ({
    id: m.id || `table-${idx}`,
    restaurant_name: m.restaurant_name,
    restaurant_url: m.restaurant_url || '',
    reservation_name: m.reservation_name || '',
    members: m.table_members,
  }));

  const [tables, setTables] = useState<TableGroup[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  // Guest form state
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ display_name: '', gender: 'male' as Gender });
  const [addingGuest, setAddingGuest] = useState(false);

  // Group participations by group_id (for pair entries)
  const groupedParticipations = useMemo(() => {
    return participations.reduce((acc, p) => {
      if (!acc[p.group_id]) {
        acc[p.group_id] = [];
      }
      acc[p.group_id].push(p);
      return acc;
    }, {} as Record<string, ParticipantInfo[]>);
  }, [participations]);

  // Group guests by group_id (for paired guests)
  const groupedGuests = useMemo(() => {
    return guests.reduce((acc, g) => {
      if (!acc[g.group_id]) {
        acc[g.group_id] = [];
      }
      acc[g.group_id].push(g);
      return acc;
    }, {} as Record<string, Guest[]>);
  }, [guests]);

  // Get all assigned IDs (both users and guests)
  const assignedIds = useMemo(() => {
    return new Set(tables.flatMap(t => t.members));
  }, [tables]);

  // Get unassigned participants
  const unassignedParticipants = useMemo(() => {
    return participations.filter(p => !assignedIds.has(p.user_id));
  }, [participations, assignedIds]);

  // Get unassigned guests
  const unassignedGuests = useMemo(() => {
    return guests.filter(g => !assignedIds.has(toGuestId(g.id)));
  }, [guests, assignedIds]);

  // Get participant info by user_id
  const getParticipantInfo = (userId: string): ParticipantInfo | undefined => {
    return participations.find(p => p.user_id === userId);
  };

  // Get guest info by guest_id
  const getGuestInfo = (guestId: string): Guest | undefined => {
    return guests.find(g => g.id === guestId);
  };

  // Add a new guest
  const handleAddGuest = async () => {
    if (!newGuest.display_name.trim()) return;

    setAddingGuest(true);
    try {
      const response = await fetch(`/api/admin/events/${event.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add guest');
      }

      setGuests([...guests, data.guest]);
      setNewGuest({ display_name: '', gender: 'male' });
      setShowGuestForm(false);
    } catch (error) {
      console.error('Add guest error:', error);
      alert('ゲストの追加に失敗しました');
    } finally {
      setAddingGuest(false);
    }
  };

  // Delete a guest
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('このゲストを削除しますか？')) return;

    try {
      const response = await fetch(`/api/admin/events/${event.id}/guests`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      // Remove from local state
      setGuests(guests.filter(g => g.id !== guestId));

      // Remove from any tables
      const guestFullId = toGuestId(guestId);
      setTables(tables.map(t => ({
        ...t,
        members: t.members.filter(id => id !== guestFullId),
      })));
    } catch (error) {
      console.error('Delete guest error:', error);
      alert('ゲストの削除に失敗しました');
    }
  };

  // Add a new empty table
  const addTable = () => {
    const newTable: TableGroup = {
      id: `new-${Date.now()}`,
      restaurant_name: '',
      restaurant_url: '',
      reservation_name: '',
      members: [],
    };
    setTables([...tables, newTable]);
  };

  // Remove a table
  const removeTable = (tableId: string) => {
    setTables(tables.filter(t => t.id !== tableId));
  };

  // Update table info
  const updateTable = (tableId: string, field: keyof TableGroup, value: string) => {
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, [field]: value } : t
    ));
  };

  // Add participant/guest to table
  const addToTable = (tableId: string, memberId: string) => {
    let memberIds: string[] = [];

    if (isGuestId(memberId)) {
      // It's a guest
      const guestId = fromGuestId(memberId);
      const guest = getGuestInfo(guestId);
      if (!guest) return;

      // Get all guests in the same group
      const groupMembers = groupedGuests[guest.group_id] || [];
      memberIds = groupMembers.map(g => toGuestId(g.id));
    } else {
      // It's a user
      const participant = getParticipantInfo(memberId);
      if (!participant) return;

      // Get all members of this group (for pair entries)
      const groupMembers = groupedParticipations[participant.group_id] || [];
      memberIds = groupMembers.map(m => m.user_id);
    }

    // Remove from any existing table
    const updatedTables = tables.map(t => ({
      ...t,
      members: t.members.filter(id => !memberIds.includes(id)),
    }));

    // Add to target table
    setTables(updatedTables.map(t =>
      t.id === tableId
        ? { ...t, members: [...t.members, ...memberIds] }
        : t
    ));
    setSelectedParticipant(null);
  };

  // Remove participant/guest from table
  const removeFromTable = (tableId: string, memberId: string) => {
    let memberIds: string[] = [];

    if (isGuestId(memberId)) {
      const guestId = fromGuestId(memberId);
      const guest = getGuestInfo(guestId);
      if (!guest) return;

      const groupMembers = groupedGuests[guest.group_id] || [];
      memberIds = groupMembers.map(g => toGuestId(g.id));
    } else {
      const participant = getParticipantInfo(memberId);
      if (!participant) return;

      const groupMembers = groupedParticipations[participant.group_id] || [];
      memberIds = groupMembers.map(m => m.user_id);
    }

    setTables(tables.map(t =>
      t.id === tableId
        ? { ...t, members: t.members.filter(id => !memberIds.includes(id)) }
        : t
    ));
  };

  // Handle participant/guest click
  const handleMemberClick = (memberId: string, currentTableId?: string) => {
    if (selectedParticipant === memberId) {
      setSelectedParticipant(null);
    } else if (selectedParticipant && currentTableId) {
      addToTable(currentTableId, selectedParticipant);
    } else {
      setSelectedParticipant(memberId);
    }
  };

  // Check if pairs are split across tables
  const splitPairs = useMemo(() => {
    const errors: string[] = [];

    // Check user pairs
    for (const [, members] of Object.entries(groupedParticipations)) {
      if (members.length <= 1) continue; // Not a pair

      const memberTables = members.map(m => {
        for (const table of tables) {
          if (table.members.includes(m.user_id)) return table.id;
        }
        return null; // Unassigned
      });

      const uniqueTables = [...new Set(memberTables.filter(t => t !== null))];
      if (uniqueTables.length > 1) {
        // Pair is split across tables
        const names = members.map(m => m.users.display_name).join('と');
        errors.push(`${names}はグループなので同じテーブルに割り当ててください`);
      }
    }

    // Check guest pairs
    for (const [, members] of Object.entries(groupedGuests)) {
      if (members.length <= 1) continue; // Not a pair

      const memberTables = members.map(g => {
        const guestFullId = toGuestId(g.id);
        for (const table of tables) {
          if (table.members.includes(guestFullId)) return table.id;
        }
        return null; // Unassigned
      });

      const uniqueTables = [...new Set(memberTables.filter(t => t !== null))];
      if (uniqueTables.length > 1) {
        const names = members.map(g => g.display_name).join('と');
        errors.push(`${names}はグループなので同じテーブルに割り当ててください`);
      }
    }

    return errors;
  }, [tables, groupedParticipations, groupedGuests]);

  // Validation
  const isValid = useMemo(() => {
    // Check for split pairs
    if (splitPairs.length > 0) return false;

    for (const table of tables) {
      if (!table.restaurant_name.trim()) return false;
      if (table.members.length < 3) return false;
      if (table.members.length > 8) return false;
    }
    return tables.length > 0;
  }, [tables, splitPairs]);

  // Get validation messages
  const getTableValidation = (table: TableGroup): string | null => {
    if (!table.restaurant_name.trim()) return 'お店を入力してください';
    if (table.members.length < 3) return `${3 - table.members.length}人以上追加してください`;
    if (table.members.length > 8) return `最大8人までです（現在${table.members.length}人）`;
    return null;
  };

  // Save matches
  const handleSave = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      const matchData = tables.map(t => ({
        table_id: t.id,
        restaurant_name: t.restaurant_name,
        restaurant_url: t.restaurant_url,
        reservation_name: t.reservation_name,
        members: t.members,
      }));

      const response = await fetch(`/api/admin/events/${event.id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: matchData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save matches');
      }

      alert('マッチングを保存しました。登録ユーザーにはLINE通知が送信されます。');
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      alert('保存に失敗しました: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Cancel event
  const handleCancel = async () => {
    if (!confirm('このイベントをキャンセルしますか？\n\n参加者全員に「既定の人数が集まらず、マッチングできませんでした」というLINE通知が送信されます。')) {
      return;
    }

    setCanceling(true);
    try {
      const response = await fetch(`/api/admin/events/${event.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel event');
      }

      alert(`イベントをキャンセルしました。\n${data.canceled_participations}人の参加者にLINE通知を送信しました。`);
      window.location.reload();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('キャンセルに失敗しました: ' + (error as Error).message);
    } finally {
      setCanceling(false);
    }
  };

  // Render participant card (compact version for tables)
  const renderParticipantCompact = (p: ParticipantInfo, tableId: string) => {
    const age = calculateAge(p.users.birth_date);
    const groupSize = groupedParticipations[p.group_id]?.length || 1;
    const groupLabel = groupSize === 2 ? 'ペア' : groupSize >= 3 ? 'グループ' : null;

    return (
      <div
        key={p.user_id}
        className="flex items-center gap-2 p-2 rounded bg-slate-800 border border-slate-700"
      >
        <UserAvatar
          displayName={p.users.display_name}
          avatarUrl={p.users.avatar_url}
          gender={p.users.gender}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-white">{p.users.display_name}</div>
          <div className="text-xs text-slate-400 truncate">
            {age}歳 / {p.users.job || '-'}
          </div>
        </div>
        {groupLabel && (
          <span className="text-xs bg-accent/10 text-accent px-1 py-0.5 rounded flex-shrink-0">
            {groupLabel}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromTable(tableId, p.user_id);
          }}
          className="p-1 hover:bg-slate-700 rounded flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    );
  };

  // Render participant card (full version for unassigned list)
  const renderParticipant = (p: ParticipantInfo, tableId?: string) => {
    const isSelected = selectedParticipant === p.user_id;
    const groupSize = groupedParticipations[p.group_id]?.length || 1;
    const groupLabel = groupSize === 2 ? 'ペア' : groupSize >= 3 ? 'グループ' : null;
    const age = calculateAge(p.users.birth_date);
    const personalityLabel = p.users.personality_type ? personalityLabels[p.users.personality_type] || p.users.personality_type : null;
    const isSubscribed = p.users.subscription_status === 'active';
    const moodInfo = p.mood ? moodLabels[p.mood] : null;
    const budgetInfo = p.budget_level ? budgetLabels[p.budget_level] : null;

    // If in a table, use compact version
    if (tableId) {
      return renderParticipantCompact(p, tableId);
    }

    return (
      <div
        key={p.user_id}
        onClick={() => handleMemberClick(p.user_id, tableId)}
        className={`p-3 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-info/20 border-2 border-info'
            : 'bg-slate-800 border border-slate-700 hover:border-slate-500'
        }`}
      >
        <div className="flex items-start gap-3">
          <UserAvatar
            displayName={p.users.display_name}
            avatarUrl={p.users.avatar_url}
            gender={p.users.gender}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">{p.users.display_name}</span>
              {moodInfo && (
                <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded" title={p.mood === 'other' && p.mood_text ? p.mood_text : undefined}>
                  {moodInfo.emoji} {p.mood === 'other' && p.mood_text ? p.mood_text : moodInfo.short}
                </span>
              )}
              {budgetInfo && (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded" title={budgetInfo.label}>
                  {budgetInfo.short}
                </span>
              )}
              {groupLabel && (
                <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                  {groupLabel}
                </span>
              )}
              {isSubscribed && (
                <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
                  有料
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              <span className={p.users.gender === 'male' ? 'text-gender-male' : 'text-gender-female'}>
                {p.users.gender === 'male' ? '男性' : '女性'}
              </span>
              <span className="mx-1">•</span>
              <span>{age}歳</span>
              {p.users.job && (
                <>
                  <span className="mx-1">•</span>
                  <span>{p.users.job}</span>
                </>
              )}
            </div>
            {personalityLabel && (
              <div className="text-xs text-slate-500 mt-1">
                性格: {personalityLabel}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render guest card (compact version for tables)
  const renderGuestCompact = (g: Guest, tableId: string) => {
    const guestFullId = toGuestId(g.id);
    const groupSize = groupedGuests[g.group_id]?.length || 1;
    const groupLabel = groupSize === 2 ? 'ペア' : groupSize >= 3 ? 'グループ' : null;

    return (
      <div
        key={guestFullId}
        className="flex items-center gap-2 p-2 rounded bg-slate-800 border border-slate-700"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
          g.gender === 'male' ? 'bg-gender-male-bg text-gender-male' : 'bg-gender-female-bg text-gender-female'
        }`}>
          {g.gender === 'male' ? '男' : '女'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-white">{g.display_name}</div>
          <div className="text-xs text-slate-400">外部ゲスト</div>
        </div>
        <span className="text-xs bg-warning/10 text-warning px-1 py-0.5 rounded flex-shrink-0">
          外部
        </span>
        {groupLabel && (
          <span className="text-xs bg-accent/10 text-accent px-1 py-0.5 rounded flex-shrink-0">
            {groupLabel}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromTable(tableId, guestFullId);
          }}
          className="p-1 hover:bg-slate-700 rounded flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    );
  };

  // Render guest card (full version for unassigned list)
  const renderGuest = (g: Guest, tableId?: string, showDelete = false) => {
    const guestFullId = toGuestId(g.id);
    const isSelected = selectedParticipant === guestFullId;
    const groupSize = groupedGuests[g.group_id]?.length || 1;
    const groupLabel = groupSize === 2 ? 'ペア' : groupSize >= 3 ? 'グループ' : null;

    // If in a table, use compact version
    if (tableId) {
      return renderGuestCompact(g, tableId);
    }

    return (
      <div
        key={guestFullId}
        onClick={() => handleMemberClick(guestFullId, tableId)}
        className={`p-3 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-info/20 border-2 border-info'
            : 'bg-slate-800 border border-slate-700 hover:border-slate-500'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            g.gender === 'male' ? 'bg-gender-male-bg text-gender-male' : 'bg-gender-female-bg text-gender-female'
          }`}>
            {g.display_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">{g.display_name}</span>
              <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                外部ゲスト
              </span>
              {groupLabel && (
                <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                  {groupLabel}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              <span className={g.gender === 'male' ? 'text-gender-male' : 'text-gender-female'}>
                {g.gender === 'male' ? '男性' : '女性'}
              </span>
            </div>
          </div>
          {showDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGuest(g.id);
              }}
              className="p-1 hover:bg-error/20 rounded text-slate-500 hover:text-error flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render a member in a table (could be user or guest)
  const renderTableMember = (memberId: string, tableId: string) => {
    if (isGuestId(memberId)) {
      const guestId = fromGuestId(memberId);
      const guest = getGuestInfo(guestId);
      return guest ? renderGuest(guest, tableId) : null;
    } else {
      const participant = getParticipantInfo(memberId);
      return participant ? renderParticipant(participant, tableId) : null;
    }
  };

  const totalUnassigned = unassignedParticipants.length + unassignedGuests.length;

  // Calculate statistics for all participants
  const stats = useMemo(() => {
    const allUsers = participations.map(p => p.users);
    const maleUsers = allUsers.filter(u => u.gender === 'male');
    const femaleUsers = allUsers.filter(u => u.gender === 'female');
    const maleGuests = guests.filter(g => g.gender === 'male');
    const femaleGuests = guests.filter(g => g.gender === 'female');

    // Age statistics
    const ages = allUsers.map(u => calculateAge(u.birth_date));
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

    // Personality type breakdown
    const personalityCount: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.personality_type) {
        personalityCount[u.personality_type] = (personalityCount[u.personality_type] || 0) + 1;
      }
    });

    // Job breakdown
    const jobCount: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.job) {
        jobCount[u.job] = (jobCount[u.job] || 0) + 1;
      }
    });

    // Subscription status
    const subscribedCount = allUsers.filter(u => u.subscription_status === 'active').length;

    return {
      totalUsers: participations.length,
      totalGuests: guests.length,
      total: participations.length + guests.length,
      male: maleUsers.length + maleGuests.length,
      female: femaleUsers.length + femaleGuests.length,
      maleUsers: maleUsers.length,
      femaleUsers: femaleUsers.length,
      maleGuests: maleGuests.length,
      femaleGuests: femaleGuests.length,
      avgAge,
      minAge,
      maxAge,
      personalityCount,
      jobCount,
      subscribedCount,
    };
  }, [participations, guests]);

  // Calculate table statistics
  const getTableStats = (table: TableGroup) => {
    let male = 0, female = 0;
    const personalities: string[] = [];
    const ages: number[] = [];

    table.members.forEach(memberId => {
      if (isGuestId(memberId)) {
        const guest = getGuestInfo(fromGuestId(memberId));
        if (guest) {
          if (guest.gender === 'male') male++;
          else female++;
        }
      } else {
        const participant = getParticipantInfo(memberId);
        if (participant) {
          if (participant.users.gender === 'male') male++;
          else female++;
          if (participant.users.personality_type) {
            personalities.push(participant.users.personality_type);
          }
          ages.push(calculateAge(participant.users.birth_date));
        }
      }
    });

    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    return { male, female, personalities, avgAge };
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="glass border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold text-white">
              dine tokyo
            </Link>
            <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Admin
            </span>
          </div>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            loading={saving}
          >
            <Check className="w-4 h-4 mr-2" />
            マッチングを確定
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          イベント一覧へ
        </Link>

        {/* Event info */}
        <Card className="mb-6 glass-card border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">
                  {formatDate(event.event_date)} {formatTime(event.event_date)}
                </h1>
                <p className="text-slate-400 text-sm">{getAreaLabel(event.area)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm px-3 py-1 rounded ${
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
                {event.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    loading={canceling}
                    className="border-error/50 text-error hover:bg-error/10"
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    イベントをキャンセル
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics summary */}
        <Card className="mb-6 glass-card border-slate-700">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3 text-white">参加者サマリー</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              {/* Total */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs">合計</div>
                <div className="text-xl font-bold text-white">{stats.total}人</div>
                <div className="text-xs text-slate-500">
                  登録: {stats.totalUsers} / ゲスト: {stats.totalGuests}
                </div>
              </div>

              {/* Gender */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs">性別</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gender-male font-bold">男 {stats.male}</span>
                  <span className="text-gender-female font-bold">女 {stats.female}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {stats.male > 0 && stats.female > 0 && (
                    <>比率 {(stats.male / stats.female).toFixed(1)}:1</>
                  )}
                </div>
              </div>

              {/* Age */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs">年齢</div>
                <div className="text-xl font-bold text-white">平均 {stats.avgAge}歳</div>
                <div className="text-xs text-slate-500">
                  {stats.minAge}〜{stats.maxAge}歳
                </div>
              </div>

              {/* Subscription */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs">有料会員</div>
                <div className="text-xl font-bold text-success">{stats.subscribedCount}人</div>
                <div className="text-xs text-slate-500">
                  {stats.totalUsers > 0 && (
                    <>{Math.round((stats.subscribedCount / stats.totalUsers) * 100)}%</>
                  )}
                </div>
              </div>

              {/* Personality */}
              <div className="bg-slate-800 rounded-lg p-3 md:col-span-2">
                <div className="text-slate-400 text-xs mb-1">性格タイプ</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.personalityCount).map(([type, count]) => (
                    <span key={type} className="text-xs bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded">
                      {personalityLabels[type] || type}: {count}
                    </span>
                  ))}
                  {Object.keys(stats.personalityCount).length === 0 && (
                    <span className="text-xs text-slate-500">データなし</span>
                  )}
                </div>
              </div>
            </div>

            {/* Job breakdown */}
            {Object.keys(stats.jobCount).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-slate-400 text-xs mb-2">職業</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.jobCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([job, count]) => (
                      <span key={job} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {job} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Split pair errors */}
        {splitPairs.length > 0 && (
          <div className="mb-6 bg-error/10 border border-error/30 rounded-lg p-4">
            <h3 className="font-semibold text-error mb-2">グループ分割エラー</h3>
            <ul className="text-sm text-error space-y-1">
              {splitPairs.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Unassigned participants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                未割当 ({totalUnassigned}人)
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowGuestForm(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                ゲスト追加
              </Button>
            </div>

            {/* Guest form */}
            {showGuestForm && (
              <Card className="mb-4 glass-card border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-white">外部ゲストを追加</p>
                  <Input
                    placeholder="名前"
                    value={newGuest.display_name}
                    onChange={(e) => setNewGuest({ ...newGuest, display_name: e.target.value })}
                  />
                  <Select
                    value={newGuest.gender}
                    onChange={(e) => setNewGuest({ ...newGuest, gender: e.target.value as Gender })}
                    options={[
                      { value: 'male', label: '男性' },
                      { value: 'female', label: '女性' },
                    ]}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddGuest} loading={addingGuest}>
                      追加
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowGuestForm(false)}>
                      キャンセル
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="glass-card border-slate-700">
              <CardContent className="p-4">
                {totalUnassigned === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    全員割当済み
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {/* Registered participants */}
                    {unassignedParticipants.map(p => renderParticipant(p))}

                    {/* External guests */}
                    {unassignedGuests.length > 0 && unassignedParticipants.length > 0 && (
                      <div className="border-t border-slate-700 my-3 pt-3">
                        <p className="text-xs text-slate-400 mb-2">外部ゲスト</p>
                      </div>
                    )}
                    {unassignedGuests.map(g => renderGuest(g, undefined, true))}
                  </div>
                )}
                {selectedParticipant && !assignedIds.has(selectedParticipant) && (
                  <p className="text-xs text-info mt-3 text-center">
                    テーブルをクリックして追加
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-white">
                <Store className="w-5 h-5" />
                テーブル ({tables.length})
              </h2>
              <Button variant="outline" size="sm" onClick={addTable}>
                <Plus className="w-4 h-4 mr-1" />
                テーブル追加
              </Button>
            </div>

            {tables.length === 0 ? (
              <Card className="glass-card border-slate-700">
                <CardContent className="p-8 text-center text-slate-400">
                  <Store className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="mb-4">テーブルがありません</p>
                  <Button onClick={addTable}>
                    <Plus className="w-4 h-4 mr-2" />
                    テーブルを追加
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tables.map((table, idx) => {
                  const validation = getTableValidation(table);
                  const tableStats = getTableStats(table);
                  return (
                    <Card
                      key={table.id}
                      className={`glass-card border-slate-700 ${selectedParticipant && !assignedIds.has(selectedParticipant)
                        ? 'border-info/50 cursor-pointer hover:border-info'
                        : ''
                      }`}
                      onClick={() => {
                        if (selectedParticipant && !assignedIds.has(selectedParticipant)) {
                          addToTable(table.id, selectedParticipant);
                        }
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-white">テーブル {idx + 1}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('このテーブルを削除しますか？')) {
                                removeTable(table.id);
                              }
                            }}
                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3" onClick={e => e.stopPropagation()}>
                        <Input
                          placeholder="お店の名前 *"
                          value={table.restaurant_name}
                          onChange={(e) => updateTable(table.id, 'restaurant_name', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="お店のURL"
                          value={table.restaurant_url}
                          onChange={(e) => updateTable(table.id, 'restaurant_url', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="予約名"
                          value={table.reservation_name}
                          onChange={(e) => updateTable(table.id, 'reservation_name', e.target.value)}
                          className="text-sm"
                        />

                        <div className="border-t border-slate-700 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">
                              メンバー ({table.members.length}/3-8人)
                            </span>
                            {validation && (
                              <span className="text-xs text-warning">{validation}</span>
                            )}
                          </div>

                          {/* Table composition summary */}
                          {table.members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 text-xs">
                              <span className="bg-slate-800 px-2 py-0.5 rounded">
                                <span className="text-gender-male">男{tableStats.male}</span>
                                <span className="mx-1 text-slate-500">/</span>
                                <span className="text-gender-female">女{tableStats.female}</span>
                              </span>
                              {tableStats.avgAge > 0 && (
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  平均{tableStats.avgAge}歳
                                </span>
                              )}
                              {tableStats.personalities.length > 0 && (
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  {[...new Set(tableStats.personalities)].map(p =>
                                    personalityLabels[p]?.charAt(0) || p.charAt(0)
                                  ).join('')}
                                </span>
                              )}
                            </div>
                          )}

                          {table.members.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-2">
                              参加者をクリックして追加
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {table.members.map(memberId => renderTableMember(memberId, table.id))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6 glass-card border-slate-700">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-white">使い方</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• 参加者をクリックして選択し、テーブルをクリックして割り当てます</li>
              <li>• グループで参加している人は一緒に移動します</li>
              <li>• 「ゲスト追加」で登録していない外部参加者を追加できます</li>
              <li>• 各テーブルは3〜8人で構成してください（推奨4〜6人）</li>
              <li>• お店の名前は必須です</li>
              <li>• マッチング確定後、登録ユーザーにはLINE通知が送信されます（外部ゲストには通知されません）</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
