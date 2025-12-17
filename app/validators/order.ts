import vine from "@vinejs/vine";

// couponCode: string | null
//   paymentGateway: string
//   cartItemIds: number[]

export const orderStoreValidator = vine.compile(
  vine.object({
    couponCode: vine.string().nullable(),
    paymentGateway: vine.string(),
    // paymentMethod: vine.string(),
    cartItemIds: vine.array(vine.number()),
  }),
);
