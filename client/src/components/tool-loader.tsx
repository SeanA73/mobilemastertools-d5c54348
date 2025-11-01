import { lazy, Suspense, ComponentType } from "react";
import { ErrorBoundary } from "./error-boundary";
import { Card, CardContent } from "@/components/ui/card";

// Loading fallback component
const ToolLoadingSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-6 p-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Lazy load tool component with error boundary and suspense
export function createLazyTool<T = {}>(importFn: () => Promise<{ default: ComponentType<T> }>) {
  const LazyComponent = lazy(importFn);
  
  return function LazyToolWrapper(props: T) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ToolLoadingSkeleton />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

