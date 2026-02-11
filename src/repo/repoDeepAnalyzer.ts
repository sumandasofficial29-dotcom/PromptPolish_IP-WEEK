import * as vscode from "vscode";
import * as path from "path";

export interface RepoDeepInsights {
  codingStyle: string[];
  testingPresence: boolean;
  errorHandlingStyle: string;
  asyncPatterns: string[];
  architecturalSignals: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export async function analyzeRepoDeep(): Promise<RepoDeepInsights> {
  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,java}",
    "**/{node_modules,.git,dist,build}/**",
    200
  );

  let usesAsyncAwait = false;
  let usesPromises = false;
  let usesTryCatch = false;
  let usesTests = false;
  let throwsErrors = false;

  for (const file of files.slice(0, 40)) {
    const doc = await vscode.workspace.openTextDocument(file);
    const text = doc.getText();

    if (text.includes("async ") && text.includes("await ")) usesAsyncAwait = true;
    if (text.includes(".then(")) usesPromises = true;
    if (text.includes("try {") && text.includes("catch")) usesTryCatch = true;
    if (text.includes("throw new")) throwsErrors = true;

    if (
      file.fsPath.includes("test") ||
      file.fsPath.includes("__tests__") ||
      text.includes("describe(")
    ) {
      usesTests = true;
    }
  }

  return {
    codingStyle: [
      usesAsyncAwait ? "async/await preferred" : "",
      usesPromises ? "promise chains present" : ""
    ].filter(Boolean),

    testingPresence: usesTests,

    errorHandlingStyle: usesTryCatch
      ? "Structured try/catch"
      : throwsErrors
      ? "Exception-driven"
      : "Implicit / unclear",

    asyncPatterns: [
      usesAsyncAwait ? "async/await" : "",
      usesPromises ? "Promise chains" : ""
    ].filter(Boolean),

    architecturalSignals: [
      usesTests ? "Tested codebase" : "Low test visibility"
    ],

    riskLevel:
      !usesTests && throwsErrors
        ? "HIGH"
        : usesTests
        ? "LOW"
        : "MEDIUM"
  };
}