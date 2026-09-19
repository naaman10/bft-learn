import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Block, Document, Inline } from "@contentful/rich-text-types";
import { asRecord, type CourseSection } from "@/lib/api/learn";

function isDocument(value: unknown): value is Document {
  return Boolean(
    value &&
      typeof value === "object" &&
      "nodeType" in value &&
      value.nodeType === "document"
  );
}

function findRichTextDocument(fields: Record<string, unknown>): Document | null {
  for (const key of ["body", "content", "text"]) {
    if (isDocument(fields[key])) {
      return fields[key];
    }
  }

  for (const value of Object.values(fields)) {
    if (isDocument(value)) {
      return value;
    }
  }

  return null;
}

function absoluteUrl(url: string) {
  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return url;
}

function contentTypeOf(target: Record<string, unknown>) {
  if (typeof target.contentType === "string" && target.contentType) {
    return target.contentType;
  }

  const sys = asRecord(target.sys);
  const contentType = asRecord(sys?.contentType);
  const contentTypeSys = asRecord(contentType?.sys);

  return typeof contentTypeSys?.id === "string" ? contentTypeSys.id : "";
}

function fileFromAsset(asset: unknown) {
  const record = asRecord(asset);
  const fields = asRecord(record?.fields) ?? record;
  if (!fields) {
    return null;
  }

  const file = asRecord(fields.file);
  const rawUrl =
    (typeof fields.url === "string" && fields.url) ||
    (typeof file?.url === "string" && file.url);

  if (!rawUrl) {
    return null;
  }

  const details = asRecord(file?.details);
  const image = asRecord(details?.image);
  const width = typeof image?.width === "number" ? image.width : 1200;
  const height = typeof image?.height === "number" ? image.height : 800;
  const alt =
    (typeof fields.imageAlt === "string" && fields.imageAlt) ||
    (typeof fields.title === "string" && fields.title) ||
    (typeof fields.description === "string" && fields.description) ||
    "";

  return { src: absoluteUrl(rawUrl), alt, width, height };
}

function imageFromEntry(target: unknown) {
  const record = asRecord(target);
  if (!record) {
    return null;
  }

  const type = contentTypeOf(record);
  if (type && type !== "image") {
    return null;
  }

  const fields = asRecord(record.fields) ?? record;
  const fromLink = fileFromAsset(fields?.image);
  if (fromLink) {
    const alt =
      (typeof fields?.imageAlt === "string" && fields.imageAlt) || fromLink.alt;
    return { ...fromLink, alt };
  }

  return fileFromAsset(record);
}

function ContentfulImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="my-6 h-auto w-full rounded-2xl"
    />
  );
}

function renderEmbeddedEntry(node: Block | Inline) {
  const target = asRecord(node.data)?.target;
  const image = imageFromEntry(target);

  if (!image) {
    return null;
  }

  return <ContentfulImage {...image} />;
}

function renderEmbeddedAsset(node: Block | Inline) {
  const image = fileFromAsset(asRecord(node.data)?.target);

  if (!image) {
    return null;
  }

  return <ContentfulImage {...image} />;
}

export function InfoSection({ section }: { section: CourseSection }) {
  const document = findRichTextDocument(section.fields);

  if (!document) {
    return <p className="text-muted">This section has no text yet.</p>;
  }

  return (
    <div className="text-foreground">
      {documentToReactComponents(document, {
        renderNode: {
          [BLOCKS.PARAGRAPH]: (_node, children) => (
            <p className="mb-4 leading-relaxed">{children}</p>
          ),
          [BLOCKS.HEADING_1]: (_node, children) => (
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          [BLOCKS.HEADING_2]: (_node, children) => (
            <h3 className="mb-3 mt-6 text-xl font-semibold tracking-tight">
              {children}
            </h3>
          ),
          [BLOCKS.HEADING_3]: (_node, children) => (
            <h4 className="mb-2 mt-5 text-lg font-semibold">{children}</h4>
          ),
          [BLOCKS.UL_LIST]: (_node, children) => (
            <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>
          ),
          [BLOCKS.OL_LIST]: (_node, children) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          [BLOCKS.LIST_ITEM]: (_node, children) => <li>{children}</li>,
          [BLOCKS.QUOTE]: (_node, children) => (
            <blockquote className="mb-4 rounded-2xl bg-accent-soft/70 px-4 py-3 text-muted">
              {children}
            </blockquote>
          ),
          [BLOCKS.EMBEDDED_ENTRY]: renderEmbeddedEntry,
          [BLOCKS.EMBEDDED_ASSET]: renderEmbeddedAsset,
          [INLINES.EMBEDDED_ENTRY]: renderEmbeddedEntry,
          [INLINES.HYPERLINK]: (node, children) => {
            const uri =
              typeof asRecord(node.data)?.uri === "string"
                ? String(asRecord(node.data)?.uri)
                : "#";
            return (
              <a
                href={uri}
                className="font-medium text-accent underline hover:text-accent-hover"
              >
                {children}
              </a>
            );
          },
        },
      })}
    </div>
  );
}
