import React from 'react';

interface QueryInfoProps {
    query: string;
    executionTime: number;
    totalRows: number;
    currentPage: number;
    pageSize: number;
    totalPages?: number;
    totalResultRows?: number;
}

export const QueryInfo: React.FC<QueryInfoProps> = ({
    query,
    executionTime,
    totalRows,
    currentPage,
    pageSize,
    totalPages,
    totalResultRows
}) => {
    return (
        <div className="query-info">
            <div className="query-header">Executed Query:</div>
            <div className="query-text">{query}</div>

            <div className="stats">
                <div className="stat-item">
                    <span className="stat-label">Execution Time:</span>
                    <span className="stat-value">{executionTime}ms</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Rows on Page:</span>
                    <span className="stat-value">{totalRows.toLocaleString()}</span>
                </div>
                {totalResultRows && totalResultRows > 0 && (
                    <div className="stat-item">
                        <span className="stat-label">Total Results:</span>
                        <span className="stat-value">{totalResultRows.toLocaleString()}</span>
                    </div>
                )}
                <div className="stat-item">
                    <span className="stat-label">Current Page:</span>
                    <span className="stat-value">{currentPage}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Page Size:</span>
                    <span className="stat-value">{pageSize} rows</span>
                </div>
                {totalPages && (
                    <div className="stat-item">
                        <span className="stat-label">Total Pages:</span>
                        <span className="stat-value">{totalPages}</span>
                    </div>
                )}
            </div>
        </div>
    );
}; 