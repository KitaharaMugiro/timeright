'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Star, TrendingUp, Gamepad2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'イベント管理', icon: Calendar },
  { href: '/admin/reviews', label: 'レビュー管理', icon: Star },
  { href: '/admin/kpi', label: 'KPI', icon: TrendingUp },
  { href: '/admin/icebreaker', label: 'アイスブレイク', icon: Gamepad2 },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname.startsWith('/admin/events');
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="glass border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-white">
                Dine Tokyo<span className="text-sm">(ダイントーキョー)</span>
              </Link>
              <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded">
                Admin
              </span>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex gap-1 -mb-px">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active
                      ? 'border-rose-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
