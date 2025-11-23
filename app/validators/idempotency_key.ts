import vine from "@vinejs/vine";

export const idempotencyKeyValidator = vine.compile(
  vine.object({
    idempotencyKeyValidator: vine.string().uuid(),
  }),
);
