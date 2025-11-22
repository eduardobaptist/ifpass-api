import vine from '@vinejs/vine'

export const subscribeValidator = vine.compile(
  vine.object({
    eventId: vine.number().positive(),
  })
)

export const checkInValidator = vine.compile(
  vine.object({
    subscriptionId: vine.number().positive(),
  })
)

// Portuguese messages
export const subscribeMessages = {
  'eventId.required': 'O campo ID do evento é obrigatório',
  'eventId.number': 'O ID do evento deve ser um número',
  'eventId.positive': 'O ID do evento deve ser um número positivo',
}

export const checkInMessages = {
  'subscriptionId.required': 'O campo ID da inscrição é obrigatório',
  'subscriptionId.number': 'O ID da inscrição deve ser um número',
  'subscriptionId.positive': 'O ID da inscrição deve ser um número positivo',
}
