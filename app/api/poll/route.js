/**
 * /api/poll - Poll management API
 * 
 * GET  - Fetch current poll (public)
 * POST - Create new poll (admin only)
 * DELETE - End current poll (admin only)
 */

import { NextResponse } from 'next/server';
import { getPoll, createPoll, endPoll } from '@/lib/pollState';

/**
 * Validate admin credentials from Authorization header
 * Uses Basic Auth: base64(username:password)
 * @param {Request} request 
 * @returns {boolean} True if authorized
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  
  // Check for Basic auth header
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  
  // Decode base64 credentials
  const base64 = authHeader.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');
  
  // Compare with environment variables
  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

/**
 * GET /api/poll - Fetch current poll
 * Public endpoint - no auth required
 */
export async function GET() {
  const poll = getPoll();
  return NextResponse.json({ poll });
}

/**
 * POST /api/poll - Create a new poll
 * Admin only - requires Basic Auth
 * Body: { question: string, options: string[] }
 */
export async function POST(request) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Parse request body
  const { question, options } = await request.json();
  
  // Validate input
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: 'Question and at least 2 options required' },
      { status: 400 }
    );
  }
  
  // Create poll and return it
  const poll = createPoll(question, options);
  return NextResponse.json({ poll });
}

/**
 * DELETE /api/poll - End current poll
 * Admin only - requires Basic Auth
 */
export async function DELETE(request) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Clear the poll
  endPoll();
  return NextResponse.json({ success: true });
}
