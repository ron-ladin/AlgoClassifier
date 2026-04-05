import axios, { AxiosError } from "axios";
import type {
  ApiErrorResponse,
  ClassifyRequest,
  LoginCredentials,
  LoginResponse,
  QuestionDetailResponse,
  QuestionSummary,
  RegisterRequest,
  RegisterResponse,
} from "../types/api";
import axiosClient from "./axiosClient";
import type { TutorResponse } from "../types/api";

const normalizeQuestionSummary = (
  item: Record<string, unknown>,
  fallbackIndex: number,
): QuestionSummary => {
  return {
    id:
      typeof item.id === "string"
        ? item.id
        : typeof item._id === "string"
          ? item._id
          : `fallback-${fallbackIndex}`,
    catchyTitle:
      typeof item.catchyTitle === "string" ? item.catchyTitle : "Untitled",
    categoryName:
      typeof item.categoryName === "string" ? item.categoryName : "Unknown",
    specificTechnique:
      typeof item.specificTechnique === "string"
        ? item.specificTechnique
        : "Unknown",
    runtimeComplexity:
      typeof item.runtimeComplexity === "string"
        ? item.runtimeComplexity
        : "Unknown",
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
  };
};

/**
 * Extracts and formats error messages from API responses.
 * Now handles complex validation errors from FastAPI seamlessly.
 */
const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return "Unexpected error occurred.";
  }

  const responseData = error.response?.data;

  // Handle FastAPI validation errors (which arrive as an array of objects in 'detail')
  if (responseData?.detail && Array.isArray(responseData.detail)) {
    const firstError = responseData.detail[0];
    const fieldName =
      firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : "Field";
    return `${fieldName}: ${firstError.msg}`;
  }

  // Handle standard string error details
  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  return responseData?.message || error.message || "Request failed.";
};

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  try {
    const body = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    });

    const response = await axiosClient.post<LoginResponse>(
      "/auth/login",
      body,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const register = async (
  user: RegisterRequest,
): Promise<RegisterResponse> => {
  try {
    const response = await axiosClient.post<RegisterResponse>(
      "/auth/register",
      user,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Sends a classification request to the backend.
 * Now supports an optional base64 image payload for multi-modal processing.
 */
export const classifyQuestion = async (
  text: string,
  imageBase64?: string,
): Promise<QuestionDetailResponse> => {
  try {
    const payload: ClassifyRequest = { text };

    // Inject the image into the payload only if it was provided
    if (imageBase64) {
      payload.image_base64 = imageBase64;
    }

    const response = await axiosClient.post<QuestionDetailResponse>(
      "/questions/classify",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getHistory = async (): Promise<QuestionSummary[]> => {
  try {
    const response = await axiosClient.get<unknown>("/questions/history");
    if (!Array.isArray(response.data)) {
      throw new Error("Invalid history payload from server.");
    }

    return response.data.map((item, index) =>
      normalizeQuestionSummary(item as Record<string, unknown>, index),
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getQuestionDetails = async (
  id: string,
): Promise<QuestionDetailResponse> => {
  try {
    if (!id.trim()) {
      throw new Error("Question id is required.");
    }

    const response = await axiosClient.get<QuestionDetailResponse>(
      `/questions/${encodeURIComponent(id)}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    if (!id.trim()) {
      throw new Error("Question id is required.");
    }

    await axiosClient.delete(`/questions/${encodeURIComponent(id)}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
/**
 * Sends a follow-up question to the AI Tutor backend.
 *
 * @param questionId The unique identifier of the algorithm question.
 * @param message The user's new question text.
 * @returns A Promise that resolves to the AI's response (TutorResponse).
 */
export const askTutorQuestion = async (
  questionId: string,
  message: string,
): Promise<TutorResponse> => {
  // We use our imported axiosClient to make a POST request to the correct endpoint.
  // We pass the user's message in the body of the request.
  const response = await axiosClient.post(`/questions/${questionId}/tutor`, {
    message,
  });

  // The backend sends back an object with the AI's role, content, and timestamp.
  // We extract and return just the data part.
  return response.data;
};

/**
 * Fetches up to 3 similar questions based on the algorithm's vector embedding.
 * This helps the user find related problems they have solved in the past.
 * * @param questionId The ID of the current question being viewed.
 * @returns A Promise containing an array of QuestionSummary objects.
 */
export const getSimilarQuestions = async (
  questionId: string,
): Promise<QuestionSummary[]> => {
  // Makes a GET request to our new semantic search endpoint
  const response = await axiosClient.get(`/questions/${questionId}/similar`);
  return response.data;
};
