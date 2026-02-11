import { callLLM } from "./llmClient";
import { RepoInsights } from "../repo/repoAnalyzer";
import { classifyIntent } from "./intentClassifier";

export async function generatePolishedPrompt(
  rawPrompt: string,
  repo: RepoInsights,
  editorContext: string
): Promise<string> {

  const intent = classifyIntent(rawPrompt);

  const systemPrompt = `
You are a STAFF-LEVEL software architect and expert prompt engineer.

Your task:
- Synthesize a world-class AI instruction for a coding assistant
- Infer missing intent
- Add architectural constraints
- Preserve developer goals
- Make the prompt optimal for GitHub Copilot / GPT-4 / Claude

DO NOT solve the task.
DO NOT write code.
ONLY produce the final prompt.

The output MUST:
- Be explicit
- Be structured
- Be actionable
- Be LLM-optimized
`;

  const userPrompt = `
PROJECT CONTEXT
---------------
Project Name: ${repo.root}
Architecture: ${repo.architecture}
Frameworks: ${repo.frameworks.join(", ")}
Languages: ${repo.languages.join(", ")}

Key Folders:
${repo.keyFolders.join("\n")}

Configuration Files:
${repo.configFiles.join(", ")}

DEVELOPER INTENT
----------------
Classified Intent: ${intent}

EDITOR CONTEXT
--------------
${editorContext}

RAW DEVELOPER PROMPT
--------------------
"""
${rawPrompt}
"""

INSTRUCTIONS
------------
Rewrite the above into a SINGLE, PROFESSIONAL, HIGH-FIDELITY PROMPT that:
1. Clearly states the goal
2. Specifies constraints and scope
3. Instructs the AI how to reason
4. Requests structured output (steps, code, risks if relevant)
5. Matches the detected architecture and framework
6. Avoids assumptions and hallucinations

Produce ONLY the rewritten prompt.
`;

  return callLLM(systemPrompt, userPrompt);
}