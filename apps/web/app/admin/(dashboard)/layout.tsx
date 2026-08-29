import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin-tabs";

// Shared by /admin, /admin/posts, /admin/comments, /admin/about and
// /admin/experience (a route group, so it doesn't add a URL segment) —
// keeps the tab strip mounted across those routes while the section below
// it swaps per page. /admin/login sits outside this group and has no tabs.
export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <AdminTabs />
      {children}
    </div>
  );
}
