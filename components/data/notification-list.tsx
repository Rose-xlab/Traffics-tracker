"use client";

import { Bell, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date-formatter";
import { useNotifications } from "@/hooks/use-notifications";
import { LoadingState } from "@/components/data/loading-state";
import { EmptyState } from "@/components/data/empty-state";

export function NotificationList() {
  const { notifications, loading, markAsRead } = useNotifications();

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (!notifications.length) {
    return (
      <EmptyState
        icon={<Bell className="h-8 w-8" />}
        title="No notifications"
        description="You're all caught up!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 ${notification.read ? 'bg-muted' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(notification.created_at)}
              </p>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => markAsRead(notification.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}