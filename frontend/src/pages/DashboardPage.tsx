import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  Brain,
  Sparkles,
} from "lucide-react";

// Shared UI Components
import DashboardLayout from "../components/layout/DashboardLayout";
import SidebarHistory from "../components/SidebarHistory";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";

import { useAuth } from "../context/useAuth";
import { classifyQuestion } from "../api/services";
import type { QuestionDetailResponse } from "../types/api";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const DashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionDetailResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !selectedFile) {
      setError("Please provide text or an image.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      let base64Image: string | undefined = undefined;
      if (selectedFile) base64Image = await convertFileToBase64(selectedFile);

      const response = await classifyQuestion(text, base64Image);
      if (response && response.id) {
        navigate(`/questions/detail/${response.id}`);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout sidebar={<SidebarHistory onSelectQuestion={setResult} />}>
      <div className="mx-auto max-w-4xl space-y-10 relative z-10">
        <PageHeader
          title="Analyze Problem"
          subtitle="Upload an image or paste your algorithmic challenge for a formal breakdown."
          backPath="/"
        />

        <main className="space-y-8">
          {error && (
            <GlassCard className="border-red-900/30 bg-red-950/20 p-4 text-red-400 flex items-center gap-3">
              <p className="text-sm font-semibold">{error}</p>
            </GlassCard>
          )}

          <GlassCard className="p-8">
            <div className="space-y-8">
              {/* Text Input Area */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-brand-primary" />
                  Problem Description
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your question details here..."
                  className="min-h-[160px] w-full rounded-2xl border border-surface-border bg-gray-950/50 px-5 py-4 text-white placeholder-gray-600 outline-none transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Enhanced Dropzone */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                  <ImageIcon className="h-4 w-4 text-brand-secondary" />
                  Visual Context (Optional)
                </label>

                {!previewUrl ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0])
                        handleFileSelection(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-all ${
                      isDragging
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-surface-border bg-gray-950/30 hover:border-gray-500 hover:bg-gray-900/50"
                    }`}
                  >
                    <UploadCloud
                      className={`mb-4 h-12 w-12 ${isDragging ? "text-brand-primary" : "text-gray-600 group-hover:text-gray-400"}`}
                    />
                    <p className="text-lg font-semibold text-gray-300">
                      Drag & Drop Image
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse local files
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          handleFileSelection(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-surface-border bg-gray-950/50 p-4">
                    <button
                      onClick={handleClearFile}
                      className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-6">
                      <div className="h-28 w-28 overflow-hidden rounded-xl border border-surface-border shadow-2xl">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-brand-secondary">
                          Image Ready for Analysis
                        </p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                          {selectedFile?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end border-t border-surface-border pt-8">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={isLoading || (!text.trim() && !selectedFile)}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-500 disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 transition-transform group-hover:scale-120" />
                      Classify & Solve
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
