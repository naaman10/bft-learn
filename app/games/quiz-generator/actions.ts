"use server";

import { apiFetch, ApiError } from "@/lib/api/client";

export type QuizResult = {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeElapsed?: number;
  yearGroup?: string;
  subject?: string;
  difficulty?: string;
  answers?: Array<{
    questionId?: string;
    questionText?: string;
    correct: boolean;
    timeSpent?: number;
    userAnswer?: string;
  }>;
};

export type QuizSessionResponse = {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  savedAt: string;
};

/**
 * Save quiz completion results to the backend API.
 * 
 * @param results - Quiz completion data from the game iframe
 * @returns Session information including the saved session ID
 */
export async function saveQuizResults(results: QuizResult): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    console.log("[saveQuizResults] Attempting to save quiz results:", results);

    const response = await apiFetch<QuizSessionResponse>(
      "/quiz-generator/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          score: results.score,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.correctAnswers,
          timeElapsed: results.timeElapsed,
          yearGroup: results.yearGroup,
          subject: results.subject,
          difficulty: results.difficulty,
          answers: results.answers,
        }),
      }
    );

    console.log("[saveQuizResults] Successfully saved quiz results:", response);

    return {
      success: true,
      sessionId: response.sessionId,
    };
  } catch (error) {
    console.error("[saveQuizResults] Failed to save quiz results:", error);

    if (error instanceof ApiError) {
      if (error.status === 404) {
        return {
          success: false,
          error: "Quiz API endpoint not found. The backend may not have quiz result endpoints implemented yet.",
        };
      }
      if (error.status === 401) {
        return {
          success: false,
          error: "Authentication failed. Please sign in again.",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save quiz results",
    };
  }
}

/**
 * Get quiz history for the current user.
 */
export async function getQuizHistory(): Promise<{
  success: boolean;
  sessions?: QuizSessionResponse[];
  error?: string;
}> {
  try {
    const sessions = await apiFetch<QuizSessionResponse[]>("/quiz-generator/sessions");

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    console.error("[getQuizHistory] Failed to fetch quiz history:", error);

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: "Quiz history endpoint not found.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quiz history",
    };
  }
}
