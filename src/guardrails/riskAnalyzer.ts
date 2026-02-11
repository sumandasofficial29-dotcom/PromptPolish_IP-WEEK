export interface RiskReport {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warnings: string[];
}

export function analyzeRisk(
  userPrompt: string,
  repoContext: any
): RiskReport {

  const warnings: string[] = [];
  const prompt = userPrompt.toLowerCase();

  // 🔴 HIGH RISK PATTERNS
  if (
    prompt.includes("drop database") ||
    prompt.includes("delete all") ||
    prompt.includes("rm -rf") ||
    prompt.includes("truncate table")
  ) {
    warnings.push("Destructive database or filesystem operation detected.");
  }

  if (
    prompt.includes("disable auth") ||
    prompt.includes("bypass authentication") ||
    prompt.includes("remove authorization")
  ) {
    warnings.push("Authentication bypass attempt detected.");
  }

  if (
    prompt.includes("expose api key") ||
    prompt.includes("print process.env") ||
    prompt.includes("log all env")
  ) {
    warnings.push("Sensitive environment variable exposure risk.");
  }

  // 🟡 MEDIUM RISK PATTERNS
  if (
    prompt.includes("refactor entire project") ||
    prompt.includes("rewrite whole codebase")
  ) {
    warnings.push("Large scale refactor requested. Risk of breaking architecture.");
  }

  if (
    prompt.includes("remove validation") ||
    prompt.includes("skip error handling")
  ) {
    warnings.push("Removing validation or error handling can cause instability.");
  }

  // Repo-based detection
  if (repoContext?.dependencies?.includes("jsonwebtoken")) {
    if (prompt.includes("remove jwt") || prompt.includes("disable jwt")) {
      warnings.push("JWT authentication system modification detected.");
    }
  }

  // Determine risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (warnings.length >= 3) {
    riskLevel = "HIGH";
  } else if (warnings.length > 0) {
    riskLevel = "MEDIUM";
  }

  return {
    riskLevel,
    warnings
  };
}