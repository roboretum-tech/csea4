/**
 * Unified Safe API Client
 * Prevents "Unexpected token '<', '<!doctype '... is not valid JSON" crashes
 * by verifying content-type and guarding against HTML fallback responses.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const customHeaders: Record<string, string> = {};
    try {
      const activeUser = typeof window !== 'undefined' ? localStorage.getItem('csea_active_consultor') : null;
      if (activeUser) {
        const parsed = JSON.parse(activeUser);
        if (parsed.id) customHeaders['x-consultor-id'] = parsed.id;
        if (parsed.email) customHeaders['x-consultor-email'] = parsed.email;
      }
    } catch {
      // Ignored
    }

    const mergedHeaders = new Headers(init?.headers || {});
    for (const [k, v] of Object.entries(customHeaders)) {
      if (!mergedHeaders.has(k)) {
        mergedHeaders.set(k, v);
      }
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers: mergedHeaders
    };

    const res = await fetch(input, modifiedInit);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`[apiClient] Respuesta no-JSON recibida (${res.status}) para ${input.toString()}:`, text.slice(0, 150));
      return {
        ok: false,
        status: res.status,
        error: res.status === 404 
          ? 'Servicio no encontrado en el servidor (404)' 
          : res.status === 429
          ? 'Límite de solicitudes alcanzado. Por favor espera un momento.'
          : `El servidor devolvió una respuesta inesperada (${res.status}).`
      };
    }

    try {
      const data = await res.json();
      return {
        ok: res.ok,
        status: res.status,
        data,
        error: !res.ok ? (data?.error || `Error del servidor (${res.status})`) : undefined
      };
    } catch (parseError: any) {
      console.error(`[apiClient] Error de sintaxis JSON en ${input.toString()}:`, parseError);
      return {
        ok: false,
        status: res.status,
        error: 'El servidor envió una respuesta con formato JSON no válido.'
      };
    }
  } catch (networkError: any) {
    console.error(`[apiClient] Error de red en ${input.toString()}:`, networkError);
    return {
      ok: false,
      status: 0,
      error: networkError?.message || 'Error de conexión con el servidor.'
    };
  }
}
