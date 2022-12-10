# 3rd party access
Foundkey supports:
- OAuth 2.0 Authorization Code grant per [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749).
- OAuth Bearer Token Usage per [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750).
- Proof Key for Code Exchange (PKCE) per [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636).
- OAuth 2.0 Authorization Server Metadata per [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html).

# Discovery
Because the implementation may change in the future, it is recommended that you use OAuth 2.0 Authorization Server Metadata a.k.a. OpenID Connect Discovery.
In short, this means that to discover the URLs for the grant endpoints you should request `/.well-known/oauth-authorization-server`, which is a JSON object.
From there, `authorization_endpoint` and `token_endpoint` will probably be most interesting to you.
The definitions of all data fields are to be found in [RFC 8414, section 2](https://www.rfc-editor.org/rfc/rfc8414#section-2).

# App registration
Before using the OAuth grant you need to register your application.
Currently you will need to use the pre-existing Misskey API to register, though Dynamic Client Registration may be implemented at a later point.
(You'd be able to tell from the Authorization Server Metadata, see above.)

The data you will need to know before registering is the following:
- a name for your app,
- a short description to be shown to users,
- which API permissions you need, and
- the callback URL you want to use.

There can only be 1 callback URL per registration.

Note that you can specify permissions a 2nd time in the OAuth flow.
If you do not provide permissions again in the grant flow, the default is to use all permissions you gave when registering the app.
If you do provide permissions in the grant flow, permissions that were not registered will never be granted.
A list of available permissions can be viewed on any Foundkey instance by going to the API documentation at `/api-doc`.

To register your app you need to `POST` to `/api/app/create`.
The body of the request must be a JSON object with the following keys:
- `name` (string): a name for your app,
- `description` (string): a short description to be shown to users,
- `permission` (array of permission names) which API permissions you need, and
- `callbackUrl` (string): the callback URL you want to use.

If successful (HTTP response code 200) you will receive back a JSON object containing among other things:
- `id` (string): the client ID
- `secret` (string): the client secret
With these credentials you should be able to use the Authorization Code grant to obtain authorization.
