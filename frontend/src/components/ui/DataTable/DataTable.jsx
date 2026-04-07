import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../Pagination/Pagination';
import { Spinner } from '../Spinner/Spinner';
import EmptyState from '../EmptyState/EmptyState';
import styles from './DataTable.module.css';

/**
 * DataTable component — sortable, searchable, paginated.
 *
 * @param {Array} columns - [{ key, label, sortable, render, width }]
 * @param {Array} data - row data array
 * @param {boolean} loading
 * @param {string} searchPlaceholder
 * @param {Function} onRowClick - optional click handler
 * @param {number} pageSize - default 10
 * @param {Function} actions - function(row) returns JSX for action column
 * @param {string} emptyTitle
 * @param {string} emptyDescription
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKeys = [],
  onRowClick,
  pageSize = 10,
  actions,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyIcon,
  toolbar,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.length > 0
        ? searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
        : columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown size={14} className={styles.sortIconIdle} />;
    return sortDir === 'asc'
      ? <ArrowUp size={14} className={styles.sortIconActive} />
      : <ArrowDown size={14} className={styles.sortIconActive} />;
  };

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {toolbar && <div className={styles.toolbarActions}>{toolbar}</div>}
      </div>

      {/* Table */}
      {pageData.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription || `Không tìm thấy kết quả cho "${search}"`}
        />
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`${styles.th} ${col.sortable ? styles.sortable : ''}`}
                      style={col.width ? { width: col.width } : {}}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      {col.sortable ? (
                        <span className={styles.sortLabel}>
                          <span>{col.label}</span>
                          <SortIcon colKey={col.key} />
                        </span>
                      ) : (
                        <span>{col.label}</span>
                      )}
                    </th>
                  ))}
                  {actions && <th className={styles.th} style={{ width: 100 }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={styles.td}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '--')}
                      </td>
                    ))}
                    {actions && (
                      <td className={`${styles.td} ${styles.actionsCell}`}>
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerInfo}>
              Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} / {sorted.length} kết quả
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
