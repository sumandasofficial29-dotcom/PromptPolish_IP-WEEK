export type RefinementLevel = "BASIC" | "STANDARD" | "ADVANCED";

export function refinementInstructions(level: RefinementLevel): string {
  switch (level) {
    case "BASIC":
      return `
REFINEMENT LEVEL: BASIC
- Keep instructions concise
- Focus on clarity over rigor
- Do not over-constrain the task
- Avoid heavy architectural reasoning
`;

    case "STANDARD":
      return `
REFINEMENT LEVEL: STANDARD
- Include constraints and architectural awareness
- Consider edge cases
- Emphasize maintainability
- Be explicit about assumptions
`;

    case "ADVANCED":
    default:
      return `
REFINEMENT LEVEL: ADVANCED
- Assume production-critical code
- Highlight architectural implications
- Identify risks and regressions
- Demand structured reasoning
- Enforce alignment with repository conventions
- Require validation and verification steps
`;
  }
}