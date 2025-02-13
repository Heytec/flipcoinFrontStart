import axios from "axios";
import { logout, updateAccessToken } from "../features/authSlice";

// Use the environment variable for baseURL
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token if needed
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          { refreshToken }
        );

        // Dynamically import store to avoid circular dependency
        const { default: store } = await import("../app/store");

        store.dispatch(updateAccessToken(response.data.accessToken));
        originalRequest.headers["Authorization"] = `Bearer ${response.data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        const { default: store } = await import("../app/store");
        store.dispatch(logout());
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// import axios from "axios";
// import { logout, updateAccessToken } from "../features/authSlice";

// const axiosInstance = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// // Attach access token to headers
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor to refresh token if needed
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = localStorage.getItem("refreshToken");
//         const response = await axios.post(
//           "http://localhost:5000/api/auth/refresh",
//           { refreshToken }
//         );

//         // Dynamically import store to avoid circular dependency
//         const { default: store } = await import("../app/store");

//         store.dispatch(updateAccessToken(response.data.accessToken));
//         originalRequest.headers["Authorization"] = `Bearer ${response.data.accessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (err) {
//         const { default: store } = await import("../app/store");
//         store.dispatch(logout());
//         return Promise.reject(err);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;


// import axios from "axios";
// import store from "./store";
// import { logout, updateAccessToken } from "../features/authSlice";

// const axiosInstance = axios.create({
//   baseURL: "http://localhost:5000/api", // Adjust as needed
// });

// // Attach access token to headers
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor to refresh token if needed
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = localStorage.getItem("refreshToken");
//         const response = await axios.post(
//           "http://localhost:5000/api/auth/refresh",
//           { refreshToken }
//         );
//         store.dispatch(updateAccessToken(response.data.accessToken));
//         originalRequest.headers[
//           "Authorization"
//         ] = `Bearer ${response.data.accessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (err) {
//         store.dispatch(logout());
//         return Promise.reject(err);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
