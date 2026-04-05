export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  question_ids: string[];
  createdAt: string;
}

export interface ClassifyRequest {
  text: string;
  image_base64?: string;
}

export interface QuestionSummary {
  id: string;
  catchyTitle: string;
  categoryName: string;
  specificTechnique: string;
  runtimeComplexity: string;
  createdAt: string;
}

export interface QuestionDetailResponse {
  // Added the missing fields to align with the backend schema and UI requirements
  id: string;
  originalText: string;
  catchyTitle: string;
  categoryName: string;
  specificTechnique: string;
  chronologicalLogic: string;
  thePunchline: string;
  runtimeComplexity: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}
