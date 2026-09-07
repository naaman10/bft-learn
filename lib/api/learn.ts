import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type Enrollment = {
  contentId: string;
  name: string;
  status: string;
  progressStatus: string;
  enrolledAt: string;
};

export type LearnUserResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
    role: string;
  } | null;
  enrollments?: Enrollment[];
  error?: string;
};

export type CourseSection = {
  contentType: string;
  entryId?: string;
  fields: Record<string, unknown>;
};

export type LearnContentResponse = {
  content: {
    entryId: string;
    name: string;
    type: string;
    subject: string;
    ageGroup: string;
    stage: string;
    entryName: string;
    fields: Record<string, unknown>;
  };
  progressStatus: ProgressStatus;
  progress: {
    version: 1;
    currentItemId?: string;
    items: Record<
      string,
      {
        status: ProgressStatus;
        answer?: unknown;
        score?: number;
        attempts?: number;
        completedAt?: string;
        updatedAt: string;
      }
    >;
  };
};

export type LearnContentResult =
  | { ok: true; data: LearnContentResponse }
  | { ok: false; status: number };

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function sectionContentType(section: Record<string, unknown>) {
  if (typeof section.contentType === "string" && section.contentType) {
    return section.contentType;
  }

  const sys = asRecord(section.sys);
  const contentType = asRecord(sys?.contentType);
  const contentTypeSys = asRecord(contentType?.sys);

  if (typeof contentTypeSys?.id === "string" && contentTypeSys.id) {
    return contentTypeSys.id;
  }

  return "unknown";
}

function sectionEntryId(section: Record<string, unknown>, index: number) {
  if (typeof section.entryId === "string" && section.entryId) {
    return section.entryId;
  }

  const sys = asRecord(section.sys);
  if (typeof sys?.id === "string" && sys.id) {
    return sys.id;
  }

  return String(index);
}

export function getCourseSections(data: LearnContentResponse): CourseSection[] {
  const fields = asRecord(data.content.fields);
  const sections = fields?.sections;

  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.flatMap((section, index) => {
    const record = asRecord(section);
    if (!record) {
      return [];
    }

    return [
      {
        contentType: sectionContentType(record),
        entryId: sectionEntryId(record, index),
        fields: asRecord(record.fields) ?? record,
      },
    ];
  });
}

export function progressLabel(status: string) {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status.replaceAll("_", " ");
  }
}

export async function getLearnUser(): Promise<LearnUserResponse | null> {
  try {
    return await apiFetch<LearnUserResponse>("/learn/user");
  } catch (error) {
    console.error("[learn] Failed to load user", error);
    return null;
  }
}

export const getLearnContent = cache(
  async (contentId: string): Promise<LearnContentResult> => {
    try {
      const data = await apiFetch<LearnContentResponse>(
        `/learn/content/${encodeURIComponent(contentId)}`
      );
      console.log(
        "[learn] GET /learn/content/:id",
        contentId,
        JSON.stringify(data, null, 2)
      );
      return { ok: true, data };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 503;
      console.error("[learn] Failed to load content", {
        contentId,
        status,
        error,
      });
      return { ok: false, status };
    }
  }
);
