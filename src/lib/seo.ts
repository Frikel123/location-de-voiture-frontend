export const setSeo = ({
  title,
  description,
  canonical,
  image = "/placeholder.svg",
  jsonLd,
}: {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}) => {
  if (typeof document === "undefined") return;

  document.title = title;

  const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:image"]', "property", "og:image", image);
  upsertMeta('meta[property="og:type"]', "property", "og:type", "website");

  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement("link");
  link.rel = "canonical";
  link.href = canonical ?? window.location.href;
  if (!link.parentElement) document.head.appendChild(link);

  document.head.querySelector("#service-lld-jsonld")?.remove();
  if (jsonLd) {
    const script = document.createElement("script");
    script.id = "service-lld-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
};
