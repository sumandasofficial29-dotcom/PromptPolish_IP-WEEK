import * as vscode from "vscode";
import { analyzeRepo } from "../repo/repoAnalyzer";
import { getEditorContext } from "../utils/editorContext";
import { generatePolishedPrompt } from "../ai/promptEngine";

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
        await this.generatePrompt(msg.payload);
      }
    });
  }

  async generatePrompt(userPrompt: string) {
    if (!this._view) return;

    try {
      // Show loading state
      this._view.webview.postMessage({
        command: "loading",
        payload: true
      });

      const repoContext = await analyzeRepo();
      const editorContext = getEditorContext();

      const finalPrompt = await generatePolishedPrompt(
        userPrompt,
        repoContext,
        editorContext
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${cssUri}" rel="stylesheet" />
        <style>
          * {
            box-sizing: border-box;
          }
          
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
            color: var(--vscode-foreground);
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
            color: var(--vscode-foreground);
          }
          
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
            transition: background-color 0.2s;
          }
          
          button:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          textarea {
            width: 100%;
            min-height: 120px;
            margin: 0;
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
          
          textarea:focus {
            border-color: var(--vscode-focusBorder);
            outline: 1px solid var(--vscode-focusBorder);
          }
          
          textarea::placeholder {
            color: var(--vscode-input-placeholderForeground);
          }
          
          #input {
            min-height: 100px;
          }
          
          #output {
            min-height: 150px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
          }
          
          #output[readonly] {
            opacity: 0.9;
            cursor: default;
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
          
          .section {
            margin-bottom: 20px;
          }
          
          .header {
            margin-bottom: 20px;
          }
          
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
          
          .copy-btn:hover:not(:disabled) {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🎨 PromptPolish</h2>
          <p>AI-powered prompt refinement for better results</p>
        </div>

        <div class="section">
          <label for="input">Enter your prompt:</label>
          <textarea id="input" placeholder="Type your prompt here..." spellcheck="true"></textarea>
        </div>

        <button id="generate">✨ Generate Polished Prompt</button>
        
        <div id="status" class="loading" style="display:none;">⏳ Generating your polished prompt...</div>
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

          generateBtn.onclick = () => {
            console.log("Generate button clicked");
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
              payload: userPrompt
            });
          };

          copyBtn.onclick = () => {
            outputArea.select();
            document.execCommand('copy');
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => {
              copyBtn.textContent = "📋 Copy";
            }, 2000);
          };

          window.addEventListener("message", event => {
            const message = event.data;
            console.log("Received message:", message);

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