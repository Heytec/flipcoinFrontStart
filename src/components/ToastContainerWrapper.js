// src/components/ToastContainerWrapper.js
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Consider moving the custom toast styles here or into App.js
// import './ToastStyles.css'; // Example if you move styles

export default function ToastContainerWrapper() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      // This style pushes the container down from the top edge
      style={{ top: '80px' }}
      // You might alternatively use the `toastClassName` or `bodyClassName` props
      // combined with CSS for more complex default styling if needed.
    />
  );
}

// import React from "react";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// export default function ToastContainerWrapper() {
//   return (
//     <ToastContainer
//       position="top-center"
//       autoClose={3000}
//       hideProgressBar={false}
//       newestOnTop={false}
//       closeOnClick
//       rtl={false}
//       pauseOnFocusLoss
//       draggable
//       pauseOnHover
//       style={{ top: '80px' }} // Corrected syntax: double curly braces
//     />
//   );
// }
