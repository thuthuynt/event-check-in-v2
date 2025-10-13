import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";

export async function GET({ locals, request }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;
  const url = new URL(request.url);
  const event_id = url.searchParams.get('event_id');
  const q = url.searchParams.get('q');

  if (!event_id) {
    return Response.json(
      { message: "Event ID is required" },
      { status: 400 }
    );
  }

  const participantService = new ParticipantService(DB);

  try {
    let participants;
    if (q && q.length >= 2) {
      participants = await participantService.search(parseInt(event_id), q);
    } else {
      participants = await participantService.getByEvent(parseInt(event_id));
    }

    return Response.json(participants);

  } catch (error) {
    console.error("Error fetching participants:", error);
    return Response.json(
      { message: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
