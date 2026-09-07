import { redirect } from "next/navigation";

export default async function LearnContentIndexPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  redirect(`/learn/${contentId}/0`);
}
