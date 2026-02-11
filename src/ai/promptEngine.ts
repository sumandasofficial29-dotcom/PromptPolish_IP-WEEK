import { callLLM } from "./llmClient";
import { classifyIntent } from "./intentClassifier";
import { intentInstructions } from "./promptProfiles";
import { RepoInsights } from "../repo/repoAnalyzer";
import { analyzeRepoDeep } from "../repo/repoDeepAnalyzer";
import { repoGuidance } from "./repoGuidance";
import { refinementInstructions, RefinementLevel } from "./strictnessProfiles";

export interface RiskReport {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warnings: string[];
}

export async function generatePolishedPrompt(
  rawPrompt: string,
  repo: RepoInsights,
  editorContext: string,
  refinement: RefinementLevel = "ADVANCED",
  riskReport?: RiskReport
): Promise<string> {

  const intent = classifyIntent(rawPrompt);
  const deepInsights = await analyzeRepoDeep();

  const systemPrompt = `
You are a PRINCIPAL ENGINEER and expert prompt architect.

ABSOLUTE RULES:
- DO NOT solve the task
- DO NOT write code
- DO NOT invent APIs or libraries
- DO NOT hallucinate missing infrastructure
- ONLY produce a refined instruction prompt

You think like:
- A production reviewer
- A security auditor
- A performance engineer
- A system architect

You are responsible for production stability.
`;

  const riskSection = riskReport && riskReport.warnings.length > 0
    ? `
RISK GUARDRAIL
--------------
Risk Level: ${riskReport.riskLevel}

Warnings Detected:
${riskReport.warnings.map(w => `- ${w}`).join("\n")}

If risk level is MEDIUM or HIGH:
- Add explicit safety constraints
- Require validation steps
- Require rollback considerations
- Prevent destructive assumptions
`
    : `
RISK GUARDRAIL
--------------
No immediate risks detected.
`;

  const userPrompt = `
PROJECT OVERVIEW
----------------
Project: ${repo.root}
Architecture: ${repo.architecture}
Languages: ${repo.languages.join(", ")}
Frameworks: ${repo.frameworks.join(", ")}

KEY STRUCTURE
-------------
${repo.keyFolders.join("\n")}

CONFIG FILES
------------
${repo.configFiles.join(", ")}

${repoGuidance(repo, deepInsights)}
${refinementInstructions(refinement)}

${riskSection}

DEVELOPER INTENT
----------------
${intentInstructions(intent)}

EDITOR CONTEXT
--------------
${editorContext}

RAW PROMPT
----------
"""${rawPrompt}"""

TASK
----
Rewrite the above into a SINGLE, world-class prompt that:

1. States the exact goal clearly
2. Identifies missing information and assumptions
3. Defines scope boundaries and non-goals
4. Enforces architectural consistency
5. Applies risk mitigation (if any detected)
6. Instructs the AI how to reason step-by-step
7. Requests structured output:
   - Plan
   - Technical Considerations
   - Risks
   - Edge Cases
   - Validation / Testing Strategy
8. Avoids hallucinations
9. Prevents unsafe operations

OUTPUT
------
Return ONLY the rewritten prompt.
No explanations.
No markdown.
`;

  return callLLM(systemPrompt, userPrompt);
}