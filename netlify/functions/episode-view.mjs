import apiHandler from '../../server/handlers/episode-view.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export const handler = adaptApiHandler(apiHandler)
