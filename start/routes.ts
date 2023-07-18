/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for the majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  // AUTH ROUTES
  Route.group(() => {
    Route.group(() => {
      Route.post('/login', 'AuthController.login')
      Route.post('/register', 'AuthController.register')
    }).prefix('/auth')

    // FORGOT-PASSWORD ROUTES
    Route.group(() => {
      Route.post('/', 'AuthController.forgotPassword')
      Route.post('/reset', 'AuthController.resetPassword')
    }).prefix('forgot-password')
  })

  // BOTS ROUTES
  Route.group(() => {
    Route.get('/bots/:botId/intro', 'BotsController.botIntro')
    Route.post('/bots/chat', 'BotsController.chat')
  }).middleware('silentAuth')

  Route.group(() => {
    Route.group(() => {
      Route.post('/website-info', 'BotsController.websiteInfo')
    })

    Route.group(() => {
      Route.get('/', 'BotsController.allBots')
      Route.get('/:botId', 'BotsController.getBot')
      Route.delete('/:botId', 'BotsController.delete')

      Route.group(() => {
        Route.post('/', 'BotsController.create')
      })
    }).prefix('/bots')

    Route.post('/auth/logout', 'AuthController.logout')
  }).middleware('auth')
})
  .prefix('api/v1')
  .middleware('validateRecaptcha')
