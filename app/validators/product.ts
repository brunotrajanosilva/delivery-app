import vine from "@vinejs/vine";

export const productValidator = vine.object({
  name: vine.string(),
  description: vine.string(),
  image: vine.string(),
  price: vine.number(),
  category_id: vine.number(),
});

export const productsInputValidator = vine.compile(
  vine.object({
    page: vine.number(),
    limit: vine.number(),
    search: vine.string(),
    category_id: vine.number(),
    sort_by: vine.string(),
    sort_order: vine.string(),
  }),
);
