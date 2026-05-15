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
    default:
      return "/author/dashboard";
  }
};
