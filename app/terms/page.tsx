"use client";

import { Scale } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Scale className="h-8 w-8" />
          Terms of Service
        </h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card className="p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using TariffsTracker, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by these terms, please
            do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="text-muted-foreground mb-4">
            Permission is granted to temporarily access and use TariffsTracker for personal,
            non-commercial purposes. This is the grant of a license, not a transfer of title.
          </p>
          <p className="text-muted-foreground">
            Under this license, you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
          <p className="text-muted-foreground">
            The materials on TariffsTracker are provided on an 'as is' basis. We make no
            warranties, expressed or implied, and hereby disclaim and negate all other warranties
            including, without limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of intellectual property or
            other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
          <p className="text-muted-foreground">
            In no event shall TariffsTracker or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit, or due to
            business interruption) arising out of the use or inability to use TariffsTracker.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Revisions</h2>
          <p className="text-muted-foreground">
            We may revise these terms of service at any time without notice. By using
            TariffsTracker, you are agreeing to be bound by the current version of these
            terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
          <p className="text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:legal@tariffstracker.com" className="text-primary hover:underline">
              legal@tariffstracker.com
            </a>
          </p>
        </section>
      </Card>
    </main>
  );
}