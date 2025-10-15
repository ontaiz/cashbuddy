import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

export const handlers = [
  // Mock Supabase auth endpoints
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: faker.string.alphanumeric(40),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: faker.string.alphanumeric(40),
      user: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        created_at: faker.date.past().toISOString(),
      },
    })
  }),

  // Mock expenses API
  http.get('*/rest/v1/expenses', () => {
    const expenses = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description: faker.commerce.productName(),
      category: faker.helpers.arrayElement(['Food', 'Transport', 'Entertainment', 'Bills']),
      date: faker.date.recent().toISOString(),
      created_at: faker.date.past().toISOString(),
      user_id: faker.string.uuid(),
    }))

    return HttpResponse.json(expenses)
  }),

  http.post('*/rest/v1/expenses', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: faker.string.uuid(),
      ...body,
      created_at: new Date().toISOString(),
      user_id: faker.string.uuid(),
    }, { status: 201 })
  }),

  http.patch('*/rest/v1/expenses', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: faker.string.uuid(),
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete('*/rest/v1/expenses', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
