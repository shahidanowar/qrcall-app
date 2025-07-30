const API_URL = 'https://visionai.site';  // Production server domain

export async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {   // <-- CORRECT!
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log('API: Login response', data);
    return data;
  }
  
export async function register(name: string, email: string, password: string, avatar?: string) {
    console.log('API: Sending register request', { name, email, password, avatar });
    const body: any = { name, email, password };
    if (avatar) body.avatar = avatar;
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log('API: Register response', data);
    return data;
}

export async function getProfile(id: string) {
    const res = await fetch(`${API_URL}/profile/${id}`);
    return await res.json();
}

export async function rejectCall(roomId: string) {
    console.log(`API: Rejecting call for room ${roomId}`);
    const res = await fetch(`${API_URL}/reject-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to reject call' }));
        throw new Error(errorData.message);
    }

    return await res.json();
}

export async function savePushToken(userId: number, token: string) {
    console.log(`API: Saving push token for userId ${userId}`);
    const res = await fetch(`${API_URL}/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pushToken: token }),
    });

    const responseText = await res.text();
    try {
        const data = JSON.parse(responseText);
        if (!res.ok) {
            throw new Error(data.message || 'Failed to save push token');
        }
        console.log('API: Save push token response', data);
        return data;
    } catch (e) {
        console.error('API: Failed to parse push token response:', responseText);
        throw new Error('Server returned an invalid response.');
    }
}