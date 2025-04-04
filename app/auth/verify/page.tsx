"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyPage() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid verification link");
      setVerifying(false);
      return;
    }

    verifyEmail(token)
      .then(() => {
        router.push("/auth/login?verified=true");
      })
      .catch((err) => {
        setError(err.message);
        setVerifying(false);
      });
  }, [searchParams, router, verifyEmail]);

  if (verifying) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying your email...</p>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
        </Card>
      </main>
    );
  }

  return null;
}