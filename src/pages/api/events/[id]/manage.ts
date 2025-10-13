import { EventService } from "@/lib/services/event";
import { validateUserTokenResponse } from "@/lib/api";

export async function PUT({ params, locals, request }) {
  const { id } = params;
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const { event_name, event_start_date } = await request.json();

    if (!event_name || !event_start_date) {
      return Response.json(
        { message: "Event name and start date are required" },
        { status: 400 }
      );
    }

    const eventService = new EventService(DB);
    const result = await eventService.update(parseInt(id), {
      event_name,
      event_start_date
    });

    if (!result.success) {
      return Response.json(
        { message: result.message || "Failed to update event" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Event updated successfully",
      event: result.event
    });

  } catch (error) {
    console.error("Event update error:", error);
    return Response.json(
      { message: `Failed to update event: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE({ params, locals, request }) {
  const { id } = params;
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const eventService = new EventService(DB);
    const result = await eventService.archive(parseInt(id));

    if (!result.success) {
      return Response.json(
        { message: result.message || "Failed to archive event" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Event archived successfully"
    });

  } catch (error) {
    console.error("Event archive error:", error);
    return Response.json(
      { message: `Failed to archive event: ${error.message}` },
      { status: 500 }
    );
  }
}
