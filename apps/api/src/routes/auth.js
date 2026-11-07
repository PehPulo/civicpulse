// TODO(Albert): bandingkan pin dengan config.instansiPin, terbitkan JWT 8 jam berisi { peran: 'instansi', petugas }.
import { Hono } from 'hono'
import { belumAda } from '../middleware/galat.js'

export const auth = new Hono().post('/instansi', () => belumAda('POST /auth/instansi'))
