import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from "@aws-sdk/client-athena";
import { fromIni } from "@aws-sdk/credential-providers";
import * as vscode from 'vscode';

export interface PaginatedResults {
    results: any[];
    totalRows: number;
    totalResultRows?: number; // Total rows in the entire result set
    hasMore: boolean;
    nextToken?: string;
    currentPage: number;
    pageSize: number;
    queryExecutionId?: string;
    pageHistory?: string[]; // Store tokens for previous pages
    canGoBack?: boolean;
    totalPages?: number; // Total number of pages
    columnNames?: string[]; // Column names for pagination
}

export class AthenaRunner {
    private client: AthenaClient;
    private s3OutputLocation: string;
    private database: string;
    private workgroup: string;
    private readonly DEFAULT_PAGE_SIZE = 100;
    private readonly ACTUAL_PAGE_SIZE = 101; // 100 data rows + 1 header row
    private readonly SCHEMA_EXPLORER_PAGE_SIZE = 100; // 100 data rows for quick preview
    private readonly SCHEMA_EXPLORER_ACTUAL_PAGE_SIZE = 101; // 100 data rows + 1 header row

    constructor() {
        const config = vscode.workspace.getConfiguration('athena.query');
        const region = config.get<string>('region');
        const profile = config.get<string>('profile');

        // Use fromIni if a profile is specified, otherwise let the SDK use its default credential chain.
        const credentials = profile ? fromIni({ profile }) : undefined;

        this.client = new AthenaClient({
            region,
            credentials
        });

        this.s3OutputLocation = config.get('s3OutputLocation')!;
        this.database = config.get('database')!;
        this.workgroup = config.get('workgroup')!;
    }

    public async runQuery(query: string, isSchemaExplorerQuery: boolean = false): Promise<PaginatedResults> {
        // Use the original query without any LIMIT modifications
        if (!this.s3OutputLocation) {
            vscode.window.showErrorMessage('S3 output location is not configured. Please set "aws.athena.s3OutputLocation" in your settings.');
            return this.createEmptyResults();
        }

        const startQueryCommand = new StartQueryExecutionCommand({
            QueryString: query,
            QueryExecutionContext: {
                Database: this.database
            },
            ResultConfiguration: {
                OutputLocation: this.s3OutputLocation
            },
            WorkGroup: this.workgroup
        });

        const startQueryResponse = await this.client.send(startQueryCommand);
        const queryExecutionId = startQueryResponse.QueryExecutionId;

        if (!queryExecutionId) {
            vscode.window.showErrorMessage('Failed to start query execution.');
            return this.createEmptyResults();
        }

        await this.waitForQueryCompletion(queryExecutionId);

        // Get the total row count for proper pagination calculation
        const totalResultRows = await this.getTotalRowCount(queryExecutionId);

        return this.getPaginatedResults(queryExecutionId, 1, isSchemaExplorerQuery, totalResultRows);
    }

    public async runFullQuery(query: string): Promise<string> {
        // Run the original query without any LIMIT modifications
        if (!this.s3OutputLocation) {
            throw new Error('S3 output location is not configured.');
        }

        const startQueryCommand = new StartQueryExecutionCommand({
            QueryString: query,
            QueryExecutionContext: {
                Database: this.database
            },
            ResultConfiguration: {
                OutputLocation: this.s3OutputLocation
            },
            WorkGroup: this.workgroup
        });

        const startQueryResponse = await this.client.send(startQueryCommand);
        const queryExecutionId = startQueryResponse.QueryExecutionId;

        if (!queryExecutionId) {
            throw new Error('Failed to start query execution.');
        }

        await this.waitForQueryCompletion(queryExecutionId);

        // Return the query execution ID for download processing
        return queryExecutionId;
    }

