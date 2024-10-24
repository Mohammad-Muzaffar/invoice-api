import zod from "zod";

const AddQuoteSchema = zod.object({
  quoteNumber: zod.string(),
  quoteDate: zod.string(),
  quoteDueDate: zod.string(),
  status: zod.enum(["ACCEPTED", "DECLINED", "DRAFT", "CONVERTED_TO_INVOICE"]),
  total: zod.number(),
  subTotal: zod.number(),
  discount: zod.number().default(0),
  totalTax: zod.number(),
  notes: zod.string().optional(),
  gst: zod.number().optional(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
  clientId: zod.string(),
  shippingAddressId: zod.string(),
  quoteItems: zod.array(
    zod.object({
      productName: zod.string(),
      productDescription: zod.string().optional(),
      hsnCode: zod.string().optional(),
      price: zod.number(),
      quantity: zod.number().optional(),
      totalPrice: zod.number(),
      taxableAmount: zod.number(),
      taxId: zod.string(),
      productId: zod.string(),
    })
  ),
});

const UpdateQuoteSchema = zod.object({
  quoteNumber: zod.string().optional(),
  quoteDate: zod.string().optional(),
  quoteDueDate: zod.string().optional(),
  status: zod
    .enum(["ACCEPTED", "DECLINED", "DRAFT", "CONVERTED_TO_INVOICE"])
    .optional(),
  total: zod.number().optional(),
  subTotal: zod.number().optional(),
  discount: zod.number().optional().default(0),
  totalTax: zod.number().optional(),
  notes: zod.string().optional(),
  gst: zod.number().optional(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
  shippingAddressId: zod.string().optional(),
  quoteItems: zod
    .array(
      zod.object({
        productName: zod.string().optional(),
        productDescription: zod.string().optional(),
        hsnCode: zod.string().optional(),
        price: zod.number().optional(),
        quantity: zod.number().optional(),
        totalPrice: zod.number().optional(),
        taxableAmount: zod.number().optional(),
        taxId: zod.string().optional(),
        productId: zod.string().optional(),
      })
    )
    .optional(),
});

export { AddQuoteSchema, UpdateQuoteSchema };
