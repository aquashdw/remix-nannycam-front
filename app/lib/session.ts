import {createCookieSessionStorage, Session} from "@remix-run/node";
import {sessionCookie} from "~/cookies.server";

export const cookieSessionStorage = createCookieSessionStorage({
  cookie: sessionCookie
});

const getSession = (request: Request) => cookieSessionStorage.getSession(request.headers.get("Cookie"));
const commitSession = cookieSessionStorage.commitSession
const destroySession = cookieSessionStorage.destroySession

type SessionData = {
  jwt?: string
  username?: string
  signedIn?: boolean
  updatedAt?: number
}
const updateSession = async (session: Session, data: SessionData) => {
  if (data.jwt) session.set("jwt", data.jwt);
  if (data.username) session.set("username", data.username);
  if (data.signedIn) session.set("signedIn", data.signedIn);
  if (data.updatedAt) session.set("updatedAt", data.updatedAt);
  return await commitSession(session);
}

export {getSession, updateSession, destroySession};

