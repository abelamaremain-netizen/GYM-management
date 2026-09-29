import { redirect } from 'next/navigation';
import { getSession } from '../../lib/auth';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="app-shell">
      <Sidebar admin={session} />
      <div className="main-area">
        <Topbar admin={session} />
        <div className="content-wrap">
          {children}
        </div>
      </div>
    </div>
  );
}
