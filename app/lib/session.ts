import {createCookieSessionStorage} from "@remix-run/node";
import {sessionCookie} from "~/cookies.server";
import * as crypto from "node:crypto";
import * as Iron from "iron-webcrypto"
import * as process from "node:process";

export const cookieSessionStorage = createCookieSessionStorage({
  cookie: sessionCookie
});

type SessionData = {
  jwt?: string
  username?: string
  signedIn?: boolean
  updatedAt?: number
}

const SECRET = process.env.SECRET ?? "!t%9v2V-rTfAKt7:~vKmuiA~MxB4uNjK";

const sealData = async (data: object) => await Iron.seal(crypto, data, SECRET, Iron.defaults);
const unsealData = async (sealed: string | undefined): Promise<SessionData | null> =>
    // @ts-expect-error cookie should be in unsealed data but isn't
    sealed ? (await Iron.unseal(crypto, sealed, SECRET, Iron.defaults)) : {};

const getSession = async (request: Request) => {
  const cookie = request.headers.get("Cookie");
  return await cookieSessionStorage.getSession(cookie);
}

export type SessionHandler = {
  getJwt: () => string | undefined,
  getUsername: () => string | undefined,
  getSignedIn: () => boolean | undefined,
  getUpdatedAt: () => number | undefined,
  update: (data: SessionData) => Promise<void>,
  getSetCookie: () => Promise<string>,
  destroySession: () => Promise<string>,
}

export async function getSessionHandler(request: Request): Promise<SessionHandler> {
  const session = await getSession(request);
  const data = await unsealData(session.get("data")) ?? {};
  const getJwt = () => data.jwt;
  const getUsername = () => data.username;
  const getSignedIn = () => data.signedIn;
  const getUpdatedAt = () => data.updatedAt;

  const update = async ({jwt, username, signedIn}: SessionData) => {
    data.jwt = jwt ?? data.jwt;
    data.username = username ?? data.username;
    data.signedIn = signedIn ?? data.signedIn;
    data.updatedAt = Date.now();
    session.set("data", await sealData(data));
  }

  const getSetCookie = async () => await cookieSessionStorage.commitSession(session);
  const destroySession = () => cookieSessionStorage.destroySession(session);

  return {
    getJwt, getUsername, getSignedIn, getUpdatedAt, update, getSetCookie, destroySession
  }
}
