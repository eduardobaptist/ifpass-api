import vine from '@vinejs/vine'

/**
 * Validator for internal user verification with code
 */
export const verifyInternalValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    code: vine
      .string()
      .minLength(6)
      .regex(/^\d{6}$/),
  })
)

// Portuguese messages
export const verifyInternalMessages = {
  'email.required': 'O campo email é obrigatório',
  'email.email': 'O email fornecido é inválido',
  'code.required': 'O código de verificação é obrigatório',
  'code.length': 'O código de verificação deve ter exatamente 6 dígitos',
  'code.regex': 'O código de verificação deve conter apenas números',
}
