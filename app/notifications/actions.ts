"use server";

import { revalidatePath } from "next/cache";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api/learn";

export async function markAsRead(notificationId: string) {
  const success = await markNotificationAsRead(notificationId);
  if (success) {
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
  }
  return success;
}

export async function markAllAsRead() {
  const result = await markAllNotificationsAsRead();
  if (result.success) {
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
  }
  return result;
}
