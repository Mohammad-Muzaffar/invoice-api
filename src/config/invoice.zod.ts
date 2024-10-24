import zod from "zod";

const AddInvoiceSchema = zod.object({
  invoiceNumber: zod.string(),
  invoiceDate: zod.string(),
  invoiceDueDate: zod.string(),
  status: zod.enum(["PAID", "PARTIALLY_PAID", "PENDING"]),
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
  invoiceItems: zod.array(
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

const UpdateInvoiceSchema = zod.object({
  invoiceNumber: zod.string().optional(),
  invoiceDate: zod.string().optional(),
  invoiceDueDate: zod.string().optional(),
  status: zod.enum(["PAID", "PARTIALLY_PAID", "PENDING"]).optional(),
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
  invoiceItems: zod
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

export { AddInvoiceSchema, UpdateInvoiceSchema };
