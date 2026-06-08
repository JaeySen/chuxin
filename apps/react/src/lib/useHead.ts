import { useEffect } from "react";

const SITE = "https://hanngusotam.com";
const DEFAULT_IMAGE = `${SITE}/chuxin-logo.jpg`;

interface HeadMeta {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
}

export function useHead({ title, description, canonical, image }: HeadMeta) {
  useEffect(() => {
    const fullTitle = title.includes("Sơ Tâm") ? title : `${title} · Sơ Tâm`;
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("og:title", fullTitle);
    setMeta("og:description", description);
    setMeta("og:image", image ?? DEFAULT_IMAGE);
    setMeta("og:url", canonical ?? (SITE + window.location.pathname));
    setMeta("og:type", "website");
    setMeta("og:site_name", "Hán ngữ Sơ Tâm");
    setMeta("og:locale", "vi_VN");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image ?? DEFAULT_IMAGE);

    setLink("canonical", canonical ?? (SITE + window.location.pathname));
  }, [title, description, canonical, image]);
}

function setMeta(nameOrProp: string, content: string) {
  const isOg = nameOrProp.startsWith("og:") || nameOrProp.startsWith("twitter:");
  const attr = isOg ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
