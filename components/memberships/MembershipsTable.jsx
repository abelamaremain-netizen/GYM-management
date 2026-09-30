'use client';

import { formatDate, formatCurrency } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { markPaymentAction } from '../../lib/actions/memberships';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EmptyState from '../ui/EmptyState';
import { ShieldCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';

export default function MembershipsTable({ memberships }) {
  const router = useRouter();
  const toast = useToast();

  if (!memberships.length) {
    return <EmptyState icon={ShieldCheck} title="No memberships found" description="Assign a plan to a member to get started." />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>MEMBER</th>
            <th>PLAN</th>
            <th>START</th>
            <th>END</th>
            <th>PRICE</th>
            <th>PAYMENT</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map((m) => (
            <tr key={m.id}>
              <td>
                <Link href={`/members/${m.users?.id}`} className="table-link">{m.users?.name}</Link>
              </td>
              <td><span className="plan-pill">{m.plan_name}</span></td>
              <td className="muted-cell">{formatDate(m.start_date)}</td>
              <td className="muted-cell">{formatDate(m.end_date)}</td>
              <td className="muted-cell">{formatCurrency(m.final_price)}</td>
              <td>
                <StatusBadge status={m.paid ? 'paid' : 'unpaid'} />
                {m.paid_date && <span className="muted-cell" style={{ marginLeft: 6, fontSize: 9 }}>{formatDate(m.paid_date)}</span>}
              </td>
              <td>
                <button
                  className="button button-quiet"
                  style={{ fontSize: 10, padding: '5px 8px' }}
                  onClick={async () => {
                    const result = await markPaymentAction(m.id, !m.paid, m.users?.id);
                    if (result?.error) toast(result.error, 'error');
                    else { toast(m.paid ? 'Marked as unpaid.' : 'Marked as paid.'); router.refresh(); }
                  }}
                >
                  {m.paid ? 'Mark unpaid' : 'Mark paid'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