    public async getNextPage(queryExecutionId: string, nextToken: string, currentPage: number, pageHistory: string[] = [], isSchemaExplorerQuery: boolean = false, totalResultRows: number = -1, columnNames: string[] = []): Promise<PaginatedResults> {
        const defaultPageSize = isSchemaExplorerQuery ? this.SCHEMA_EXPLORER_PAGE_SIZE : this.DEFAULT_PAGE_SIZE;

        const getResultsCommand = new GetQueryResultsCommand({
            QueryExecutionId: queryExecutionId,
            NextToken: nextToken,
            MaxResults: defaultPageSize  // Request exactly the number of data rows we want
        });

        const resultsResponse = await this.client.send(getResultsCommand);
        const results = this.formatResults(resultsResponse.ResultSet, columnNames); // Pagination page

        // Debug logging
        console.log(`Next page ${currentPage + 1}: Requested ${defaultPageSize} rows, got ${resultsResponse.ResultSet?.Rows?.length || 0} total rows, ${results.length} data rows (expected ${defaultPageSize})`);

        // Add current token to history for previous page navigation
        const newPageHistory = [...pageHistory, nextToken];

        const hasMore = !!resultsResponse.NextToken;
        const currentPageRows = results.length;

        // Calculate total pages using the provided total row count
        const totalPages = totalResultRows > 0 ? Math.ceil(totalResultRows / defaultPageSize) : (hasMore ? currentPage + 1 : currentPage);

        return {
            results,
            totalRows: currentPageRows,
            totalResultRows,
            hasMore,
            nextToken: resultsResponse.NextToken,
            currentPage: currentPage + 1,
            pageSize: defaultPageSize,
            queryExecutionId,
            pageHistory: newPageHistory,
            canGoBack: newPageHistory.length > 0,
            totalPages,
            columnNames
        };
    }

    public async getPreviousPage(queryExecutionId: string, currentPage: number, pageHistory: string[], isSchemaExplorerQuery: boolean = false, totalResultRows: number = -1, columnNames: string[] = []): Promise<PaginatedResults> {
        if (pageHistory.length === 0) {
            throw new Error('No previous pages available');
        }

        const defaultPageSize = isSchemaExplorerQuery ? this.SCHEMA_EXPLORER_PAGE_SIZE : this.DEFAULT_PAGE_SIZE;

        // Remove the last token from history (current page)
        const newPageHistory = pageHistory.slice(0, -1);
        const previousToken = newPageHistory[newPageHistory.length - 1] || undefined;

        const getResultsCommand = new GetQueryResultsCommand({
            QueryExecutionId: queryExecutionId,
            NextToken: previousToken,
            MaxResults: previousToken ? defaultPageSize : this.ACTUAL_PAGE_SIZE  // First page needs header handling
        });

        const resultsResponse = await this.client.send(getResultsCommand);

        // If going back to first page (no previousToken), handle header row
        const results = previousToken ?
            this.formatResults(resultsResponse.ResultSet, columnNames) :
            this.formatFirstPageResults(resultsResponse.ResultSet).rows;

        const hasMore = !!resultsResponse.NextToken;
        const currentPageRows = results.length;

        // Calculate total pages using the provided total row count
        const totalPages = totalResultRows > 0 ? Math.ceil(totalResultRows / defaultPageSize) : (hasMore ? currentPage : currentPage - 1);

        return {
            results,
            totalRows: currentPageRows,
            totalResultRows,
            hasMore,
            nextToken: resultsResponse.NextToken,
            currentPage: currentPage - 1,
            pageSize: defaultPageSize,
            queryExecutionId,
            pageHistory: newPageHistory,
            canGoBack: newPageHistory.length > 0,
            totalPages,
            columnNames
        };
    }

