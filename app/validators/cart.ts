import vine from "@vinejs/vine";

export const cartItemStoreValidator = vine.compile(
  vine.object({
    variationId: vine.number(),
    quantity: vine.number(),
    cartItemExtras: vine.array(
      vine.object({
        extraId: vine.number(),
        quantity: vine.number(),
      }),
    ),
  }),
);

export const cartItemUpdateValidator = vine.compile(
  vine.object({
    id: vine.number(),
    quantity: vine.number(),
    cartItemExtras: vine
      .array(
        vine.object({
          extraId: vine.number(),
          quantity: vine.number(),
        }),
      )
      .optional(),
  }),
);

export const checkoutCartValidator = vine.compile(
  vine.object({
    cartItemIds: vine.array(vine.number()),
    couponCode: vine.string().optional(),
  }),
);
