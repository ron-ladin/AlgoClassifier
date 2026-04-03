import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { getHistory, getQuestionDetails } from '../api/services';
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-md bg-gray-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-gray-800 bg-gray-900 p-3 text-sm text-gray-400">No previous analyses yet.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void handleSelect(item.id)}
                className={`w-full rounded-md border p-3 text-left text-sm transition ${
                  selectedId === item.id
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700 hover:text-white'
                }`}
              >
                <p className="line-clamp-2 font-medium">{item.catchyTitle}</p>
                <p className="mt-1 text-xs text-gray-500">{item.categoryName}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default SidebarHistory;
