This file provides an overview of what functionality goes where.

As convention for this file, when a path is given that does **not** start with a slash, its a relative path.
Look further up in the section to find the "base path" it is relative to.

## backend

All the backend code is in `/packages/backend/src`.

### Database

For connecting to the database an ORM (object–relational mapping) is used.
The ORM can map between database entries and TypeScript objects.
The type definitions for these objects can be found in `/packages/backend/src/models/`.

Definitions for individual objects are defined in `entities/`.
Some behaviour that is mostly used by the API is defined in `repositories/`.
These can be thought of like the database tables themselves.
Often there is functionality called "pack" in these, and by "packing" a database object you will get the API representation of that object.
Schemas for these API versions of the objects are defined in `schema/`.

### API

API stuff goes in `/packages/backend/src/server/api/`

All API routes are "mounted" in `index.ts`.
For this to work, the endpoint has to be tied into the respective path in `endpoints.ts`.

Endpoints are defined using a JSON object, and documentation is automatically generated using these objects.
The type definition for that object is also contained/documented in `endpoints.ts`.

Reading that file you can see that the endpoint behaviour is defined in `endpoints/`.
The paths below that directory should be the same as on the API.

Handling the API calls is done in `api-handler.ts`, which does some preprocessing of the request.
It then uses `authenticate.ts` to try to authenticate the user.
After that the actual endpoint code is run by `call.ts` after checking some more of the preconditions set by the endpoint definiton.

### ActivityPub

ActivityPub related code is in `/packages/backend/src/remote/activitypub/`

Both incoming and outgoing ActivityPub request are handled through queues, to e.g. allow for retrying a request when it fails, or spikes of many incoming requests.

#### Incoming Activities
Remote ActivityPub implementations will HTTP POST to the resource `/user/:userId/inbox` or `/inbox` (the latter is also known as the "shared inbox").
The behaviour for these routes is exactly the same: They add all the received data into the inbox queue.
This is defined in `/packages/backend/src/server/activitypub.ts`.

The inbox processor will do some basic things like verify signatures.

Incoming ActivityPub requests are processed by the code in `kernel/`.
The files/directories are generally named the same as the Activities that they process, which should help with orientation.
The entry point for processing an activity is `processOneActivity` in the `kernel/index.ts` file in that directory.
Parts of incoming activities may also be processed by `models/`.

#### Outgoing Activities
Outgoing activities are usually initiated in the logic of the API endpoints.
The bodies of outgoing ActivityPub requests are "rendered" using `renderer/`.
These files define several functions that are meant to be used together, e.g. `renderCreate(await renderNote(note, false), note)`.
The invocation of these functions is placed either in the API endpoints directly or in the services code.

The rendered bodies of the functions and the recipients are put into the deliver queue to be delivered.

### Services

If code for handling a task seems to big to e.g. do directly in an API endpoint or should be reused, it is probably placed in `/packages/backend/src/services/`.

### Queues

Code regarding queues is in `/packages/backend/src/queue/`.

Misskey defines several queues for processing things that might take longer in the background.
The queues themselves are defined in `index.ts`.
How the different queues are then processed is defined by the code in the `processors/` directory.

## client

All the client code is in `/packages/client/src/`.
The client uses Vue 3 and its Composition API, but there are also some older Options API components that have yet to be refactored (see CONTRIBUTING.md).

### Pages

If it is something you can navigate to, it is most likely a page.
These are defined in `/packages/client/src/pages/` and should be organized by the path you use to see them.

### Components

If it is not a page, it is probably a component.
Components can be things like the emoji picker, a tooltip, a widget.
Components can be combined to make bigger components or also pages.
They are defined in `/packages/client/src/components/`.

### Directives

Vue has "directives", e.g. you can add an attribute to a component like `v-tooltip`.
There are some built in directives like e.g. `v-if` and `v-for`.
Other custom directives are defined in `/packages/client/src/directives/`.
They are added to the Vue app in `index.ts` and their behavior is defined in separate files in the directory.
