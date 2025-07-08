import { useState, useCallback } from 'react';
import { QueryResult } from '../components/ResultsTable';

export interface PaginatedResults {
    results: QueryResult[];
    totalRows: number;
    totalResultRows?: number;
    hasMore: boolean;
    nextToken?: string;
    currentPage: number;
    pageSize: number;
    queryExecutionId?: string;
    pageHistory?: string[];
    canGoBack?: boolean;
    totalPages?: number;
}

interface InitialData {
    results: PaginatedResults;
    query: string;
    executionTime: number;
    sessionId: string;
}

export const useQueryResults = (
    initialData: InitialData | undefined,
    vscode: ReturnType<typeof import('./useVSCodeAPI').useVSCodeAPI>
) => {
    const [results, setResults] = useState<PaginatedResults | null>(initialData?.results || null);
    const [query, setQuery] = useState<string>(initialData?.query || '');
    const [executionTime, setExecutionTime] = useState<number>(initialData?.executionTime || 0);
    const [sessionId, setSessionId] = useState<string>(initialData?.sessionId || '');

    const updateResults = useCallback((newResults: PaginatedResults) => {
        setResults(newResults);
    }, []);

    const handleNextPage = useCallback(() => {
        console.log('handleNextPage called', { hasMore: results?.hasMore, nextToken: !!results?.nextToken, sessionId });
        if (results?.hasMore && results?.nextToken) {
            vscode.postMessage({
                command: 'loadNextPage',
                sessionId
            });
        }
    }, [results, vscode, sessionId]);

    const handlePreviousPage = useCallback(() => {
        console.log('handlePreviousPage called', { canGoBack: results?.canGoBack, sessionId });
        if (results?.canGoBack) {
            vscode.postMessage({
                command: 'loadPreviousPage',
                sessionId
            });
        }
    }, [results, vscode, sessionId]);

    const handleDownloadAll = useCallback(() => {
        vscode.postMessage({
            command: 'downloadAllResults',
            sessionId
        });
    }, [vscode, sessionId]);

    return {
        results,
        query,
        executionTime,
        sessionId,
        updateResults,
        handleNextPage,
        handlePreviousPage,
        handleDownloadAll
    };
}; 