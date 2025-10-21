import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";
import * as XLSX from 'xlsx';

export async function GET({ locals, request, url }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const eventId = url.searchParams.get('event_id');
    const format = url.searchParams.get('format') || 'csv'; // csv or excel

    if (!eventId) {
      return Response.json(
        { message: "Event ID is required" },
        { status: 400 }
      );
    }

    const participantService = new ParticipantService(DB);
    
    // Get all participants for the event
    const result = await participantService.search(parseInt(eventId), '', 1, 10000); // Get all participants
    
    if (!result.success) {
      return Response.json(
        { message: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    const participants = result.participants;

    if (format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(participants);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="participants_event_${eventId}.xlsx"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // Create CSV file
      if (participants.length === 0) {
        return Response.json(
          { message: "No participants found for this event" },
          { status: 404 }
        );
      }

      // Get headers from the first participant
      const headers = Object.keys(participants[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...participants.map(participant => 
          headers.map(header => {
            const value = participant[header];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="participants_event_${eventId}.csv"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

  } catch (error) {
    console.error("Error exporting participants:", error);
    return Response.json(
      { message: "Failed to export participants" },
      { status: 500 }
    );
  }
}
