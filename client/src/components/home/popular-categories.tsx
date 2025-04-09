import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Link } from "wouter";
import { Loading } from "@/components/ui/loading";

// Sample images for categories - in a real app, these would be fetched from backend
const categoryImages = [
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=250",
  "https://images.unsplash.com/photo-1582192730841-2a682d7375f9?auto=format&fit=crop&w=400&h=250",
  "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=400&h=250",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=400&h=250",
];

export function PopularCategories() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  // Take just the top 4 categories
  const topCategories = categories.slice(0, 4);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-sans mb-8">Categorias populares</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {topCategories.map((category, index) => (
            <Link key={category.id} href={`/busca?categoria=${category.slug}`} className="group">
              <div className="relative rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img
                  src={categoryImages[index % categoryImages.length]}
                  alt={category.name}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-white font-bold text-lg">{category.name}</h3>
                  <span className="text-white text-sm">
                    {category.productsCount} produtos
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