    private async getPaginatedResults(queryExecutionId: string, page: number, isSchemaExplorerQuery: boolean = false, totalResultRows: number = -1): Promise<PaginatedResults> {
        const pageSize = isSchemaExplorerQuery ? this.SCHEMA_EXPLORER_PAGE_SIZE : this.DEFAULT_PAGE_SIZE;
        const actualPageSize = isSchemaExplorerQuery ? this.SCHEMA_EXPLORER_ACTUAL_PAGE_SIZE : this.ACTUAL_PAGE_SIZE;

        const getResultsCommand = new GetQueryResultsCommand({
            QueryExecutionId: queryExecutionId,
            MaxResults: actualPageSize
        });

        const resultsResponse = await this.client.send(getResultsCommand);
        const { rows: results, columns } = this.formatFirstPageResults(resultsResponse.ResultSet); // First page

        // Debug logging
        console.log(`Page ${page}: Requested ${actualPageSize} rows, got ${resultsResponse.ResultSet?.Rows?.length || 0} total rows, ${results.length} data rows (page size: ${pageSize})`);

        // For schema explorer queries with LIMIT 100, there's no next page
        const hasMore = isSchemaExplorerQuery ? false : !!resultsResponse.NextToken;
        const currentPageRows = results.length;

        // Calculate total pages based on total result rows
        const totalPages = totalResultRows > 0 ? Math.ceil(totalResultRows / pageSize) : (hasMore ? page + 1 : page);

        return {
            results,
            totalRows: currentPageRows,
            totalResultRows,
            hasMore,
            nextToken: hasMore ? resultsResponse.NextToken : undefined,
            currentPage: page,
            pageSize,
            queryExecutionId,
            pageHistory: [],
            canGoBack: false,
            totalPages,
            columnNames: columns
        };
    }

    private createEmptyResults(): PaginatedResults {
        return {
            results: [],
            totalRows: 0,
            hasMore: false,
            currentPage: 1,
            pageSize: this.DEFAULT_PAGE_SIZE,
            queryExecutionId: undefined,
            pageHistory: [],
            canGoBack: false,
            totalPages: 1
        };
    }

    private async waitForQueryCompletion(queryExecutionId: string): Promise<void> {
        const getQueryExecutionCommand = new GetQueryExecutionCommand({
            QueryExecutionId: queryExecutionId
        });

        let status: string | undefined = 'QUEUED';
        while (status === 'QUEUED' || status === 'RUNNING') {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Poll every 1.5 seconds
            const executionResponse = await this.client.send(getQueryExecutionCommand);
            status = executionResponse.QueryExecution?.Status?.State;

            if (status === 'FAILED' || status === 'CANCELLED') {
                const reason = executionResponse.QueryExecution?.Status?.StateChangeReason;
                throw new Error(`Query ${status}: ${reason || 'No reason provided.'}`);
            }
        }
    }

    private formatResults(resultSet: any, columnNames: string[]): any[] {
        if (!resultSet || !resultSet.Rows || resultSet.Rows.length === 0) {
            return [];
        }

        // For pagination, Athena doesn't include headers in subsequent pages
        // All rows in pagination calls are data rows
        const rows = resultSet.Rows.map((row: any, rowIndex: number) => {
            const rowData: any = {};
            row.Data.forEach((val: any, index: number) => {
                // Use the actual column names passed from the first page
                const columnName = columnNames[index] || `col_${index}`;
                rowData[columnName] = val.VarCharValue;
            });
            return rowData;
        });

        return rows;
    }

    private formatFirstPageResults(resultSet: any): { rows: any[], columns: string[] } {
        if (!resultSet || !resultSet.Rows || resultSet.Rows.length === 0) {
            return { rows: [], columns: [] };
        }

        // The first row contains the column headers
        const columns = resultSet.Rows[0].Data.map((col: any) => col.VarCharValue);

        // The rest of the rows contain the data
        const rows = resultSet.Rows.slice(1).map((row: any) => {
            const rowData: any = {};
            row.Data.forEach((val: any, index: number) => {
                // Ensure the column exists before assigning
                if (columns[index]) {
                    rowData[columns[index]] = val.VarCharValue;
                }
            });
            return rowData;
        });

        return { rows, columns };
    }

