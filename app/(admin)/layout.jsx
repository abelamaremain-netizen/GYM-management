import { redirect } from 'next/navigation';
import { getSession } from '../../lib/auth';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { ToastProvider } from '../../components/ui/Toast';

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar admin={session} />
        <div className="main-area">
          <Topbar admin={session} />
          <div className="content-wrap">
            {children}
          </div>
        </div>
        <div id="mobile-scrim" className="mobile-scrim" style={{ display: 'none' }} />
        <script dangerouslySetInnerHTML={{ __html: `
          var scrim = document.getElementById('mobile-scrim');
          if (scrim) {
            scrim.addEventListener('click', function() {
              document.getElementById('app-sidebar')?.classList.remove('sidebar-open');
              scrim.style.display = 'none';
            });
          }
        ` }} />
      </div>
    </ToastProvider>
  );
}
