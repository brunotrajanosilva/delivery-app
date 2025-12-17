import vine from "@vinejs/vine";

export const idempotencyKeyValidator = vine.compile(
  vine.object({
    idempotencyKey: vine.string().uuid(),
  }),
);
