import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseServerClient, jsonResponse, errorResponse } from "@/lib/serverApi";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const cookieStore = await cookies();
    const supabase = getSupabaseServerClient(cookieStore);

    const filter = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    const { data: jobs, error, count } = await filter;

    if (error) {
      console.error("[/api/student-jobs GET] Supabase error:", error.message);
      return jsonResponse({ jobs: [], totalPages: 0, currentPage: page, totalJobs: 0 });
    }

    return jsonResponse({
      jobs: jobs || [],
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalJobs: count || 0,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
