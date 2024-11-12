import User from '#models/user'
import vine from '@vinejs/vine'
/**
 * Validates the post's creation action
 */
export const registerUserValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .unique(async (db, value, field) => {
        try {
          const user = await User.findByOrFail('email', value)
          return false
        } catch (error) {
          return true
        }
      }),
    password: vine.string().minLength(8).confirmed({ confirmationField: 'passwordConfirmation' }),
    passwordConfirmation: vine.string(),
  })
)
