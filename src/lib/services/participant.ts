export const PARTICIPANT_QUERIES = {
  SELECT_BY_EVENT: `SELECT * FROM participants WHERE event_id = ? ORDER BY bib_no ASC`,
  SELECT_BY_ID: `SELECT * FROM participants WHERE id = ?`,
  SELECT_BY_EVENT_AND_ID: `SELECT * FROM participants WHERE event_id = ? AND id = ?`,
  SEARCH_PARTICIPANTS: `
    SELECT * FROM participants 
    WHERE event_id = ? AND (
      bib_no LIKE ? OR 
      first_name LIKE ? OR 
      last_name LIKE ? OR 
      phone LIKE ? OR 
      email LIKE ? OR
      CONCAT(first_name, ' ', last_name) LIKE ?
    )
    ORDER BY bib_no ASC
  `,
  INSERT_PARTICIPANT: `
    INSERT INTO participants (
      event_id, participant_id, start_time, bib_no, id_card_passport,
      last_name, first_name, tshirt_size, birthday_year, nationality,
      phone, email, emergency_contact_name, emergency_contact_phone,
      blood_type, medical_information, medicines_using, parent_full_name,
      parent_date_of_birth, parent_email, parent_id_card_passport,
      parent_relationship, full_name, name_on_bib
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  UPDATE_CHECKIN: `
    UPDATE participants 
    SET checkin_at = CURRENT_TIMESTAMP, checkin_by = ?, note = ?, 
        signature_url = ?, uploaded_image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  COUNT_BY_EVENT: `SELECT COUNT(*) as total FROM participants WHERE event_id = ?`,
  COUNT_CHECKED_IN: `SELECT COUNT(*) as checked_in FROM participants WHERE event_id = ? AND checkin_at IS NOT NULL`,
};

export class ParticipantService {
  private DB: D1Database;

  constructor(DB: D1Database) {
    this.DB = DB;
  }

  async getByEvent(eventId: number) {
    const response = await this.DB.prepare(PARTICIPANT_QUERIES.SELECT_BY_EVENT)
      .bind(eventId)
      .all();

    if (response.success) {
      return response.results;
    }
    return [];
  }

  async getById(id: number) {
    const response = await this.DB.prepare(PARTICIPANT_QUERIES.SELECT_BY_ID)
      .bind(id)
      .first();
    return response;
  }

  async getByEventAndId(eventId: number, id: number) {
    const response = await this.DB.prepare(PARTICIPANT_QUERIES.SELECT_BY_EVENT_AND_ID)
      .bind(eventId, id)
      .first();
    return response;
  }

  async search(eventId: number, query: string) {
    const searchTerm = `%${query}%`;
    const response = await this.DB.prepare(PARTICIPANT_QUERIES.SEARCH_PARTICIPANTS)
      .bind(eventId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
      .all();

    if (response.success) {
      return response.results;
    }
    return [];
  }

  async create(participantData: {
    event_id: number;
    participant_id?: string;
    start_time?: string;
    bib_no: string;
    id_card_passport?: string;
    last_name: string;
    first_name: string;
    tshirt_size?: string;
    birthday_year?: number;
    nationality?: string;
    phone?: string;
    email?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    medical_information?: string;
    medicines_using?: string;
    parent_full_name?: string;
    parent_date_of_birth?: string;
    parent_email?: string;
    parent_id_card_passport?: string;
    parent_relationship?: string;
    full_name?: string;
    name_on_bib?: string;
  }) {
    const {
      event_id, participant_id, start_time, bib_no, id_card_passport,
      last_name, first_name, tshirt_size, birthday_year, nationality,
      phone, email, emergency_contact_name, emergency_contact_phone,
      blood_type, medical_information, medicines_using, parent_full_name,
      parent_date_of_birth, parent_email, parent_id_card_passport,
      parent_relationship, full_name, name_on_bib
    } = participantData;

    const response = await this.DB.prepare(PARTICIPANT_QUERIES.INSERT_PARTICIPANT)
      .bind(
        event_id, participant_id || null, start_time || null, bib_no, id_card_passport || null,
        last_name, first_name, tshirt_size || null, birthday_year || null, nationality || null,
        phone || null, email || null, emergency_contact_name || null, emergency_contact_phone || null,
        blood_type || null, medical_information || null, medicines_using || null, parent_full_name || null,
        parent_date_of_birth || null, parent_email || null, parent_id_card_passport || null,
        parent_relationship || null, full_name || null, name_on_bib || null
      )
      .run();

    if (!response.success) {
      throw new Error("Failed to create participant");
    }

    return { success: true, participantId: response.meta.last_row_id };
  }

  async updateCheckIn(id: number, checkInData: {
    checkin_by: string;
    note?: string;
    signature_url?: string;
    uploaded_image_url?: string;
  }) {
    const { checkin_by, note, signature_url, uploaded_image_url } = checkInData;

    const response = await this.DB.prepare(PARTICIPANT_QUERIES.UPDATE_CHECKIN)
      .bind(checkin_by, note || null, signature_url || null, uploaded_image_url || null, id)
      .run();

    if (!response.success) {
      throw new Error("Failed to update check-in");
    }

    return { success: true };
  }

  async getStats(eventId: number) {
    const [totalResponse, checkedInResponse] = await Promise.all([
      this.DB.prepare(PARTICIPANT_QUERIES.COUNT_BY_EVENT).bind(eventId).first(),
      this.DB.prepare(PARTICIPANT_QUERIES.COUNT_CHECKED_IN).bind(eventId).first()
    ]);

    const total = totalResponse?.total || 0;
    const checkedIn = checkedInResponse?.checked_in || 0;
    const remaining = total - checkedIn;

    return { total, checked_in: checkedIn, remaining };
  }
}
