"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@/types/api";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: false,
    frequency: "daily",
    types: {
      rate_changes: true,
      new_rulings: true,
      exclusions: true,
    },
  });
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Save preferences to backend
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email Notifications</Label>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, email: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push">Push Notifications</Label>
              <Switch
                id="push"
                checked={preferences.push}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, push: checked }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Update Frequency</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: "immediate" | "daily" | "weekly") =>
                  setPreferences((prev) => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Update Types</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-changes">Rate Changes</Label>
              <Switch
                id="rate-changes"
                checked={preferences.types.rate_changes}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    types: { ...prev.types, rate_changes: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-rulings">New Rulings</Label>
              <Switch
                id="new-rulings"
                checked={preferences.types.new_rulings}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    types: { ...prev.types, new_rulings: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exclusions">Exclusions</Label>
              <Switch
                id="exclusions"
                checked={preferences.types.exclusions}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    types: { ...prev.types, exclusions: checked },
                  }))
                }
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </main>
  );
}