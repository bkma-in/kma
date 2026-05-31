export const getDashboardByRole = (role?: string) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";

    case "reviewer":
      return "/reviewer/dashboard";

    case "reader":
      return "/reader/dashboard";

    case "dev":
      return "/dev/dashboard";

    case "author":
      return "/author/dashboard";

    default:
      // Unknown or missing role — redirect to login instead of a dashboard
      console.warn(`[getDashboardByRole] Unknown role: "${role}". Redirecting to login.`);
      return "/auth?mode=login";
  }
};
