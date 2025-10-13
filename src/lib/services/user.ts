export const USER_QUERIES = {
  SELECT_BY_USERNAME: `SELECT * FROM users WHERE user_name = ? AND is_active = 1`,
  SELECT_BY_ID: `SELECT id, user_name, email, role, created_at FROM users WHERE id = ? AND is_active = 1`,
  INSERT_USER: `INSERT INTO users (user_name, password_hash, email, role) VALUES (?, ?, ?, ?)`,
  UPDATE_USER: `UPDATE users SET user_name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  DEACTIVATE_USER: `UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
};

export class UserService {
  private DB: D1Database;

  constructor(DB: D1Database) {
    this.DB = DB;
  }

  async getByUsername(username: string) {
    const response = await this.DB.prepare(USER_QUERIES.SELECT_BY_USERNAME)
      .bind(username)
      .first();
    return response;
  }

  async getById(id: number) {
    const response = await this.DB.prepare(USER_QUERIES.SELECT_BY_ID)
      .bind(id)
      .first();
    return response;
  }

  async create(userData: {
    user_name: string;
    password_hash: string;
    email?: string;
    role?: string;
  }) {
    const { user_name, password_hash, email, role = 'staff' } = userData;

    const response = await this.DB.prepare(USER_QUERIES.INSERT_USER)
      .bind(user_name, password_hash, email || null, role)
      .run();

    if (!response.success) {
      throw new Error("Failed to create user");
    }

    return { success: true, userId: response.meta.last_row_id };
  }

  async update(id: number, userData: {
    user_name: string;
    email?: string;
    role?: string;
  }) {
    const { user_name, email, role } = userData;

    const response = await this.DB.prepare(USER_QUERIES.UPDATE_USER)
      .bind(user_name, email || null, role || 'staff', id)
      .run();

    if (!response.success) {
      throw new Error("Failed to update user");
    }

    return { success: true };
  }

  async deactivate(id: number) {
    const response = await this.DB.prepare(USER_QUERIES.DEACTIVATE_USER)
      .bind(id)
      .run();

    if (!response.success) {
      throw new Error("Failed to deactivate user");
    }

    return { success: true };
  }
}
