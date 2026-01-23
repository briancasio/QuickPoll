import { NextResponse } from 'next/server';

// POST: Validate admin credentials
export async function POST(request) {
  const { username, password } = await request.json();
  
  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASS;
  
  if (username === validUser && password === validPass) {
    // Return base64 encoded credentials for use with Basic auth
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return NextResponse.json({ success: true, token });
  }
  
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
