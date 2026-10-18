import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Server component pagination bar.
 * @param {number}  page        current page (1-indexed)
 * @param {number}  total       total record count
 * @param {number}  pageSize    records per page
 * @param {string}  basePath    e.g. '/members'
 * @param {object}  params      extra query params to preserve (e.g. { status, search })
 */
export default function Pagination({ page, total, pageSize, basePath, params = {} }) {
  if (total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  function buildUrl(p) {
    const query = new URLSearchParams({ ...params, page: p });
    // Remove empty values
    for (const [k, v] of [...query.entries()]) {
      if (!v || v === 'all') query.delete(k);
    }
    if (p > 1) query.set('page', p);
    const qs = query.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="table-footer">
      <span>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
      <div className="pagination-btns">
        {page > 1 ? (
          <Link href={buildUrl(page - 1)} className="button button-quiet pagination-btn">
            <ChevronLeft size={15} /> Previous
          </Link>
        ) : (
          <span className="button button-quiet pagination-btn disabled">
            <ChevronLeft size={15} /> Previous
          </span>
        )}
        <span className="pagination-page">{page} / {totalPages}</span>
        {page < totalPages ? (
          <Link href={buildUrl(page + 1)} className="button button-quiet pagination-btn">
            Next <ChevronRight size={15} />
          </Link>
        ) : (
          <span className="button button-quiet pagination-btn disabled">
            Next <ChevronRight size={15} />
          </span>
        )}
      </div>
    </div>
  );
}
