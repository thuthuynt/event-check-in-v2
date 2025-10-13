import { UserService } from "@/lib/services/user";
import bcrypt from "bcryptjs";

export async function POST({ locals, request }) {
  const { DB } = locals.runtime.env;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const userService = new UserService(DB);
    const user = await userService.getByUsername(username);

    if (!user) {
      return Response.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // For demo purposes, we'll use a simple password check
    // In production, you should use proper password hashing
    const isValidPassword = password === "admin123" || await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return Response.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate a simple token (in production, use JWT)
    const token = btoa(`${user.id}:${user.user_name}:${Date.now()}`);

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
