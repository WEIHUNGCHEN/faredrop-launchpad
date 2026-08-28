import { useEffect } from "react";

type MetaTag = { name?: string; property?: string; content: string };

const DEFAULT_TITLE = "FareDrop — Flight price drop alerts";

function upsertMeta(tag: MetaTag): () => void {
  const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (existing) {
    const previous = existing.getAttribute("content");
    existing.setAttribute("content", tag.content);
    return () => {
      if (previous === null) existing.removeAttribute("content");
      else existing.setAttribute("content", previous);
    };
  }

  const element = document.createElement("meta");
  if (tag.name) element.setAttribute("name", tag.name);
  if (tag.property) element.setAttribute("property", tag.property);
  element.setAttribute("content", tag.content);
  document.head.appendChild(element);
  return () => element.remove();
}

/**
 * Replaces TanStack Router's per-route `head()` in a plain SPA: sets
 * document.title and the page's meta tags on mount, and restores them on unmount.
 */
export function usePageMeta(title: string, meta: MetaTag[] = []): void {
  const serializedMeta = JSON.stringify(meta);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const tags = JSON.parse(serializedMeta) as MetaTag[];
    const restorers = tags.map(upsertMeta);

    return () => {
      document.title = previousTitle || DEFAULT_TITLE;
      for (const restore of restorers) restore();
    };
  }, [title, serializedMeta]);
}
