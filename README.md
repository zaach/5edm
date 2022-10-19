# 5EDM
Ephemeral, Edge, End-to-End Encrypted Direct Messaging

5EDM uses the recent [HPKE](https://www.rfc-editor.org/rfc/rfc9180.html) standard to establish an end-to-end
encrypted and deniable messaging session between two parties. New keys are
generated before each session, which provides forward-secrecy across sessions and anonymity. With no persistent storage of keys the app's only dependency is <a href="https://deno.com/deploy">Deno Deploy</a>, an edge computing platform that functions as a server-side message bus and CDN for the client code.
            
### Running Locally

In addition to `deno` you'll need `npx` installed to compile tailwindcss.

Start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

### Deploying

The app can be deployed to Deno Deploy.

## Protocol
TODO
