import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasCredentialAccount } from "@/lib/auth/accounts";
import {
  getCourseReferenceMaterial,
  getCourseSections,
  getLearnContent,
  kidProgressLabel,
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
  const title = result.ok
    ? result.data.content.name.trim() ||
      result.data.content.entryName.trim() ||
      "Assigned work"
    : "Unable to open course";
  const tags = result.ok
    ? [
        result.data.content.subject,
        result.data.content.stage,
      ].filter((value) => value?.trim())
    : [];
  const sectionCount = result.ok
    ? getCourseSections(result.data).length
    : 0;

  return (
    <AppShell>
      <LearnCourseFrame
        contentId={contentId}
        title={title}
        progressLabel={
          result.ok ? kidProgressLabel(result.data.progressStatus) : null
        }
        tags={tags}
        sectionCount={sectionCount}
        referenceTabs={referenceTabs}
        referencePanels={referencePanels}
      >
        {children}
      </LearnCourseFrame>
    </AppShell>
  );
}
