import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post, put, del, postFormData, ApiError } from './client'

function mockFetch(status: number, body?: unknown, ok?: boolean) {
  return vi.fn().mockResolvedValue({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: status === 404 ? 'Not Found' : '',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : ''),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as any).location
  globalThis.location = { href: '' } as Location
})

describe('get', () => {
  it('makes GET request with same-origin credentials', async () => {
    globalThis.fetch = mockFetch(200, { data: 'ok' })
    const result = await get('/api/test')
    expect(result).toEqual({ data: 'ok' })
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      credentials: 'same-origin',
      headers: {},
    })
  })

  it('throws ApiError on non-ok response', async () => {
    globalThis.fetch = mockFetch(404, 'Not Found', false)
    await expect(get('/api/test')).rejects.toThrow(ApiError)
    await expect(get('/api/test')).rejects.toThrow('Not Found')
  })

  it('redirects to /login on 401', async () => {
    globalThis.fetch = mockFetch(401, undefined, false)
    await expect(get('/api/test')).rejects.toThrow(ApiError)
    expect(globalThis.location.href).toBe('/login')
  })

  it('returns undefined for 204', async () => {
    globalThis.fetch = mockFetch(204)
    const result = await get('/api/test')
    expect(result).toBeUndefined()
  })
})

describe('post', () => {
  it('sends JSON body with POST', async () => {
    globalThis.fetch = mockFetch(201, { id: 1 })
    const result = await post('/api/test', { name: 'foo' })
    expect(result).toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'foo' }),
    })
  })

  it('sends POST without body when omitted', async () => {
    globalThis.fetch = mockFetch(200, {})
    await post('/api/test')
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      body: undefined,
    }))
  })
})

describe('postFormData', () => {
  it('sends FormData without Content-Type header', async () => {
    globalThis.fetch = mockFetch(200, { id: 1 })
    const fd = new FormData()
    fd.append('key', 'value')
    const result = await postFormData('/api/test', fd)
    expect(result).toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    })
  })
})

describe('put', () => {
  it('sends JSON body with PUT', async () => {
    globalThis.fetch = mockFetch(200, { ok: true })
    const result = await put('/api/test', { title: 'new' })
    expect(result).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'new' }),
    })
  })
})

describe('del', () => {
  it('sends DELETE request', async () => {
    globalThis.fetch = mockFetch(204)
    const result = await del('/api/test')
    expect(result).toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {},
    })
  })
})
