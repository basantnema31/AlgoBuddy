import {
  getPublicCollaborationSession,
  joinCollaborationSession,
  validateCsrfOrigin,
} from "@/lib/collaboration/sessionStore";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";
import { getAuthenticatedUser, jsonResponse, errorResponse } from "@/lib/serverApi";

export async function GET(request, { params }) {
  try {
    const { user, configured } = await getAuthenticatedUser();

    if (configured && !user) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const ip = getClientIp(request.headers);
    const { allowed } = await checkRateLimit(`collab:lookup:${ip}`);

    if (!allowed) {
      return jsonResponse({ error: "Too many session lookup requests. Please try again shortly." }, 429);
    }
  
    const session = await getPublicCollaborationSession(params.sessionId);

    if (!session) {
      return jsonResponse({ error: "Session not found" }, 404);
    }

    return jsonResponse({ session });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request, { params }) {
  try {
    if (!validateCsrfOrigin(request)) {
      return jsonResponse({ error: "CSRF validation failed" }, 403);
    }

    const { user, configured } = await getAuthenticatedUser();
    if (configured && !user) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const ip = getClientIp(request.headers);
    const { allowed } = await checkRateLimit(`collab:join:${ip}:${params.sessionId}`);
    if (!allowed) {
      return jsonResponse({ error: "Too many join attempts. Please try again shortly." }, 429);
    }

    const body = await request.json().catch(() => ({}));
    const result = await joinCollaborationSession(params.sessionId, {
      password: body.password,
      userId: configured ? user?.id || "" : body.createdBy || "anonymous",
    });

    if (result.error) {
      return jsonResponse({ error: result.error }, result.status || 400);
    }

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
