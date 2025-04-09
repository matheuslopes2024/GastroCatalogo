import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex items-center justify-center p-4 h-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
