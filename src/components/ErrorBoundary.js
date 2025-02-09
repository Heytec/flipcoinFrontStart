// import React from 'react';

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
