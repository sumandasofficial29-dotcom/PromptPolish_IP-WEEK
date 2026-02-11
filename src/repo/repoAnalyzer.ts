import * as vscode from "vscode";
import * as path from "path";

export interface RepoInsights {
  root: string;
  languages: string[];
  frameworks: string[];
  architecture: string;
  keyFolders: string[];
  configFiles: string[];
}

export async function analyzeRepo(): Promise<RepoInsights> {
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    throw new Error("No workspace opened");
  }

  const root = workspace[0].uri.fsPath;
  const files = await vscode.workspace.findFiles(
    "**/*",
    "**/{node_modules,.git,dist,build}/**",
    500
  );

  const extensions = new Set<string>();
  const folders = new Set<string>();
  const configFiles: string[] = [];

  for (const file of files) {
    extensions.add(path.extname(file.fsPath));
    folders.add(path.dirname(file.fsPath).replace(root, ""));

    const base = path.basename(file.fsPath);
    if (
      ["package.json", "angular.json", "pom.xml", "build.gradle",
       "tsconfig.json", "vite.config.ts", "next.config.js"].includes(base)
    ) {
      configFiles.push(base);
    }
  }

  const languages = Array.from(extensions)
    .map(e => e.replace(".", ""))
    .filter(Boolean);

  const frameworks = detectFrameworks(configFiles, languages);
  const architecture = detectArchitecture(folders);

  return {
    root: path.basename(root),
    languages,
    frameworks,
    architecture,
    keyFolders: Array.from(folders).slice(0, 30),
    configFiles
  };
}

function detectFrameworks(configs: string[], langs: string[]): string[] {
  const frameworks: string[] = [];

  if (configs.includes("angular.json")) frameworks.push("Angular");
  if (configs.includes("next.config.js")) frameworks.push("Next.js");
  if (configs.includes("vite.config.ts")) frameworks.push("Vite");
  if (configs.includes("package.json") && langs.includes("ts"))
    frameworks.push("Node.js / TypeScript");
  if (configs.includes("pom.xml")) frameworks.push("Spring Boot");
  if (configs.includes("build.gradle")) frameworks.push("Spring / Gradle");

  return frameworks.length ? frameworks : ["Unknown"];
}

function detectArchitecture(folders: Set<string>): string {
  const f = Array.from(folders).join(" ");

  if (f.includes("controller") && f.includes("service"))
    return "Layered (Controller / Service / Repository)";
  if (f.includes("components") && f.includes("hooks"))
    return "Component-based";
  if (f.includes("domain") && f.includes("application"))
    return "Clean / DDD";

  return "Unclassified / Mixed";
}