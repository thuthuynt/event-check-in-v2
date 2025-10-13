import { EventService } from "@/lib/services/event";
import { validateUserTokenResponse } from "@/lib/api";

export async function GET({ locals, params, request }) {
  const { DB } = locals.runtime.env;
  const { id } = params;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  const eventService = new EventService(DB);
  const event = await eventService.getById(parseInt(id));

  if (!event) {
    return Response.json(
      { message: "Event not found" },
      { status: 404 }
    );
  }

  return Response.json(event);
}
