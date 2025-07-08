import React, { useState, useEffect } from 'react';
import { QueryInfo } from './QueryInfo';
import { ResultsTable, QueryResult } from './ResultsTable';
import { Pagination } from './Pagination';
import { LoadingView } from './LoadingView';
import { NoResultsView } from './NoResultsView';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';
import { useQueryResults, PaginatedResults } from '../hooks/useQueryResults';
import './AthenaResultsView.css';

export interface AthenaResultsViewProps {
    initialData?: {
        results: PaginatedResults;
        query: string;
        executionTime: number;
        sessionId: string;
    };
}

export const AthenaResultsView: React.FC<AthenaResultsViewProps> = ({ initialData }) => {
    console.log('AthenaResultsView rendered with initialData:', initialData);
    if (initialData) {
        console.log('Initial data details:', {
            resultsLength: initialData.results.results.length,
            totalRows: initialData.results.totalRows,
            hasMore: initialData.results.hasMore,
            currentPage: initialData.results.currentPage,
            pageSize: initialData.results.pageSize,
            totalPages: initialData.results.totalPages,
            nextToken: !!initialData.results.nextToken
        });
    }
    const [isLoading, setIsLoading] = useState(false); // Don't show loading by default if we have initialData
    const [loadingMessage, setLoadingMessage] = useState('Loading results...');
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

    const vscode = useVSCodeAPI();
    const {
        results,
        query,
        executionTime,
        sessionId,
        updateResults,
        handleNextPage,
        handlePreviousPage,
        handleDownloadAll
    } = useQueryResults(initialData, vscode);

    useEffect(() => {
        // Listen for messages from the extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;

            switch (message.command) {
                case 'updateResults':
                    updateResults(message.results);
                    setIsLoading(false);
                    setIsLoadingNext(false);
                    setIsLoadingPrevious(false);
                    break;
                case 'showLoading':
                    // Only show full loading for initial queries, not pagination
                    // If we already have initialData, don't show full loading screen
                    if (initialData) {
                        return;
                    }
                    if (message.message && (message.message.includes('next page') || message.message.includes('previous page'))) {
                        // Don't show full loading for pagination - ignore this message
                        return;
                    } else {
                        setIsLoading(true);
                        setLoadingMessage(message.message || 'Loading...');
                    }
                    break;
                case 'showPaginationLoading':
                    if (message.type === 'next') {
                        setIsLoadingNext(true);
                    } else if (message.type === 'previous') {
                        setIsLoadingPrevious(true);
                    }
                    break;
                case 'hideLoading':
                    setIsLoading(false);
                    setIsLoadingNext(false);
                    setIsLoadingPrevious(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [updateResults]);

    console.log('AthenaResultsView render state:', { isLoading, hasResults: !!results, resultsLength: results?.results?.length });

    if (isLoading) {
        console.log('Rendering LoadingView from AthenaResultsView');
        return <LoadingView message={loadingMessage} query={query} />;
    }

    if (!results || results.results.length === 0) {
        console.log('Rendering NoResultsView');
        return <NoResultsView query={query} executionTime={executionTime} />;
    }

    console.log('Rendering full results view with:', {
        query,
        executionTime,
        results: results.results.length,
        totalRows: results.totalRows,
        hasMore: results.hasMore,
        currentPage: results.currentPage,
        pageSize: results.pageSize,
        totalPages: results.totalPages,
        nextToken: !!results.nextToken
    });

    return (
        <div className="athena-results-container">
            <QueryInfo
                query={query}
                executionTime={executionTime}
                totalRows={results.totalRows}
                currentPage={results.currentPage}
                pageSize={results.pageSize}
                totalPages={results.totalPages}
                totalResultRows={results.totalResultRows}
            />

            <ResultsTable
                results={results.results}
                currentPage={results.currentPage}
                pageSize={results.pageSize}
            />

            <Pagination
                currentPage={results.currentPage}
                totalPages={results.totalPages || 1}
                hasMore={results.hasMore}
                canGoBack={results.canGoBack || false}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                onDownloadAll={handleDownloadAll}
                totalRows={results.totalRows}
                totalResultRows={results.totalResultRows}
                isLoadingNext={isLoadingNext}
                isLoadingPrevious={isLoadingPrevious}
            />
        </div>
    );
}; 