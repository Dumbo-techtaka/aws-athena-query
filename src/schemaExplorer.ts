import * as vscode from 'vscode';
import { GlueClient, GetDatabasesCommand, GetTablesCommand, GetTableCommand } from '@aws-sdk/client-glue';
import { fromIni } from '@aws-sdk/credential-providers';

export class SchemaExplorerProvider implements vscode.TreeDataProvider<SchemaItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SchemaItem | undefined | null | void> = new vscode.EventEmitter<SchemaItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SchemaItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private glueClient: GlueClient;
    private databases: Database[] = [];
    private tablesCache: Map<string, Table[]> = new Map();
    private columnsCache: Map<string, Column[]> = new Map();

    constructor() {
        const config = vscode.workspace.getConfiguration('athena.query');
        const region = config.get<string>('region');
        const profile = config.get<string>('profile');

        // Use fromIni if a profile is specified, otherwise let the SDK use its default credential chain.
        const credentials = profile ? fromIni({ profile }) : undefined;

        this.glueClient = new GlueClient({
            region,
            credentials
        });
    }

    refresh(): void {
        this.databases = [];
        this.tablesCache.clear();
        this.columnsCache.clear();
        this._onDidChangeTreeData.fire();
    }

    refreshConfig(): void {
        const config = vscode.workspace.getConfiguration('athena.query');
        const region = config.get<string>('region');
        const profile = config.get<string>('profile');

        // Use fromIni if a profile is specified, otherwise let the SDK use its default credential chain.
        const credentials = profile ? fromIni({ profile }) : undefined;

        this.glueClient = new GlueClient({
            region,
            credentials
        });

        // Clear cache and refresh
        this.refresh();
    }

    getTreeItem(element: SchemaItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SchemaItem): Promise<SchemaItem[]> {
        if (!element) {
            // Root level - return databases
            return this.getDatabaseItems();
        }

        if (element.contextValue === 'database') {
            // Database level - return tables
            return this.getTableItems(element.label as string);
        }

        if (element.contextValue === 'table') {
            // Table level - return columns
            const database = element.database!;
            const table = element.label as string;
            return this.getColumnItems(database, table);
        }

        return [];
    }

    private async getDatabaseItems(): Promise<SchemaItem[]> {
        try {
            if (this.databases.length === 0) {
                const databases = await this.getDatabases();
                this.databases = databases;
            }

            return this.databases.map(db => new SchemaItem(
                db.name,
                db.description || '',
                vscode.TreeItemCollapsibleState.Collapsed,
                'database',
                {
                    command: 'athena.refreshSchema',
                    title: 'Refresh Schema'
                }
            ));
        } catch (error) {
            console.error('Error loading databases:', error);
            return [new SchemaItem(
                'Error loading databases',
                'Click to retry',
                vscode.TreeItemCollapsibleState.None,
                'error',
                {
                    command: 'athena.refreshSchema',
                    title: 'Retry'
                }
            )];
        }
    }

    private async getTableItems(database: string): Promise<SchemaItem[]> {
        try {
            if (!this.tablesCache.has(database)) {
                const tables = await this.getTables(database);
                this.tablesCache.set(database, tables);
            }

            const tables = this.tablesCache.get(database) || [];
            return tables.map(table => {
                const item = new SchemaItem(
                    table.name,
                    table.description || '',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'table',
                    {
                        command: 'athena.queryTable',
                        title: 'Query Table',
                        arguments: [database, table.name]
                    }
                );
                item.database = database;
                return item;
            });
        } catch (error) {
            console.error('Error loading tables:', error);
            return [new SchemaItem(
                'Error loading tables',
                'Click to retry',
                vscode.TreeItemCollapsibleState.None,
                'error',
                {
                    command: 'athena.refreshSchema',
                    title: 'Retry'
                }
            )];
        }
    }

    private async getColumnItems(database: string, table: string): Promise<SchemaItem[]> {
        try {
            const key = `${database}.${table}`;
            if (!this.columnsCache.has(key)) {
                const columns = await this.getColumns(database, table);
                this.columnsCache.set(key, columns);
            }

            const columns = this.columnsCache.get(key) || [];
            return columns.map(col => new SchemaItem(
                col.name,
                `${col.type} - ${col.description || ''}`,
                vscode.TreeItemCollapsibleState.None,
                'column'
            ));
        } catch (error) {
            console.error('Error loading columns:', error);
            return [new SchemaItem(
                'Error loading columns',
                'Click to retry',
                vscode.TreeItemCollapsibleState.None,
                'error',
                {
                    command: 'athena.refreshSchema',
                    title: 'Retry'
                }
            )];
        }
    }

    async getDatabases(): Promise<Database[]> {
        try {
            const command = new GetDatabasesCommand({});
            const response = await this.glueClient.send(command);

            return response.DatabaseList?.map(db => ({
                name: db.Name || '',
                description: db.Description || ''
            })) || [];
        } catch (error: any) {
            console.error('Error fetching databases:', error);

            // Show specific error messages to help with troubleshooting
            if (error.name === 'CredentialsProviderError' || error.name === 'UnauthorizedOperation') {
                vscode.window.showErrorMessage(`AWS credentials error: ${error.message}. Please check your AWS configuration.`);
            } else if (error.name === 'InvalidInputException' || error.name === 'AccessDeniedException') {
                vscode.window.showErrorMessage(`AWS Glue access error: ${error.message}. Please check your permissions.`);
            } else {
                vscode.window.showErrorMessage(`Error loading Glue databases: ${error.message}`);
            }

            // Return mock data if AWS fails
            return [
                { name: 'sample_database', description: 'Sample database for testing' },
                { name: 'analytics_db', description: 'Analytics database' }
            ];
        }
    }

    async getTables(database: string): Promise<Table[]> {
        try {
            const command = new GetTablesCommand({
                DatabaseName: database
            });
            const response = await this.glueClient.send(command);

            return response.TableList?.map(table => ({
                name: table.Name || '',
                description: table.Description || ''
            })) || [];
        } catch (error: any) {
            console.error('Error fetching tables:', error);

            // Show specific error messages to help with troubleshooting
            if (error.name === 'EntityNotFoundException') {
                vscode.window.showErrorMessage(`Database '${database}' not found in AWS Glue.`);
            } else if (error.name === 'AccessDeniedException') {
                vscode.window.showErrorMessage(`Access denied to database '${database}'. Please check your permissions.`);
            } else {
                vscode.window.showErrorMessage(`Error loading tables from '${database}': ${error.message}`);
            }

            // Return mock data if AWS fails
            return [
                { name: 'users', description: 'User data table' },
                { name: 'orders', description: 'Order transactions' },
                { name: 'products', description: 'Product catalog' }
            ];
        }
    }

    async getColumns(database: string, table: string): Promise<Column[]> {
        try {
            const command = new GetTableCommand({
                DatabaseName: database,
                Name: table
            });
            const response = await this.glueClient.send(command);

            return response.Table?.StorageDescriptor?.Columns?.map(col => ({
                name: col.Name || '',
                type: col.Type || '',
                description: col.Comment || ''
            })) || [];
        } catch (error: any) {
            console.error('Error fetching columns:', error);

            // Show specific error messages to help with troubleshooting
            if (error.name === 'EntityNotFoundException') {
                vscode.window.showErrorMessage(`Table '${database}.${table}' not found in AWS Glue.`);
            } else if (error.name === 'AccessDeniedException') {
                vscode.window.showErrorMessage(`Access denied to table '${database}.${table}'. Please check your permissions.`);
            } else {
                vscode.window.showErrorMessage(`Error loading columns from '${database}.${table}': ${error.message}`);
            }

            // Return mock data if AWS fails
            return [
                { name: 'id', type: 'bigint', description: 'Primary key' },
                { name: 'name', type: 'string', description: 'Name field' },
                { name: 'created_at', type: 'timestamp', description: 'Creation timestamp' }
            ];
        }
    }
}

export class SchemaItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.contextValue = contextValue;

        // Set appropriate icons
        switch (contextValue) {
            case 'database':
                this.iconPath = new vscode.ThemeIcon('database');
                break;
            case 'table':
                this.iconPath = new vscode.ThemeIcon('table');
                break;
            case 'column':
                this.iconPath = new vscode.ThemeIcon('symbol-field');
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
        }
    }

    public database?: string;
}

interface Database {
    name: string;
    description: string;
}

interface Table {
    name: string;
    description: string;
}

interface Column {
    name: string;
    type: string;
    description: string;
} 