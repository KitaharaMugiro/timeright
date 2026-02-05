'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { ArrowLeft, Plus, X, Users, Store, Check, Trash2, UserPlus, Ban, Bell, Wand2 } from 'lucide-react';
import { ReminderConfirmationDialog } from '@/components/admin/ReminderConfirmationDialog';
import type { Event, Participation, User, Match, Guest, Gender, ParticipationMood, BudgetLevel } from '@/types/database';

// Block relation between users (reviewer blocked target)
interface BlockRelation {
  reviewer_id: string;
  target_user_id: string;
}

interface EventDetailClientProps {
  event: Event;
  participations: (Participation & { users: User })[];
  matches: Match[];
  guests: Guest[];
  blockRelations: BlockRelation[];
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
const budgetLabels: Record<number, { label: string; stars: string; short: string }> = {
  1: { label: 'リーズナブル', stars: '⭐', short: '⭐' },
  2: { label: 'スタンダード', stars: '⭐⭐', short: '⭐⭐' },
  3: { label: 'プレミアム', stars: '⭐⭐⭐', short: '⭐⭐⭐' },
};

export function EventDetailClient({
  event,
  participations,
  matches: initialMatches,
  guests: initialGuests,
  blockRelations,
}: EventDetailClientProps) {
  // Initialize tables from existing matches
  const initialTables: TableGroup[] = initialMatches.map((m, idx) => ({
    id: m.id || `table-${idx}`,
    restaurant_name: m.restaurant_name,
    restaurant_url: m.restaurant_url || '',
    reservation_name: m.reservation_name || '',
    members: m.table_members as string[],
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

  // Reminder dialog state
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderRecipients, setReminderRecipients] = useState<Array<{
    id: string;
    displayName: string;
    hasLineId: boolean;
    isGuest: boolean;
  }>>([]);
  const [reminderStats, setReminderStats] = useState({ total: 0, willReceive: 0, willSkip: 0 });
  const [reminderAlreadySent, setReminderAlreadySent] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

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

  // Check if event is today
  const isEventToday = useMemo(() => {
    const eventDate = new Date(event.event_date);
    const today = new Date();
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  }, [event.event_date]);

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

  // ==========================================================================
  // テーブル割り当て条件
  // ==========================================================================
  //
  // 【必須条件】（自動・手動問わず必ず守るルール）
  // 1. ブロックした人が同じテーブルにいない
  // 2. 友達と参加している人（同じgroup_id）は必ず同じテーブル
  //
  // 【マッチング推奨条件】（自動割り当て時に考慮、UIでも表示）
  // 1. 男女比が1:1に近い
  // 2. 今回のテーブルに求めるmoodがなるべく同じ
  // 3. レストランの価格(budget_level)がなるべく同じ（星1と星3が混ざることは避けたい）
  // 4. 各参加者の性格(personality)の相性がいい
  // ==========================================================================

  // ブロック関係をSetで管理（高速ルックアップ用）
  // 形式: "userId1-userId2" (両方向でチェックするため双方向で登録)
  const blockSet = useMemo(() => {
    const set = new Set<string>();
    blockRelations.forEach(br => {
      // 双方向でブロック関係を登録（どちらがブロックしても同テーブルNG）
      set.add(`${br.reviewer_id}-${br.target_user_id}`);
      set.add(`${br.target_user_id}-${br.reviewer_id}`);
    });
    return set;
  }, [blockRelations]);

  // 【必須条件1】ブロック関係チェック
  // 2人のユーザー間にブロック関係があるかどうかを確認
  const hasBlockRelation = (userId1: string, userId2: string): boolean => {
    return blockSet.has(`${userId1}-${userId2}`);
  };

  // テーブル内にブロック関係があるかチェック
  // ゲストはブロック対象外なのでuser_idのみチェック
  const hasBlockConflictInTable = (memberIds: string[]): boolean => {
    const userIds = memberIds.filter(id => !isGuestId(id));
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        if (hasBlockRelation(userIds[i], userIds[j])) {
          return true; // ブロック関係あり
        }
      }
    }
    return false;
  };

  // 【推奨条件1】男女比スコア計算
  // 1:1に近いほど高スコア（最大100）
  const calculateGenderBalanceScore = (maleCount: number, femaleCount: number): number => {
    const total = maleCount + femaleCount;
    if (total === 0) return 100;
    const ratio = Math.min(maleCount, femaleCount) / Math.max(maleCount, femaleCount);
    return Math.round(ratio * 100);
  };

  // 【推奨条件2】Moodマッチスコア計算
  // 同じmoodが多いほど高スコア（最大100）
  const calculateMoodMatchScore = (memberIds: string[]): number => {
    const moods = memberIds
      .filter(id => !isGuestId(id))
      .map(id => getParticipantInfo(id)?.mood)
      .filter((m): m is ParticipationMood => m !== undefined);

    if (moods.length === 0) return 100;

    // 最も多いmoodの割合を計算
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<ParticipationMood, number>);

    const maxCount = Math.max(...Object.values(moodCounts));
    return Math.round((maxCount / moods.length) * 100);
  };

