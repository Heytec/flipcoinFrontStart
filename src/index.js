// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store, { persistor } from "./app/store";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css"; // Tailwind CSS styles

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);




// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { Provider } from "react-redux";
// import store from "./app/store";
// import ErrorBoundary from "./components/ErrorBoundary";
// import "./index.css"; // Tailwind CSS styles

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <ErrorBoundary>
//     <Provider store={store}>
//       <App />
//     </Provider>
//   </ErrorBoundary>
// );
