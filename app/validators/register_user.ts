import vine from '@vinejs/vine'
/*
public schema = schema.create({
    email: schema.string({}, [
      rules.email(),
      rules.unique({ table: 'users', column: 'email' })
    ]),
    password: schema.string({}, [
      rules.minLength(8),
      rules.confirmed('passwordConfirmation')
    ])
  })
*/
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
