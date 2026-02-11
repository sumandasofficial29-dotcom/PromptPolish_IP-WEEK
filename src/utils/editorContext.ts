import * as vscode from "vscode";

export function getEditorContext(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return "No active editor.";

  const doc = editor.document;
  const selection = editor.selection;

  return `
File Path: ${doc.fileName}
Language: ${doc.languageId}
Total Lines: ${doc.lineCount}

Selected Code:
${selection.isEmpty ? "None" : doc.getText(selection)}
`;
}