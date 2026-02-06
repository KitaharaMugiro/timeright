import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { IcebreakerAdminClient } from './client';
import type {
  IcebreakerQuestion,
  IcebreakerWouldYouRather,
  IcebreakerWordWolf,
  IcebreakerCommonThings,
  IcebreakerNgWord,
  IcebreakerNgWordTopic,
} from '@/types/database';

export default async function IcebreakerAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/line?redirect=/admin/icebreaker');
  }

  if (!user.is_admin) {
    redirect('/');
  }

  const supabase = await createServiceClient();

  // 全データを並行取得
  const [questionsRes, wyrRes, wordWolfRes, commonThingsRes, ngWordRes, ngWordTopicsRes] = await Promise.all([
    supabase.from('icebreaker_questions').select('*').order('created_at', { ascending: false }),
    supabase.from('icebreaker_would_you_rather').select('*').order('created_at', { ascending: false }),
    supabase.from('icebreaker_word_wolf').select('*').order('created_at', { ascending: false }),
    supabase.from('icebreaker_common_things').select('*').order('created_at', { ascending: false }),
    supabase.from('icebreaker_ng_word').select('*').order('created_at', { ascending: false }),
    supabase.from('icebreaker_ng_word_topics').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <IcebreakerAdminClient
      questions={(questionsRes.data || []) as IcebreakerQuestion[]}
      wouldYouRather={(wyrRes.data || []) as IcebreakerWouldYouRather[]}
      wordWolf={(wordWolfRes.data || []) as IcebreakerWordWolf[]}
      commonThings={(commonThingsRes.data || []) as IcebreakerCommonThings[]}
      ngWord={(ngWordRes.data || []) as IcebreakerNgWord[]}
      ngWordTopics={(ngWordTopicsRes.data || []) as IcebreakerNgWordTopic[]}
    />
  );
}
