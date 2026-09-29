'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowUpRight, BadgeDollarSign, Bell, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Dumbbell, Ellipsis,
  FileText, Filter, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck,
  UserRound, UserRoundPlus, Users, Wallet, X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const demoData = {
  members: [
    { id: 'FG-2048', full_name: 'Olivia Rhye', email: 'olivia.rhye@email.com', phone: '+1 (555) 012-3847', plan: 'Performance', status: 'Active', joined_at: '2026-06-14', expires_at: '2026-10-14' },
    { id: 'FG-2047', full_name: 'Phoenix Baker', email: 'phoenix.baker@email.com', phone: '+1 (555) 014-2839', plan: 'Essential', status: 'Active', joined_at: '2026-06-12', expires_at: '2026-10-12' },
    { id: 'FG-2046', full_name: 'Lana Steiner', email: 'lana.steiner@email.com', phone: '+1 (555) 016-4920', plan: 'Unlimited', status: 'Active', joined_at: '2026-06-11', expires_at: '2026-10-11' },
    { id: 'FG-2045', full_name: 'Demi Wilkinson', email: 'demi.wilkinson@email.com', phone: '+1 (555) 018-5571', plan: 'Essential', status: 'Expired', joined_at: '2026-06-08', expires_at: '2026-09-20' },
    { id: 'FG-2044', full_name: 'Candice Wu', email: 'candice.wu@email.com', phone: '+1 (555) 019-7364', plan: 'Performance', status: 'Active', joined_at: '2026-06-06', expires_at: '2026-10-06' },
    { id: 'FG-2043', full_name: 'Natali Craig', email: 'natali.craig@email.com', phone: '+1 (555) 010-9225', plan: 'Essential', status: 'Active', joined_at: '2026-06-04', expires_at: '2026-10-04' },
  ],
  trainers: [
    { id: 't1', full_name: 'Marcus Chen', specialty: 'Strength & conditioning', members: 18, status: 'Available', initials: 'MC' },
    { id: 't2', full_name: 'Ava Thompson', specialty: 'Mobility & recovery', members: 14, status: 'In session', initials: 'AT' },
    { id: 't3', full_name: 'Jordan Lee', specialty: 'Performance training', members: 21, status: 'Available', initials: 'JL' },
  ],
  payments: [
    { id: 'p1', member_name: 'Olivia Rhye', description: 'Performance · Monthly', amount: 89, status: 'Paid', paid_at: '2026-09-28', method: 'Card' },
    { id: 'p2', member_name: 'Phoenix Baker', description: 'Essential · Monthly', amount: 49, status: 'Paid', paid_at: '2026-09-27', method: 'Bank transfer' },
    { id: 'p3', member_name: 'Lana Steiner', description: 'Unlimited · Monthly', amount: 129, status: 'Paid', paid_at: '2026-09-27', method: 'Card' },
    { id: 'p4', member_name: 'Candice Wu', description: 'Performance · Monthly', amount: 89, status: 'Pending', paid_at: '2026-09-26', method: 'Cash' },
  ],
  attendance: [
    { id: 'a1', member_name: 'Olivia Rhye', time: '08:42 AM', type: 'Check in' },
    { id: 'a2', member_name: 'Marcus Chen', time: '08:31 AM', type: 'Check in' },
    { id: 'a3', member_name: 'Phoenix Baker', time: '08:16 AM', type: 'Check in' },
    { id: 'a4', member_name: 'Lana Steiner', time: '07:58 AM', type: 'Check in' },
  ],
  workouts: [
    { id: 'w1', name: 'Foundations: Full body', category: 'Strength', duration: '45 min', assignments: 12, trainer: 'Marcus Chen' },
    { id: 'w2', name: 'Mobility reset', category: 'Recovery', duration: '30 min', assignments: 8, trainer: 'Ava Thompson' },
    { id: 'w3', name: 'Engine builder', category: 'Conditioning', duration: '50 min', assignments: 16, trainer: 'Jordan Lee' },
  ],
};

const nav = [
  ['Overview', LayoutDashboard, 'WORKSPACE'], ['Members', Users, 'WORKSPACE'],
  ['Memberships', ShieldCheck, 'WORKSPACE'], ['Payments', Wallet, 'WORKSPACE'],
  ['Attendance', CalendarDays, 'WORKSPACE'], ['Trainers', UserRound, 'PEOPLE'],
  ['Workouts', Dumbbell, 'PEOPLE'], ['Reports', FileText, 'MANAGE'],
];

