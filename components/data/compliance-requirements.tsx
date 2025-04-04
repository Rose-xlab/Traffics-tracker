"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ComplianceRequirementsProps {
  requirements: string[];
}

export function ComplianceRequirements({ requirements }: ComplianceRequirementsProps) {
  if (requirements.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No compliance requirements found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Requirements</h3>
      <ul className="space-y-2">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <span>{req}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}