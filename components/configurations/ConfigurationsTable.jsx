'use client';

import { useState, useActionState } from 'react';
import { updateConfigAction } from '../../lib/actions/configurations';
import { formatDate } from '../../lib/utils';
import { Pencil, X, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfigurationsTable({ configurations, canEdit }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await updateConfigAction(prev, formData);
    if (result?.success) { setEditing(null); router.refresh(); }
    return result;
  }, null);

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>KEY</th>
            <th>LABEL</th>
            <th>VALUE</th>
            <th>TYPE</th>
            <th>DESCRIPTION</th>
            <th>LAST UPDATED</th>
            {canEdit && <th>ACTIONS</th>}
          </tr>
        </thead>
        <tbody>
          {configurations.map((config) => (
            <tr key={config.id}>
              <td><code style={{ fontSize: 10, background: '#f4f6f3', padding: '2px 5px', borderRadius: 3 }}>{config.key}</code></td>
              <td><strong style={{ fontSize: 11 }}>{config.label}</strong></td>
              <td>
                {editing === config.id ? (
                  <form action={formAction} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="hidden" name="id" value={config.id} />
                    <input
                      name="value"
                      defaultValue={config.value}
                      className="form-input"
                      style={{ width: 160, height: 30, fontSize: 11 }}
                      autoFocus
                    />
                    <button type="submit" className="icon-button" disabled={pending} aria-label="Save"><Check size={14} /></button>
                    <button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Cancel"><X size={14} /></button>
                  </form>
                ) : (
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{config.value}</span>
                )}
              </td>
              <td className="muted-cell">{config.type}</td>
              <td className="muted-cell" style={{ maxWidth: 240, whiteSpace: 'normal', fontSize: 10 }}>{config.description || '—'}</td>
              <td className="muted-cell">{config.users?.name ? `${config.users.name} · ` : ''}{formatDate(config.updated_at)}</td>
              {canEdit && (
                <td>
                  {editing !== config.id && (
                    <button className="icon-button" onClick={() => setEditing(config.id)} aria-label="Edit"><Pencil size={13} /></button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
