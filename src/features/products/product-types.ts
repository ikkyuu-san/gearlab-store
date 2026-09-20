export type ProductStatus = "Preorder" | "In Stock" | "Out of Stock";

export type Product = {
  id: string;
  category: string;
  categoryLabel: string;
  name: string;
  price: number;
  status: ProductStatus;
  image: string | null;
  imageAlt: string;
  description: string;
  details: string[];
};
