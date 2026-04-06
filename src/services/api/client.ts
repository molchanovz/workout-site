let rpcId = 1

export async function send(method: string, params: object = {}): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers['Authorization2'] = token

  const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/rpc/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: rpcId++ })
  })
  const data = await res.json()
  if (data.error) {
    if (data.error.message?.toLowerCase().includes('unauthorized') || res.status === 401) {
      localStorage.removeItem('token')
      window.location.replace('/')
      return
    }
    throw new Error(data.error.message)
  }
  return data.result
}
