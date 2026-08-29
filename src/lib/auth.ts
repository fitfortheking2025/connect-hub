import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User, IUser } from "@/models";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const username = (credentials.username as string).toLowerCase().trim();
        const user = await User.findOne({ username, isActive: true }).lean<IUser>();

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.role === "MEMBER") {
          throw new Error("Members do not have portal access.");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.fullName,
          email: user.username,
          role: user.role,
        };
      },
    }),
  ],
});