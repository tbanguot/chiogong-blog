import apiHandler from '../../server/handlers/book.js'
import { adaptApiHandler } from '../../server/netlify-adapter.js'

export const handler = adaptApiHandler(apiHandler)
