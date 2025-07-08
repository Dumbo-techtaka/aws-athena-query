import './polyfills';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { AthenaResultsView } from './components/AthenaResultsView';
import { LoadingView } from './components/LoadingView';
import { PaginatedResults } from '../athena';
import { getVSCodeAPI } from './hooks/useVSCodeAPI';

// Error boundary component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red' }}>
                    <h2>Something went wrong.</h2>
                    <p>Error: {this.state.error?.message}</p>
                    <pre>{this.state.error?.stack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

interface WebviewState {
    type: 'loading' | 'results';
    query: string;
    paginatedResults?: PaginatedResults;
    originalQuery?: string;
    executionTime?: number;
    sessionId?: string;
}

declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage(message: any): void;
            getState(): any;
            setState(state: any): void;
        };
    }
}

const App: React.FC = () => {
    console.log('App component rendering');
    const [state, setState] = React.useState<WebviewState>({
        type: 'loading',
        query: ''
    });

    React.useEffect(() => {
        const vscode = getVSCodeAPI();

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            console.log('Received message:', message);

            switch (message.command) {
                case 'showLoading':
                    console.log('Setting loading state');
                    console.log('Loading message:', message);
                    console.log('Query in message:', message.query);
                    setState({
                        type: 'loading',
                        query: message.query || ''
                    });
                    break;
                case 'showResults':
                    console.log('Setting results state:', message);
                    console.log('Message details:', {
                        hasQuery: !!message.query,
                        hasPaginatedResults: !!message.paginatedResults,
                        hasOriginalQuery: !!message.originalQuery,
                        hasExecutionTime: !!message.executionTime,
                        hasSessionId: !!message.sessionId,
                        paginatedResultsKeys: message.paginatedResults ? Object.keys(message.paginatedResults) : []
                    });

                    const newState: WebviewState = {
                        type: 'results',
                        query: message.query,
                        paginatedResults: message.paginatedResults,
                        originalQuery: message.originalQuery,
                        executionTime: message.executionTime,
                        sessionId: message.sessionId
                    };
                    console.log('New state:', newState);
                    setState(newState);
                    vscode.setState(newState);
                    break;
                case 'updateResults':
                    setState(prevState => {
                        if (prevState.type === 'results') {
                            console.log('Updating results');
                            const updatedState = {
                                ...prevState,
                                paginatedResults: message.results
                            };
                            vscode.setState(updatedState);
                            return updatedState;
                        }
                        return prevState;
                    });
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // Always signal to extension that webview is ready - don't check saved state first
        console.log('Webview ready, sending webviewReady message');
        vscode.postMessage({ command: 'webviewReady' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    console.log('Current state:', state);
    console.log('State check:', {
        type: state.type,
        hasPaginatedResults: !!state.paginatedResults,
        hasOriginalQuery: !!state.originalQuery,
        hasExecutionTime: !!state.executionTime,
        hasSessionId: !!state.sessionId,
        paginatedResultsType: typeof state.paginatedResults,
        originalQueryType: typeof state.originalQuery,
        executionTimeType: typeof state.executionTime,
        sessionIdType: typeof state.sessionId
    });

    if (state.type === 'loading') {
        console.log('Rendering LoadingView with query:', state.query);
        return <LoadingView query={state.query} />;
    }

    if (state.type === 'results' && state.paginatedResults) {
        console.log('Rendering AthenaResultsView');
        console.log('Full state for results:', {
            type: state.type,
            query: state.query,
            paginatedResults: state.paginatedResults,
            originalQuery: state.originalQuery,
            executionTime: state.executionTime,
            sessionId: state.sessionId
        });
        return (
            <AthenaResultsView
                initialData={{
                    results: state.paginatedResults,
                    query: state.query || state.originalQuery || '',
                    executionTime: state.executionTime || 0,
                    sessionId: state.sessionId || ''
                }}
            />
        );
    }

    // Show loading as fallback
    console.log('Falling back to LoadingView - missing data:', {
        type: state.type,
        hasPaginatedResults: !!state.paginatedResults,
        hasOriginalQuery: !!state.originalQuery,
        hasExecutionTime: !!state.executionTime,
        hasSessionId: !!state.sessionId
    });
    return <LoadingView query={state.query || "Loading..."} />;
};

// Create root and render
console.log('Starting React app initialization');
const container = document.getElementById('root');
if (container) {
    console.log('Found root container, creating React root');
    try {
        const root = createRoot(container);
        root.render(
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        );
        console.log('React app rendered successfully');
    } catch (error) {
        console.error('Failed to render React app:', error);
        container.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>Failed to load React app</h2>
                <p>Error: ${error}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    }
} else {
    console.error('Root container not found!');
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Root container not found!</div>';
} 