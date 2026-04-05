import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Home,
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Brain,
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import SidebarHistory from "../components/SidebarHistory";
import { useAuth } from "../context/useAuth";
import { classifyQuestion } from "../api/services";
import type { QuestionDetailResponse } from "../types/api";

// Configurable constants for file validation
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Utility function to convert a File object into a Base64 string.
 * Wrapped in a Promise to allow async/await usage during the submit phase.
 */
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

  // Input states
  const [text, setText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // UI and Lifecycle states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionDetailResponse | null>(null);

  // Hidden file input reference for manual uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates the selected file against defined constraints (type and size).
   * Sets local state and generates a preview URL if valid.
   */
  const handleFileSelection = (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPEG, etc.).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setSelectedFile(file);

    // Create a temporary object URL strictly for UI preview purposes
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  /**
   * Clears the current file selection and revokes the object URL to prevent memory leaks.
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input value
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  /**
   * Main submission handler.
   * Orchestrates base64 conversion (only when needed) and API communication.
   */
  const handleSubmit = async () => {
    if (!text.trim() && !selectedFile) {
      setError("Please provide either text or an image to analyze.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let base64Image: string | undefined = undefined;

      // Perform the heavy base64 conversion ONLY at submission time
      if (selectedFile) {
        base64Image = await convertFileToBase64(selectedFile);
      }

      // We explicitly clear the previous result to show loading context
      setResult(null);

      const response = await classifyQuestion(text, base64Image);

      // Automatic redirection to the detail page upon successful classification
      // Assuming the backend returns the 'id' in the response.
      if (response && (response as any).id) {
        navigate(`/questions/detail/${(response as any).id}`);
      } else {
        // Fallback if ID is not immediately available, just show it locally
        setResult(response);
      }

      // Clean up inputs after successful submission
      setText("");
      handleClearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout sidebar={<SidebarHistory onSelectQuestion={setResult} />}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Section */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Ask a Question</h1>
            <p className="text-gray-400">
              Upload an image or paste your algorithmic problem.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-indigo-500 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Input Form Section */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          {/* Error Display */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-800/50 bg-red-950/30 p-4 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Text Input Area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Problem Text (Optional if image provided)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your question here..."
                className="min-h-[120px] w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Drag & Drop Image Upload Area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Image Attachment (Max {MAX_FILE_SIZE_MB}MB)
              </label>

              {!previewUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-950/20"
                      : "border-gray-700 bg-gray-950 hover:border-gray-500 hover:bg-gray-900"
                  }`}
                >
                  <UploadCloud
                    className={`mb-3 h-10 w-10 ${isDragging ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-400"}`}
                  />
                  <p className="text-sm font-medium text-gray-300">
                    Drag and drop an image, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Supports PNG, JPG, JPEG
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleManualFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative inline-block w-full rounded-xl border border-gray-700 bg-gray-950 p-4">
                  <button
                    onClick={handleClearFile}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-gray-400 transition hover:bg-red-900 hover:text-red-400"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 text-sm font-medium text-indigo-400">
                        <ImageIcon className="h-4 w-4" />
                        Image Attached
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {selectedFile?.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => void handleSubmit()}
                disabled={isLoading || (!text.trim() && !selectedFile)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    Classify Problem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Local Result Fallback (if redirection is not instant) */}
        {result && !isLoading && (
          <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6 text-emerald-400 text-center">
            <p className="font-medium">
              Classification successful! Redirecting to details...
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
