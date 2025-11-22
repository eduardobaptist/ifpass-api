import vine from '@vinejs/vine'

/**
 * Validator for user registration (only for attendees)
 */
export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(255),
    fullName: vine.string().minLength(2).maxLength(255).optional(),
    type: vine.enum(['internal', 'external']),
  })
)

// Portuguese messages
export const registerMessages = {
  'email.required': 'O campo email é obrigatório',
  'email.email': 'O email fornecido é inválido',
  'password.required': 'O campo senha é obrigatório',
  'password.minLength': 'A senha deve ter no mínimo {{ min }} caracteres',
  'password.maxLength': 'A senha deve ter no máximo {{ max }} caracteres',
  'fullName.minLength': 'O nome completo deve ter no mínimo {{ min }} caracteres',
  'fullName.maxLength': 'O nome completo deve ter no máximo {{ max }} caracteres',
  'type.required': 'O campo tipo é obrigatório',
  'type.enum': 'O tipo deve ser "internal" ou "external"',
}
