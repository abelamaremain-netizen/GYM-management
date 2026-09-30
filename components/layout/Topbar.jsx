import Link from 'next/link';
import { Bell, CalendarDays, Menu } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabase';
import { initials } from '../../lib/utils';

async function getUnreadCount() {
  if (!supabaseAdmin) return 0;
  const { count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  return count || 0;
}

export default async function Topbar({ admin }) {
  const unread = await getUnreadCount();
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile hamburger — uses inline script to avoid client component overhead */}
        <button
          className="icon-button menu-trigger"
          aria-label="Open navigation"
          onClick={undefined}
          id="hamburger-btn"
        >
          <Menu size={20} />
        </button>
        <div className="breadcrumbs">
          <span>Gym Management</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="today-pill">
          <CalendarDays size={15} />
          {today}
        </div>
        <Link href="/notifications" className="icon-button notification-button" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && <i className="notif-badge">{unread > 9 ? '9+' : unread}</i>}
        </Link>
        <div className="top-avatar">{initials(admin?.name)}</div>
      </div>
      {/* Inline script to wire hamburger without a client component */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('hamburger-btn')?.addEventListener('click', function() {
          var s = document.getElementById('app-sidebar');
          var m = document.getElementById('mobile-scrim');
          if (s) s.classList.toggle('sidebar-open');
          if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
        });
      ` }} />
    </header>
  );
}
