import React from 'react';

interface NoResultsViewProps {
    query: string;
    executionTime: number;
}

export const NoResultsView: React.FC<NoResultsViewProps> = ({ query, executionTime }) => {
    return (
        <div className="container">
            <div className="header">
                <div className="logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>AWS Athena Query Results</span>
                </div>
                <div className="status success">
                    <span className="status-dot"></span>
                    Query completed successfully
                </div>
            </div>

            <div className="query-info">
                <div className="query-header">Executed Query:</div>
                <div className="query-text">{query}</div>
            </div>

            <div className="stats">
                <div className="stat-item">
                    <span className="stat-label">Execution Time:</span>
                    <span className="stat-value">{executionTime}ms</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Rows Returned:</span>
                    <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Columns:</span>
                    <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Page Size:</span>
                    <span className="stat-value">500 rows</span>
                </div>
            </div>

            <div className="results-container">
                <div className="no-results">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <h3>No Results</h3>
                    <p>Your query executed successfully but returned no data.</p>
                </div>
            </div>
        </div>
    );
}; 