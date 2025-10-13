export const EVENT_QUERIES = {
  SELECT_ALL: `SELECT e.*, u.user_name as created_by_name FROM events e LEFT JOIN users u ON e.created_by = u.id ORDER BY e.event_start_date DESC`,
  SELECT_BY_ID: `SELECT e.*, u.user_name as created_by_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?`,
  SELECT_ACTIVE: `SELECT e.*, u.user_name as created_by_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.status = 'active' ORDER BY e.event_start_date DESC`,
  INSERT_EVENT: `INSERT INTO events (event_name, event_start_date, event_end_date, location, description, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
  UPDATE_EVENT: `UPDATE events SET event_name = ?, event_start_date = ?, event_end_date = ?, location = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  DELETE_EVENT: `UPDATE events SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  COUNT_PARTICIPANTS: `SELECT COUNT(*) as participant_count FROM participants WHERE event_id = ?`,
};

export class EventService {
  private DB: D1Database;

  constructor(DB: D1Database) {
    this.DB = DB;
  }

  async getAll() {
    const response = await this.DB.prepare(EVENT_QUERIES.SELECT_ALL).all();
    
    if (response.success) {
      // Add participant count to each event
      const eventsWithCounts = await Promise.all(
        response.results.map(async (event: any) => {
          const countResponse = await this.DB.prepare(EVENT_QUERIES.COUNT_PARTICIPANTS)
            .bind(event.id)
            .first();
          return {
            ...event,
            participant_count: countResponse?.participant_count || 0
          };
        })
      );
      return eventsWithCounts;
    }
    return [];
  }

  async getById(id: number) {
    const response = await this.DB.prepare(EVENT_QUERIES.SELECT_BY_ID)
      .bind(id)
      .first();
    
    if (response) {
      // Add participant count
      const countResponse = await this.DB.prepare(EVENT_QUERIES.COUNT_PARTICIPANTS)
        .bind(id)
        .first();
      return {
        ...response,
        participant_count: countResponse?.participant_count || 0
      };
    }
    return null;
  }

  async getActive() {
    const response = await this.DB.prepare(EVENT_QUERIES.SELECT_ACTIVE).all();
    
    if (response.success) {
      // Add participant count to each event
      const eventsWithCounts = await Promise.all(
        response.results.map(async (event: any) => {
          const countResponse = await this.DB.prepare(EVENT_QUERIES.COUNT_PARTICIPANTS)
            .bind(event.id)
            .first();
          return {
            ...event,
            participant_count: countResponse?.participant_count || 0
          };
        })
      );
      return eventsWithCounts;
    }
    return [];
  }

  async create(eventData: {
    event_name: string;
    event_start_date: string;
    event_end_date?: string;
    location?: string;
    description?: string;
    created_by: number;
  }) {
    const { event_name, event_start_date, event_end_date, location, description, created_by } = eventData;

    const response = await this.DB.prepare(EVENT_QUERIES.INSERT_EVENT)
      .bind(event_name, event_start_date, event_end_date || null, location || null, description || null, created_by)
      .run();

    if (!response.success) {
      throw new Error("Failed to create event");
    }

    return { success: true, eventId: response.meta.last_row_id };
  }

  async update(id: number, eventData: {
    event_name: string;
    event_start_date: string;
    event_end_date?: string;
    location?: string;
    description?: string;
    status?: string;
  }) {
    const { event_name, event_start_date, event_end_date, location, description, status = 'active' } = eventData;

    const response = await this.DB.prepare(EVENT_QUERIES.UPDATE_EVENT)
      .bind(event_name, event_start_date, event_end_date || null, location || null, description || null, status, id)
      .run();

    if (!response.success) {
      throw new Error("Failed to update event");
    }

    return { success: true };
  }

  async delete(id: number) {
    const response = await this.DB.prepare(EVENT_QUERIES.DELETE_EVENT)
      .bind(id)
      .run();

    if (!response.success) {
      throw new Error("Failed to delete event");
    }

    return { success: true };
  }

  async archive(id: number) {
    // Archive is the same as delete (soft delete)
    return this.delete(id);
  }
}
