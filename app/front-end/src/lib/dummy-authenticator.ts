/*
 * Created on Fri Oct 27 2023
 * Author: Connor Doman
 */

import bcrypt from "bcrypt";
import { User } from "next-auth";
import { AuthRequest, PrivacyPalAuthenticator, PrivacyPalCredentialsRecord } from "./auth";
import { CredentialsConfig } from "next-auth/providers/credentials";
import { CONFIG_DIRECTORY, extractConfigFile } from "./config";

export interface PrivacyPalDummyUser {
    id: string;
    email: string;
    hashedPassword: string;
}

export class DummyAuthenticator implements PrivacyPalAuthenticator {
    static configDirectory: string | undefined = CONFIG_DIRECTORY;
    private _name: string;
    private _credentials: CredentialsConfig["credentials"];

    constructor() {
        this._name = "credentials";
        this._credentials = {
            email: { label: "Email", type: "text", placeholder: "Email" },
            password: { label: "Password", type: "password" },
        };
    }

    async authorize(credentials: PrivacyPalCredentialsRecord, req: AuthRequest): Promise<User | null> {
        const userConfig = (await extractConfigFile("user.properties.json", DummyAuthenticator.configDirectory)) as {
            users: PrivacyPalDummyUser[];
        };
        const users: PrivacyPalDummyUser[] = userConfig.users;

        // search the recovered JSON for a user with the same email as the credentials
        const user = users.find((user) => user.email === credentials?.email) as PrivacyPalDummyUser;

        if (user) {
            // find the plain text password from the credentials
            const plainPassword = credentials?.password ?? "";

            // translate the stored password from base64 to ASCII
            const hashedPassword = user.hashedPassword ? atob(user.hashedPassword) : "";

            if (hashedPassword === "") {
                console.error("User has no password");
                return null;
            }

            // convert stored password back to ASCII from base64
            // compare the plain text password with the hashed password
            const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);

            if (isPasswordValid) {
                return { id: user.id, email: user.email } as User;
            }
            console.error("Invalid password");
        }
        // if credentials invalid in any way, return null
        return null;
    }

    get name() {
        return this._name;
    }

    get credentials() {
        return this._credentials;
    }
}
