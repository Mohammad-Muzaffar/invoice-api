import zod from "zod";

enum InvoiceStatus {
  PAID,
  PARTIALLY_PAID,
  PENDING,
}

const AddInvoiceSchema = zod.object({
  invoiceNumber: zod.string(),
  invoiceDate: zod.string(),
  invoiceDueDate: zod.string(),
  status: zod.enum(["PAID", "PARTIALLY_PAID", "PENDING"]),
  totalWithoutTax: zod.number(),
  subTotal: zod.number(),
  discount: zod.number().default(0),
  totalTax: zod.number(),
  notes: zod.string().optional(),
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

export { AddInvoiceSchema };
