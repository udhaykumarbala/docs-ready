export function cleanMdx(content: string): string {
  let result = content;

  // Strip UTF-8 BOM
  result = result.replace(/^\uFEFF/, "");

  // Strip import statements
  result = result.replace(/^import\s+.*$/gm, "");

  // Strip multi-line JSX blocks: <Component ...> ... </Component>
  // Must run before single-line to avoid partial matches
  result = result.replace(/<([A-Z]\w*)[^>]*>[\s\S]*?<\/\1>/g, "");

  // Strip single-line self-closing JSX: <Component ... />
  result = result.replace(/^[ \t]*<[A-Z]\w*[^>]*\/>\s*$/gm, "");

  // Convert admonitions: :::type Title\ncontent\n:::
  result = result.replace(
    /^:::(\w+)(?:[^\S\n]+(.+))?\n([\s\S]*?)^:::\s*$/gm,
    (_match, type: string, title: string | undefined, body: string) => {
      const label = title ?? type.charAt(0).toUpperCase() + type.slice(1);
      const trimmedBody = body.trim();
      return `> **${label}:** ${trimmedBody}`;
    }
  );

  // Clean up excessive blank lines (3+ → 2)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim() + "\n";
}
