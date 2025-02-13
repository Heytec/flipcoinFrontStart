// import React from 'react';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorMessage: error, errorInfo });
  }

  formatErrorMessage(error) {
    if (typeof error === 'object' && error !== null) {
      return error.message || JSON.stringify(error, null, 2);
    }
    return error.toString();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center bg-red-100 border border-red-400 rounded-lg">
          <h1 className="text-2xl font-bold text-red-700 mb-3">Oops! Something went wrong.</h1>
          <p className="text-gray-800">{this.formatErrorMessage(this.state.errorMessage)}</p>

          {this.state.errorInfo && (
            <details className="mt-4 text-sm text-gray-600" style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo.componentStack}
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, error: null, errorInfo: null };
//   }

//   static getDerivedStateFromError(error) {
//     // Update state so the next render shows the fallback UI.
//     return { hasError: true, error };
//   }

//   componentDidCatch(error, errorInfo) {
//     // You can also log the error to an error reporting service here.
//     this.setState({ error, errorInfo });
//     console.error("ErrorBoundary caught an error", error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       // Customize the fallback UI
//       return (
//         <div className="p-4 text-center">
//           <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
//           <p className="mb-2">{this.state.error && this.state.error.toString()}</p>
//           <details style={{ whiteSpace: 'pre-wrap' }}>
//             {this.state.errorInfo && this.state.errorInfo.componentStack}
//           </details>
//         </div>
//       );
//     }
//     return this.props.children; 
//   }
// }

// export default ErrorBoundary;
