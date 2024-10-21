import zod from "zod";

const AddProductSchema = zod.object({
  productName: zod.string(),
  productDescription: zod.string().optional(),
  hsnCode: zod.string().optional(),
  price: zod.number(),
  taxId: zod.string(),
});

const UpdateProductsSchema = zod.object({
  productName: zod.string().optional(),
  productDescription: zod.string().optional(),
  hsnCode: zod.string().optional(),
  price: zod.number().optional(),
  taxId: zod.string().optional(),
});

export { AddProductSchema, UpdateProductsSchema };
