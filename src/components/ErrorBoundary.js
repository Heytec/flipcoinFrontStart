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
        <div className="p-6 text-center bg-gradient-to-r from-[#0d1526] to-[#111c35] border-t-2 border-red-500 rounded-xl shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#09101f] border border-red-500 flex items-center justify-center">
              <svg 
                className="w-7 h-7 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-red-400 mb-3">Oops! Something went wrong.</h1>
          <p className="text-gray-300 bg-[#0a121e] p-3 rounded-lg border border-gray-800">
            {this.formatErrorMessage(this.state.errorMessage)}
          </p>

          {this.state.errorInfo && (
            <details className="mt-4 text-sm text-gray-400 bg-[#0a121e] p-3 rounded-lg border border-gray-800">
              <summary className="cursor-pointer text-[#00ff88] font-medium">Show Error Details</summary>
              <div className="mt-2 overflow-auto" style={{ maxHeight: '200px', whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack}
              </div>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg flex items-center justify-center mx-auto"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
///////////**************************************************************************************************************************************************************************************************************************************************** */


// // import React from 'react';
// import React from 'react';

// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, errorMessage: '', errorInfo: null };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, errorMessage: error };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error("ErrorBoundary caught an error", error, errorInfo);
//     this.setState({ errorMessage: error, errorInfo });
//   }

//   formatErrorMessage(error) {
//     if (typeof error === 'object' && error !== null) {
//       return error.message || JSON.stringify(error, null, 2);
//     }
//     return error.toString();
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="p-6 text-center bg-red-100 border border-red-400 rounded-lg">
//           <h1 className="text-2xl font-bold text-red-700 mb-3">Oops! Something went wrong.</h1>
//           <p className="text-gray-800">{this.formatErrorMessage(this.state.errorMessage)}</p>

//           {this.state.errorInfo && (
//             <details className="mt-4 text-sm text-gray-600" style={{ whiteSpace: 'pre-wrap' }}>
//               {this.state.errorInfo.componentStack}
//             </details>
//           )}

//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
//           >
//             Refresh Page
//           </button>
//         </div>
//       );
//     }

//     return this.props.children; 
//   }
// }

// export default ErrorBoundary;








///////////**************************************************************************************************************************************************************************************************************************************************** */
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
//


/****************************************************************************** */
{/* <div className="p-6 text-center bg-gray-900 border border-gray-800 rounded-lg">
  <h1 className="text-2xl font-bold text-green-400 mb-3">Oops! Something went wrong.</h1>
  <p className="text-gray-300">{this.formatErrorMessage(this.state.errorMessage)}</p>

  {this.state.errorInfo && (
    <details className="mt-4 text-sm text-gray-400" style={{ whiteSpace: 'pre-wrap' }}>
      {this.state.errorInfo.componentStack}
    </details>
  )}

  <button
    onClick={() => window.location.reload()}
    className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-bold"
  >
    REFRESH PAGE
  </button>
</div> */}