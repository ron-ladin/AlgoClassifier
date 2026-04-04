import { useNavigate } from "react-router-dom";
import { BookOpen, HelpCircle, Users, LogOut } from "lucide-react";
import FloatingBackground from "../components/FloatingBackground";
import { useAuth } from "../context/useAuth";

const LandingPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-950 px-6 text-white overflow-hidden">
      <FloatingBackground />

      {/* Header remain as it is */}
      <header className="z-20 flex w-full items-center justify-between py-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          AlgoClassifier
        </h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-950/20 px-3 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white hover:bg-gray-950/60"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </header>

      {/* Main content - THE REFACTOR */}
      <main className="z-10 flex flex-1 flex-col items-center justify-center py-10">
        {/* Central Title Section with Readability Fix */}
        <div className="mx-auto w-full max-w-4xl text-center mb-16 space-y-3">
          {/* WELCOME TO YOUR HUB - THE FIX */}
          <h2
            className="text-6xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-indigo-100 to-emerald-100 bg-clip-text text-transparent"
            style={{
              // אפקט "Glow" ו-Shadow כדי להפריד את הטקסט לחלוטין מן הרקע
              textShadow:
                "0 0 15px rgba(129, 140, 248, 0.7), 0 0 30px rgba(16, 185, 129, 0.4), 0 0 50px rgba(129, 140, 248, 0.2)",
            }}
          >
            WELCOME TO YOUR HUB
          </h2>

          <p className="mx-auto max-w-2xl text-xl text-gray-300 font-medium">
            Your central repository for algorithmic problems. Save, classify,
            and share.
          </p>
        </div>

        {/* שלוש קוביות הלחיצה, עכשיו עם יותר עומק */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-5xl">
          {/* Ask a Question - Integrated */}
          <button
            onClick={() => navigate("/ask")}
            // הוספת backdrop-blur-md ו-bg-gray-950/40 לכל כפתור בנפרד לקריאות טובה יותר
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-800 bg-gray-950/40 p-8 text-center transition backdrop-blur-md hover:border-indigo-500 hover:bg-indigo-950/50 hover:shadow-[0_0_30px_rgba(129,140,248,0.3)]"
          >
            <div className="rounded-full bg-indigo-900/60 p-5 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition hover:scale-105">
              <HelpCircle className="h-9 w-9" />
            </div>
            <div className="text-2xl font-semibold">Ask a Question</div>
            <div className="text-base text-gray-400">Analyze a new problem</div>
          </button>

          {/* My Questions - Integrated */}
          <button
            onClick={() => navigate("/questions")}
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-800 bg-gray-950/40 p-8 text-center transition backdrop-blur-md hover:border-emerald-500 hover:bg-emerald-950/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            <div className="rounded-full bg-emerald-900/60 p-5 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition hover:scale-105">
              <BookOpen className="h-9 w-9" />
            </div>
            <div className="text-2xl font-semibold">My Questions</div>
            <div className="text-base text-gray-400">View your folders</div>
          </button>

          {/* Study Groups (Coming Soon) - Integrated but disabled */}
          <button
            disabled
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-800 bg-gray-950/20 p-8 text-center opacity-60 cursor-not-allowed"
          >
            <div className="rounded-full bg-gray-800 p-5 text-gray-500">
              <Users className="h-9 w-9" />
            </div>
            <div className="text-2xl font-semibold text-gray-400">
              Study Groups
            </div>
            <div className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
              Coming Soon
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
