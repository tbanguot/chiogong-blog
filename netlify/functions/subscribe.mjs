import apiHandler from '../../server/handlers/subscribe.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export const handler = adaptApiHandler(apiHandler)
