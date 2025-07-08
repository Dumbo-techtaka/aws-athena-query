declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage(message: any): void;
            getState(): any;
            setState(state: any): void;
        };
    }
}

// Singleton instance of VS Code API
let vscodeAPIInstance: ReturnType<typeof window.acquireVsCodeApi> | null = null;

export const getVSCodeAPI = () => {
    if (!vscodeAPIInstance) {
        if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
            vscodeAPIInstance = window.acquireVsCodeApi();
        } else {
            vscodeAPIInstance = {
                postMessage: () => { },
                getState: () => ({}),
                setState: () => { }
            };
        }
    }
    return vscodeAPIInstance;
};

export const useVSCodeAPI = () => {
    return getVSCodeAPI();
}; 