const titles = {
  Overview: 'Good morning, Alex', Members: 'Members', Memberships: 'Memberships',
  Payments: 'Payments', Attendance: 'Attendance', Trainers: 'Trainers',
  Workouts: 'Workout plans', Reports: 'Reports & analytics',
};

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function dateLabel(value) {
  if (!value) return 'Today';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function Avatar({ name }) {
  const color = (name?.charCodeAt(0) || 65) % 5;
  return <span className={`member-avatar avatar-${color}`}>{initials(name)}</span>;
}

function IconButton({ label, children, onClick, className = '' }) {
  return <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function StatCard({ label, value, change, sub, icon: Icon, color, live }) {
  return <article className="stat-card"><div className={`stat-icon icon-${color}`}><Icon size={19} /></div><div className="stat-content"><span className="stat-label">{label}</span><div className="stat-value-row"><strong>{value}</strong><span className={live ? 'live-tag' : 'stat-change'}>{live ? <><i />{change}</> : <><ArrowUpRight size={12} />{change}</>}</span></div><small>{sub}</small></div></article>;
}

function MemberTable({ members, compact = false }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>MEMBER</th><th>MEMBER ID</th><th>PLAN</th><th>JOINED</th><th>STATUS</th>{!compact && <th>EXPIRES</th>}</tr></thead><tbody>{members.map((member) => <tr key={member.id}><td><div className="member-cell"><Avatar name={member.full_name} /><span><strong>{member.full_name}</strong><small>{member.email}</small></span></div></td><td className="muted-cell">{member.id}</td><td><span className="plan-pill">{member.plan}</span></td><td className="muted-cell">{dateLabel(member.joined_at)}</td><td><span className={`status-pill ${member.status === 'Active' ? 'status-active' : 'status-expired'}`}><i />{member.status}</span></td>{!compact && <td className="muted-cell">{dateLabel(member.expires_at)}</td>}</tr>)}</tbody></table>{members.length === 0 && <div className="empty-state"><Users size={22} /><strong>No members match that search</strong><span>Try another name, email, ID, or filter.</span></div>}</div>;
}

function PaymentList({ payments, expanded = false }) {
  return <div className={`payment-list ${expanded ? 'payment-list-expanded' : ''}`}>{payments.map((payment, index) => <div className="payment-row" key={payment.id}><span className={`payment-icon payment-color-${index % 4}`}><ArrowDownToLine size={15} /></span><span className="payment-person"><strong>{payment.member_name}</strong><small>{payment.description}</small></span><span className="payment-date">{dateLabel(payment.paid_at)}</span><span className="payment-method">{payment.method}</span><span className="payment-amount">${Number(payment.amount || 0).toFixed(2)}</span><span className={`payment-status ${payment.status === 'Paid' ? 'paid' : 'pending'}`}><i />{payment.status}</span></div>)}</div>;
}

function RecordModal({ modal, onClose, onSave, members, trainers }) {
  const fields = {
    member: [
      { name: 'full_name', label: 'Full name', placeholder: 'e.g. Avery Johnson' },
      { name: 'email', label: 'Email address', type: 'email', placeholder: 'avery@email.com' },
      { name: 'phone', label: 'Phone number', placeholder: '+1 (555) 000-0000' },
      { name: 'plan', label: 'Membership plan', options: ['Essential', 'Performance', 'Unlimited'] },
      { name: 'status', label: 'Status', options: ['Active', 'Expired'] },
      { name: 'expires_at', label: 'Membership expires', type: 'date' },
    ],
    payment: [
      { name: 'member_name', label: 'Member', options: members.map((member) => member.full_name) },
      { name: 'amount', label: 'Amount (USD)', type: 'number', placeholder: '89' },
      { name: 'description', label: 'Payment description', placeholder: 'Performance · Monthly', wide: true },
      { name: 'method', label: 'Payment method', options: ['Card', 'Cash', 'Bank transfer'] },
    ],
    trainer: [
      { name: 'full_name', label: 'Full name', placeholder: 'e.g. Sam Rivera' },
      { name: 'specialty', label: 'Specialization', placeholder: 'Strength & conditioning' },
      { name: 'email', label: 'Email address', type: 'email', placeholder: 'sam@email.com' },
    ],
    workout: [
      { name: 'name', label: 'Plan name', placeholder: 'Strength foundations' },
      { name: 'category', label: 'Category', options: ['Strength', 'Conditioning', 'Recovery', 'Mobility'] },
      { name: 'duration', label: 'Duration', placeholder: '45 min' },
      { name: 'trainer', label: 'Trainer', options: trainers.map((trainer) => trainer.full_name) },
    ],
  }[modal.kind];
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget))); }}><div className="modal-heading"><div><span className="eyebrow">GYM OPERATIONS</span><h2>{modal.title}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={18} /></IconButton></div><div className="form-grid">{fields.map((field) => <label className={field.wide ? 'wide-field' : ''} key={field.name}>{field.label}{field.options ? <select name={field.name} defaultValue={field.options[0]} required>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input name={field.name} type={field.type || 'text'} placeholder={field.placeholder || ''} required />}</label>)}</div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Save changes <ArrowUpRight size={15} /></button></div></form></div>;
}

