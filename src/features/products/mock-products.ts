import type { Product } from "./product-types";
import { PRODUCT_CATEGORIES } from "./categories";

export type { Product } from "./product-types";
export const categories = PRODUCT_CATEGORIES;
export type CategoryId = (typeof categories)[number]["id"];

// Display-only examples used by the seed script. The frontend reads the database.

export const mockProducts: Product[] = [
  {
    id: "compact-keyboard", category: "keyboards", categoryLabel: "Gaming keyboards",
    name: "Compact Mechanical Keyboard", price: 2490, status: "Preorder",
    image: "/images/demo-keyboard.png", imageAlt: "Demo graphite keyboard with light gray accent keys",
    description: "A considered starting point for your setup. A compact layout, tactile keys, and a clean graphite finish.",
    details: ["Compact layout", "Graphite finish", "Mechanical keys"],
  },
  {
    id: "wireless-mouse", category: "mice", categoryLabel: "Gaming mice",
    name: "Lightweight Wireless Mouse", price: 1590, status: "Preorder",
    image: "/images/demo-mouse.png", imageAlt: "Demo matte black wireless mouse with sculpted sides",
    description: "A minimal profile for an uncluttered desk, with a comfortable shape and a matte black finish.",
    details: ["Wireless design", "Sculpted shape", "Matte black finish"],
  },
  {
    id: "studio-headset", category: "audio", categoryLabel: "Audio",
    name: "Over-Ear Gaming Headset", price: 2990, status: "Preorder",
    image: "/images/demo-audio.png", imageAlt: "Demo black over-ear headset with padded earcups and a microphone",
    description: "Stay immersed in your games and connected to your team with cushioned earcups and an understated design.",
    details: ["Over-ear design", "Padded earcups", "Boom microphone"],
  },
  {
    id: "desk-mat", category: "desk-accessories", categoryLabel: "Desk Accessories",
    name: "Extended Desk Mat", price: 690, status: "In Stock",
    image: null, imageAlt: "Desk mat photo coming soon",
    description: "A simple foundation for your everyday space. Soft charcoal fabric with neatly stitched edges.",
    details: ["Extended format", "Fabric surface", "Stitched edges"],
  },
];

export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("en-US").format(price)} THB`;
}
