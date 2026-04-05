import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { getHistory } from "../api/services";
import type { QuestionSummary } from "../types/api";

type GroupedQuestions = Record<string, QuestionSummary[]>;

const generateSlug = (text: string): string => {
  if (!text) return "uncategorized";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\/\\?#%]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const QuestionsFoldersPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getHistory();
        setQuestions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch folders.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchQuestions();
  }, []);

  const groupedFolders = useMemo(() => {
    if (!questions || questions.length === 0) return {};

    return questions.reduce<GroupedQuestions>((acc, question) => {
      const category = question.categoryName || "Uncategorized";

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(question);
      return acc;
    }, {});
  }, [questions]);

  const foldersList = Object.entries(groupedFolders).map(
    ([category, items]) => ({
      categoryName: category,
      count: items.length,
      slug: generateSlug(category),
    }),
  );

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-white sm:px-6 lg:px-8 relative z-10">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Modern Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-8">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/")}
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-surface-border backdrop-blur-md transition-all hover:bg-surface-hover hover:border-gray-500"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                My Knowledge Base
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base font-medium">
                Browse your structured algorithmic analyses by category.
              </p>
            </div>
          </div>
        </header>

        <main>
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary drop-shadow-lg" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-900/30 bg-red-950/20 backdrop-blur-md p-10 text-center text-red-400 shadow-glass">
              <AlertCircle className="mb-4 h-12 w-12 opacity-80" />
              <p className="text-xl font-medium mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-red-800 bg-red-900/30 px-6 py-2.5 text-sm font-medium transition hover:bg-red-800/50"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && foldersList.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-surface/30 backdrop-blur-sm py-24 text-center">
              <div className="rounded-full bg-gray-800/50 p-6 mb-6">
                <Folder className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200 mb-2">
                Your workspace is empty
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                You haven't classified any algorithmic problems yet. Paste a
                problem or upload an image to generate your first analysis.
              </p>
              <button
                onClick={() => navigate("/ask")}
                className="rounded-xl bg-brand-primary px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:scale-105"
              >
                Start New Analysis
              </button>
            </div>
          )}

          {/* THE NEW GLASSMORPHISM GRID */}
          {!isLoading && !error && foldersList.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {foldersList.map((folder) => (
                <button
                  key={folder.slug}
                  onClick={() =>
                    navigate(
                      `/questions/folder/${encodeURIComponent(folder.slug)}`,
                    )
                  }
                  // Here we apply our new design tokens: surface, backdrop-blur, shadow-glass
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-surface-border bg-surface p-7 text-left backdrop-blur-md shadow-glass transition-all duration-300 hover:-translate-y-2 hover:bg-surface-hover hover:border-brand-secondary/50 hover:shadow-glass-hover"
                >
                  <div className="flex w-full items-start justify-between mb-8">
                    <div className="rounded-2xl bg-gray-800/50 p-4 text-brand-secondary transition-all duration-300 group-hover:bg-brand-secondary/20 group-hover:scale-110">
                      <Folder className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-white/90 drop-shadow-md">
                        {folder.count}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {folder.count === 1 ? "Analysis" : "Analyses"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full">
                    <h3 className="truncate text-2xl font-bold text-gray-100 transition-colors duration-300 group-hover:text-brand-secondary">
                      {folder.categoryName}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-400 opacity-0 transition-all duration-300 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                      View Collection{" "}
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </div>
                  </div>

                  {/* Subtle decorative gradient blob in the background of the card */}
                  <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-brand-secondary/10 blur-3xl transition-all duration-500 group-hover:bg-brand-secondary/20 group-hover:scale-150 pointer-events-none"></div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestionsFoldersPage;
