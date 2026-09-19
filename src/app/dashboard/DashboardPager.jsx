export const DASHBOARD_PAGE_SIZE = 15;

export function paginateItems(items, page, pageSize = DASHBOARD_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize;
  const end = total === 0 ? 0 : Math.min(start + pageSize, total);
  return {
    currentPage,
    totalPages,
    start,
    end,
    items: items.slice(start, end),
    total,
  };
}

export default function DashboardPager({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) {
  const currentPage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  return (
    <div className="db-articles-pager">
      <button
        type="button"
        className="db-icon-btn db-pager-btn"
        aria-label="Previous page"
        disabled={disabled || atStart}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        className="db-icon-btn db-pager-btn"
        aria-label="Next page"
        disabled={disabled || atEnd}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
