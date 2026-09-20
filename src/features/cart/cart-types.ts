import type { Product } from "@/features/products/product-types";

export const MAX_CART_QUANTITY = 10;

export type CartItem = Pick<Product, "id" | "name" | "price" | "image" | "imageAlt" | "status" | "categoryLabel"> & {
  quantity: number;
};

export type CartProduct = Product;
