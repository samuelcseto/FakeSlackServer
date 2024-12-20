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
const UserController = () => import('#controllers/user_controller')
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

router.put('switch-status', [UserController, 'switchStatus']).use(middleware.auth())
router
  .put('switch-notifications', [UserController, 'switchNotificationsOnlyMentions'])
  .use(middleware.auth())

router.get('/channels', [ChannelsController, 'getChannels']).use(middleware.auth())
router.post('/channels', [ChannelsController, 'create']).use(middleware.auth())
router.post('/channel/join', [ChannelsController, 'join']).use(middleware.auth())
router.get('/channel/users/:channelId', [ChannelsController, 'listUsers']).use(middleware.auth())
router
  .get('/channel/messages/:channelId/:page', [ChannelsController, 'getMessages'])
  .use(middleware.auth())
