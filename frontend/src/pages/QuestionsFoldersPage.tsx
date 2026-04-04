import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { getHistory } from "../api/services";
import type { QuestionSummary } from "../types/api";

type GroupedQuestions = Record<string, QuestionSummary[]>;

/**
 * Generates a URL-friendly slug that supports Unicode (e.g., Hebrew).
 * Instead of stripping non-English characters, it safely handles spaces and
 * strips only URL-breaking characters.
 * Time Complexity: O(L) where L is the string length.
 */
const generateSlug = (text: string): string => {
  if (!text) return "uncategorized";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\/\\?#%]+/g, "") // Strip characters that break URLs
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with dashes
    .replace(/-+/g, "-") // Collapse multiple consecutive dashes
    .replace(/(^-|-$)/g, ""); // Trim dashes from start and end
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
      // Utilize the new Unicode-safe slug generator
      slug: generateSlug(category),
    }),
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center gap-4 border-b border-gray-800 pb-6">
          <button
            onClick={() => navigate("/")}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">My Questions</h1>
            <p className="text-gray-400">
              Browse your saved algorithmic problems by topic.
            </p>
          </div>
        </header>

        <main>
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-800/50 bg-red-950/20 p-8 text-center text-red-400">
              <AlertCircle className="mb-4 h-10 w-10 opacity-80" />
              <p className="text-lg font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md border border-red-800 px-4 py-2 text-sm transition hover:bg-red-900/40"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && foldersList.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-20 text-center">
              <Folder className="mb-4 h-12 w-12 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-300">
                No folders yet
              </h3>
              <p className="mt-2 text-gray-500">
                You haven't classified any questions yet. Start by asking a
                question!
              </p>
              <button
                onClick={() => navigate("/ask")}
                className="mt-6 rounded-md bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-500"
              >
                Ask a Question
              </button>
            </div>
          )}

          {!isLoading && !error && foldersList.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {foldersList.map((folder) => (
                <button
                  key={folder.slug}
                  // CRITICAL FIX: encodeURIComponent ensures Hebrew/Symbols are safely passed to the URL
                  onClick={() =>
                    navigate(
                      `/questions/folder/${encodeURIComponent(folder.slug)}`,
                    )
                  }
                  className="group flex flex-col items-start gap-4 rounded-xl border border-gray-800 bg-gray-900 p-6 text-left transition hover:border-emerald-500 hover:bg-gray-950 hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="rounded-lg bg-emerald-950/50 p-3 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Folder className="h-8 w-8" />
                    </div>
                    <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold tracking-wide text-gray-300 group-hover:border-emerald-700">
                      {folder.count}{" "}
                      {folder.count === 1 ? "Question" : "Questions"}
                    </span>
                  </div>

                  <div className="w-full">
                    <h3 className="truncate text-xl font-semibold text-white group-hover:text-emerald-400 transition">
                      {folder.categoryName}
                    </h3>
                  </div>
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
