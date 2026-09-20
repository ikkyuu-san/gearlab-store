import { PrismaClient } from "@prisma/client";
import { createProduct, deleteProduct, getProductById, getProductBySlug, updateProduct } from "../src/server/products";
import { ProductServiceError } from "../src/server/product-errors";

const prisma = new PrismaClient();

async function main() {
  const slug = `crud-test-${Date.now()}`;
  let testId: string | undefined;
  try {
    let invalidHandled = false;
    try {
      await createProduct({ name: "Invalid" });
    } catch (error) {
      invalidHandled = error instanceof ProductServiceError && error.code === "INVALID_PRODUCT";
    }
    if (!invalidHandled) throw new Error("Invalid product verification failed.");

    const created = await createProduct({
      slug,
      name: "CRUD Test Product",
      description: "Temporary product used by the development CRUD verification script.",
      category: "testing",
      priceTHB: 1,
      imageUrl: null,
      stockStatus: "PREORDER",
      featured: false,
    });
    testId = created.id;

    const readBySlug = await getProductBySlug(slug);
    if (!readBySlug || readBySlug.id !== created.id) throw new Error("Read-by-slug verification failed.");

    const updated = await updateProduct(created.id, { name: "CRUD Test Product Updated", priceTHB: 2 });
    if (updated.name !== "CRUD Test Product Updated" || updated.price !== 2) throw new Error("Update verification failed.");

    let duplicateHandled = false;
    try {
      await createProduct({ slug, name: "Duplicate Test", description: "Should fail", category: "testing", priceTHB: 1 });
    } catch (error) {
      duplicateHandled = error instanceof ProductServiceError && error.code === "DUPLICATE_SLUG";
    }
    if (!duplicateHandled) throw new Error("Duplicate slug verification failed.");

    let notFoundHandled = false;
    try {
      await updateProduct("missing-product-id", { name: "Should fail" });
    } catch (error) {
      notFoundHandled = error instanceof ProductServiceError && error.code === "PRODUCT_NOT_FOUND";
    }
    if (!notFoundHandled) throw new Error("Product-not-found verification failed.");

    await deleteProduct(created.id);
    testId = undefined;
    if (await getProductById(created.id)) throw new Error("Delete verification failed.");

    console.log("CRUD verification passed: create, read, update, duplicate-slug handling, and delete.");
  } finally {
    if (testId) await prisma.product.delete({ where: { id: testId } }).catch(() => undefined);
  }
}

main()
  .catch(() => {
    console.error("CRUD verification failed. Check the database configuration and availability.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
