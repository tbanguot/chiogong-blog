import apiHandler from '../../server/handlers/episodes.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export const handler = adaptApiHandler(apiHandler)
