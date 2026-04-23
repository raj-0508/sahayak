import { ExplainerGenerator } from "@/components/dashboard/explainer-generator";

export default function ExplainersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">AI Explainers</h1>
        <p className="text-muted-foreground">
          Get simple explanations and visual aids for complex topics.
        </p>
      </div>
      <ExplainerGenerator />
    </div>
  );
}
