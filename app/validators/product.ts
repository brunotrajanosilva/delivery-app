import vine from "@vinejs/vine";

export const productsIndexValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
    search: vine.string().optional(),
    category_id: vine.number().optional(),
    sort_by: vine.string().optional(),
    sort_order: vine.string().optional(),
  }),
);
