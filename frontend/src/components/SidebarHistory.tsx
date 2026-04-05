import { useEffect, useState } from "react";
import {
  ChevronDown,
  Folder,
  History,
  RefreshCw,
  Trash2,
  Search,
} from "lucide-react";
import {
  deleteQuestion,
  getHistory,
  getQuestionDetails,
} from "../api/services";
import type { QuestionDetailResponse, QuestionSummary } from "../types/api";

// We use our design tokens directly via Tailwind classes
interface SidebarHistoryProps {
  onSelectQuestion: (question: QuestionDetailResponse) => void;
  refreshTrigger?: number;
}

const SidebarHistory = ({
  onSelectQuestion,
  refreshTrigger,
}: SidebarHistoryProps) => {
  const [items, setItems] = useState<QuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const loadHistory = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

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
      setError(err instanceof Error ? err.message : "Failed loading history.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [refreshTrigger]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setError(null);
    try {
      const detail = await getQuestionDetails(id);
      onSelectQuestion(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed loading details.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed deleting question.",
      );
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    `${item.catchyTitle} ${item.categoryName}`
      .toLowerCase()
      .includes(normalizedSearch),
  );

  const groupByCategory = (historyItems: QuestionSummary[]) => {
    return historyItems.reduce<Record<string, QuestionSummary[]>>(
      (acc, item) => {
        const key = item.categoryName || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {},
    );
  };

  const groupedItems = groupByCategory(filteredItems);
  const orderedCategories = Object.keys(groupedItems).sort((a, b) =>
    a.localeCompare(b),
  );

  const toggleFolder = (categoryName: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  return (
    <section className="flex h-full flex-col gap-6 relative z-10">
      {/* Header with Glass Style */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <History className="h-5 w-5 text-brand-primary" />
          History
        </h2>
        <button
          type="button"
          onClick={() => void loadHistory(true)}
          className="rounded-full p-2 text-gray-400 transition-all hover:bg-surface-hover hover:text-white"
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Modern Search Input */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search analyses..."
          className="w-full rounded-xl border border-surface-border bg-gray-950/40 py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {/* Error & Loading States */}
      {error && (
        <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-surface-border/20"
            />
          ))}
        </div>
      ) : (
        <ul className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {orderedCategories.map((category) => {
            const isOpen = openFolders[category] ?? true;
            return (
              <li key={category} className="space-y-1">
                <button
                  onClick={() => toggleFolder(category)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-bold text-gray-400 hover:bg-surface-hover hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Folder
                      className={`h-4 w-4 ${isOpen ? "text-brand-secondary" : "text-gray-600"}`}
                    />
                    {category}
                    <span className="text-[10px] opacity-50 bg-gray-800 px-1.5 py-0.5 rounded-md">
                      {groupedItems[category].length}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>

                {isOpen && (
                  <ul className="mt-1 space-y-1 ml-2 border-l border-surface-border pl-2">
                    {groupedItems[category].map((item) => (
                      <li key={item.id} className="group relative">
                        <button
                          onClick={() => void handleSelect(item.id)}
                          className={`w-full rounded-lg p-2.5 text-left text-xs transition-all ${
                            selectedId === item.id
                              ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                              : "text-gray-400 hover:bg-surface-hover hover:text-white border border-transparent"
                          }`}
                        >
                          <p className="line-clamp-1 font-medium">
                            {item.catchyTitle}
                          </p>
                          <p className="mt-1 text-[10px] opacity-40">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(item.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-600 opacity-0 hover:bg-red-950/40 hover:text-red-400 transition-all group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
