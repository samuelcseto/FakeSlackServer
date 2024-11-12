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
        // TODO check unique email against DB
        return true
      }),
    password: vine.string().minLength(8).confirmed({ confirmationField: 'passwordConfirmation' }),
    passwordConfirmation: vine.string(),
  })
)
