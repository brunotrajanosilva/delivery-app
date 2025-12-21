/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from "@adonisjs/core/services/router";
import { middleware } from "./kernel.js";

router
  .group(() => {
    // Products routes
    router
      .group(() => {
        router.get("/", "#controllers/product/product_controller.index");
        router.get("/:id", "#controllers/product/product_controller.show");
      })
      .prefix("/product")
      .use(middleware.auth({ guards: ["api"] }));

    router
      .group(() => {
        (router.get("/", "#controllers/user/order_controller.index"),
          router.get("/:id", "#controllers/user/order_controller.show"),
          router.post("/", "#controllers/user/order_controller.store"));
      })
      .prefix("/order")
      .use(middleware.auth({ guards: ["api"] }));

    router
      .group(() => {
        router.get("/", "#controllers/user/cart_controller.index");
        router.post("/", "#controllers/user/cart_controller.store");
        router.patch("/:id", "#controllers/user/cart_controller.update");
        router.get("/checkout", "#controllers/user/cart_controller.checkout");
      })
      .prefix("/cart")
      .use(middleware.auth({ guards: ["api"] }));

    router
      .group(() => {
        router.post("/", "#controllers/user/auth_controller.login");
      })
      .prefix("/auth");
    router
      .group(() => {
        router.get(
          "/check-order-status/:jobId",
          "#controllers/user/order_controller.orderStatus",
        );
      })
      .prefix("/polling");
  })
  .prefix("/api/v1");

// .use(middleware.auth({ guards: ["api"] }));
