// ============================================================
// me.js — Rutas de perfil del usuario autenticado
//
// GET  /api/me        → devuelve datos del usuario desde Clerk
// PATCH /api/me       → actualiza phone y address en Clerk publicMetadata
//
// Por qué publicMetadata y no Mongo:
//   - Clerk ya está integrado, cero infraestructura extra
//   - Los datos del usuario viven en un solo lugar
//   - Team 3 (MS2) los usa para resolver el aeropuerto más cercano
//     via geocoding cuando el usuario no manda el IATA directo
//
// Campos que necesita Team 3:
//   - address.ciudad → origen para buscar aeropuerto más cercano
//   - phone          → dato de contacto del viajero
//   - createdAt      → cuándo se registró el usuario
// ============================================================
import { Router } from 'express';
import { createClerkClient } from '@clerk/express';
import { requireAuth } from '../middlewares/auth.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Cliente de Clerk para operaciones de backend
const clerk = createClerkClient({ secretKey: config.clerkSecretKey });

// ── GET /api/me ───────────────────────────────────────────────
// Devuelve los datos del usuario autenticado.
// Combina los campos nativos de Clerk con los que se guardan
// en publicMetadata (phone, address) via PATCH /api/me.
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await clerk.users.getUser(req.userId);

    // publicMetadata es donde guardamos los datos extra del usuario
    // que Clerk no tiene por defecto (address, phone personalizado)
    const meta = user.publicMetadata || {};

    return successResponse(res, {
      userId:    user.id,
      email:     user.emailAddresses[0]?.emailAddress || null,
      firstName: user.firstName,
      lastName:  user.lastName,
      username:  user.username,
      imageUrl:  user.imageUrl,
      // phone: primero el que guardamos nosotros, si no el de Clerk nativo
      phone:     meta.phone || user.phoneNumbers[0]?.phoneNumber || null,
      // address: guardado en publicMetadata via PATCH /api/me
      // Team 3 usa address.ciudad para resolver el aeropuerto más cercano
      address: meta.address || null,
      // createdAt: cuándo se registró el usuario en Clerk (timestamp ms → ISO)
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : null,
    });
  } catch (err) {
    console.error(`[${req.requestId}] Error GET /me → Clerk:`, err.message);
    return errorResponse(res, req, {
      ...ERRORS.INTERNAL_ERROR,
      message: 'No se pudo obtener el perfil del usuario desde Clerk',
    });
  }
});

// ── PATCH /api/me ─────────────────────────────────────────────
// Actualiza phone y address del usuario en Clerk publicMetadata.
// El front lo llama cuando el usuario completa su perfil.
// Team 3 (MS2) lee estos datos via GET /api/me para resolver
// el aeropuerto de origen sin pedirle el IATA al usuario.
//
// Body esperado (todos opcionales, se mergean con lo existente):
// {
//   "phone": "+54 351 123 4567",
//   "address": {
//     "ciudad":    "Córdoba",
//     "provincia": "Córdoba",    (opcional)
//     "pais":      "Argentina"
//   }
// }
router.patch('/', requireAuth, async (req, res) => {
  try {
    const { phone, address } = req.body;

    // Validación básica — al menos uno de los dos tiene que venir
    if (!phone && !address) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: 'Mandá al menos phone o address para actualizar',
      });
    }

    // Si viene address, validamos que tenga ciudad y pais mínimo
    // (son los que necesita Team 3 para el geocoding)
    if (address && (!address.ciudad || !address.pais)) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: 'address debe incluir al menos ciudad y pais',
      });
    }

    // Leemos el usuario actual para mergear con los datos existentes
    // y no pisar campos que ya estaban guardados
    const user = await clerk.users.getUser(req.userId);
    const metaActual = user.publicMetadata || {};

    // Mergeamos — si no viene un campo, se mantiene el valor anterior
    const metaNueva = {
      ...metaActual,
      ...(phone   ? { phone }   : {}),
      ...(address ? { address } : {}),
    };

    // Guardamos en Clerk publicMetadata
    await clerk.users.updateUser(req.userId, {
      publicMetadata: metaNueva,
    });

    console.log(`[${req.requestId}] Perfil actualizado para userId: ${req.userId}`);

    return successResponse(res, {
      mensaje:  'Perfil actualizado correctamente',
      userId:   req.userId,
      phone:    metaNueva.phone   || null,
      address:  metaNueva.address || null,
    }, 200);

  } catch (err) {
    console.error(`[${req.requestId}] Error PATCH /me → Clerk:`, err.message);
    return errorResponse(res, req, {
      ...ERRORS.INTERNAL_ERROR,
      message: 'No se pudo actualizar el perfil del usuario en Clerk',
    });
  }
});

export default router;