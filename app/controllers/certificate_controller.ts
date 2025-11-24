import type { HttpContext } from '@adonisjs/core/http'
import Certificate from '#models/certificate'
import Subscription from '#models/subscription'
import { formatDate } from '#utils/date_format'
import {
  issueCertificateValidator,
  issueCertificateMessages,
  validateCertificateValidator,
  validateCertificateMessages,
} from '#validators/certificate_validator'
import { SubscriptionStatus } from '#models/subscription'
import { UserRole } from '#models/user'

export default class CertificateController {
  /**
   * Issue a certificate for a subscription
   * Only works if the subscription has been attended (check-in done)
   */
  async issue({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await issueCertificateValidator.validate(request.all(), {
      messages: issueCertificateMessages,
    } as any)

    try {
      // Find the subscription
      const subscription = await Subscription.findOrFail(payload.subscriptionId)

      // Check if subscription belongs to user or user is admin/organizer
      if (subscription.userId !== user.id && !user.canManageEvents()) {
        return response.forbidden({
          message: 'Você não tem permissão para emitir certificado para esta inscrição',
        })
      }

      // Check if subscription has been attended
      if (!subscription.hasAttended()) {
        return response.badRequest({
          message: 'Não é possível emitir certificado para uma inscrição sem check-in',
        })
      }

      // Check if certificate already exists for this subscription
      const existingCertificate = await Certificate.query()
        .where('subscriptionId', subscription.id)
        .first()

      if (existingCertificate) {
        return response.ok({
          certificate: {
            id: existingCertificate.id,
            certificateNumber: existingCertificate.certificateNumber,
            verificationToken: existingCertificate.verificationToken,
            issuedAt: formatDate(existingCertificate.issuedAt),
          },
          message: 'Certificado já foi emitido anteriormente',
        })
      }

      // Create certificate
      const certificate = await Certificate.create({
        userId: subscription.userId,
        eventId: subscription.eventId,
        subscriptionId: subscription.id,
      })

      // Load relations
      await certificate.load('event')
      await certificate.load('user')

      return response.created({
        certificate: {
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          verificationToken: certificate.verificationToken,
          signature: certificate.signature,
          issuedAt: formatDate(certificate.issuedAt),
          event: {
            id: certificate.event.id,
            name: certificate.event.name,
            date: formatDate(certificate.event.date),
          },
        },
        message: 'Certificado emitido com sucesso',
      })
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Inscrição não encontrada',
        })
      }
      return response.badRequest({
        message: error.message || 'Erro ao emitir certificado',
      })
    }
  }

  /**
   * Validate a certificate token
   * This endpoint is public and can be used by teachers to verify certificates
   * Accepts token in body or query string
   */
  async validate({ request, response }: HttpContext) {
    // Get token from body or query string
    const token = request.input('token') || request.qs().token

    if (!token) {
      return response.badRequest({
        message: 'Token do certificado é obrigatório',
        valid: false,
      })
    }

    try {
      const certificate = await Certificate.findByToken(token)

      if (!certificate) {
        return response.notFound({
          message: 'Certificado não encontrado',
          valid: false,
        })
      }

      // Load relations
      await certificate.load('event')
      await certificate.load('user')
      await certificate.load('subscription')

      // Verify signature
      const isSignatureValid = certificate.isSignatureValid()

      if (!isSignatureValid) {
        return response.badRequest({
          message: 'Assinatura digital inválida - certificado pode ter sido alterado',
          valid: false,
        })
      }

      // Update verification count
      await certificate.verify()

      return response.ok({
        valid: true,
        certificate: {
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          issuedAt: formatDate(certificate.issuedAt),
          verifiedAt: formatDate(certificate.verifiedAt),
          verificationCount: certificate.verificationCount,
        },
        event: {
          id: certificate.event.id,
          name: certificate.event.name,
          type: certificate.event.type,
          description: certificate.event.description,
          date: formatDate(certificate.event.date),
          location: certificate.event.location,
        },
        subscription: {
          id: certificate.subscription?.id,
          status: certificate.subscription?.status,
          checkedInAt: formatDate(certificate.subscription?.checkedInAt),
          createdAt: formatDate(certificate.subscription?.createdAt),
        },
        user: {
          id: certificate.user.id,
          fullName: certificate.user.fullName,
          email: certificate.user.email,
          type: certificate.user.type,
        },
        message: 'Certificado válido',
      })
    } catch (error: any) {
      return response.badRequest({
        message: error.message || 'Erro ao validar certificado',
        valid: false,
      })
    }
  }

  /**
   * List user's certificates
   * Returns certificates with their verification tokens for easy copying
   */
  async myCertificates({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const certificates = await Certificate.findByUser(user.id)

    return response.ok({
      certificates: certificates.map((cert) => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        verificationToken: cert.verificationToken,
        issuedAt: formatDate(cert.issuedAt),
        verifiedAt: formatDate(cert.verifiedAt),
        verificationCount: cert.verificationCount,
        event: {
          id: cert.event.id,
          name: cert.event.name,
          type: cert.event.type,
          date: formatDate(cert.event.date),
          location: cert.event.location,
        },
        subscription: cert.subscription
          ? {
              id: cert.subscription.id,
              status: cert.subscription.status,
              checkedInAt: formatDate(cert.subscription.checkedInAt),
            }
          : null,
      })),
    })
  }

  /**
   * Get a specific certificate by ID (only if it belongs to the user or user is admin/organizer)
   */
  async show({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const certificate = await Certificate.findOrFail(params.id)

    // Check if certificate belongs to user or user is admin/organizer
    if (certificate.userId !== user.id && !user.canManageEvents()) {
      return response.forbidden({
        message: 'Você não tem permissão para visualizar este certificado',
      })
    }

    // Load relations
    await certificate.load('event')
    await certificate.load('user')
    await certificate.load('subscription')

    return response.ok({
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationToken: certificate.verificationToken,
        signature: certificate.signature,
        issuedAt: formatDate(certificate.issuedAt),
        verifiedAt: formatDate(certificate.verifiedAt),
        verificationCount: certificate.verificationCount,
        event: {
          id: certificate.event.id,
          name: certificate.event.name,
          type: certificate.event.type,
          description: certificate.event.description,
          date: formatDate(certificate.event.date),
          location: certificate.event.location,
        },
        subscription: certificate.subscription
          ? {
              id: certificate.subscription.id,
              status: certificate.subscription.status,
              checkedInAt: formatDate(certificate.subscription.checkedInAt),
              createdAt: formatDate(certificate.subscription.createdAt),
            }
          : null,
        user: {
          id: certificate.user.id,
          fullName: certificate.user.fullName,
          email: certificate.user.email,
        },
      },
    })
  }
}

