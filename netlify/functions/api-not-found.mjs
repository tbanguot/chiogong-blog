export const handler = async () => ({
  statusCode: 404,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify({ error: 'API route not found.' }),
})
