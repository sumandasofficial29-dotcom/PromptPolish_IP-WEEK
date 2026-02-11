import { RepoInsights } from "../repo/repoAnalyzer";
import { RepoDeepInsights } from "../repo/repoDeepAnalyzer";

export function repoGuidance(
  repo: RepoInsights,
  deep: RepoDeepInsights
): string {
  return `
REPOSITORY GUIDANCE
------------------
Architecture: ${repo.architecture}
Risk Level: ${deep.riskLevel}

Coding Style:
${deep.codingStyle.join(", ") || "Not clearly defined"}

Async Patterns:
${deep.asyncPatterns.join(", ") || "None detected"}

Error Handling:
${deep.errorHandlingStyle}

Testing:
${deep.testingPresence ? "Tests exist — do NOT break them" : "Low test coverage — be defensive"}

IMPORTANT CONSTRAINTS:
- Follow existing patterns strictly
- Do not introduce new paradigms casually
- Prefer minimal, composable changes
- Preserve public interfaces
`;
}