  // 【推奨条件3】Budget(価格帯)マッチスコア計算
  // 同じ価格帯が多いほど高スコア、差が大きいとペナルティ（最大100）
  const calculateBudgetMatchScore = (memberIds: string[]): number => {
    const budgets = memberIds
      .filter(id => !isGuestId(id))
      .map(id => getParticipantInfo(id)?.budget_level)
      .filter((b): b is number => b !== undefined);

    if (budgets.length === 0) return 100;

    const minBudget = Math.min(...budgets);
    const maxBudget = Math.max(...budgets);
    const budgetRange = maxBudget - minBudget;

    // 星1と星3が混在（差が2）の場合は大きくペナルティ
    if (budgetRange === 2) return 20;
    // 星1つ差の場合は中程度のスコア
    if (budgetRange === 1) return 70;
    // 全員同じ価格帯なら最高スコア
    return 100;
  };

  // 【推奨条件4】性格相性スコア計算
  // 性格タイプの組み合わせに基づいてスコアを計算（最大100）
  // 相性の良い組み合わせ: Leader-Supporter, Analyst-Entertainer
  // バランスが取れている（多様性がある）と高スコア
  const calculatePersonalityScore = (memberIds: string[]): number => {
    const personalities = memberIds
      .filter(id => !isGuestId(id))
      .map(id => getParticipantInfo(id)?.users.personality_type)
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

    if (personalities.length <= 1) return 100;

    // 性格タイプのカウント
    const typeCounts: Record<string, number> = {};
    for (const type of personalities) {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    // 多様性スコア（異なる性格タイプが多いほど高い）
    const uniqueTypes = Object.keys(typeCounts).length;
    const diversityScore = (uniqueTypes / 4) * 50; // 最大50点

    // 相性ボーナス
    let compatibilityBonus = 0;
    // Leader + Supporter の組み合わせがあればボーナス
    if (typeCounts['Leader'] && typeCounts['Supporter']) {
      compatibilityBonus += 25;
    }
    // Analyst + Entertainer の組み合わせがあればボーナス
    if (typeCounts['Analyst'] && typeCounts['Entertainer']) {
      compatibilityBonus += 25;
    }

    return Math.min(100, Math.round(diversityScore + compatibilityBonus));
  };

  // 【推奨条件5】本人確認マッチスコア計算
  // 本人確認済みの人同士が同じテーブルにいるほど高スコア（最大100）
  // 本人確認済みの人が未確認の人と混在すると低スコア
  const calculateVerificationMatchScore = (memberIds: string[]): number => {
    const verificationStatuses = memberIds
      .filter(id => !isGuestId(id))
      .map(id => getParticipantInfo(id)?.users.is_identity_verified)
      .filter((v): v is boolean => v !== undefined);

    if (verificationStatuses.length === 0) return 100;

    const verifiedCount = verificationStatuses.filter(v => v).length;
    const unverifiedCount = verificationStatuses.filter(v => !v).length;

    // 全員が同じステータス（全員確認済み or 全員未確認）なら100点
    if (verifiedCount === 0 || unverifiedCount === 0) return 100;

    // 本人確認済みの人が多い場合、未確認の人が混じると減点
    // 本人確認済み率が高いほどスコアが高い
    const verifiedRatio = verifiedCount / verificationStatuses.length;
    return Math.round(verifiedRatio * 100);
  };

  // テーブル全体の推奨スコアを計算（0-100）
  const calculateTableRecommendationScore = (memberIds: string[]): {
    total: number;
    genderBalance: number;
    moodMatch: number;
    budgetMatch: number;
    personality: number;
    verificationMatch: number;
    hasBlockConflict: boolean;
  } => {
    const userIds = memberIds.filter(id => !isGuestId(id));
    const users = userIds.map(id => getParticipantInfo(id)).filter((p): p is ParticipantInfo => p !== undefined);
    const guestIds = memberIds.filter(id => isGuestId(id));
    const guestList = guestIds.map(id => getGuestInfo(fromGuestId(id))).filter((g): g is Guest => g !== undefined);

    const maleCount = users.filter(u => u.users.gender === 'male').length +
                      guestList.filter(g => g.gender === 'male').length;
    const femaleCount = users.filter(u => u.users.gender === 'female').length +
                        guestList.filter(g => g.gender === 'female').length;

    const genderBalance = calculateGenderBalanceScore(maleCount, femaleCount);
    const moodMatch = calculateMoodMatchScore(memberIds);
    const budgetMatch = calculateBudgetMatchScore(memberIds);
    const personality = calculatePersonalityScore(memberIds);
    const verificationMatch = calculateVerificationMatchScore(memberIds);
    const hasBlockConflict = hasBlockConflictInTable(memberIds);

    // 総合スコア（各項目を均等に加重）
    // ブロック関係がある場合は0点
    const total = hasBlockConflict ? 0 : Math.round((genderBalance + moodMatch + budgetMatch + personality + verificationMatch) / 5);

    return { total, genderBalance, moodMatch, budgetMatch, personality, verificationMatch, hasBlockConflict };
  };

  // Auto-assign participants to tables
  // ==========================================================================
  // 自動割り当てアルゴリズム
  //
  // 【必須条件】を満たしながら【推奨条件】のスコアが最大化するように割り当て
  //
  // 1. 全グループを収集（友達参加は同じgroup_idで管理 → 必須条件2を自動的に満たす）
  // 2. ブロック関係のあるグループ同士を特定
  // 3. 各テーブルにグループを割り当てる際:
  //    - 必須条件1: ブロック関係がないかチェック
  //    - 推奨条件: スコアが最大化するテーブルを選択
  // ==========================================================================
  const autoAssign = () => {
    // グループ情報の拡張インターフェース
    interface GroupInfo {
      groupId: string;
      memberIds: string[]; // user_id or guest:guest_id
      maleCount: number;
      femaleCount: number;
      size: number;
      // 推奨条件用の追加情報
      moods: ParticipationMood[];       // グループメンバーのmood一覧
      budgetLevels: number[];           // グループメンバーのbudget_level一覧
      personalityTypes: string[];       // グループメンバーの性格タイプ一覧
      verifiedCount: number;            // 本人確認済みの人数
      userIds: string[];                // ブロックチェック用（ゲスト除外）
    }

    const groups: GroupInfo[] = [];

    // Process registered participants
    // 【必須条件2】友達と参加している人は同じgroup_idでグループ化されている
    for (const [groupId, members] of Object.entries(groupedParticipations)) {
      const maleCount = members.filter(m => m.users.gender === 'male').length;
      const femaleCount = members.filter(m => m.users.gender === 'female').length;
      const verifiedCount = members.filter(m => m.users.is_identity_verified).length;
      groups.push({
        groupId,
        memberIds: members.map(m => m.user_id),
        maleCount,
        femaleCount,
        size: members.length,
        moods: members.map(m => m.mood),
        budgetLevels: members.map(m => m.budget_level),
        personalityTypes: members.map(m => m.users.personality_type).filter((p): p is NonNullable<typeof p> => p !== null),
        verifiedCount,
        userIds: members.map(m => m.user_id),
      });
    }

    // Process guests (ゲストはブロック対象外、本人確認も対象外)
    for (const [groupId, members] of Object.entries(groupedGuests)) {
      const maleCount = members.filter(g => g.gender === 'male').length;
      const femaleCount = members.filter(g => g.gender === 'female').length;
      groups.push({
        groupId,
        memberIds: members.map(g => toGuestId(g.id)),
        maleCount,
        femaleCount,
        size: members.length,
        moods: [],
        budgetLevels: [],
        personalityTypes: [],
        verifiedCount: 0, // ゲストは本人確認対象外
        userIds: [], // ゲストはブロックチェック対象外
      });
    }

    if (groups.length === 0) return;

    // 【必須条件1】グループ間のブロック関係をマッピング
    // どのグループ同士が同じテーブルに配置できないかを事前計算
    const groupBlockMap = new Map<string, Set<string>>();
    for (const group of groups) {
      groupBlockMap.set(group.groupId, new Set());
    }

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const groupA = groups[i];
        const groupB = groups[j];
        // 両グループのユーザー間にブロック関係があるかチェック
        let hasBlock = false;
        for (const userA of groupA.userIds) {
          for (const userB of groupB.userIds) {
            if (hasBlockRelation(userA, userB)) {
              hasBlock = true;
              break;
            }
          }
          if (hasBlock) break;
        }
        if (hasBlock) {
          groupBlockMap.get(groupA.groupId)?.add(groupB.groupId);
          groupBlockMap.get(groupB.groupId)?.add(groupA.groupId);
        }
      }
    }

