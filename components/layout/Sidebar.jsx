'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell, LayoutDashboard, Users, ShieldCheck, UserRound,
  Wrench, Bell, Settings, FileText, ChevronDown, LogOut,
} from 'lucide-react';
import { logoutAction } from '../../lib/actions/auth';
import { initials } from '../../lib/utils';

const NAV = [
  { label: 'Dashboard',      href: '/dashboard',       icon: LayoutDashboard, group: 'WORKSPACE' },
  { label: 'Members',        href: '/members',          icon: Users,           group: 'WORKSPACE' },
  { label: 'Memberships',    href: '/memberships',      icon: ShieldCheck,     group: 'WORKSPACE' },
  { label: 'Instructors',    href: '/instructors',      icon: UserRound,       group: 'PEOPLE'    },
  { label: 'Equipment',      href: '/equipment',        icon: Wrench,          group: 'MANAGE'    },
  { label: 'Notifications',  href: '/notifications',    icon: Bell,            group: 'MANAGE'    },
  { label: 'Reports',        href: '/reports',          icon: FileText,        group: 'MANAGE'    },
  { label: 'Configurations', href: '/configurations',   icon: Settings,        group: 'MANAGE'    },
];

const GROUPS = ['WORKSPACE', 'PEOPLE', 'MANAGE'];

export default function Sidebar({ admin }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <span className="brand-mark"><Dumbbell size={19} /></span>
        <span>GYM<span className="brand-period">.</span></span>
      </div>

      {/* Location pill */}
      <div className="branch-select">
        <span className="branch-dot" />
        <span>
          <small>LOCATION</small>
          <strong>Main Branch</strong>
        </span>
        <ChevronDown size={15} />
      </div>

      {/* Nav */}
      <nav className="side-nav">
        {GROUPS.map((group) => (
          <div className="nav-group" key={group}>
            <span className="nav-label">{group}</span>
            {NAV.filter((item) => item.group === group).map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={`nav-item ${active ? 'nav-active' : ''}`}>
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <form action={logoutAction}>
          <button type="submit" className="nav-item nav-item-btn">
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </form>
        <div className="profile">
          <div className="profile-avatar">{initials(admin?.name)}</div>
          <span>
            <strong>{admin?.name}</strong>
            <small>{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
