export type ProductErrorCode =
  | "INVALID_PRODUCT"
  | "DUPLICATE_SLUG"
  | "DUPLICATE_SKU"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_HAS_ORDER_HISTORY"
  | "DATABASE_ERROR";

export class ProductServiceError extends Error {
  constructor(
    public readonly code: ProductErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = "ProductServiceError";
  }
}