    // Calculate total people
    const totalPeople = groups.reduce((sum, g) => sum + g.size, 0);

    // Calculate optimal number of tables (target 5 people per table, min 3, max 8)
    const targetPerTable = 5;
    let numTables = Math.round(totalPeople / targetPerTable);
    numTables = Math.max(1, numTables); // At least 1 table

    // Ensure we can fit everyone (max 8 per table)
    while (numTables * 8 < totalPeople) {
      numTables++;
    }

    // Ensure tables aren't too empty (min 3 per table if possible)
    while (numTables > 1 && totalPeople / numTables < 3) {
      numTables--;
    }

    // Create empty tables
    const newTables: TableGroup[] = Array.from({ length: numTables }, (_, i) => ({
      id: `auto-${Date.now()}-${i}`,
      restaurant_name: '',
      restaurant_url: '',
      reservation_name: '',
      members: [],
    }));

    // テーブルごとの統計情報（推奨条件スコア計算用）
    interface TableStats {
      male: number;
      female: number;
      total: number;
      moods: ParticipationMood[];
      budgetLevels: number[];
      personalityTypes: string[];
      verifiedCount: number;          // 本人確認済みの人数
      assignedGroupIds: Set<string>;  // 【必須条件1】ブロックチェック用
    }
    const tableStats: TableStats[] = newTables.map(() => ({
      male: 0,
      female: 0,
      total: 0,
      moods: [],
      budgetLevels: [],
      personalityTypes: [],
      verifiedCount: 0,
      assignedGroupIds: new Set(),
    }));

