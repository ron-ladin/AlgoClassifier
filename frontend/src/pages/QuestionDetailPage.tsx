import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Brain,
  Clock,
  Target,
  List,
  Tag,
  AlignLeft,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { getQuestionDetails } from "../api/services";
import type { QuestionDetailResponse } from "../types/api";
import ZoomableImage from "../components/ZoomableImage";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";

const QuestionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [question, setQuestion] = useState<QuestionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Focus Mode State: tracks which section is currently expanded ('intuitive', 'formal', or null)
  const [expandedSection, setExpandedSection] = useState<
    "intuitive" | "formal" | null
  >(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!id) throw new Error("No question ID provided.");
        setIsLoading(true);
        const data = await getQuestionDetails(id);
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDetails();
  }, [id]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-white sm:px-6 lg:px-8 relative z-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header - Hidden in Focus Mode to give more space */}
        {!expandedSection && (
          <PageHeader
            title="Problem Analysis"
            backPath="/questions"
            subtitle="Deep dive into algorithmic logic and formal proofs."
          />
        )}

        <main className="space-y-6">
          {question && (
            <>
              {/* Top Info Bar - Hidden in Focus Mode */}
              {!expandedSection && (
                <GlassCard className="p-6 md:p-8">
                  <div dir="rtl">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-6">
                      {question.catchyTitle}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950/50 px-4 py-1.5 text-sm font-medium text-emerald-400">
                        <Tag className="h-4 w-4" /> {question.categoryName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800 bg-amber-950/50 px-4 py-1.5 text-sm font-medium text-amber-400">
                        <Clock className="h-4 w-4" />{" "}
                        {question.runtimeComplexity}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )}

              <div
                className={`grid grid-cols-1 gap-6 ${expandedSection ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}
              >
                {/* Left Column: Guiding Theorem & Original Problem (Hidden if Formal is expanded) */}
                {(!expandedSection || expandedSection === "intuitive") && (
                  <div
                    className={`space-y-6 ${expandedSection === "intuitive" ? "hidden" : "lg:col-span-1"}`}
                  >
                    <GlassCard className="p-6 border-indigo-500/30 bg-indigo-950/20">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-indigo-300">
                          Guiding Theorem
                        </h3>
                      </div>
                      <p
                        className="text-gray-300 leading-relaxed font-medium"
                        dir="rtl"
                      >
                        {question.thePunchline}
                      </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlignLeft className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-200">
                          Original Problem
                        </h3>
                      </div>
                      <div
                        className="text-gray-400 text-sm whitespace-pre-wrap bg-gray-950/50 p-4 rounded-xl border border-surface-border"
                        dir="rtl"
                      >
                        {question.originalText}
                      </div>
                      {question.imageUrl && (
                        <div className="mt-4 pt-4 border-t border-surface-border">
                          <ZoomableImage imageUrl={question.imageUrl} />
                        </div>
                      )}
                    </GlassCard>
                  </div>
                )}

                {/* Right Column: Intuitive & Formal Answers */}
                <div
                  className={`${expandedSection ? "lg:col-span-1" : "lg:col-span-2"} space-y-6`}
                >
                  {/* INTUITIVE APPROACH */}
                  {(!expandedSection || expandedSection === "intuitive") && (
                    <GlassCard
                      className={`p-6 shadow-lg transition-all duration-500 ${expandedSection === "intuitive" ? "min-h-[70vh]" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain className="h-6 w-6 text-blue-400" />
                          <h3 className="text-xl font-bold text-blue-300">
                            Intuitive Approach
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            setExpandedSection(
                              expandedSection ? null : "intuitive",
                            )
                          }
                          className="p-2 hover:bg-surface-hover rounded-full text-gray-400 transition-colors"
                        >
                          {expandedSection === "intuitive" ? (
                            <Minimize2 className="h-5 w-5" />
                          ) : (
                            <Maximize2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <div
                        className={`prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap ${expandedSection === "intuitive" ? "text-lg" : "text-base"}`}
                        dir="rtl"
                      >
                        {question.specificTechnique}
                      </div>
                    </GlassCard>
                  )}

                  {/* FORMAL PROOF & LOGIC */}
                  {(!expandedSection || expandedSection === "formal") && (
                    <GlassCard
                      className={`p-6 shadow-lg transition-all duration-500 ${expandedSection === "formal" ? "min-h-[80vh]" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <List className="h-7 w-7 text-emerald-400" />
                          <h3 className="text-2xl font-bold text-emerald-300">
                            Formal Proof & Logic
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            setExpandedSection(
                              expandedSection ? null : "formal",
                            )
                          }
                          className="p-2 hover:bg-surface-hover rounded-full text-gray-400 transition-colors"
                        >
                          {expandedSection === "formal" ? (
                            <Minimize2 className="h-5 w-5" />
                          ) : (
                            <Maximize2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <div
                        className={`prose prose-invert max-w-none text-gray-200 leading-loose whitespace-pre-wrap ${expandedSection === "formal" ? "text-xl" : "text-base"}`}
                        dir="rtl"
                      >
                        {question.chronologicalLogic}
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestionDetailPage;
