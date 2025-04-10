import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex justify-center items-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}