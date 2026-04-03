import axios, { AxiosError } from 'axios';
import axiosClient from './axiosClient';
import type {
  ApiErrorResponse,
  ClassifyRequest,
  LoginCredentials,
  LoginResponse,
  QuestionDetailResponse,
  QuestionSummary,
  RegisterRequest,
  RegisterResponse,
} from '../types/api';

const normalizeQuestionSummary = (
  item: Record<string, unknown>,
  fallbackIndex: number,
): QuestionSummary => {
  return {
    id:
      typeof item.id === 'string'
        ? item.id
        : typeof item._id === 'string'
          ? item._id
          : `fallback-${fallbackIndex}`,
    catchyTitle: typeof item.catchyTitle === 'string' ? item.catchyTitle : 'Untitled',
    categoryName: typeof item.categoryName === 'string' ? item.categoryName : 'Unknown',
    specificTechnique:
      typeof item.specificTechnique === 'string' ? item.specificTechnique : 'Unknown',
    runtimeComplexity:
      typeof item.runtimeComplexity === 'string' ? item.runtimeComplexity : 'Unknown',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  };
};

const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Unexpected error occurred.';
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  return (
    axiosError.response?.data?.detail ||
    axiosError.response?.data?.message ||
    axiosError.message ||
    'Request failed.'
  );
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const body = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    });

    const response = await axiosClient.post<LoginResponse>('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const register = async (user: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await axiosClient.post<RegisterResponse>('/auth/register', user);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const classifyQuestion = async (text: string): Promise<QuestionDetailResponse> => {
  try {
    const payload: ClassifyRequest = { text };
    const response = await axiosClient.post<QuestionDetailResponse>('/questions/classify', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getHistory = async (): Promise<QuestionSummary[]> => {
  try {
    const response = await axiosClient.get<unknown>('/questions/history');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid history payload from server.');
    }

    return response.data.map((item, index) =>
      normalizeQuestionSummary(item as Record<string, unknown>, index),
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const getQuestionDetails = async (id: string): Promise<QuestionDetailResponse> => {
  try {
    if (!id.trim()) {
      throw new Error('Question id is required.');
    }

    const response = await axiosClient.get<QuestionDetailResponse>(`/questions/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