    public async downloadAllResults(queryExecutionId: string): Promise<{ csvContent: string, totalRows: number }> {
        let allRows: any[] = [];
        let nextToken: string | undefined = undefined;
        let pageCount = 0;
        let totalRows = 0;
        let headers: string[] = [];

        do {
            const getResultsCommand: GetQueryResultsCommand = new GetQueryResultsCommand({
                QueryExecutionId: queryExecutionId,
                NextToken: nextToken,
                MaxResults: 1000 // Use maximum allowed for faster download
            });

            const resultsResponse: any = await this.client.send(getResultsCommand);

            if (pageCount === 0) {
                // First page: extract headers and data rows
                const allPageRows = resultsResponse.ResultSet?.Rows || [];
                if (allPageRows.length > 0) {
                    // Extract headers from first row
                    headers = allPageRows[0].Data.map((col: any) => col.VarCharValue || '');
                    // Extract data rows (skip header)
                    const dataRows = allPageRows.slice(1);
                    allRows.push(...dataRows);
                    totalRows += dataRows.length;
                }
            } else {
                // Subsequent pages: all rows are data rows
                const dataRows = resultsResponse.ResultSet?.Rows || [];
                allRows.push(...dataRows);
                totalRows += dataRows.length;
            }

            nextToken = resultsResponse.NextToken;
            pageCount++;

            // Update progress (you can implement progress reporting here)
            console.log(`Downloaded ${totalRows} rows so far...`);

        } while (nextToken);

        // Convert to CSV with proper headers
        const csvContent = this.convertToCSVWithHeaders(allRows, headers);

        return { csvContent, totalRows };
    }

    private convertToCSV(rows: any[]): string {
        if (rows.length === 0) {
            return '';
        }

        // Get headers from first row
        const headers = rows[0].Data.map((col: any) => col.VarCharValue || '');

        // Create CSV header
        const csvHeader = headers.map((header: string) => this.escapeCSVField(header)).join(',');

        // Create CSV rows
        const csvRows = rows.map(row => {
            const values = row.Data.map((val: any) => this.escapeCSVField(val.VarCharValue || ''));
            return values.join(',');
        });

        return [csvHeader, ...csvRows].join('\n');
    }

    private convertToCSVWithHeaders(rows: any[], headers: string[]): string {
        if (rows.length === 0) {
            return '';
        }

        // Create CSV header
        const csvHeader = headers.map((header: string) => this.escapeCSVField(header)).join(',');

        // Create CSV rows
        const csvRows = rows.map(row => {
            const values = headers.map((header, index) => {
                // Get value by index from the row's Data array
                const value = row.Data[index]?.VarCharValue || '';
                return this.escapeCSVField(value);
            });
            return values.join(',');
        });

        return [csvHeader, ...csvRows].join('\n');
    }

    private escapeCSVField(field: string): string {
        if (!field) return '';

        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            return `"${field.replace(/"/g, '""')}"`;
        }

        return field;
    }

    public async getTotalRowCount(queryExecutionId: string): Promise<number> {
        try {
            // Get the total row count by fetching all results without pagination
            let totalRows = 0;
            let nextToken: string | undefined = undefined;
            let pageCount = 0;

            console.log('Starting getTotalRowCount...');

            do {
                const getResultsCommand: GetQueryResultsCommand = new GetQueryResultsCommand({
                    QueryExecutionId: queryExecutionId,
                    NextToken: nextToken,
                    MaxResults: 1000 // Use maximum allowed for faster counting
                });

                const resultsResponse: any = await this.client.send(getResultsCommand);
                const rows = resultsResponse.ResultSet?.Rows || [];

                if (pageCount === 0 && rows.length > 0) {
                    // First page includes header, so subtract 1
                    const dataRows = rows.length - 1;
                    totalRows += dataRows;
                    console.log(`Page ${pageCount}: Got ${rows.length} total rows, ${dataRows} data rows (first page with header)`);
                } else {
                    // Subsequent pages are all data rows
                    totalRows += rows.length;
                    console.log(`Page ${pageCount}: Got ${rows.length} data rows`);
                }

                nextToken = resultsResponse.NextToken;
                pageCount++;
            } while (nextToken);

            console.log(`Total row count: ${totalRows}`);
            return totalRows;
        } catch (error) {
            console.error('Error getting total row count:', error);
            return -1; // Unable to determine total row count
        }
    }
}