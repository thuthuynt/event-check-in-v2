import { ParticipantService } from "@/lib/services/participant";
import { validateUserTokenResponse } from "@/lib/api";

export async function POST({ locals, request }) {
  const { DB, "runner-images": RUNNER_IMAGES } = locals.runtime.env;

  const invalidTokenResponse = await validateUserTokenResponse(request);
  if (invalidTokenResponse) return invalidTokenResponse;

  try {
    const { participant_id, photo, signature, checkin_by, note } = await request.json();

    console.log("Check-in request received:", { 
      participant_id, 
      hasPhoto: !!photo, 
      hasSignature: !!signature,
      photoLength: photo ? photo.length : 0,
      signatureLength: signature ? signature.length : 0,
      photoPrefix: photo ? photo.substring(0, 50) : 'none',
      signaturePrefix: signature ? signature.substring(0, 50) : 'none'
    });

    if (!participant_id || !photo || !signature) {
      return Response.json(
        { message: "Participant ID, photo, and signature are required" },
        { status: 400 }
      );
    }

    const participantService = new ParticipantService(DB);

    // Check if participant exists and is not already checked in
    const participant = await participantService.getById(participant_id);
    if (!participant) {
      console.error("Participant not found:", participant_id);
      return Response.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.checkin_at) {
      console.error("Participant already checked in:", participant_id);
      return Response.json(
        { message: "Participant already checked in" },
        { status: 400 }
      );
    }

    console.log("Participant found, proceeding with check-in");

    // Upload photo to R2
    let photoUrl = null;
    if (photo) {
      try {
        const photoKey = `runner-photos/event_${participant.event_id}_bib_${participant.bib_no}_${Date.now()}.jpg`;
        const photoBuffer = Buffer.from(photo.split(',')[1], 'base64');
        
        console.log("Uploading photo to R2:", photoKey, "Buffer size:", photoBuffer.length);
        console.log("R2 binding available:", !!RUNNER_IMAGES);
        
        const uploadResult = await RUNNER_IMAGES.put(photoKey, photoBuffer, {
          contentType: 'image/jpeg',
          metadata: {
            participant_id: participant_id.toString(),
            type: 'checkin_photo',
            uploaded_at: new Date().toISOString()
          }
        });
        
        console.log("R2 upload result:", uploadResult);
        
        // Use a simpler approach - store the key and construct URL in the frontend
        // This avoids hardcoding account IDs and makes it more flexible
        photoUrl = photoKey;
        console.log("Photo uploaded successfully, key:", photoUrl);
      } catch (photoError) {
        console.error("Photo upload error:", photoError);
        console.error("Error details:", {
          message: photoError.message,
          stack: photoError.stack,
          name: photoError.name
        });
        // Continue without photo URL
      }
    }

    // Upload signature to R2
    let signatureUrl = null;
    if (signature) {
      try {
        const signatureKey = `runner-signatures/event_${participant.event_id}_bib_${participant.bib_no}_${Date.now()}.png`;
        const signatureBuffer = Buffer.from(signature.split(',')[1], 'base64');
        
        console.log("Uploading signature to R2:", signatureKey, "Buffer size:", signatureBuffer.length);
        
        const uploadResult = await RUNNER_IMAGES.put(signatureKey, signatureBuffer, {
          contentType: 'image/png',
          metadata: {
            participant_id: participant_id.toString(),
            type: 'checkin_signature',
            uploaded_at: new Date().toISOString()
          }
        });
        
        console.log("R2 signature upload result:", uploadResult);
        
        // Use a simpler approach - store the key and construct URL in the frontend
        signatureUrl = signatureKey;
        console.log("Signature uploaded successfully, key:", signatureUrl);
      } catch (signatureError) {
        console.error("Signature upload error:", signatureError);
        console.error("Signature error details:", {
          message: signatureError.message,
          stack: signatureError.stack,
          name: signatureError.name
        });
        // Continue without signature URL
      }
    }

    // Update participant check-in
    console.log("Updating participant check-in in database");
    const result = await participantService.updateCheckIn(participant_id, {
      checkin_by: checkin_by || 'System',
      note: note || null,
      signature_url: signatureUrl,
      uploaded_image_url: photoUrl
    });

    console.log("Check-in update result:", result);

    if (!result.success) {
      console.error("Failed to update check-in in database");
      return Response.json(
        { message: "Failed to complete check-in" },
        { status: 500 }
      );
    }

    console.log("Check-in completed successfully");
    return Response.json({
      success: true,
      message: "Check-in completed successfully",
      checkin_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Check-in error:", error);
    return Response.json(
      { message: `Failed to complete check-in: ${error.message}` },
      { status: 500 }
    );
  }
}
