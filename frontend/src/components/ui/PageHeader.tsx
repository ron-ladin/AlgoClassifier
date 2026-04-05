import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  backPath?: string; // Where the back button goes
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backPath = "/",
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-8">
      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate(backPath)}
          className="group flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-surface-border backdrop-blur-md transition-all hover:bg-surface-hover hover:border-gray-500"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
        </button>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 mt-2 text-sm sm:text-base font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
