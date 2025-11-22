import vine from '@vinejs/vine'

export const createEventValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(255),
    type: vine.enum(['internal', 'external']),
    description: vine.string().maxLength(1000).optional(),
    date: vine.date({
      formats: ['iso8601'],
    }),
    location: vine.string().maxLength(255).optional(),
    capacity: vine.number().positive().optional(),
  })
)

export const updateEventValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(255).optional(),
    type: vine.enum(['internal', 'external']).optional(),
    description: vine.string().maxLength(1000).optional(),
    date: vine
      .date({
        formats: ['iso8601'],
      })
      .optional(),
    location: vine.string().maxLength(255).optional(),
    capacity: vine.number().positive().optional(),
  })
)

// Portuguese messages
export const createEventMessages = {
  'name.required': 'O campo nome é obrigatório',
  'name.minLength': 'O nome do evento deve ter no mínimo {{ min }} caracteres',
  'name.maxLength': 'O nome do evento deve ter no máximo {{ max }} caracteres',
  'type.required': 'O campo tipo é obrigatório',
  'type.enum': 'O tipo deve ser "internal" ou "external"',
  'description.maxLength': 'A descrição deve ter no máximo {{ max }} caracteres',
  'date.required': 'O campo data é obrigatório',
  'date.date': 'O campo data deve ser uma data válida',
  'location.maxLength': 'A localização deve ter no máximo {{ max }} caracteres',
  'capacity.positive': 'A capacidade deve ser um número positivo',
}

export const updateEventMessages = {
  'name.minLength': 'O nome do evento deve ter no mínimo {{ min }} caracteres',
  'name.maxLength': 'O nome do evento deve ter no máximo {{ max }} caracteres',
  'type.enum': 'O tipo deve ser "internal" ou "external"',
  'description.maxLength': 'A descrição deve ter no máximo {{ max }} caracteres',
  'date.date': 'O campo data deve ser uma data válida',
  'location.maxLength': 'A localização deve ter no máximo {{ max }} caracteres',
  'capacity.positive': 'A capacidade deve ser um número positivo',
}
