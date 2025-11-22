import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { UserRole } from '#models/user'

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/user_controller')
const EventController = () => import('#controllers/event_controller')
const SubscriptionController = () => import('#controllers/subscription_controller')

// Auth routes
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
router.get('/auth/me', [AuthController, 'me']).use(middleware.auth())

// User management routes (admin only)
router
  .group(() => {
    router.get('/users', [UserController, 'index'])
    router.get('/users/:id', [UserController, 'show'])
    router.post('/users', [UserController, 'store'])
    router.put('/users/:id', [UserController, 'update'])
    router.delete('/users/:id', [UserController, 'destroy'])
  })
  .use(middleware.auth())
  .use(middleware.permission({ roles: [UserRole.ADMIN] }))

// Event routes
router.get('/events', [EventController, 'index']).use(middleware.auth())
router.get('/events/:id', [EventController, 'show']).use(middleware.auth())

// Event management routes (organizer/admin only)
router
  .group(() => {
    router.post('/events', [EventController, 'store'])
    router.put('/events/:id', [EventController, 'update'])
    router.delete('/events/:id', [EventController, 'destroy'])
  })
  .use(middleware.auth())
  .use(middleware.permission({ roles: [UserRole.ORGANIZER, UserRole.ADMIN] }))

// Subscription routes
router
  .post('/subscriptions/subscribe', [SubscriptionController, 'subscribe'])
  .use(middleware.auth())
router
  .get('/subscriptions/my-subscriptions', [SubscriptionController, 'mySubscriptions'])
  .use(middleware.auth())
router.post('/subscriptions/:id/cancel', [SubscriptionController, 'cancel']).use(middleware.auth())
router.post('/subscriptions/attend', [SubscriptionController, 'attend']).use(middleware.auth())

// Event subscriptions list (organizer/admin only)
router
  .get('/events/:id/subscriptions', [SubscriptionController, 'eventSubscriptions'])
  .use(middleware.auth())
  .use(middleware.permission({ roles: [UserRole.ORGANIZER, UserRole.ADMIN] }))
