# foundkey-js
`foundkey-js` is a fork of [misskey-js](https://github.com/misskey-dev/misskey.js) that is more up to date.

The following is provided:
- User authentication
- API requests
- Streaming
- Utility functions
- Various foundkey type definitions

This library is designed to work with FoundKey. It should also work with Misskey 12+ but compatibility is not guaranteed.

## Install
This package is not currently published to npmjs.

# Usage
To use `foundkey-js` in your code, use the following import:
``` ts
import * as foundkey from 'foundkey-js';
```

For convenience, the following code examples are based on the assumption that the code is imported as `* as foundkey` as shown above.

However, since tree-shaking is not possible with this import method, we recommend the following individual import for use cases where code size is important.

``` ts
import { api as foundkeyApi } from 'foundkey-js';
```

## Authenticate
todo

## API request
When using the API, initialize an instance of the `APIClient` class by providing information on the server to be used and an access token, and make a request by calling the `request` method of the instance.

``` ts
const cli = new foundkey.api.APIClient({
	origin: 'https://foundkey.example',
	credential: 'TOKEN',
});

const meta = await cli.request('meta', { detail: true });
```

The first argument of `request` is the name of the endpoint to call, and the second argument is a parameter object. The response is returned as a Promise.

## Streaming
Two classes are provided for streaming in `foundkey-js`.

One is the `Stream` class, which handles the streaming connection itself, and the other is the `Channel` class, which represents the concept of a channel on the streaming.

When using streaming, you first initialize an instance of the `Stream` class, and then use the methods of the `Stream` instance to get an instance of the `Channel` class.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

If a connection is lost, it is automatically reconnected.

### Connecting to a channel
Connection to a channel is made using the `useChannel` method of the `Stream` class.

No parameters
``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });

const mainChannel = stream.useChannel('main');
```

With parameters
``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });

const messagingChannel = stream.useChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});
```

### Disconnect from a channel
Call the `dispose` method of the `Channel` class.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });

const mainChannel = stream.useChannel('main');

mainChannel.dispose();
```

### Receiving messages
The `Channel` class inherits from EventEmitter and when a message is received from the server, it emits a payload with the name of the event received.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### Sending messages
Messages can be sent to the server using the `send` method of the `Channel` class.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });
const messagingChannel = stream.useChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});

messagingChannel.send('read', {
	id: 'xxxxxxxxxx'
});
```

### `_connected_` event
The `_connected_` event of the `Stream` class is available.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });
stream.on('_connected_', () => {
	console.log('connected');
});
```

### `_disconnected_` event
The `_disconnected_` event of the `Stream` class is available.

``` ts
const stream = new foundkey.Stream('https://foundkey.example', { token: 'TOKEN' });
stream.on('_disconnected_', () => {
	console.log('disconnected');
});
```

### Connection state
You can check the `state` property of the `Stream` class.

- `initializing`: before connection is established
- `connected`: connected.
- `reconnecting`: reconnecting.
