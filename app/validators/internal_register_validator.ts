import vine from '@vinejs/vine'

/**
 * Validator for internal user registration (pending validation)
 */
export const internalRegisterValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .regex(/@aluno\.iffar\.edu\.br$/),
    password: vine.string().minLength(8).maxLength(255),
    fullName: vine.string().minLength(2).maxLength(255).optional(),
  })
)

// Portuguese messages
export const internalRegisterMessages = {
  'email.required': 'O campo email é obrigatório',
  'email.email': 'O email fornecido é inválido',
  'email.regex': 'O email deve ser do domínio @aluno.iffar.edu.br',
  'password.required': 'O campo senha é obrigatório',
  'password.minLength': 'A senha deve ter no mínimo {{ min }} caracteres',
  'password.maxLength': 'A senha deve ter no máximo {{ max }} caracteres',
  'fullName.minLength': 'O nome completo deve ter no mínimo {{ min }} caracteres',
  'fullName.maxLength': 'O nome completo deve ter no máximo {{ max }} caracteres',
}
