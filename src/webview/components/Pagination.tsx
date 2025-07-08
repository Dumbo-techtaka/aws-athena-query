import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    canGoBack: boolean;
    onNextPage: () => void;
    onPreviousPage: () => void;
    onDownloadAll: () => void;
    totalRows: number;
    totalResultRows?: number;
    isLoadingNext?: boolean;
    isLoadingPrevious?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    hasMore,
    canGoBack,
    onNextPage,
    onPreviousPage,
    onDownloadAll,
    totalRows,
    totalResultRows,
    isLoadingNext = false,
    isLoadingPrevious = false
}) => {
    console.log('Pagination render:', { currentPage, totalPages, hasMore, canGoBack, totalRows, totalResultRows });

    const paginationInfo = totalResultRows && totalResultRows > 0
        ? `Showing page ${currentPage} of ${totalPages} (${totalRows.toLocaleString()} of ${totalResultRows.toLocaleString()} total rows)`
        : `Showing page ${currentPage} of ${totalPages} (${totalRows.toLocaleString()} rows)`;

    return (
        <div className="pagination">
            <div className="pagination-info">
                {paginationInfo}
            </div>
            <div className="pagination-controls">
                <button className="download-btn" onClick={onDownloadAll}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download All
                </button>

                {canGoBack && (
                    <button className="pagination-btn" onClick={onPreviousPage} disabled={isLoadingPrevious}>
                        {isLoadingPrevious ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="loading-spinner">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                </circle>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        {isLoadingPrevious ? 'Loading...' : 'Previous'}
                    </button>
                )}

                {hasMore && (
                    <button className="pagination-btn" onClick={() => { console.log('Next button clicked!'); onNextPage(); }} disabled={isLoadingNext}>
                        {isLoadingNext ? 'Loading...' : 'Next'}
                        {isLoadingNext ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="loading-spinner">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                </circle>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}; 