    // Sort groups: larger groups first (harder to place), then by count
    const sortedGroups = [...groups].sort((a, b) => {
      // Larger groups first (harder to place)
      if (b.size !== a.size) return b.size - a.size;
      // Then by total count
      return (b.maleCount + b.femaleCount) - (a.maleCount + a.femaleCount);
    });

    // ==========================================================================
    // グループをテーブルに割り当て
    // 【必須条件1】ブロック関係がないテーブルのみ候補
    // 【推奨条件】スコアが最大化するテーブルを選択
    // ==========================================================================
    for (const group of sortedGroups) {
      // Find the best table for this group
      let bestTableIdx = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < newTables.length; i++) {
        const stats = tableStats[i];
        const newTotal = stats.total + group.size;

        // Skip if would exceed max size
        if (newTotal > 8) continue;

        // 【必須条件1】ブロック関係チェック
        // このテーブルに既に割り当てられているグループとブロック関係がないかチェック
        const blockedGroups = groupBlockMap.get(group.groupId) || new Set();
        let hasBlockConflict = false;
        for (const assignedGroupId of stats.assignedGroupIds) {
          if (blockedGroups.has(assignedGroupId)) {
            hasBlockConflict = true;
            break;
          }
        }
        // ブロック関係があるテーブルはスキップ
        if (hasBlockConflict) continue;

        // ==========================================================================
        // 【推奨条件】スコア計算
        // ==========================================================================

        // 【推奨条件1】男女比スコア（1:1に近いほど高スコア）
        const newMale = stats.male + group.maleCount;
        const newFemale = stats.female + group.femaleCount;
        const genderBalanceScore = calculateGenderBalanceScore(newMale, newFemale);

        // 【推奨条件2】Moodマッチスコア
        const newMoods = [...stats.moods, ...group.moods];
        let moodScore = 100;
        if (newMoods.length > 0) {
          const moodCounts = newMoods.reduce((acc, mood) => {
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
          }, {} as Record<ParticipationMood, number>);
          const maxMoodCount = Math.max(...Object.values(moodCounts));
          moodScore = Math.round((maxMoodCount / newMoods.length) * 100);
        }

        // 【推奨条件3】Budget(価格帯)マッチスコア
        const newBudgets = [...stats.budgetLevels, ...group.budgetLevels];
        let budgetScore = 100;
        if (newBudgets.length > 0) {
          const minBudget = Math.min(...newBudgets);
          const maxBudget = Math.max(...newBudgets);
          const budgetRange = maxBudget - minBudget;
          if (budgetRange === 2) budgetScore = 20;       // 星1と星3混在 = NG
          else if (budgetRange === 1) budgetScore = 70;  // 1つ差 = 中程度
          else budgetScore = 100;                         // 同じ = OK
        }

        // 【推奨条件4】性格相性スコア
        const newPersonalities = [...stats.personalityTypes, ...group.personalityTypes];
        let personalityScore = 100;
        if (newPersonalities.length > 1) {
          const typeCounts = newPersonalities.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const uniqueTypes = Object.keys(typeCounts).length;
          const diversityScore = (uniqueTypes / 4) * 50;
          let compatibilityBonus = 0;
          if (typeCounts['Leader'] && typeCounts['Supporter']) compatibilityBonus += 25;
          if (typeCounts['Analyst'] && typeCounts['Entertainer']) compatibilityBonus += 25;
          personalityScore = Math.min(100, Math.round(diversityScore + compatibilityBonus));
        }

        // 【推奨条件5】本人確認マッチスコア
        // 本人確認済みの人同士、未確認の人同士がグループになるほど高スコア
        const newVerifiedCount = stats.verifiedCount + group.verifiedCount;
        const newUnverifiedCount = (stats.total + group.size) - newVerifiedCount;
        let verificationScore = 100;
        if (newVerifiedCount > 0 && newUnverifiedCount > 0) {
          // 混在している場合、本人確認済みの割合でスコア計算
          verificationScore = Math.round((newVerifiedCount / (stats.total + group.size)) * 100);
        }

        // テーブルサイズのバランススコア（空いているテーブルを優先）
        const sizeBalanceScore = (8 - stats.total) * 5;

        // 総合スコア計算（推奨条件を均等に加重 + サイズバランス）
        const totalScore = genderBalanceScore + moodScore + budgetScore + personalityScore + verificationScore + sizeBalanceScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestTableIdx = i;
        }
      }

      // 【フォールバック】全テーブルがブロック関係で不可の場合、最も空いているテーブルを選択
      if (bestTableIdx === -1) {
        let minOccupancy = Infinity;
        for (let i = 0; i < newTables.length; i++) {
          if (tableStats[i].total + group.size <= 8 && tableStats[i].total < minOccupancy) {
            minOccupancy = tableStats[i].total;
            bestTableIdx = i;
          }
        }
        // それでも見つからない場合はテーブルを追加
        if (bestTableIdx === -1) {
          bestTableIdx = newTables.length;
          newTables.push({
            id: `auto-${Date.now()}-overflow-${bestTableIdx}`,
            restaurant_name: '',
            restaurant_url: '',
            reservation_name: '',
            members: [],
          });
          tableStats.push({
            male: 0,
            female: 0,
            total: 0,
            moods: [],
            budgetLevels: [],
            personalityTypes: [],
            verifiedCount: 0,
            assignedGroupIds: new Set(),
          });
        }
      }

      // Assign group to best table
      newTables[bestTableIdx].members.push(...group.memberIds);
      tableStats[bestTableIdx].male += group.maleCount;
      tableStats[bestTableIdx].female += group.femaleCount;
      tableStats[bestTableIdx].total += group.size;
      tableStats[bestTableIdx].moods.push(...group.moods);
      tableStats[bestTableIdx].budgetLevels.push(...group.budgetLevels);
      tableStats[bestTableIdx].personalityTypes.push(...group.personalityTypes);
      tableStats[bestTableIdx].verifiedCount += group.verifiedCount;
      tableStats[bestTableIdx].assignedGroupIds.add(group.groupId);
    }

    // Remove empty tables
    const nonEmptyTables = newTables.filter(t => t.members.length > 0);

    // If all tables are empty, something went wrong
    if (nonEmptyTables.length === 0) {
      alert('自動割り当てに失敗しました');
      return;
    }

    setTables(nonEmptyTables);
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
    // 【必須条件2】Check for split pairs (友達と参加している人は同じテーブル)
    if (splitPairs.length > 0) return false;

    for (const table of tables) {
      // 【必須条件1】ブロック関係チェック
      if (hasBlockConflictInTable(table.members)) return false;
      if (!table.restaurant_name.trim()) return false;
      if (table.members.length < 3) return false;
      if (table.members.length > 8) return false;
    }
    return tables.length > 0;
  }, [tables, splitPairs, hasBlockConflictInTable]);

  // Get validation messages
  // 【必須条件】のバリデーション
  // ブロック関係がある場合はエラーとして表示
  const getTableValidation = (table: TableGroup): { message: string; isBlockError: boolean } | null => {
    // 【必須条件1】ブロック関係チェック
    if (hasBlockConflictInTable(table.members)) {
      return { message: '⚠️ ブロック関係のあるユーザーがいます', isBlockError: true };
    }
    if (!table.restaurant_name.trim()) return { message: 'お店を入力してください', isBlockError: false };
    if (table.members.length < 3) return { message: `${3 - table.members.length}人以上追加してください`, isBlockError: false };
    if (table.members.length > 8) return { message: `最大8人までです（現在${table.members.length}人）`, isBlockError: false };
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

  // Open reminder dialog and fetch recipients
  const handleOpenReminderDialog = async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch(`/api/admin/events/${event.id}/reminder`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recipients');
      }

      setReminderRecipients(data.recipients);
      setReminderStats(data.stats);
      setReminderAlreadySent(data.reminderAlreadySent);
      setShowReminderDialog(true);
    } catch (error) {
      console.error('Fetch recipients error:', error);
      alert('送信先の取得に失敗しました');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Send reminder notifications
  const handleSendReminder = async () => {
    const response = await fetch(`/api/admin/events/${event.id}/reminder`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reminder');
    }

    alert(`リマインダーを送信しました。\n送信: ${data.notifications.sent}件\n失敗: ${data.notifications.failed}件\nスキップ: ${data.notifications.skipped}件`);
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
  // テーブルの統計情報と【推奨条件】スコアを取得
  const getTableStats = (table: TableGroup) => {
    let male = 0, female = 0;
    const personalities: string[] = [];
    const ages: number[] = [];
    const moods: ParticipationMood[] = [];
    const budgets: number[] = [];

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
          moods.push(participant.mood);
          budgets.push(participant.budget_level);
        }
      }
    });

    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    // 【推奨条件】スコア計算
    const recommendationScore = table.members.length > 0
      ? calculateTableRecommendationScore(table.members)
      : { total: 100, genderBalance: 100, moodMatch: 100, budgetMatch: 100, personality: 100, verificationMatch: 100, hasBlockConflict: false };

    // Mood分布（最も多いmoodを表示用に）
    const moodCounts = moods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<ParticipationMood, number>);
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ParticipationMood | undefined;

    // Budget分布
    const minBudget = budgets.length > 0 ? Math.min(...budgets) : 0;
    const maxBudget = budgets.length > 0 ? Math.max(...budgets) : 0;
    const budgetRange = maxBudget - minBudget;

    // 本人確認済みの人数
    const verifiedCount = table.members
      .filter(id => !isGuestId(id))
      .filter(id => getParticipantInfo(id)?.users.is_identity_verified)
      .length;
    const userCount = table.members.filter(id => !isGuestId(id)).length;

    return {
      male,
      female,
      personalities,
      avgAge,
      recommendationScore,
      dominantMood,
      budgetRange,
      moods,
      budgets,
      verifiedCount,
      userCount,
    };
  };

  return (
    <AdminLayout>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          イベント一覧へ
        </Link>
        <Button
          onClick={handleSave}
          disabled={!isValid}
          loading={saving}
        >
          <Check className="w-4 h-4 mr-2" />
          マッチングを確定
        </Button>
      </div>

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
                {event.status === 'matched' && isEventToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenReminderDialog}
                    loading={loadingRecipients}
                    className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    リマインダー送信
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (tables.length > 0 && !confirm('現在のテーブル設定をリセットして自動割り当てしますか？')) {
                      return;
                    }
                    autoAssign();
                  }}
                  disabled={participations.length + guests.length === 0}
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  自動割り当て
                </Button>
                <Button variant="outline" size="sm" onClick={addTable}>
                  <Plus className="w-4 h-4 mr-1" />
                  テーブル追加
                </Button>
              </div>
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
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">テーブル {idx + 1}</span>
                            {/* 【推奨条件】総合スコア表示 */}
                            {table.members.length > 0 && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  tableStats.recommendationScore.hasBlockConflict
                                    ? 'bg-error/20 text-error'
                                    : tableStats.recommendationScore.total >= 70
                                    ? 'bg-success/20 text-success'
                                    : tableStats.recommendationScore.total >= 50
                                    ? 'bg-warning/20 text-warning'
                                    : 'bg-slate-700 text-slate-400'
                                }`}
                                title={`男女比:${tableStats.recommendationScore.genderBalance}% Mood:${tableStats.recommendationScore.moodMatch}% 価格帯:${tableStats.recommendationScore.budgetMatch}% 性格:${tableStats.recommendationScore.personality}% 本人確認:${tableStats.recommendationScore.verificationMatch}%`}
                              >
                                {tableStats.recommendationScore.hasBlockConflict ? '⚠️' : `${tableStats.recommendationScore.total}点`}
                              </span>
                            )}
                          </div>
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
                              <span className={`text-xs ${validation.isBlockError ? 'text-error font-semibold' : 'text-warning'}`}>
                                {validation.message}
                              </span>
                            )}
                          </div>

                          {/* Table composition summary */}
                          {table.members.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 text-xs">
                              {/* 男女比 */}
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  tableStats.recommendationScore.genderBalance >= 80
                                    ? 'bg-success/20 text-success'
                                    : tableStats.recommendationScore.genderBalance >= 50
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-warning/20 text-warning'
                                }`}
                                title={`男女比スコア: ${tableStats.recommendationScore.genderBalance}%`}
                              >
                                <span className="text-gender-male">男{tableStats.male}</span>
                                <span className="mx-1 text-slate-500">/</span>
                                <span className="text-gender-female">女{tableStats.female}</span>
                              </span>

                              {/* 平均年齢 */}
                              {tableStats.avgAge > 0 && (
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  {tableStats.avgAge}歳
                                </span>
                              )}

                              {/* Mood - 推奨条件2 */}
                              {tableStats.dominantMood && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    tableStats.recommendationScore.moodMatch >= 80
                                      ? 'bg-success/20 text-success'
                                      : tableStats.recommendationScore.moodMatch >= 50
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'bg-warning/20 text-warning'
                                  }`}
                                  title={`Moodマッチ: ${tableStats.recommendationScore.moodMatch}%`}
                                >
                                  {moodLabels[tableStats.dominantMood]?.emoji}
                                </span>
                              )}

                              {/* Budget - 推奨条件3 */}
                              {tableStats.budgets.length > 0 && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    tableStats.budgetRange === 0
                                      ? 'bg-success/20 text-success'
                                      : tableStats.budgetRange === 1
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'bg-error/20 text-error'
                                  }`}
                                  title={`価格帯マッチ: ${tableStats.recommendationScore.budgetMatch}%${tableStats.budgetRange === 2 ? ' (星1と星3が混在)' : ''}`}
                                >
                                  {tableStats.budgetRange === 0 ? budgetLabels[tableStats.budgets[0]]?.short :
                                   tableStats.budgetRange === 2 ? '⭐~⭐⭐⭐' : '⭐~⭐⭐'}
                                </span>
                              )}

                              {/* Personality - 推奨条件4 */}
                              {tableStats.personalities.length > 0 && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    tableStats.recommendationScore.personality >= 70
                                      ? 'bg-success/20 text-success'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                  title={`性格相性: ${tableStats.recommendationScore.personality}%`}
                                >
                                  {[...new Set(tableStats.personalities)].map(p =>
                                    personalityLabels[p]?.charAt(0) || p.charAt(0)
                                  ).join('')}
                                </span>
                              )}

                              {/* 本人確認 - 推奨条件5 */}
                              {tableStats.userCount > 0 && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    tableStats.recommendationScore.verificationMatch >= 100
                                      ? 'bg-success/20 text-success'
                                      : tableStats.recommendationScore.verificationMatch >= 70
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'bg-warning/20 text-warning'
                                  }`}
                                  title={`本人確認マッチ: ${tableStats.recommendationScore.verificationMatch}% (${tableStats.verifiedCount}/${tableStats.userCount}人確認済み)`}
                                >
                                  ✓{tableStats.verifiedCount}
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
              <li>• <strong className="text-info">自動割り当て</strong>：下記の条件を考慮して自動でテーブルに振り分けます</li>
              <li>• 参加者をクリックして選択し、テーブルをクリックして手動で割り当てることもできます</li>
              <li>• グループで参加している人は一緒に移動します</li>
              <li>• 「ゲスト追加」で登録していない外部参加者を追加できます</li>
              <li>• 各テーブルは3〜8人で構成してください（推奨4〜6人）</li>
              <li>• お店の名前は必須です</li>
              <li>• マッチング確定後、登録ユーザーにはLINE通知が送信されます（外部ゲストには通知されません）</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2 text-white text-sm">テーブル割り当て条件</h4>
            <div className="text-sm text-slate-400 space-y-2">
              <div>
                <span className="text-error font-medium">【必須条件】</span>
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>• ブロックした人が同じテーブルにいない</li>
                  <li>• 友達と参加している人は必ず同じテーブル</li>
                </ul>
              </div>
              <div>
                <span className="text-info font-medium">【推奨条件】</span>（スコア表示）
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>• <span className="text-gender-male">男</span>/<span className="text-gender-female">女</span>：男女比が1:1に近い</li>
                  <li>• 🎉☕💡：今回求めるムードがなるべく同じ</li>
                  <li>• ⭐：レストランの価格帯がなるべく同じ</li>
                  <li>• 性格：参加者の性格(personality)の相性がいい</li>
                  <li>• ✓：本人確認済みの人同士がなるべく同じテーブル</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder Confirmation Dialog */}
        <ReminderConfirmationDialog
          isOpen={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
          onConfirm={handleSendReminder}
          recipients={reminderRecipients}
          stats={reminderStats}
          reminderAlreadySent={reminderAlreadySent}
        />
    </AdminLayout>
  );
}
