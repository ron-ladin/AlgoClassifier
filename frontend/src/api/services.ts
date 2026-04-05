import axios, { AxiosError } from "axios";
import axiosClient from "./axiosClient";
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
