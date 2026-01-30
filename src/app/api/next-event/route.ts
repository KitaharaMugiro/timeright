import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAreaLabel } from '@/lib/utils';

export async function GET() {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + 2);
  cutoffDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('events')
    .select('area, event_date')
    .eq('status', 'open')
    .gte('event_date', cutoffDate.toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .returns<{ area: string; event_date: string }[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ nextEvent: null });
  }

  const event = data[0];
  const eventDate = new Date(event.event_date);
  const month = eventDate.getMonth() + 1;
  const day = eventDate.getDate();
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][eventDate.getDay()];

  return NextResponse.json({
    nextEvent: {
      area: getAreaLabel(event.area),
      date: `${month}/${day}(${weekday})`,
    },
  });
}
