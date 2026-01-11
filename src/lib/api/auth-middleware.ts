import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface AuthenticatedRequest extends NextRequest {
    userId?: string;
    userRole?: string;
}

export interface AuthResult {
    success: boolean;
    userId?: string;
    userRole?: string;
    error?: string;
}

/**
 * Verify Supabase session from request headers
 * Expects Authorization: Bearer <token> header
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!supabaseAdmin) {
        return { success: false, error: 'Supabase configuration error' };
    }

    try {
        // Verify JWT token
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return { success: false, error: 'Invalid or expired token' };
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: 'User not found' };
        }

        return {
            success: true,
            userId: user.id,
            userRole: userData.role,
        };
    } catch (error) {
        console.error('[Auth Middleware] Verification error:', error);
        return { success: false, error: 'Authentication failed' };
    }
}

/**
 * Middleware wrapper that requires authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(
    req: NextRequest,
    handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
    const auth = await verifyAuth(req);

    if (!auth.success) {
        return NextResponse.json(
            { error: auth.error || 'Unauthorized' },
            { status: 401 }
        );
    }

    return handler(req, auth);
}

/**
 * Middleware wrapper that requires admin or organizer role
 * Returns 403 if not authorized
 */
export async function requireAdmin(
    req: NextRequest,
    handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
    const auth = await verifyAuth(req);

    if (!auth.success) {
        return NextResponse.json(
            { error: auth.error || 'Unauthorized' },
            { status: 401 }
        );
    }

    if (auth.userRole !== 'admin' && auth.userRole !== 'organizer') {
        return NextResponse.json(
            { error: 'Forbidden: Admin or organizer role required' },
            { status: 403 }
        );
    }

    return handler(req, auth);
}

/**
 * Middleware wrapper that requires specific role
 * Returns 403 if not authorized
 */
export async function requireRole(
    req: NextRequest,
    allowedRoles: string[],
    handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
    const auth = await verifyAuth(req);

    if (!auth.success) {
        return NextResponse.json(
            { error: auth.error || 'Unauthorized' },
            { status: 401 }
        );
    }

    if (!auth.userRole || !allowedRoles.includes(auth.userRole)) {
        return NextResponse.json(
            { error: `Forbidden: One of these roles required: ${allowedRoles.join(', ')}` },
            { status: 403 }
        );
    }

    return handler(req, auth);
}

/**
 * Extract user ID from request body
 * Useful for validating user owns the resource
 */
export function getUserIdFromBody(body: any): string | null {
    return body?.user_id || body?.userId || null;
}

/**
 * Verify user owns the resource
 */
export function verifyOwnership(auth: AuthResult, resourceUserId: string): boolean {
    return auth.userId === resourceUserId;
}
