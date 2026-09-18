"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { completeLearnContent } from "@/lib/api/learn";

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
