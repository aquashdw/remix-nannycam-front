import {Link} from "@remix-run/react";

export default function SignUpError() {
  return (
      <main>
        <div className="main-content">
          <h1 className="mb-4">Uh-Oh!</h1>
          <p className="mb-2">You&apos;ve stumbled to this page because something bad has happened, or
            you&apos;ve
            become curious. Sorry for the trouble.</p>
          <p className="mb-4">Send us an email of what happened, and we&apos;ll look into it.</p>

          <div className="flex justify-between items-center">
            <Link
                className="button-neg"
                to="/"
            >
              Go back
            </Link>
          </div>
        </div>
      </main>
  );
}