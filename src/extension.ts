import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaExplorerProvider } from './schemaExplorer';
import { AthenaRunner } from './athena';

interface QuerySession {
    queryExecutionId: string;
    query: string;
    athenaRunner: AthenaRunner;
    totalResultRows: number;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Athena Query extension is now active!');

    // Store active query sessions
    const querySessions = new Map<string, QuerySession>();

    // Initialize schema explorer
    const schemaProvider = new SchemaExplorerProvider();
    const treeView = vscode.window.createTreeView('athena-schema-view', {
        treeDataProvider: schemaProvider,
        showCollapseAll: true
    });

    // Register commands
    const queryCommand = vscode.commands.registerCommand('athena.query', async () => {
        const panel = vscode.window.createWebviewPanel(
            'athenaResults',
            'Athena Query Results',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent(panel, context);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                console.log('Extension received message:', message);
                switch (message.command) {
                    case 'executeQuery':
                        await handleQueryExecution(panel, message.query, message.region, querySessions);
                        break;
                    case 'exportToCsv':
                        await handleCsvExport(message.data, message.filename);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    const refreshSchemaCommand = vscode.commands.registerCommand('athena.refreshSchema', () => {
        schemaProvider.refresh();
    });

    const queryTableCommand = vscode.commands.registerCommand('athena.queryTable', async (database: string, table: string) => {
        const query = `SELECT * FROM "${database}"."${table}" LIMIT 100`;

        // Create a new document with the query
        const document = await vscode.workspace.openTextDocument({
            content: query,
            language: 'sql'
        });

        await vscode.window.showTextDocument(document);
    });

    // Listen for configuration changes
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('athena.query')) {
            schemaProvider.refreshConfig();
        }
    });

    // Register all commands and listeners
    context.subscriptions.push(queryCommand, refreshSchemaCommand, queryTableCommand, treeView, configChangeListener);

    // Auto-refresh schema on activation
    schemaProvider.refresh();
}

async function handleQueryExecution(panel: vscode.WebviewPanel, query: string, region: string, querySessions: Map<string, QuerySession>) {
    const athenaRunner = new AthenaRunner();
    try {
        const startTime = Date.now();
        const paginatedResults = await athenaRunner.runQuery(query, false);
        const executionTime = Date.now() - startTime;

        const sessionId = `session_${Date.now()}`;
        querySessions.set(sessionId, {
            queryExecutionId: paginatedResults.queryExecutionId || '',
            query,
            athenaRunner,
            totalResultRows: paginatedResults.totalResultRows || -1
        });

        panel.webview.postMessage({
            command: 'showResults',
            query: query,
            paginatedResults: paginatedResults,
            originalQuery: query,
            executionTime: executionTime,
            sessionId: sessionId
        });
    } catch (error: any) {
        panel.webview.postMessage({
            command: 'showError',
            error: error.message
        });
    }
}

async function handleCsvExport(data: any[], filename: string) {
    try {
        const csvContent = convertToCSV(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${filename}_${timestamp}.csv`;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        const filePath = path.join(workspaceRoot, fileName);
        const uri = vscode.Uri.file(filePath);

        const encoder = new TextEncoder();
        const csvData = encoder.encode(csvContent);

        await vscode.workspace.fs.writeFile(uri, csvData);
        vscode.window.showInformationMessage(`Exported to ${fileName}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Export failed: ${error.message}`);
    }
}

function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma or quote
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): string {
    // Return the webview content for the query results
    const webviewUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'out', 'webview.js'));
    const templatePath = path.join(context.extensionPath, 'src', 'webview', 'template.html');

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Athena Query Results</title>
    </head>
    <body>
        <div id="root"></div>
        <script src="${webviewUri}"></script>
    </body>
    </html>`;
}

function getLoadingContent(query: string): string {
    return `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="width: 20px; height: 20px; border: 2px solid #007acc; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                <span>Running query...</span>
            </div>
            <div style="max-width: 600px; word-wrap: break-word; text-align: center; color: #888;">
                <strong>Query:</strong> ${query}
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

export function deactivate() { }
