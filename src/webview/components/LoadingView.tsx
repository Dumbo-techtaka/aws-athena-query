import * as React from 'react';
import './LoadingView.css';

interface LoadingViewProps {
    query: string;
    message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ query }) => {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [elapsedTime, setElapsedTime] = React.useState(0);

    const steps = [
        'Initializing AWS Athena connection...',
        'Validating query syntax...',
        'Submitting query to Athena...',
        'Processing query results...',
        'Formatting data for display...'
    ];

    React.useEffect(() => {
        // Start with step 0
        setCurrentStep(0);

        // Progress through steps more gradually and stop before the last step
        const stepTimers = [
            setTimeout(() => setCurrentStep(1), 800),   // 0.8 seconds
            setTimeout(() => setCurrentStep(2), 2000),  // 2 seconds
            setTimeout(() => setCurrentStep(3), 4000),  // 4 seconds
            // Don't automatically progress to step 4 - let it stay at step 3 until results come
        ];

        // Start the timer
        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => {
            stepTimers.forEach(timer => clearTimeout(timer));
            clearInterval(timerInterval);
        };
    }, []);

    const formatTime = (seconds: number) => {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

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
                <div className="status">
                    <span className="status-dot"></span>
                    Running... ({formatTime(elapsedTime)})
                </div>
            </div>

            <div className="loading-container">
                <div className="query-preview">
                    <div className="query-preview-text">{query}</div>
                </div>

                <div className="loading-steps">
                    {steps.map((step, index) => (
                        <div key={index} className="loading-step">
                            <div className={`step-icon ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}>
                                {index < currentStep ? '✓' : index + 1}
                            </div>
                            <span>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 