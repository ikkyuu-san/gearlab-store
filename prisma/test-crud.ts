import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { archiveProduct, createProduct, deleteProduct, getAdminProductById, getProductById, getProductBySlug, listAdminProducts, listProducts, unarchiveProduct, updateProduct } from "../src/server/products";
import { ProductServiceError } from "../src/server/product-errors";
import { createGuestOrder, OrderServiceError } from "../src/server/orders";

const prisma = new PrismaClient();

async function main() {
  const slug = `crud-test-${Date.now()}`;
  const checkoutToken = randomUUID();
  let testId: string | undefined;
  try {
    let invalidHandled = false;
    try {
      await createProduct({ name: "Invalid" });
    } catch (error) {
      invalidHandled = error instanceof ProductServiceError && error.code === "INVALID_PRODUCT";
    }
    if (!invalidHandled) throw new Error("Invalid product verification failed.");

    let invalidCategoryHandled = false;
    try {
      await createProduct({ slug: `${slug}-bad-category`, name: "Invalid Category", description: "Should fail.", category: "unmanaged-category", priceMMK: 1 });
    } catch (error) {
      invalidCategoryHandled = error instanceof ProductServiceError && error.code === "INVALID_PRODUCT";
    }
    if (!invalidCategoryHandled) throw new Error("Controlled category verification failed.");

    const created = await createProduct({
      slug,
      name: "CRUD Test Product",
      description: "Temporary product used by the development CRUD verification script.",
      category: "desk",
      brand: "Verification",
      sku: `TEST-${Date.now()}`,
      priceMMK: 1,
      imageUrl: null,
      imageAlt: "Temporary verification image description",
      stockStatus: "PREORDER",
      featured: false,
      specifications: [
        { name: " Weight ", value: " 55g " },
        { name: "", value: "" },
        { name: "Sensor", value: "PAW3395" },
      ],
    });
    testId = created.id;

    const readBySlug = await getProductBySlug(slug);
    if (!readBySlug || readBySlug.id !== created.id) throw new Error("Read-by-slug verification failed.");
    if (readBySlug.specifications.map(({ name, value }) => `${name}:${value}`).join("|") !== "Weight:55g|Sensor:PAW3395") throw new Error("Public product specification read/order verification failed.");
    const adminRecord = await getAdminProductById(created.id);
    if (!adminRecord?.active || adminRecord.brand !== "Verification" || !adminRecord.sku || adminRecord.category !== "desk-accessories" || adminRecord.imageAlt !== "Temporary verification image description") throw new Error("Product domain field verification failed.");
    if (adminRecord.specifications.map(({ name, value, position }) => `${name}:${value}:${position}`).join("|") !== "Weight:55g:0|Sensor:PAW3395:1") throw new Error("Product specification create/trim/order verification failed.");
    if (readBySlug.imageAlt !== "Temporary verification image description") throw new Error("Product image alt text verification failed.");

    const updated = await updateProduct(created.id, { name: "CRUD Test Product Updated", priceMMK: 2, specifications: [{ name: "Layout", value: "60%" }] });
    if (updated.name !== "CRUD Test Product Updated" || updated.price !== 2) throw new Error("Update verification failed.");
    const updatedAdminRecord = await getAdminProductById(created.id);
    if (updatedAdminRecord?.specifications.length !== 1 || updatedAdminRecord.specifications[0]?.name !== "Layout") throw new Error("Product specification edit/removal verification failed.");
    await updateProduct(created.id, { specifications: [] });
    const productWithoutSpecifications = await getProductBySlug(slug);
    if (!productWithoutSpecifications || productWithoutSpecifications.specifications.length !== 0) throw new Error("Product without specifications verification failed.");

    let duplicateHandled = false;
    try {
      await createProduct({ slug, name: "Duplicate Test", description: "Should fail", category: "keyboards", priceMMK: 1 });
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

    const archived = await archiveProduct(created.id);
    const archivedRecord = await getAdminProductById(created.id);
    if (archived.active || !archived.archivedAt || archivedRecord?.active !== false || !archivedRecord.archivedAt) {
      throw new Error("Archive state verification failed.");
    }
    if (await getProductBySlug(slug) || (await listProducts()).some((product) => product.id === created.id)) {
      throw new Error("Archived product was visible publicly.");
    }
    if (!(await listAdminProducts()).some((product) => product.id === created.id)) {
      throw new Error("Archived product was not available to admin queries.");
    }

    let archivedCheckoutRejected = false;
    try {
      await createGuestOrder({
        checkoutToken,
        customerName: "Temporary Verification",
        phone: "+95000000000",
        email: "",
        deliveryAddress: "Temporary verification address",
        note: "",
        items: [{ productId: created.id, quantity: 1 }],
      });
    } catch (error) {
      archivedCheckoutRejected = error instanceof OrderServiceError && error.code === "PRODUCT_UNAVAILABLE";
    }
    if (!archivedCheckoutRejected) throw new Error("Archived product checkout was not rejected.");

    const unarchived = await unarchiveProduct(created.id);
    const restored = await getAdminProductById(created.id);
    if (!unarchived.active || unarchived.archivedAt || restored?.active !== true || restored.archivedAt) {
      throw new Error("Unarchive state verification failed.");
    }
    if (!(await listProducts()).some((product) => product.id === created.id)) {
      throw new Error("Unarchived product was not visible publicly.");
    }

    const historicalProduct = await prisma.product.findFirst({ where: { orderItems: { some: {} } }, select: { id: true } });
    if (historicalProduct) {
      let historicalDeleteBlocked = false;
      try { await deleteProduct(historicalProduct.id); } catch (error) {
        historicalDeleteBlocked = error instanceof ProductServiceError && error.code === "PRODUCT_HAS_ORDER_HISTORY";
      }
      if (!historicalDeleteBlocked) throw new Error("Product with historical orders was not protected from deletion.");
    }

    await deleteProduct(created.id);
    testId = undefined;
    if (await getProductById(created.id)) throw new Error("Delete verification failed.");

    console.log("Product verification passed: CRUD, controlled categories, archive/unarchive, inactive checkout rejection, and historical delete protection.");
  } finally {
    const accidentalTestOrder = await prisma.order.findUnique({ where: { checkoutToken }, select: { id: true } });
    if (accidentalTestOrder) await prisma.order.delete({ where: { id: accidentalTestOrder.id } }).catch(() => undefined);
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
