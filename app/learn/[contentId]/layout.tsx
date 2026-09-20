import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import {
  getCourseReferenceMaterial,
  getLearnContent,
  referenceTabLabel,
} from "@/lib/api/learn";
import { AppShell } from "@/app/app-shell";
import { LearnCourseFrame } from "@/app/learn/learn-course-frame";
import { SectionBody } from "@/app/learn/section-body";

export const dynamic = "force-dynamic";

export default async function LearnContentLayout({
  children,
  params,
}: LayoutProps<"/learn/[contentId]">) {
  const { data: session } = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (!(await hasCredentialAccount())) {
    redirect("/auth/set-password");
  }

  const { contentId } = await params;
  const result = await getLearnContent(contentId);
  const referenceMaterial = result.ok
    ? getCourseReferenceMaterial(result.data)
    : [];
  const referenceTabs = referenceMaterial.map((item, index) => ({
    id: item.entryId ?? String(index),
    label: referenceTabLabel(item, index),
  }));
  const referencePanels = referenceMaterial.map((item, index) => (
    <SectionBody
      key={item.entryId ?? String(index)}
      section={item}
      variant="reference"
    />
  ));

  return (
    <AppShell>
      <LearnCourseFrame
        contentId={contentId}
        referenceTabs={referenceTabs}
        referencePanels={referencePanels}
      >
        {children}
      </LearnCourseFrame>
    </AppShell>
  );
}
