import vine from '@vinejs/vine'

/**
 * Validator for issuing a certificate
 */
export const issueCertificateValidator = vine.compile(
  vine.object({
    subscriptionId: vine.number().positive(),
  })
)

export const issueCertificateMessages = {
  'subscriptionId.required': 'O ID da inscrição é obrigatório',
  'subscriptionId.number': 'O ID da inscrição deve ser um número',
  'subscriptionId.positive': 'O ID da inscrição deve ser um número positivo',
}

/**
 * Validator for validating a certificate token
 */
export const validateCertificateValidator = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(1),
  })
)

export const validateCertificateMessages = {
  'token.required': 'O token do certificado é obrigatório',
  'token.string': 'O token deve ser uma string',
  'token.minLength': 'O token não pode estar vazio',
}

