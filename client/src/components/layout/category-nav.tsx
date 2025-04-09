import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Loading } from "@/components/ui/loading";

import { 
  Utensils, 
  Thermometer, 
  Flame, 
  Brush, 
  Wine, 
  LayoutGrid, 
  BringToFront 
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  "utensils": <Utensils className="text-xl" />,
  "temperature-low": <Thermometer className="text-xl" />,
  "fire": <Flame className="text-xl" />,
  "blender": <Brush className="text-xl" />,
  "wine-glass-alt": <Wine className="text-xl" />,
  "sink": <LayoutGrid className="text-xl" />,
  "chair": <BringToFront className="text-xl" />
};

export function CategoryNav() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-6 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={`/busca?categoria=${category.slug}`}
              className="flex flex-col items-center p-2 hover:text-primary transition-colors"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                {ICON_MAP[category.icon ?? ""] || <Utensils className="text-xl" />}
              </div>
              <span className="text-sm font-medium text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
