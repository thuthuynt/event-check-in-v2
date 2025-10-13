import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";

export async function GET({ locals, params, request }) {
  const { DB } = locals.runtime.env;
  const { id } = params;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  const participantService = new ParticipantService(DB);
  const participant = await participantService.getById(parseInt(id));

  if (!participant) {
    return Response.json(
      { message: "Participant not found" },
      { status: 404 }
    );
  }

  return Response.json(participant);
}
