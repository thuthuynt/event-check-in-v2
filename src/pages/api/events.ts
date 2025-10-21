import { EventService } from "@/lib/services/event";
import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";
import * as XLSX from 'xlsx';

// Helper function to map CSV/Excel row data to participant object
function mapCsvRowToParticipant(headers: string[], values: string[], eventId: number): any {
  const participantData: any = {
    event_id: eventId,
    bib_no: '',
    last_name: '',
    first_name: '',
  };

  // Map common CSV column names to our database fields
  headers.forEach((header, index) => {
    const value = values[index] || '';
    
    switch (header) {
      case 'bib_no':
      case 'bib':
      case 'bib number':
        participantData.bib_no = value;
        break;
      case 'last_name':
      case 'lastname':
      case 'surname':
        participantData.last_name = value;
        break;
      case 'first_name':
      case 'firstname':
      case 'given name':
        participantData.first_name = value;
        break;
      case 'full_name':
      case 'fullname':
      case 'name':
        participantData.full_name = value;
        break;
      case 'name_on_bib':
      case 'bib name':
        participantData.name_on_bib = value;
        break;
      case 'phone':
      case 'phone_number':
      case 'mobile':
        participantData.phone = value;
        break;
      case 'email':
      case 'email_address':
        participantData.email = value;
        break;
      case 'id_card':
      case 'id_card_passport':
      case 'id':
        participantData.id_card_passport = value;
        break;
      case 'tshirt_size':
      case 'shirt_size':
      case 'size':
        participantData.tshirt_size = value;
        break;
      case 'birthday_year':
      case 'birth_year':
      case 'year':
        participantData.birthday_year = parseInt(value) || null;
        break;
      case 'nationality':
        participantData.nationality = value;
        break;
      case 'emergency_contact_name':
      case 'emergency_name':
        participantData.emergency_contact_name = value;
        break;
      case 'emergency_contact_phone':
      case 'emergency_phone':
        participantData.emergency_contact_phone = value;
        break;
      case 'blood_type':
        participantData.blood_type = value;
        break;
      case 'medical_information':
      case 'medical_info':
        participantData.medical_information = value;
        break;
      case 'medicines_using':
      case 'medicines':
        participantData.medicines_using = value;
        break;
      case 'parent_full_name':
      case 'parent_name':
        participantData.parent_full_name = value;
        break;
      case 'parent_email':
        participantData.parent_email = value;
        break;
      case 'parent_id_card_passport':
      case 'parent_id':
        participantData.parent_id_card_passport = value;
        break;
      case 'parent_relationship':
      case 'relationship':
        participantData.parent_relationship = value;
        break;
      case 'start_time':
        participantData.start_time = value;
        break;
      case 'participant_id':
        participantData.participant_id = value;
        break;
      case 'category':
        participantData.category = value;
        break;
      case 'age_group':
      case 'age group':
        participantData.age_group = value;
        break;
    }
  });

  // Only return participant data if we have essential information
  if (participantData.bib_no || participantData.full_name || (participantData.first_name && participantData.last_name)) {
    return participantData;
  }
  return null;
}

export async function GET({ locals, request }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const eventService = new EventService(DB);
    const events = await eventService.getAll();

    return Response.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json(
      { message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST({ locals, request }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const formData = await request.formData();
    const event_name = formData.get('event_name') as string;
    const event_start_date = formData.get('event_start_date') as string;
    const event_end_date = formData.get('event_end_date') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    const participants_file = formData.get('participants_file') as File;

    if (!event_name || !event_start_date) {
      return Response.json(
        { message: "Event name and start date are required" },
        { status: 400 }
      );
    }

    // Create event
    const eventService = new EventService(DB);
    const eventResult = await eventService.create({
      event_name,
      event_start_date,
      event_end_date: event_end_date || undefined,
      location: location || undefined,
      description: description || undefined,
      created_by: 1 // Default admin user
    });

    if (!eventResult.success) {
      return Response.json(
        { message: "Failed to create event" },
        { status: 500 }
      );
    }

    let participantCount = 0;
    let participantErrors = [];

    // Process participants file if provided
    if (participants_file && participants_file.size > 0) {
      try {
        const fileName = participants_file.name.toLowerCase();
        let participants = [];
        
        if (fileName.endsWith('.csv')) {
          // Process CSV file
          const fileContent = await participants_file.text();
          const lines = fileContent.split('\n').filter(line => line.trim());
          
          if (lines.length > 0) {
            // Parse CSV header
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Process each participant row
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              
              if (values.length >= headers.length) {
                const participantData = mapCsvRowToParticipant(headers, values, eventResult.eventId);
                if (participantData) {
                  participants.push(participantData);
                }
              }
            }
          }
        } else if (fileName.endsWith('.xlsx')) {
          // Process Excel file
          const arrayBuffer = await participants_file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
            
            // Process each participant row
            for (let i = 1; i < jsonData.length; i++) {
              const values = jsonData[i].map((v: any) => String(v || '').trim());
              
              if (values.length >= headers.length) {
                const participantData = mapCsvRowToParticipant(headers, values, eventResult.eventId);
                if (participantData) {
                  participants.push(participantData);
                }
              }
            }
          }
        } else {
          return Response.json(
            { message: "Unsupported file format. Please upload a CSV or Excel (.xlsx) file." },
            { status: 400 }
          );
        }

        // Create participants in database
        const participantService = new ParticipantService(DB);
        for (const participantData of participants) {
          try {
            // Ensure required fields are present
            if (!participantData.bib_no) {
              participantData.bib_no = `BIB-${participantCount + 1}`;
            }
            if (!participantData.last_name) {
              participantData.last_name = 'Unknown';
            }
            if (!participantData.first_name) {
              participantData.first_name = 'Unknown';
            }
            if (!participantData.full_name) {
              participantData.full_name = `${participantData.first_name} ${participantData.last_name}`;
            }
            if (!participantData.name_on_bib) {
              participantData.name_on_bib = participantData.full_name;
            }

            // Create participant
            const participantResult = await participantService.create(participantData);
            if (participantResult.success) {
              participantCount++;
            } else {
              participantErrors.push(`Failed to create participant: ${participantResult.message}`);
            }
          } catch (error) {
            participantErrors.push(`Error creating participant: ${error.message}`);
          }
        }
      } catch (error) {
        console.error("Error processing participants file:", error);
        participantErrors.push(`File processing error: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `Event created successfully${participantCount > 0 ? ` with ${participantCount} participants` : ''}`,
      eventId: eventResult.eventId,
      participantCount,
      participantErrors: participantErrors.length > 0 ? participantErrors : undefined
    });

  } catch (error) {
    console.error("Error creating event:", error);
    return Response.json(
      { message: "Failed to create event" },
      { status: 500 }
    );
  }
}