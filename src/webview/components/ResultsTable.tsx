import React, { useState, useEffect, useRef } from 'react';

export interface QueryResult {
    [key: string]: string;
}

interface ResultsTableProps {
    results: QueryResult[];
    currentPage: number;
    pageSize: number;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
    results,
    currentPage,
    pageSize
}) => {
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const [isResizing, setIsResizing] = useState(false);
    const [currentColumn, setCurrentColumn] = useState<string | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        // Initialize column widths if not set
        if (results.length > 0 && Object.keys(columnWidths).length === 0) {
            const columns = Object.keys(results[0]);
            const initialWidths: { [key: string]: number } = {};
            columns.forEach((col, index) => {
                if (index === 0) {
                    initialWidths[col] = 50; // Index column
                } else {
                    initialWidths[col] = 150; // Default width
                }
            });
            setColumnWidths(initialWidths);
        }
    }, [results, columnWidths]);

    const handleMouseDown = (e: React.MouseEvent, column: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const isNearRightEdge = e.clientX > rect.right - 8;

        if (isNearRightEdge) {
            setIsResizing(true);
            setCurrentColumn(column);
            setStartX(e.clientX);
            setStartWidth(columnWidths[column] || 150);
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !currentColumn) return;

        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff);

        setColumnWidths(prev => ({
            ...prev,
            [currentColumn]: newWidth
        }));
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        setCurrentColumn(null);
    };

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, startX, startWidth, currentColumn]);

    if (results.length === 0) {
        return null;
    }

    const columns = Object.keys(results[0]);

    return (
        <div className="results-container">
            <div className="table-container">
                <table ref={tableRef} className="results-table">
                    <thead>
                        <tr>
                            <th
                                className="index-column"
                                style={{ width: '50px', minWidth: '50px', maxWidth: '60px' }}
                            >
                                #
                            </th>
                            {columns.map((column, index) => (
                                <th
                                    key={column}
                                    onMouseDown={(e) => handleMouseDown(e, column)}
                                    style={{
                                        width: `${columnWidths[column] || 150}px`,
                                        minWidth: `${columnWidths[column] || 150}px`,
                                        maxWidth: `${columnWidths[column] || 150}px`
                                    }}
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row, rowIndex) => {
                            const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1;
                            return (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'even' : 'odd'}>
                                    <td className="index-column">{rowNumber}</td>
                                    {columns.map((column, colIndex) => (
                                        <td
                                            key={column}
                                            style={{
                                                width: `${columnWidths[column] || 150}px`,
                                                minWidth: `${columnWidths[column] || 150}px`,
                                                maxWidth: `${columnWidths[column] || 150}px`
                                            }}
                                            title={row[column] || ''}
                                        >
                                            {row[column] || ''}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 