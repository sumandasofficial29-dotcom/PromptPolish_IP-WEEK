import { DeveloperIntent } from "./intentClassifier";

/**
 * Returns intent-specific reasoning and output guidance
 * injected directly into the final prompt.
 *
 * This does NOT solve the task.
 * It instructs the downstream AI HOW to think.
 */
export function intentInstructions(intent: DeveloperIntent): string {
  switch (intent) {

    case "BUG_FIX":
      return `
INTENT GUIDANCE (BUG FIX)
- Identify the root cause before suggesting changes
- Prefer minimal and targeted fixes
- Avoid refactors unless explicitly required
- Consider edge cases and regressions
- Preserve existing behavior and public APIs
- Suggest validation or reproduction steps
`;

    case "REFACTOR":
      return `
INTENT GUIDANCE (REFACTOR)
- Preserve functionality exactly
- Improve readability, structure, and maintainability
- Follow existing coding conventions strictly
- Avoid introducing new abstractions unless justified
- Highlight before/after structure clearly
`;

    case "PERFORMANCE":
      return `
INTENT GUIDANCE (PERFORMANCE)
- Analyze time and space complexity
- Identify concrete bottlenecks
- Consider trade-offs and constraints
- Avoid premature optimization
- Prefer measurable improvements
`;

    case "SECURITY":
      return `
INTENT GUIDANCE (SECURITY)
- Identify threat models and attack vectors
- Highlight insecure patterns
- Prefer secure-by-default approaches
- Avoid breaking backward compatibility
- Mention validation and mitigation steps
`;

    case "DOCUMENTATION":
      return `
INTENT GUIDANCE (DOCUMENTATION)
- Focus on clarity and structure
- Explain intent, not just implementation
- Include examples where helpful
- Optimize for developer onboarding
`;

    case "FEATURE":
      return `
INTENT GUIDANCE (FEATURE DEVELOPMENT)
- Clarify scope and non-goals
- Design APIs that align with existing architecture
- Consider extensibility and future changes
- Identify edge cases and failure modes
`;

    case "CODE_REVIEW":
      return `
INTENT GUIDANCE (CODE REVIEW)
- Evaluate code against best practices
- Identify risks, smells, and improvement areas
- Avoid subjective opinions
- Prioritize correctness and maintainability
`;

    case "UNKNOWN":
    default:
      return `
INTENT GUIDANCE (UNSPECIFIED)
- Clarify ambiguous requirements
- Identify missing information
- Make reasonable assumptions explicit
- Request confirmation where needed
`;
  }
}