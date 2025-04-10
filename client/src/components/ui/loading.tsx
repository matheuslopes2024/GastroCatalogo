import { Loader2 } from "lucide-react";
import { Skeleton } from "./skeleton";

export function Loading() {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      {/* Primeiro grupo de comparação */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b border-gray-200">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="divide-y divide-gray-200">
          {/* Primeiro produto */}
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/5">
                <Skeleton className="w-full h-40 md:h-32" />
              </div>
              <div className="md:w-2/5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
                <div className="flex flex-col items-start md:items-end w-full">
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-20 mb-4" />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
                  <Skeleton className="h-10 w-full md:w-32" />
                  <Skeleton className="h-10 w-full md:w-32" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Segundo produto */}
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/5">
                <Skeleton className="w-full h-40 md:h-32" />
              </div>
              <div className="md:w-2/5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
                <div className="flex flex-col items-start md:items-end w-full">
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-20 mb-4" />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
                  <Skeleton className="h-10 w-full md:w-32" />
                  <Skeleton className="h-10 w-full md:w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Segundo grupo de comparação (mais curto) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b border-gray-200">
          <Skeleton className="h-6 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="divide-y divide-gray-200">
          {/* Somente um produto */}
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/5">
                <Skeleton className="w-full h-40 md:h-32" />
              </div>
              <div className="md:w-2/5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
                <div className="flex flex-col items-start md:items-end w-full">
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-20 mb-4" />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
                  <Skeleton className="h-10 w-full md:w-32" />
                  <Skeleton className="h-10 w-full md:w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}