import vine from "@vinejs/vine";

export const itemIdValidator = vine.compile(
  vine.object({
    id: vine.number().withoutDecimals(), //check why non negative not working
  }),
);
