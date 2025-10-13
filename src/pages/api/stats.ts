import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";

export async function GET({ locals, request }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;
  const url = new URL(request.url);
  const event_id = url.searchParams.get('event_id');

  if (!event_id) {
    return Response.json(
      { message: "Event ID is required" },
      { status: 400 }
    );
  }

  const participantService = new ParticipantService(DB);

  try {
    const stats = await participantService.getStats(parseInt(event_id));
    return Response.json(stats);

  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
