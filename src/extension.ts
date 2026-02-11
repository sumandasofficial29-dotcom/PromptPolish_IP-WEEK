import * as vscode from "vscode";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env file from the extension root
dotenv.config({ path: path.join(__dirname, "../.env") });

import { analyzeRepo } from "./repo/repoAnalyzer";
import { getEditorContext } from "./utils/editorContext";
import { generatePolishedPrompt } from "./ai/promptEngine";
import { PromptPolishViewProvider } from "./sidebar/PromptPolishViewProvider";

export function activate(context: vscode.ExtensionContext) {

  // Register sidebar view provider
  const sidebarProvider = new PromptPolishViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("promptpolish.sidebar", sidebarProvider)
  );

  const polishCommand = vscode.commands.registerCommand(
    "promptpolish.polishPrompt",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage("Select a prompt first");
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "PromptPolish: Generating AI-enhanced prompt...",
          cancellable: false
        },
        async () => {
          try {
            const rawPrompt = editor.document.getText(selection);
            const repoSummary = await analyzeRepo();
            const editorContext = getEditorContext();

            const polished = await generatePolishedPrompt(
              rawPrompt,
              repoSummary,
              editorContext
            );

            editor.edit(editBuilder => {
              editBuilder.replace(selection, polished);
            });

          } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
          }
        }
      );
    }
  );

  context.subscriptions.push(polishCommand);
}

export function deactivate() {}