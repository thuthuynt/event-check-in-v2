import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";

export async function POST({ locals, request }) {
  const { DB } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const formData = await request.formData();
    const event_id = formData.get('event_id') as string;
    const participant_id = formData.get('participant_id') as string;
    const start_time = formData.get('start_time') as string;
    const bib_no = formData.get('bib_no') as string;
    const category = formData.get('category') as string;
    const age_group = formData.get('age_group') as string;
    const id_card_passport = formData.get('id_card_passport') as string;
    const last_name = formData.get('last_name') as string;
    const first_name = formData.get('first_name') as string;
    const tshirt_size = formData.get('tshirt_size') as string;
    const birthday_year = formData.get('birthday_year') as string;
    const nationality = formData.get('nationality') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const emergency_contact_name = formData.get('emergency_contact_name') as string;
    const emergency_contact_phone = formData.get('emergency_contact_phone') as string;
    const blood_type = formData.get('blood_type') as string;
    const medical_information = formData.get('medical_information') as string;
    const medicines_using = formData.get('medicines_using') as string;
    const parent_full_name = formData.get('parent_full_name') as string;
    const parent_date_of_birth = formData.get('parent_date_of_birth') as string;
    const parent_email = formData.get('parent_email') as string;
    const parent_id_card_passport = formData.get('parent_id_card_passport') as string;
    const parent_relationship = formData.get('parent_relationship') as string;
    const full_name = formData.get('full_name') as string;
    const name_on_bib = formData.get('name_on_bib') as string;
    const photo = formData.get('photo') as string;
    const signature = formData.get('signature') as string;

    if (!event_id) {
      return Response.json(
        { message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Prepare participant data
    const participantData: any = {
      event_id: parseInt(event_id),
      participant_id: participant_id || '',
      start_time: start_time || '',
      bib_no: bib_no || '',
      category: category || '',
      age_group: age_group || '',
      id_card_passport: id_card_passport || '',
      last_name: last_name || '',
      first_name: first_name || '',
      tshirt_size: tshirt_size || '',
      birthday_year: birthday_year ? parseInt(birthday_year) : null,
      nationality: nationality || '',
      phone: phone || '',
      email: email || '',
      emergency_contact_name: emergency_contact_name || '',
      emergency_contact_phone: emergency_contact_phone || '',
      blood_type: blood_type || '',
      medical_information: medical_information || '',
      medicines_using: medicines_using || '',
      parent_full_name: parent_full_name || '',
      parent_date_of_birth: parent_date_of_birth || '',
      parent_email: parent_email || '',
      parent_id_card_passport: parent_id_card_passport || '',
      parent_relationship: parent_relationship || '',
      full_name: full_name || `${first_name || ''} ${last_name || ''}`.trim(),
      name_on_bib: name_on_bib || full_name || `${first_name || ''} ${last_name || ''}`.trim(),
      note: 'Manually created'
    };

    // Ensure required fields have defaults
    if (!participantData.bib_no) {
      // Generate a unique bib number
      const participantService = new ParticipantService(DB);
      const existingParticipants = await participantService.search(participantData.event_id, '', 1, 1000);
      participantData.bib_no = `BIB-${existingParticipants.participants.length + 1}`;
    }

    // Create participant
    const participantService = new ParticipantService(DB);
    const result = await participantService.create(participantData);

    if (!result.success) {
      return Response.json(
        { message: result.message || "Failed to create participant" },
        { status: 500 }
      );
    }

    // If photo and signature are provided, handle check-in
    if (photo && signature) {
      try {
        // Handle photo upload to R2
        let photoUrl = '';
        if (photo.startsWith('data:image/')) {
          const photoData = photo.split(',')[1];
          const photoBuffer = Buffer.from(photoData, 'base64');
          const photoKey = `runner-photos/event_${participantData.event_id}_bib_${participantData.bib_no}_${Date.now()}.jpg`;
          
          const { "runner-images": RUNNER_IMAGES } = locals.runtime.env;
          await RUNNER_IMAGES.put(photoKey, photoBuffer, {
            httpMetadata: {
              contentType: 'image/jpeg',
            },
          });
          photoUrl = photoKey;
        }

        // Handle signature upload to R2
        let signatureUrl = '';
        if (signature.startsWith('data:image/')) {
          const signatureData = signature.split(',')[1];
          const signatureBuffer = Buffer.from(signatureData, 'base64');
          const signatureKey = `runner-signatures/event_${participantData.event_id}_bib_${participantData.bib_no}_${Date.now()}.png`;
          
          const { "runner-images": RUNNER_IMAGES } = locals.runtime.env;
          await RUNNER_IMAGES.put(signatureKey, signatureBuffer, {
            httpMetadata: {
              contentType: 'image/png',
            },
          });
          signatureUrl = signatureKey;
        }

      // Update participant with check-in data
      const checkInResult = await participantService.checkInParticipant(result.participantId, {
        uploaded_image_url: photoUrl,
        signature_url: signatureUrl,
        checkin_by: 'admin',
        note: 'Manually created and checked in via mobile app'
      });

        if (!checkInResult.success) {
          console.error("Failed to check in participant:", checkInResult.message);
        }
      } catch (error) {
        console.error("Error handling photo/signature upload:", error);
        // Don't fail the entire request if photo/signature upload fails
      }
    }

    return Response.json({
      success: true,
      message: "Participant created successfully",
      participantId: result.participantId,
      checkedIn: !!(photo && signature)
    });

  } catch (error) {
    console.error("Error creating participant:", error);
    return Response.json(
      { message: "Failed to create participant" },
      { status: 500 }
    );
  }
}
