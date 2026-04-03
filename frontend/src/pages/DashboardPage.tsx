import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SidebarHistory from '../components/SidebarHistory';
import ResultCard from '../components/ResultCard';
import { classifyQuestion } from '../api/services';
import { useAuth } from '../context/useAuth';
import type { QuestionDetailResponse } from '../types/api';

const DashboardPage = () => {
  const { logout } = useAuth();

  const [questionText, setQuestionText] = useState('');
  const [result, setResult] = useState<QuestionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    const trimmed = questionText.trim();

    if (trimmed.length < 10) {
      setError('Please paste a longer question (at least 10 characters).');
      return;
    }

    setIsLoading(true);
    try {
      const data = await classifyQuestion(trimmed);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      sidebar={<SidebarHistory onSelectQuestion={setResult} />}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">AlgoClassifier</h1>
            <p className="text-gray-400">Analyze algorithmic questions and get structured insights.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>

        <section className="rounded-xl border border-gray-800 bg-gray-950/70 p-4 md:p-5">
          <label htmlFor="question" className="mb-2 block text-sm font-medium text-gray-300">
            Paste algorithmic problem
          </label>
          <textarea
            id="question"
            rows={10}
            className="w-full resize-y rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none ring-indigo-500 transition focus:ring-2"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Describe the algorithmic problem in detail..."
            disabled={isLoading}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Analyze Algorithm
            </button>
            {error && <p className="text-sm text-red-300">{error}</p>}
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-950/70 p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-gray-800" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-gray-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-800" />
          </div>
        ) : result ? (
          <ResultCard result={result} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950/50 p-6 text-gray-400">
            No analysis yet. Submit a problem to see the AI classification.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
