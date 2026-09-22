"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { completeLearnContent, saveLearnProgress } from "@/lib/api/learn";

function isValidItemId(id: string): boolean {
  // Check if it's a valid CMS entry ID (not just a numeric index)
  // Valid IDs are typically alphanumeric strings with specific patterns
  // Reject simple numeric strings like "0", "1", "2"
  return id.length > 0 && !/^\d+$/.test(id);
}

export async function completeContent(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const contentId = String(formData.get("contentId") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const answer = formData.get("answer");

  if (!contentId) {
    return { error: "This course could not be completed." };
  }

  const patch: Parameters<typeof completeLearnContent>[1] = {
    action: "complete",
  };

  if (itemId && typeof answer === "string") {
    if (!isValidItemId(itemId)) {
      console.error("[learn] Invalid item ID format", { contentId, itemId });
      return { error: "Invalid question ID. Please contact support." };
    }
    
    patch.currentItemId = itemId;
    patch.items = {
      [itemId]: {
        answer,
        status: "completed",
      },
    };
  }

  try {
    await completeLearnContent(contentId, patch);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/auth/sign-in");
    }

    if (error instanceof ApiError && error.status === 409) {
      redirect("/dashboard");
    }

    console.error("[learn] Failed to complete content", { contentId, error });
    return { error: "Could not complete this work. Try again." };
  }

  redirect("/dashboard");
}

export async function saveProgress(
  contentId: string,
  itemId: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  if (!contentId || !itemId) {
    return { success: false, error: "Invalid request" };
  }

  if (!isValidItemId(itemId)) {
    console.error("[learn] Invalid item ID format for auto-save", { contentId, itemId });
    return { success: false, error: "Invalid question ID" };
  }

  try {
    await saveLearnProgress(contentId, {
      action: "save",
      currentItemId: itemId,
      items: {
        [itemId]: {
          answer,
          status: "in_progress",
        },
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/auth/sign-in");
    }

    console.error("[learn] Failed to save progress", { contentId, itemId, error });
    return { success: false, error: "Failed to save" };
  }
}
