import * as vscode from "vscode";
import { analyzeRepo } from "../repo/repoAnalyzer";
import { getEditorContext } from "../utils/editorContext";
import { generatePolishedPrompt } from "../ai/promptEngine";
import { analyzeRisk } from "../guardrails/riskAnalyzer";
import { RefinementLevel } from "../ai/strictnessProfiles";

export class PromptPolishViewProvider
  implements vscode.WebviewViewProvider {

  private _view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    view.webview.html = this.getHtml(view.webview);

    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === "generate") {
        await this.generatePrompt(
          msg.payload.prompt,
          msg.payload.strictness
        );
      }
    });
  }

  async generatePrompt(userPrompt: string, strictness: RefinementLevel) {
    if (!this._view) return;

    try {
      this._view.webview.postMessage({
        command: "loading",
        payload: true
      });

      const repoContext = await analyzeRepo();
      const editorContext = getEditorContext();

      // 🔎 STEP 2 — Risk Guardrail
      const riskReport = analyzeRisk(userPrompt, repoContext);

      const finalPrompt = await generatePolishedPrompt(
        userPrompt,
        repoContext,
        editorContext,
        strictness,
        riskReport
      );

      this._view.webview.postMessage({
        command: "showPrompt",
        payload: finalPrompt
      });

    } catch (error: any) {
      this._view.webview.postMessage({
        command: "error",
        payload: error.message || "Failed to generate prompt"
      });
    } finally {
      this._view.webview.postMessage({
        command: "loading",
        payload: false
      });
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "src/sidebar/promptpolish.css")
    );
    
    const iconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media/icon.png")
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${cssUri}" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; }

          body {
            padding: 16px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            margin: 0;
          }

          h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          h2 img {
            width: 24px;
            height: 24px;
          }

          p {
            margin: 0 0 16px 0;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
          }

          label {
            display: block;
            margin-top: 16px;
            margin-bottom: 6px;
            font-weight: 500;
            font-size: 13px;
          }

          textarea, select {
            width: 100%;
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.5;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            resize: vertical;
            outline: none;
          }

          textarea:focus, select:focus {
            border-color: var(--vscode-focusBorder);
            outline: 1px solid var(--vscode-focusBorder);
          }

          #input { min-height: 100px; }
          #output { min-height: 150px; }

          button {
            padding: 10px 16px;
            margin: 16px 0;
            cursor: pointer;
            width: 100%;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            font-size: 13px;
            font-weight: 500;
          }

          button:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
          }

          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 10px;
            margin: 12px 0;
            border-radius: 2px;
            font-size: 12px;
          }

          .loading {
            color: var(--vscode-descriptionForeground);
            padding: 8px 0;
            text-align: center;
            font-size: 13px;
            font-style: italic;
          }

          .section { margin-bottom: 20px; }
          .header { margin-bottom: 20px; }

          .output-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }

          .copy-btn {
            padding: 4px 12px;
            font-size: 11px;
            width: auto;
            margin: 0;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
        </style>
      </head>
      <body>

        <div class="header">
          <h2><img src="${iconUri}" alt="PromptPolish" /> PromptPolish</h2>
          <p>Transform your prompts with AI-powered context and engineering best practices</p>
        </div>

        <div class="section">
          <label for="input">Enter your prompt:</label>
          <textarea id="input" placeholder="Type your prompt here..." spellcheck="true"></textarea>
        </div>

        <div class="section">
          <label for="refinement">Refinement Level:</label>
          <select id="refinement">
            <option value="BASIC">⚡ Basic</option>
            <option value="STANDARD">⭐ Standard</option>
            <option value="ADVANCED" selected>🚀 Advanced</option>
          </select>
        </div>

        <button id="generate">✨ Generate Polished Prompt</button>

        <div id="status" class="loading" style="display:none;">
          ⏳ Generating your polished prompt...
        </div>

        <div id="error" class="error" style="display:none;"></div>

        <div class="section">
          <div class="output-controls">
            <label for="output">Polished prompt:</label>
            <button id="copy" class="copy-btn" style="display:none;">📋 Copy</button>
          </div>
          <textarea id="output" placeholder="Your polished prompt will appear here..." readonly></textarea>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          const generateBtn = document.getElementById("generate");
          const copyBtn = document.getElementById("copy");
          const statusDiv = document.getElementById("status");
          const errorDiv = document.getElementById("error");
          const inputArea = document.getElementById("input");
          const outputArea = document.getElementById("output");
          const refinementSelect = document.getElementById("refinement");

          generateBtn.onclick = () => {
            const userPrompt = inputArea.value.trim();

            if (!userPrompt) {
              errorDiv.textContent = "⚠️ Please enter a prompt first";
              errorDiv.style.display = "block";
              return;
            }

            errorDiv.style.display = "none";
            copyBtn.style.display = "none";

            vscode.postMessage({
              command: "generate",
              payload: {
                prompt: userPrompt,
                strictness: refinementSelect.value
              }
            });
          };

          copyBtn.onclick = () => {
            outputArea.select();
            document.execCommand("copy");
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => {
              copyBtn.textContent = "📋 Copy";
            }, 2000);
          };

          window.addEventListener("message", event => {
            const message = event.data;

            switch(message.command) {
              case "loading":
                if (message.payload) {
                  statusDiv.style.display = "block";
                  generateBtn.disabled = true;
                  outputArea.value = "";
                  copyBtn.style.display = "none";
                } else {
                  statusDiv.style.display = "none";
                  generateBtn.disabled = false;
                }
                break;

              case "showPrompt":
                outputArea.value = message.payload;
                errorDiv.style.display = "none";
                copyBtn.style.display = "inline-block";
                break;

              case "error":
                errorDiv.textContent = "❌ Error: " + message.payload;
                errorDiv.style.display = "block";
                copyBtn.style.display = "none";
                break;
            }
          });
        </script>

      </body>
      </html>
    `;
  }
}