export async function GET({ params, locals }) {
  const { key } = params;
  const { "runner-images": RUNNER_IMAGES } = locals.runtime.env;

  try {
    console.log("Image API called with key:", key);
    console.log("Decoded key:", decodeURIComponent(key));
    console.log("R2 binding available:", !!RUNNER_IMAGES);
    
    // Decode the key in case it's URL encoded
    const decodedKey = decodeURIComponent(key);
    
    // Get the object from R2
    const object = await RUNNER_IMAGES.get(decodedKey);
    
    if (!object) {
      console.log("Image not found:", decodedKey);
      return new Response("Image not found", { status: 404 });
    }

    // Get the content type from the object metadata or default to image/jpeg
    const contentType = object.httpMetadata?.contentType || 'image/jpeg';
    
    console.log("Serving image:", decodedKey, "Content-Type:", contentType);
    
    // Return the image with proper headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error("Error fetching image:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
