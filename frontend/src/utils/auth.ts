export const getDashboardByRole = (role?: string) => {
  switch (role) {
    case "admin":
      return "/admin";

    case "reviewer":
      return "/reviewer";

    case "reader":
      return "/reader";

    case "dev":
      return "/dev";

    case "author":
      return "/author";

    default:
      // Unknown or missing role — redirect to login instead of a dashboard
      console.warn(`[getDashboardByRole] Unknown role: "${role}". Redirecting to login.`);
      return "/auth?mode=login";
  }
};