export default function Home() {
  const [activePage, setActivePage] = useState('Overview');
  const [data, setData] = useState(demoData);
  const [query, setQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('All members');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRecords() {
      if (!isSupabaseConfigured) {
        try {
          const saved = localStorage.getItem('oxygen-gym-data');
          if (saved && !cancelled) setData({ ...demoData, ...JSON.parse(saved) });
        } catch { /* Ignore invalid local demo data. */ }
        return;
      }
      const tables = Object.keys(demoData);
      const results = await Promise.all(tables.map((table) => supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100)));
      if (cancelled) return;
      const nextData = {};
      let failed = false;
      results.forEach((result, index) => {
        if (result.error) { failed = true; nextData[tables[index]] = []; }
        else nextData[tables[index]] = result.data || [];
      });
      setConnectionIssue(failed);
      setData(nextData);
    }
    loadRecords();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeMembers = data.members.filter((member) => member.status === 'Active').length;
  const revenue = data.payments.filter((payment) => payment.status === 'Paid').reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const filteredMembers = useMemo(() => data.members.filter((member) => {
    const matchesQuery = `${member.full_name} ${member.email} ${member.id}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (memberFilter === 'All members' || member.status === memberFilter);
  }), [data.members, query, memberFilter]);

  async function saveRecord(table, record) {
    let savedRecord = record;
    if (isSupabaseConfigured) {
      const { data: inserted, error } = await supabase.from(table).insert(record).select().single();
      if (error) { setNotice(`Save failed: ${error.message}`); return; }
      savedRecord = inserted;
    }
    setData((current) => {
      const next = { ...current, [table]: [savedRecord, ...current[table]] };
      if (!isSupabaseConfigured) localStorage.setItem('oxygen-gym-data', JSON.stringify(next));
      return next;
    });
    setModal(null);
    setNotice(isSupabaseConfigured ? 'Saved to your Supabase PostgreSQL database.' : 'Saved in this browser. Connect Supabase to sync your team.');
  }

  function showModal(kind) {
    const modalTitles = { member: 'Add a member', payment: 'Record a payment', trainer: 'Add a trainer', workout: 'Create a workout plan' };
    setModal({ kind, title: modalTitles[kind] });
  }

  async function saveModal(values) {
    if (modal.kind === 'member') {
      values.id = `FG-${2049 + data.members.length}`;
      values.joined_at = new Date().toISOString().slice(0, 10);
    } else if (modal.kind === 'payment') {
      values.amount = Number(values.amount);
      values.status = 'Paid';
      values.paid_at = new Date().toISOString().slice(0, 10);
    } else if (modal.kind === 'trainer') {
      values.members = 0;
      values.status = 'Available';
      values.initials = initials(values.full_name);
    } else if (modal.kind === 'workout') {
      values.assignments = 0;
    }
    await saveRecord(`${modal.kind === 'member' ? 'members' : modal.kind === 'payment' ? 'payments' : modal.kind === 'trainer' ? 'trainers' : 'workouts'}`, values);
  }

  async function checkIn() {
    const member = data.members.find((item) => item.status === 'Active');
    if (!member) { setNotice('Add an active member before recording attendance.'); return; }
    await saveRecord('attendance', { member_name: member.full_name, type: 'Check in', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), attended_at: new Date().toISOString() });
  }

  function exportCsv() {
    const rows = [['Member ID', 'Name', 'Email', 'Plan', 'Status'], ...data.members.map((member) => [member.id, member.full_name, member.email, member.plan, member.status])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'oxygen-gym-members-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice('Member report downloaded.');
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Dumbbell size={19} /></span><span>OXYGEN GYM<span className="brand-period">.</span></span><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <div className="branch-select"><span className="branch-dot" /><span><small>LOCATION</small><strong>Downtown Club</strong></span><ChevronDown size={15} /></div>
      <nav className="side-nav">{['WORKSPACE', 'PEOPLE', 'MANAGE'].map((group) => <div className="nav-group" key={group}><span className="nav-label">{group}</span>{nav.filter((item) => item[2] === group).map(([label, Icon]) => <button key={label} className={`nav-item ${activePage === label ? 'nav-active' : ''}`} onClick={() => { setActivePage(label); setMenuOpen(false); }}><Icon size={17} /><span>{label}</span>{label === 'Members' && <span className="nav-count">{data.members.length}</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings size={17} /><span>Settings</span></button><div className="profile"><div className="profile-avatar">AR</div><span><strong>Alex Rivera</strong><small>Gym administrator</small></span><Ellipsis size={18} /></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><IconButton label="Open navigation" className="menu-trigger" onClick={() => setMenuOpen(true)}><Menu size={20} /></IconButton><div className="breadcrumbs">Oxygen Gym <ChevronRight size={14} /> <span>{activePage}</span></div></div><div className="topbar-actions"><div className="today-pill"><CalendarDays size={15} /> Monday, September 28</div><IconButton label="Notifications" className="notification-button"><Bell size={18} /><i /></IconButton><div className="top-avatar">AR</div></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow">MONDAY, SEPTEMBER 28, 2026 <span className="heading-line" /></div><h1>{titles[activePage]}</h1><p>{activePage === 'Overview' ? 'Here’s what’s happening at your gym today.' : `Manage your gym ${activePage.toLowerCase()} and keep everything moving.`}</p></div>{activePage === 'Members' && <button className="button button-primary" onClick={() => showModal('member')}><Plus size={17} /> Add member</button>}{activePage === 'Reports' && <button className="button button-primary" onClick={exportCsv}><ArrowDownToLine size={16} /> Export report</button>}</div>

        {!isSupabaseConfigured && <div className="setup-banner"><span><CircleHelp size={17} /><strong>Demo mode</strong> Changes save in this browser. Add Supabase keys to sync live data.</span><a href="/setup">Setup guide <ArrowUpRight size={14} /></a></div>}
        {isSupabaseConfigured && connectionIssue && <div className="setup-banner warning-banner"><span><CircleHelp size={17} /><strong>Database setup needed</strong> Run the included schema in your Supabase SQL editor.</span><a href="/setup">Setup guide <ArrowUpRight size={14} /></a></div>}

        {activePage === 'Overview' && <>
          <section className="stats-grid"><StatCard label="Total members" value={data.members.length.toLocaleString()} change="12.8%" sub="vs. last month" icon={Users} color="green" /><StatCard label="Active memberships" value={activeMembers.toLocaleString()} change="8.2%" sub="vs. last month" icon={ShieldCheck} color="blue" /><StatCard label="Revenue this month" value={`$${revenue.toLocaleString()}`} change="6.4%" sub="vs. last month" icon={BadgeDollarSign} color="orange" /><StatCard label="Today's check-ins" value={String(data.attendance.length).padStart(2, '0')} change="Live" sub="members in the gym" icon={Activity} color="pink" live /></section>
          <section className="overview-grid"><article className="panel revenue-panel"><div className="panel-heading"><div><span className="eyebrow">REVENUE OVERVIEW</span><h2>Income trends</h2></div><select className="select-compact" aria-label="Revenue timeframe"><option>Last 7 months</option><option>Last 30 days</option><option>This year</option></select></div><div className="revenue-total"><strong>${(revenue * 10.4).toLocaleString()}</strong><span className="trend-positive"><ArrowUpRight size={14} /> 6.4%</span><small>total revenue <span>·</span> this year</small></div><div className="chart-area"><div className="chart-y"><span>$20k</span><span>$15k</span><span>$10k</span><span>$5k</span><span>$0</span></div><div className="chart-bars">{[{ m: 'Mar', v: 52 }, { m: 'Apr', v: 70 }, { m: 'May', v: 62 }, { m: 'Jun', v: 84 }, { m: 'Jul', v: 75 }, { m: 'Aug', v: 92 }, { m: 'Sep', v: 80 }].map((item) => <div className="bar-group" key={item.m}><div className="bar-track"><span className={item.m === 'Sep' ? 'bar current-bar' : 'bar'} style={{ height: `${item.v}%` }} /></div><small>{item.m}</small></div>)}</div></div></article>
            <article className="panel attendance-panel"><div className="panel-heading"><div><span className="eyebrow">LIVE FLOOR</span><h2>Today’s attendance</h2></div><span className="live-indicator"><i /> LIVE</span></div><div className="attendance-number"><strong>{String(data.attendance.length).padStart(2, '0')}</strong><span>checked in today</span></div><div className="attendance-meter"><span style={{ width: `${Math.min(100, data.attendance.length * 8)}%` }} /></div><div className="attendance-caption"><span>Peak capacity</span><strong>{Math.min(100, data.attendance.length * 8)}%</strong></div><div className="panel-divider" /><div className="mini-list-heading"><span>RECENT CHECK-INS</span><button onClick={() => setActivePage('Attendance')}>View all <ArrowUpRight size={13} /></button></div><div className="checkin-list">{data.attendance.slice(0, 3).map((item) => <div className="checkin-row" key={item.id}><Avatar name={item.member_name} /><span>{item.member_name}</span><small>{item.time}</small></div>)}</div></article></section>
          <section className="lower-grid"><article className="panel members-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>Recent members</h2></div><button className="text-link" onClick={() => setActivePage('Members')}>All members <ArrowUpRight size={14} /></button></div><MemberTable members={data.members.slice(0, 4)} compact /></article><article className="panel payments-panel"><div className="panel-heading"><div><span className="eyebrow">CASH FLOW</span><h2>Recent payments</h2></div><IconButton label="More payment actions"><Ellipsis size={18} /></IconButton></div><PaymentList payments={data.payments.slice(0, 4)} /></article></section>
          <section className="quick-actions"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Keep things moving</h2></div><div className="quick-buttons"><button onClick={() => showModal('member')}><UserRoundPlus size={17} /> Add member <ArrowUpRight size={14} /></button><button onClick={checkIn}><Check size={17} /> Check in member <ArrowUpRight size={14} /></button><button onClick={() => showModal('payment')}><Wallet size={17} /> Record payment <ArrowUpRight size={14} /></button></div></section>
        </>}

        {activePage === 'Members' && <section className="panel page-panel"><div className="toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or ID" /></div><label className="filter-select"><Filter size={15} /><select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}><option>All members</option><option>Active</option><option>Expired</option></select></label><span className="result-count">{filteredMembers.length} members</span></div><MemberTable members={filteredMembers} /><div className="table-footer"><span>Showing <strong>{filteredMembers.length ? 1 : 0}–{filteredMembers.length}</strong> of <strong>{filteredMembers.length}</strong> results</span><div><button disabled><ChevronLeft size={16} /> Previous</button><button disabled>Next <ChevronRight size={16} /></button></div></div></section>}

        {activePage === 'Memberships' && <section className="membership-grid">{[{ title: 'Essential', price: 49, detail: 'The everyday essentials', color: 'plan-sage', benefits: ['Gym floor access', 'Locker room access', '1 fitness assessment'] }, { title: 'Performance', price: 89, detail: 'For focused progress', color: 'plan-coral', benefits: ['All Essential benefits', '4 personal training sessions', 'Group classes included'] }, { title: 'Unlimited', price: 129, detail: 'Your training, no limits', color: 'plan-ink', benefits: ['All Performance benefits', 'Unlimited personal training', 'Guest passes included'] }].map((plan) => <article className={`plan-card ${plan.color}`} key={plan.title}><span className="eyebrow">MONTHLY PLAN</span><div className="plan-price"><strong>${plan.price}</strong><span>/ month</span></div><h2>{plan.title}</h2><p>{plan.detail}</p><div className="plan-rule" /><span className="benefit-label">INCLUDED</span>{plan.benefits.map((benefit) => <div className="plan-benefit" key={benefit}><Check size={15} /> {benefit}</div>)}<div className="plan-count">{data.members.filter((member) => member.plan === plan.title).length} members</div></article>)}</section>}

        {activePage === 'Payments' && <section className="panel page-panel"><div className="payments-summary"><div><span className="eyebrow">COLLECTED PAYMENTS</span><strong>${revenue.toLocaleString()}</strong><small>This month · {data.payments.length} transactions</small></div><div className="summary-icon"><Wallet size={21} /></div><button className="button button-primary" onClick={() => showModal('payment')}><Plus size={16} /> Record payment</button></div><div className="panel-heading list-heading"><div><span className="eyebrow">TRANSACTION LOG</span><h2>Recent payments</h2></div><button className="button button-quiet" onClick={exportCsv}><ArrowDownToLine size={15} /> Export CSV</button></div><PaymentList payments={data.payments} expanded /></section>}

        {activePage === 'Attendance' && <section className="panel page-panel"><div className="attendance-summary"><div><span className="eyebrow">TODAY · SEPTEMBER 28</span><h2>{data.attendance.length} check-ins</h2><p>Members who visited your gym today.</p></div><button className="button button-primary" onClick={checkIn}><Check size={16} /> Check in member</button></div><div className="attendance-table">{data.attendance.map((item, index) => <div className="attendance-entry" key={item.id}><span className="entry-number">{String(index + 1).padStart(2, '0')}</span><Avatar name={item.member_name} /><strong>{item.member_name}</strong><span className="checkin-tag"><span /> Checked in</span><small>{item.time}</small></div>)}</div></section>}

        {activePage === 'Trainers' && <><div className="module-toolbar"><span className="eyebrow">YOUR COACHING TEAM · {data.trainers.length} TRAINERS</span><button className="button button-primary" onClick={() => showModal('trainer')}><Plus size={16} /> Add trainer</button></div><section className="trainer-grid">{data.trainers.map((trainer, index) => <article className="trainer-card" key={trainer.id}><div className={`trainer-cover cover-${index % 3}`}><span className="trainer-portrait">{trainer.initials || initials(trainer.full_name)}</span><IconButton label={`More options for ${trainer.full_name}`}><Ellipsis size={18} /></IconButton></div><div className="trainer-body"><div className="trainer-status"><i className={trainer.status === 'Available' ? 'available-dot' : ''} />{trainer.status || 'Available'}</div><h2>{trainer.full_name}</h2><p>{trainer.specialty}</p><div className="trainer-meta"><span><Users size={15} /> {trainer.members || 0} members</span><button onClick={() => setNotice('Trainer details are available in your Supabase trainer record.')}>View profile <ArrowUpRight size={13} /></button></div></div></article>)}</section></>}

        {activePage === 'Workouts' && <section className="panel page-panel"><div className="panel-heading list-heading"><div><span className="eyebrow">PROGRAM LIBRARY</span><h2>Workout plans</h2></div><button className="button button-primary" onClick={() => showModal('workout')}><Plus size={16} /> Create plan</button></div><div className="workout-list">{data.workouts.map((workout, index) => <div className="workout-row" key={workout.id}><div className={`workout-symbol workout-${index % 3}`}><Dumbbell size={19} /></div><div className="workout-title"><strong>{workout.name}</strong><span>{workout.category} <i /> {workout.duration}</span></div><div className="workout-trainer"><small>COACH</small><span>{workout.trainer || 'Unassigned'}</span></div><div className="workout-members"><Users size={15} /> {workout.assignments || 0} assigned</div><IconButton label={`More actions for ${workout.name}`}><Ellipsis size={18} /></IconButton></div>)}</div><div className="workout-note"><Activity size={16} /><span>Exercise schedules, sets, reps, and progress tracking can be added to each plan.</span></div></section>}

        {activePage === 'Reports' && <section className="report-grid"><article className="panel report-card"><span className="report-icon report-green"><Users size={20} /></span><span className="eyebrow">MEMBERSHIP</span><strong>{data.members.length}</strong><p>Total registered members</p><button onClick={exportCsv}>Download member report <ArrowDownToLine size={14} /></button></article><article className="panel report-card"><span className="report-icon report-orange"><Wallet size={20} /></span><span className="eyebrow">REVENUE</span><strong>${revenue.toLocaleString()}</strong><p>Recorded payments</p><button onClick={exportCsv}>Download member report <ArrowDownToLine size={14} /></button></article><article className="panel report-card"><span className="report-icon report-blue"><Activity size={20} /></span><span className="eyebrow">ATTENDANCE</span><strong>{data.attendance.length}</strong><p>Today's gym visits</p><button onClick={exportCsv}>Download member report <ArrowDownToLine size={14} /></button></article></section>}

        <footer className="app-footer"><span>OXYGEN GYM CLUB MANAGEMENT</span><span>Good work happens here.</span></footer>
      </div>
    </main>
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    {modal && <RecordModal modal={modal} onClose={() => setModal(null)} onSave={saveModal} members={data.members} trainers={data.trainers} />}
    {notice && <div className="toast"><span><Check size={15} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
  </div>;
}