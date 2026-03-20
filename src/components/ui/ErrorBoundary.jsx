import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("App Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8f9fc',
                    fontFamily: 'Arial, sans-serif',
                    padding: '20px'
                }}>
                    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '600px' }}>
                        <div style={{ 
                            background: '#FEE2E2', 
                            color: '#991B1B', 
                            padding: '12px 20px', 
                            borderRadius: '8px', 
                            marginBottom: '20px',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            ⚠️ Error in Application
                        </div>
                        <h1 style={{ color: '#111834', marginBottom: '1rem', fontSize: '24px' }}>Something went wrong</h1>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '1rem' }}>
                            {this.state.error?.message}
                        </p>
                        <details style={{ 
                            textAlign: 'left', 
                            background: '#f5f5f5', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            marginTop: '15px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                                Stack Trace (for developers)
                            </summary>
                            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                                {this.state.error?.stack}
                            </pre>
                        </details>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                background: '#4F27E9',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginTop: '20px',
                                fontSize: '14px'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
