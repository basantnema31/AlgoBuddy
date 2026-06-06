import { claimSessionPresenter, validateCsrfOrigin } from "@/lib/collaboration/sessionStore";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";
import { getAuthenticatedUser, jsonResponse, errorResponse } from "@/lib/serverApi";

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
    const { allowed } = await checkRateLimit(`collab:presenter:${ip}:${params.sessionId}`);
    if (!allowed) {
      return jsonResponse({ error: "Too many presenter updates. Please try again shortly." }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const result = await claimSessionPresenter(params.sessionId, {
      userId: configured ? user?.id || "" : body.presenterId || "anonymous",
      sessionSecret: body.sessionSecret,
    });

    if (result.error) {
      return jsonResponse({ error: result.error }, result.status || 400);
    }

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
