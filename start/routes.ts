/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
    router.get('me', [AuthController, 'me']).use(middleware.auth())
  })
  .prefix('auth')

router.post('/channels', [ChannelsController, 'create']).use(middleware.auth())
router.post('/channel/join', [ChannelsController, 'join']).use(middleware.auth())
router.post('/channel/invite', [ChannelsController, 'inviteUser']).use(middleware.auth())
router
  .delete('/channel/leave/:channelId', [ChannelsController, 'leaveChannel'])
  .use(middleware.auth())
router.get('/channel/users/:channelId', [ChannelsController, 'listUsers']).use(middleware.auth())
