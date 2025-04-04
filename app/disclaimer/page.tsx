"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DisclaimerPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Disclaimer
        </h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card className="p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information Accuracy</h2>
          <p className="text-muted-foreground">
            While we strive to provide accurate and up-to-date information, TariffsTracker makes
            no representations or warranties of any kind, express or implied, about the
            completeness, accuracy, reliability, suitability, or availability of the information
            contained on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Not Legal Advice</h2>
          <p className="text-muted-foreground">
            The information provided on TariffsTracker is for general informational purposes only
            and should not be construed as legal advice. You should consult with qualified legal
            counsel or customs brokers for specific guidance related to your import/export
            activities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
          <p className="text-muted-foreground mb-4">
            Our platform aggregates data from various official sources, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>U.S. International Trade Commission (USITC)</li>
            <li>U.S. Trade Representative (USTR)</li>
            <li>U.S. Customs and Border Protection (CBP)</li>
            <li>Department of Commerce</li>
            <li>Federal Register</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            While we regularly update our database, there may be delays between official updates
            and their reflection on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            In no event shall TariffsTracker be liable for any direct, indirect, incidental,
            consequential, or punitive damages arising out of your access to or use of our
            platform. This includes any errors or omissions in any content, or any loss or
            damage of any kind incurred as a result of the use of any content posted,
            transmitted, or otherwise made available via TariffsTracker.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">External Links</h2>
          <p className="text-muted-foreground">
            Our platform may contain links to external websites that are not provided or
            maintained by us. We do not guarantee the accuracy, relevance, timeliness, or
            completeness of any information on these external websites.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p className="text-muted-foreground">
            If you have any questions about this disclaimer, please contact us at{" "}
            <a href="mailto:legal@tariffstracker.com" className="text-primary hover:underline">
              legal@tariffstracker.com
            </a>
          </p>
        </section>
      </Card>
    </main>
  );
}