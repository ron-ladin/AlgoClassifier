import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  Folder,
} from "lucide-react";
import { getHistory } from "../api/services";
import type { QuestionSummary } from "../types/api";

// Reusable UI components
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";

/**
 * Safe slug generator for Hebrew and special characters.
 */
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

const FolderDetailsPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch history data on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const data = await getHistory();
        setAllQuestions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch content.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void fetchQuestions();
  }, []);

  // Filter questions that belong to this specific folder slug
  const folderQuestions = useMemo(() => {
    if (!allQuestions.length || !slug) return [];
    return allQuestions.filter((q) => generateSlug(q.categoryName) === slug);
  }, [allQuestions, slug]);

  // Safe title extraction
  const displayTitle =
    folderQuestions.length > 0
      ? folderQuestions[0].categoryName
      : "Folder Content";

  // Auto-redirect if folder is empty after loading
  useEffect(() => {
    if (!isLoading && !error && folderQuestions.length === 0) {
      navigate("/questions", { replace: true });
    }
  }, [isLoading, error, folderQuestions.length, navigate]);

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-white sm:px-6 lg:px-8 relative z-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader
          title={displayTitle}
          backPath="/questions"
          subtitle={
            !isLoading &&
            !error && (
              <span>{folderQuestions.length} Problem(s) classified here</span>
            )
          }
        />

        <main>
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
            </div>
          )}

          {!isLoading && error && (
            <GlassCard className="p-10 text-center text-red-400 border-red-900/30 bg-red-950/20">
              <AlertCircle className="mb-4 mx-auto h-12 w-12 opacity-80" />
              <p className="text-xl font-medium mb-6">{error}</p>
            </GlassCard>
          )}

          {!isLoading && !error && folderQuestions.length > 0 && (
            <div className="flex flex-col gap-5">
              {folderQuestions.map((question) => (
                <GlassCard
                  key={question.id}
                  isInteractive={true}
                  onClick={() => navigate(`/questions/detail/${question.id}`)}
                  className="group p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="flex items-start sm:items-center gap-5">
                    <div className="rounded-2xl bg-gray-800/50 p-3 text-brand-primary group-hover:bg-brand-primary/20 group-hover:scale-110 transition-all">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-brand-primary transition-colors">
                        {question.catchyTitle}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm font-bold text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details &rarr;
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FolderDetailsPage;
