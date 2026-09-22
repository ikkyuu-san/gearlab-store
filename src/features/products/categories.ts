export const PRODUCT_CATEGORIES = [
  { id: "keyboards", name: "Gaming Keyboards", caption: "Every keystroke counts.", image: "/images/demo-keyboard.png" },
  { id: "mice", name: "Gaming Mice", caption: "Precision in your hands.", image: "/images/demo-mouse.png" },
  { id: "audio", name: "Audio", caption: "Hear every detail.", image: "/images/demo-audio.png" },
  { id: "desk-accessories", name: "Desk Accessories", caption: "Make the space yours.", image: null },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]["id"];

export const PRODUCT_CATEGORY_IDS = PRODUCT_CATEGORIES.map((category) => category.id) as [
  ProductCategoryId,
  ...ProductCategoryId[],
];

export function normalizeProductCategory(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "desk" ? "desk-accessories" : normalized;
}

export function getProductCategoryId(value: string | undefined): ProductCategoryId | null {
  if (!value) return null;
  const normalized = normalizeProductCategory(value);
  return PRODUCT_CATEGORY_IDS.includes(normalized as ProductCategoryId)
    ? normalized as ProductCategoryId
    : null;
}

export function getProductCategoryLabel(value: string) {
  const id = getProductCategoryId(value);
  return PRODUCT_CATEGORIES.find((category) => category.id === id)?.name ?? value;
}
