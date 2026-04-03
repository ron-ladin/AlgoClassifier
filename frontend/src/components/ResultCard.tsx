import { Lightbulb } from 'lucide-react';
import type { QuestionDetailResponse } from '../types/api';

interface ResultCardProps {
  result: QuestionDetailResponse;
}

const splitChronologicalSteps = (logic: string): string[] => {
  return logic
    .split(/\n+/)
    .map((line) => line.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean);
};

const ResultCard = ({ result }: ResultCardProps) => {
  const steps = splitChronologicalSteps(result.chronologicalLogic);

  return (
    <article
      dir="rtl"
      className="rounded-xl border border-gray-800 bg-gray-950/70 p-6 text-right shadow-xl shadow-black/20"
    >
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full border border-indigo-600 bg-indigo-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
          {result.categoryName}
        </span>
        <span
          dir="ltr"
          className="rounded-full border border-emerald-700 bg-emerald-700/20 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200"
        >
          {result.specificTechnique}
        </span>
      </div>

      <h2 className="text-2xl font-bold text-white">{result.catchyTitle}</h2>

      <section className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Chronological Logic</h3>
        {steps.length > 0 ? (
          <ol className="mt-3 list-decimal space-y-2 pr-5 text-gray-200">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-gray-300">{result.chronologicalLogic}</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          <Lightbulb className="h-4 w-4" />
          The Punchline
        </h3>
        <p className="mt-2 text-amber-100">{result.thePunchline}</p>
      </section>

      <div className="mt-6">
        <span
          dir="ltr"
          className="inline-block rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300"
        >
          Runtime Complexity: {result.runtimeComplexity}
        </span>
      </div>
    </article>
  );
};

export default ResultCard;
