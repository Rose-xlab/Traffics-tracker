"use client";

import { Bell } from "lucide-react";
import { NotificationList } from "@/components/data/notification-list";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
        </div>

        <NotificationList />
      </main>
    </AuthGuard>
  );
}