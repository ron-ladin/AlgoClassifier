import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import { getHistory } from "../api/services";
import type { QuestionSummary } from "../types/api";

/**
 * Normalizes a given string to a URL-friendly slug supporting Unicode.
 * This MUST mirror the implementation in QuestionsFoldersPage precisely
 * to ensure deterministic O(1) string matching against the decoded URL parameter.
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

const FolderDetailsPage = () => {
  const navigate = useNavigate();

  // Extract the specific folder slug from the URL parameters defined in AppRoutes.
  // Note: react-router-dom automatically decodes the URI component here.
  const { slug } = useParams<{ slug: string }>();

  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getHistory();
        setAllQuestions(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch folder contents.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchQuestions();
  }, []);

  const folderQuestions = useMemo(() => {
    if (!allQuestions.length || !slug) return [];

    return allQuestions.filter((question) => {
      const categoryName = question.categoryName || "Uncategorized";
      const questionSlug = generateSlug(categoryName);
      // Strictly compare the calculated slug to the decoded URL slug
      return questionSlug === slug;
    });
  }, [allQuestions, slug]);

  const displayTitle =
    folderQuestions.length > 0
      ? folderQuestions[0].categoryName
      : "Folder Details";

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/questions")}
              className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
              aria-label="Back to folders"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-emerald-400">
                {displayTitle}
              </h1>
              <p className="text-gray-400 mt-1">
                {!isLoading && !error && (
                  <span>
                    {folderQuestions.length}{" "}
                    {folderQuestions.length === 1 ? "Problem" : "Problems"}{" "}
                    stored
                  </span>
                )}
              </p>
            </div>
          </div>
        </header>

        <main>
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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

          {!isLoading && !error && folderQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/30 py-20 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-300">
                No questions found
              </h3>
              <p className="mt-2 text-gray-500">
                This folder appears to be empty or the URL is invalid.
              </p>
            </div>
          )}

          {!isLoading && !error && folderQuestions.length > 0 && (
            <div className="flex flex-col gap-4">
              {folderQuestions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => navigate(`/questions/detail/${question.id}`)}
                  className="group flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 text-left transition hover:border-indigo-500 hover:bg-gray-950 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-lg bg-indigo-950/50 p-2 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition">
                        {question.catchyTitle}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-gray-300">
                          <Clock className="h-3 w-3" />
                          ID: {question.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden text-sm font-semibold text-indigo-500 opacity-0 transition group-hover:opacity-100 sm:block">
                    View Details &rarr;
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

export default FolderDetailsPage;
