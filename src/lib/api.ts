// User authentication functions
export const validateUserToken = async (request) => {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Decode the token (it's base64 encoded user info)
    try {
      const decoded = atob(token);
      const [userId, username, timestamp] = decoded.split(':');
      
      // Check if token is not too old (24 hours)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - tokenTime > maxAge) {
        return null;
      }
      
      return {
        id: parseInt(userId),
        username: username,
        timestamp: tokenTime
      };
    } catch (decodeError) {
      return null;
    }
  } catch (error) {
    console.error("Error validating user token:", error);
    return null;
  }
};

export const validateUserTokenResponse = async (request) => {
  const user = await validateUserToken(request);
  if (!user) {
    return Response.json({ message: "Invalid or expired token" }, { status: 401 });
  }
  return null; // No error, user is valid
};

// Event API functions
export const getEvents = async (baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/events`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return {
      events: data,
      success: true,
    };
  } else {
    console.error("Failed to fetch events");
    return {
      events: [],
      success: false,
    };
  }
};

export const getEvent = async (id, baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/events/${id}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return {
      event: data,
      success: true,
    };
  } else {
    console.error("Failed to fetch event");
    return {
      event: null,
      success: false,
    };
  }
};

export const createEvent = async (baseUrl, apiToken, eventData) => {
  const response = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: eventData,
  });
  if (response.ok) {
    const data = await response.json();
    return {
      event: data,
      success: true,
    };
  } else {
    console.error("Failed to create event");
    return {
      event: null,
      success: false,
    };
  }
};

// Participant API functions
export const searchParticipants = async (eventId, query, baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/participants/search?event_id=${eventId}&q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return {
      participants: data,
      success: true,
    };
  } else {
    console.error("Failed to search participants");
    return {
      participants: [],
      success: false,
    };
  }
};

export const getParticipant = async (id, eventId, baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/participants/${id}?event_id=${eventId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return {
      participant: data,
      success: true,
    };
  } else {
    console.error("Failed to fetch participant");
    return {
      participant: null,
      success: false,
    };
  }
};

export const completeCheckIn = async (participantId, photo, signature, checkinBy, note, baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/checkin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participant_id: participantId,
      photo,
      signature,
      checkin_by: checkinBy,
      note,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      data,
    };
  } else {
    console.error("Failed to complete check-in");
    return {
      success: false,
      error: "Failed to complete check-in",
    };
  }
};

// Statistics API functions
export const getStats = async (eventId, baseUrl, apiToken) => {
  const response = await fetch(`${baseUrl}/api/stats?event_id=${eventId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return {
      stats: data,
      success: true,
    };
  } else {
    console.error("Failed to fetch stats");
    return {
      stats: null,
      success: false,
    };
  }
};

// Authentication API functions
export const login = async (username, password, baseUrl) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } else {
    const error = await response.json();
    return {
      success: false,
      error: error.message || "Login failed",
    };
  }
};