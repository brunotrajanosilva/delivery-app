/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router
  .group(() => {
    // Products routes
    router
      .group(() => {
        router.get('/', '#controllers/product/product_controller.index')
        router.get('/:id', '#controllers/products_controller.show')
        router.get('/category/:categoryId', '#controllers/products_controller.byCategory')
        router.get('/popular', '#controllers/products_controller.popular')
        router.get('/recommended', '#controllers/products_controller.recommended')
      })
      .prefix('/products')

    // Categories routes
    router
      .group(() => {
        router.get('/', '#controllers/categories_controller.index')
        router.get('/:id', '#controllers/categories_controller.show')
        router.get('/:id/products', '#controllers/categories_controller.products')
      })
      .prefix('/categories')

    router
      .group(() => {
        ;(router.get('/', '#controllers/delivery_controller.index'),
          router.get('/:id', '#controllers/delivery_controller.show'),
          router.get('/worker', '#controllers/delivery_controller.workerIndex'),
          router.get('/worker/assign', '#controllers/delivery_controller.workerAssign'),
          router.patch(
            '/:id/worker/update-delivery',
            '#controllers/delivery_controller.updateDelivery'
          ))
      })
      .prefix('/delivery')

    router
      .group(() => {
        ;(router.get('/', '#controllers/order_controller.index'),
          router.get('/:id', '#controllers/order_controller.show'),
          router.post('/', '#controllers/order_controller.finish'),
          router.get('/payment-webhook', '#controllers/order_controller.paymentWebhook'))
      })
      .prefix('/order')

    // users
    router
      .group(() => {
        ;(router.get('/', '#controllers/cart_controller.index'),
          router.post('/', '#controllers/cart_controller.store'),
          router.patch('/:id', '#controllers/cart_controller.update'))
      })
      .prefix('/cart')

    router.get('/', async () => {
      return { message: 'Hello World' }
    })
  })
  .prefix('/api/v1')
