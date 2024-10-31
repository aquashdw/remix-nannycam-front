import { createCookieSessionStorage, Session } from "@remix-run/node";
import { sessionCookie } from "~/cookies.server";
import * as crypto from "node:crypto";
import * as Iron from 'iron-webcrypto'
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
const seal = async (cookie: string) => await Iron.seal(crypto, { cookie }, SECRET, Iron.defaults);
const unseal = async (cookieValue: string) : Promise<string | null> =>
    // @ts-expect-error cookie should be in unsealed data but isn't
    (await Iron.unseal(crypto, cookieValue, SECRET, Iron.defaults)).cookie;

const getSealedId = (cookie: string) => {
  const splitStr = cookie.split("sessionid=");
  const semiIdx = splitStr[1].indexOf(";");
  return semiIdx !== -1 ? splitStr[1].slice(0, splitStr[1].indexOf(";")) : splitStr[1];
}

const getSession = async (request: Request) => {
  const cookie = request.headers.get("Cookie");
  if (!cookie || cookie.indexOf("sessionid=") === -1) return cookieSessionStorage.getSession(cookie);

  const value = getSealedId(cookie);
  const unsealed = await unseal(value);
  if (!unsealed) throw Error("cannot decrypt cookie");
  const composite = `sessionid=${unsealed}`;
  return await cookieSessionStorage.getSession(composite);
}


const refineCommited = async (commited: string) => {
  const splitStr = commited.split("sessionid=");
  const preCookie = splitStr[0];
  const value = splitStr[1].slice(0, splitStr[1].indexOf(";"));
  const postCookie = splitStr[1].slice(splitStr[1].indexOf(";"));
  return `${preCookie}sessionid=${await seal(value)}${postCookie}`;
}

const updateSession = async (session: Session, data: SessionData) => {
  if (data.jwt) session.set("jwt", data.jwt);
  if (data.username) session.set("username", data.username);
  if (data.signedIn) session.set("signedIn", data.signedIn);
  if (data.updatedAt) session.set("updatedAt", data.updatedAt);
  const commited = await cookieSessionStorage.commitSession(session)
  return await refineCommited(commited);
}

const destroySession = cookieSessionStorage.destroySession

export {getSession, updateSession, destroySession};
