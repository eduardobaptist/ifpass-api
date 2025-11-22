import vine from '@vinejs/vine'

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

// Portuguese messages
export const loginMessages = {
  'email.required': 'O campo email é obrigatório',
  'email.email': 'O email fornecido é inválido',
  'password.required': 'O campo senha é obrigatório',
}
