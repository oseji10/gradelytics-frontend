import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const PUBLIC_PREFIXES = [
  "/signup",
  "/signin",
  "/refresh",
  "/logout",
  "/resend-otp",
  "/verify-otp",
  "/setup-password",
  "/roles",
  "/stripe/webhook",
  "/learning",
];

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    const url = config.url ?? "";

    // Skip public routes
    if (PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      return config;
    }

    if (typeof window === "undefined") return config;

    // Get current user from localStorage
    const user = localStorage.getItem("user");
    let isAdmin = false;
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        const role = parsedUser.role?.toUpperCase();
        isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN";
      } catch {
        console.warn("Failed to parse user from localStorage");
      }
    }

    // Attach tenant ID only if NOT admin
    if (!isAdmin) {
      const schoolIdStr = localStorage.getItem("currentSchoolId");
      if (schoolIdStr) {
        const schoolId = Number(schoolIdStr);
        if (!isNaN(schoolId)) {
          config.headers["X-School-ID"] = schoolId;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to signin
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("currentSchoolId");
        localStorage.removeItem("user");
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
