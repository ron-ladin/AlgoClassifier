import { useState, useEffect, useRef } from "react";
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
  MessageSquare,
  Send,
  User,
} from "lucide-react";
// הוספנו כאן את getSimilarQuestions
import {
  getQuestionDetails,
  askTutorQuestion,
  getSimilarQuestions,
} from "../api/services";
import type {
  QuestionDetailResponse,
  TutorMessage,
  QuestionSummary,
} from "../types/api";
import ZoomableImage from "../components/ZoomableImage";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";

const QuestionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [question, setQuestion] = useState<QuestionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [similarQuestions, setSimilarQuestions] = useState<QuestionSummary[]>(
    [],
  );

  const [expandedSection, setExpandedSection] = useState<
    "intuitive" | "formal" | null
  >(null);

  // --- Tutor Chat State ---
  const [chatHistory, setChatHistory] = useState<TutorMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית למטה כשיש הודעה חדשה בצ'אט
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!id) throw new Error("No question ID provided.");
        setIsLoading(true);

        // 1. שליפת פרטי השאלה המרכזית
        const data = await getQuestionDetails(id);
        setQuestion(data);
        if (data.tutorHistory) {
          setChatHistory(data.tutorHistory);
        }

        // 2. ניסיון לשליפת שאלות דומות (ברקע)
        try {
          const similarData = await getSimilarQuestions(id);
          setSimilarQuestions(similarData);
        } catch (simErr) {
          console.error("Failed to load similar questions:", simErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDetails();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !id) return;

    const userText = currentMessage.trim();
    setCurrentMessage("");
    setIsTyping(true);

    const tempUserMessage: TutorMessage = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, tempUserMessage]);

    try {
      const aiReply = await askTutorQuestion(id, userText);
      setChatHistory((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error("Failed to fetch tutor response:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: "מצטער, הייתה שגיאה בתקשורת עם השרת. נסה שוב מאוחר יותר.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-white sm:px-6 lg:px-8 relative z-10">
      <div className="mx-auto max-w-6xl space-y-8">
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
                {/* Left Column */}
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

                {/* Right Column */}
                <div
                  className={`${expandedSection ? "lg:col-span-1" : "lg:col-span-2"} space-y-6`}
                >
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

              {/* --- רכיב ה-AI Tutor --- */}
              {!expandedSection && (
                <div className="mt-8">
                  <GlassCard className="p-6 md:p-8 border-brand-primary/20 bg-brand-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="h-6 w-6 text-brand-primary" />
                      <h3 className="text-xl font-bold text-brand-primary">
                        AI Tutor
                      </h3>
                      <p className="text-sm text-gray-400 mr-auto">
                        Ask any follow-up questions about this algorithm
                      </p>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="h-80 overflow-y-auto mb-4 p-4 rounded-xl bg-gray-950/50 border border-surface-border flex flex-col gap-4">
                      {chatHistory.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                          <Brain className="h-12 w-12 mb-3 opacity-20" />
                          <p dir="rtl">
                            יש משהו לא ברור בהוכחה? שאל אותי עכשיו!
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex w-full ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl p-4 flex gap-3 ${
                                msg.role === "ai"
                                  ? "bg-surface-elevated border border-surface-border text-gray-300"
                                  : "bg-brand-primary/20 border border-brand-primary/30 text-white"
                              }`}
                              dir="rtl"
                            >
                              <div className="mt-1 flex-shrink-0">
                                {msg.role === "ai" ? (
                                  <Brain className="h-5 w-5 text-brand-primary" />
                                ) : (
                                  <User className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isTyping && (
                        <div className="flex w-full justify-start">
                          <div
                            className="bg-surface-elevated border border-surface-border rounded-2xl p-4 flex gap-3 items-center"
                            dir="rtl"
                          >
                            <Brain className="h-5 w-5 text-brand-primary animate-pulse" />
                            <span className="text-sm text-gray-400 animate-pulse">
                              ה-Tutor מקליד...
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                      onSubmit={handleSendMessage}
                      className="relative flex items-center"
                    >
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="שאל שאלת המשך על הבעיה..."
                        dir="rtl"
                        className="w-full bg-gray-950/50 border border-surface-border rounded-xl py-4 pr-4 pl-14 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                        disabled={isTyping}
                      />
                      <button
                        type="submit"
                        disabled={isTyping || !currentMessage.trim()}
                        className="absolute left-2 p-2 rounded-lg bg-brand-primary hover:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5 text-white" />
                      </button>
                    </form>
                  </GlassCard>
                </div>
              )}

              {/* --- NEW: Similar Questions Section --- */}
              {similarQuestions.length > 0 && !expandedSection && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-6" dir="rtl">
                    <Brain className="h-6 w-6 text-amber-400" />
                    <h3 className="text-xl font-bold text-amber-400">
                      שאלות דומות מאותו סוג
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {similarQuestions.map((sq) => (
                      <GlassCard
                        key={sq.id}
                        className="p-5 hover:border-amber-400/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/questions/${sq.id}`)}
                      >
                        <div dir="rtl">
                          <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">
                            {sq.catchyTitle}
                          </h4>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-300">
                            <Tag className="h-3 w-3" /> {sq.categoryName}
                          </span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestionDetailPage;
