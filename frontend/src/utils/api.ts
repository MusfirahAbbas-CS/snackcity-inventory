export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    if (response.status === 401 || response.status === 403) {
      if (error?.detail) throw new Error(error.detail);
      throw new Error('Unauthorized');
    }
    throw new Error(
      typeof error?.detail === 'string'
        ? error.detail
        : 'Request failed. Check that the backend is running.',
    )
  }

  return response.json()
}
