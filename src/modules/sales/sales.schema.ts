import * as z from "zod";

const createSaleSchema = z.object({
  client: z.string(),
  saleId: z.string(),
  customerId: z.string(),
  totalWeight: z.number(),
  seller: z.string()
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
