import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Brain,
  Clock,
  Target,
  List,
  Tag,
  AlignLeft,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { getQuestionDetails, deleteQuestion } from "../api/services";
import type { QuestionDetailResponse } from "../types/api";

const QuestionDetailPage = () => {
  const navigate = useNavigate();
  // Extract the question ID from the URL parameters
  const { id } = useParams<{ id: string }>();

  // State initialization for managing the fetch lifecycle
  const [question, setQuestion] = useState<QuestionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for handling the destructive action (Deletion)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * Fetches the complete question details from the backend upon component mount.
   */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!id) throw new Error("No question ID provided in the URL.");

        setIsLoading(true);
        setError(null);

        const data = await getQuestionDetails(id);
        setQuestion(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load question details. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDetails();
  }, [id]);

  /**
   * Intelligent Back Navigation:
   * Uses history stack navigation to return the user exactly where they came from.
   */
  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/questions");
    }
  };

  /**
   * Executes the deletion request to the backend.
   * Upon success, it automatically routes the user back to their previous context.
   */
  const handleConfirmDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      setError(null);

      await deleteQuestion(id);

      // Navigate back after successful deletion.
      // The parent folder component will automatically re-fetch its contents.
      handleGoBack();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete the question.",
      );
      setShowDeleteModal(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      {/* Delete Confirmation Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-4" dir="rtl">
              <div className="rounded-full bg-red-950/50 p-3 text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">מחיקת שאלה?</h3>
            </div>
            <p className="mb-8 text-gray-400" dir="rtl">
              פעולה זו אינה הפיכה. היא תסיר לצמיתות את הניתוח והלוגיקה עבור "
              {question?.catchyTitle}".
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    מחיקה לצמיתות
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Header */}
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-indigo-400">
                Problem Analysis
              </h1>
              <p className="text-gray-400 mt-1">
                Detailed algorithmic breakdown and logical chronologies.
              </p>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          {!isLoading && !error && question && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="group flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-500 hover:bg-red-950/40 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 transition group-hover:scale-110" />
              Delete
            </button>
          )}
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-gray-400 font-mono text-sm animate-pulse">
              Loading analysis data...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-800/50 bg-red-950/20 p-8 text-center text-red-400">
            <AlertCircle className="mb-4 h-10 w-10 opacity-80" />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-md border border-red-800 px-6 py-2 text-sm transition hover:bg-red-900/40"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Rendering */}
        {!isLoading && !error && question && (
          <main className="space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">
              <div dir="rtl">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-6">
                  {question.catchyTitle}
                </h2>

                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950/50 px-4 py-1.5 text-sm font-medium text-emerald-400">
                    <Tag className="h-4 w-4" />
                    {question.categoryName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-800 bg-indigo-950/50 px-4 py-1.5 text-sm font-medium text-indigo-400">
                    <Brain className="h-4 w-4" />
                    {question.specificTechnique}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800 bg-amber-950/50 px-4 py-1.5 text-sm font-medium text-amber-400">
                    <Clock className="h-4 w-4" />
                    {question.runtimeComplexity}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 shadow-lg shadow-indigo-900/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-md bg-indigo-500/20 p-2 text-indigo-400">
                      <Target className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-300">
                      The Punchline
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed" dir="rtl">
                    {question.thePunchline}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-md bg-gray-800 p-2 text-gray-400">
                      <AlignLeft className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-200">
                      Original Problem
                    </h3>
                  </div>
                  <div
                    className="prose prose-invert max-w-none text-gray-400 text-sm whitespace-pre-wrap rounded-lg bg-gray-950 p-4 border border-gray-800/50"
                    dir="rtl"
                  >
                    {question.originalText}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="h-full rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-md bg-emerald-500/20 p-2 text-emerald-400">
                      <List className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-300">
                      Chronological Logic
                    </h3>
                  </div>
                  <div
                    className="prose prose-invert max-w-none text-gray-300 leading-loose whitespace-pre-wrap"
                    dir="rtl"
                  >
                    {question.chronologicalLogic}
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;
