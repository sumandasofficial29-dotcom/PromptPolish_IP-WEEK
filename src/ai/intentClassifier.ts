export type DeveloperIntent =
  | "BUG_FIX"
  | "REFACTOR"
  | "PERFORMANCE"
  | "SECURITY"
  | "DOCUMENTATION"
  | "FEATURE"
  | "CODE_REVIEW"
  | "UNKNOWN";

export function classifyIntent(prompt: string): DeveloperIntent {
  const p = prompt.toLowerCase();

  if (p.includes("bug") || p.includes("error") || p.includes("fix"))
    return "BUG_FIX";
  if (p.includes("refactor") || p.includes("clean"))
    return "REFACTOR";
  if (p.includes("optimize") || p.includes("performance"))
    return "PERFORMANCE";
  if (p.includes("secure") || p.includes("vulnerability"))
    return "SECURITY";
  if (p.includes("doc") || p.includes("comment"))
    return "DOCUMENTATION";
  if (p.includes("add") || p.includes("implement"))
    return "FEATURE";
  if (p.includes("review") || p.includes("best practice"))
    return "CODE_REVIEW";

  return "UNKNOWN";
}