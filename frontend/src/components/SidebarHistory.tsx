import { useEffect, useState } from 'react';
import { ChevronDown, Folder, History, RefreshCw, Trash2 } from 'lucide-react';
import { deleteQuestion, getHistory, getQuestionDetails } from '../api/services';
import type { QuestionDetailResponse, QuestionSummary } from '../types/api';

interface SidebarHistoryProps {
  onSelectQuestion: (question: QuestionDetailResponse) => void;
}

const SidebarHistory = ({ onSelectQuestion }: SidebarHistoryProps) => {
  const [items, setItems] = useState<QuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const loadHistory = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      const history = await getHistory();
      setItems(history);
      setOpenFolders((prev) => {
        const next = { ...prev };
        for (const entry of history) {
          if (!(entry.categoryName in next)) {
            next[entry.categoryName] = true;
          }
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed loading history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setError(null);
    try {
      const detail = await getQuestionDetails(id);
      onSelectQuestion(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed loading question details.');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteQuestion(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed deleting question.');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) => {
        const haystack = `${item.catchyTitle} ${item.categoryName}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : items;

  const groupByCategory = (historyItems: QuestionSummary[]): Record<string, QuestionSummary[]> => {
    return historyItems.reduce<Record<string, QuestionSummary[]>>((acc, item) => {
      const key = item.categoryName || 'Uncategorized';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  };

  const groupedItems = groupByCategory(filteredItems);
  const orderedCategories = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

  const toggleFolder = (categoryName: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <History className="h-5 w-5 text-indigo-400" />
          Question History
        </h2>
        <button
          type="button"
          onClick={() => void loadHistory(true)}
          className="rounded-md border border-gray-700 p-2 text-gray-300 transition hover:border-gray-500 hover:text-white"
          aria-label="Refresh history"
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="rounded-md border border-red-700 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>}

      <div>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search history..."
          className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none ring-indigo-500 transition focus:ring-2"
          aria-label="Search history"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-md bg-gray-800" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <p className="rounded-md border border-gray-800 bg-gray-900 p-3 text-sm text-gray-400">No previous analyses yet.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-1">
          {orderedCategories.map((categoryName) => {
            const categoryItems = groupedItems[categoryName];
            const isOpen = openFolders[categoryName] ?? true;

            return (
              <li key={categoryName} className="rounded-md border border-gray-800 bg-gray-900/80">
                <button
                  type="button"
                  onClick={() => toggleFolder(categoryName)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-200 transition hover:text-white"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-indigo-300" />
                    <span className="font-medium">{categoryName}</span>
                    <span className="text-xs text-gray-400">({categoryItems.length})</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition ${isOpen ? '' : '-rotate-90'}`} />
                </button>

                {isOpen && (
                  <ul className="space-y-2 border-t border-gray-800 p-2">
                    {categoryItems.map((item) => (
                      <li key={item.id}>
                        <div
                          className={`rounded-md border p-2 text-left text-sm transition ${
                            selectedId === item.id
                              ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                              : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700 hover:text-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => void handleSelect(item.id)}
                            className="w-full text-left"
                          >
                            <p className="line-clamp-2 font-medium">{item.catchyTitle}</p>
                          </button>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              className="inline-flex items-center gap-1 rounded border border-red-800/70 px-2 py-1 text-xs text-red-300 transition hover:border-red-600 hover:text-red-200"
                              aria-label={`Delete ${item.catchyTitle}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SidebarHistory;
