import zod from "zod";

const AddPurchaseInvoiceSchema = zod.object({
  invoiceNumber: zod.string(),
  invoiceDate: zod.string(),
  sellerName: zod.string(),
  sellerAddress: zod.string().optional(),
  total: zod.number(),
  subTotal: zod.number(),
  discount: zod.number().default(0),
  totalTax: zod.number(),
  notes: zod.string().optional(),
  gst: zod.number().optional(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
  invoiceItems: zod.array(
    zod.object({
      productName: zod.string(),
      productDescription: zod.string().optional(),
      hsnCode: zod.string().optional(),
      price: zod.number(),
      quantity: zod.number().optional(),
      totalPrice: zod.number(),
      subTotal: zod.number(),
      taxableAmount: zod.number(),
    })
  ),
});

const UpdatePurchaseInvoiceSchema = zod.object({
  invoiceNumber: zod.string().optional(),
  invoiceDate: zod.string().optional(),
  sellerName: zod.string(),
  sellerAddress: zod.string().optional(),
  total: zod.number().optional(),
  subTotal: zod.number().optional(),
  discount: zod.number().optional().default(0),
  totalTax: zod.number().optional(),
  notes: zod.string().optional(),
  gst: zod.number().optional(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
  invoiceItems: zod
    .array(
      zod.object({
        productName: zod.string().optional(),
        productDescription: zod.string().optional(),
        hsnCode: zod.string().optional(),
        price: zod.number().optional(),
        quantity: zod.number().optional(),
        totalPrice: zod.number().optional(),
        subTotal: zod.number().optional(),
        taxableAmount: zod.number().optional(),
      })
    )
    .optional(),
});

export { AddPurchaseInvoiceSchema, UpdatePurchaseInvoiceSchema };
