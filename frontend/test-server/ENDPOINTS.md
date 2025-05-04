# Proposal from NW for server API endpoints needed for client
Top is a list of all endpoints categorized by UI pages. Scroll further for details.  
Note: **For all endpoints listed, prepand `/api[/v1]` (version is optional)**

#### Changes
- rev1: Formatted every entry so it's easier to read all requests and responses
- rev2: Added "title" to simple level and level data structures
- rev3: Changed "parents" to "parent" for simple level and level data structures, and only allow singular parent
- rev4: Changed "transitions" for Turing Machine data structure to use strongly typed objects
- rev5: Added initial position for Turing Machine heads
- rev6: Added "ui" to Turing Machine for rendering consistent UI across clients
- rev7: Changed "ui.labels" to "ui.nodes" in TM to store more info
- rev8:
	- Changed "tapes[].values" to "tapes[].value" in TM, which now stores just a string instead of array of strings
	- Added optional "tapes[].input" and "tapes[].output" booleans in TM, indicating whether a tape is input or output
	- Added optional "machines[].ui.nodes[].final" boolean, indicating whether a node is final (UI only)
	- Added "machines[].start" number, indicating starting node of the machine
	- Added "statements[].lines" array of vectors, defining the look of the edge arrow (UI)
	- Added "machines[].ui.color" number, defining the color of the machine

### Landing
- GET `/getserverresponse` (or `/ping`)
- GET `/validate`
- GET `/progress`

### Login
- GET `/pubkey`
- POST `/login`
- POST `/register`

### Level Select
- GET `/levels`
- GET `/level/:id`

### Designer
- POST `/level/:id`
- POST `/save`
- POST `/upload`
- GET `/import/:id`

## Encryptions
### RSA
HTTPS is not guaranteed. RSA encryption is used.

Server has an endpoint for public key. If a request uses access token in the header, the access token will be RSA-encrypted.

Encryption is also used specifically used for `/register`.

### Salt
Salt is used for hashing the password during `/login`.

## Data Structures
### Turing Machine
```json
{
  "tapes": [
    { "type": "infinite", "input": true }, // input
    { "type": "infinite", "output": true }, // output
    { // storage tapes (can have more)
      "type": "left_limited",
      "value": "a" // initial value of storage tape
    }
  ],
  "machines": [
    {
      "transitions": [ // transition table
				{
					"source": 0,
					"target": 1,
					"statements": [
						{ "read": "a", "write": "b", "move": 2 } // read a, write b, move to right by 2
						{ "read": "_", "write": "b", "move": -1 } // read blank, write b, move to left by 1
					],
					"lines": [[50, 0], [0, 50]] // (UI) intermediate lines of the edge
				}
      ],
      "heads": [ // heads, with their type and tape ref
        { "type": "r", "tape": 0, "position": 2 }, // type can be r, w or rw. tape is the index of top-level `tapes`. position is the initial position of the head
        { "type": "rw", "tape": 0, "position": -1 }
      ],
			"start": 0,
			"ui": {
				"title": "title of the machine",
				"color": 16777215, // color of the machine in RGB
				"boxes": [{ "start": [0, 0], "size": [20, 50], "color": 16777216 }], // rectangles for grouping states
				"texts": [{ "pos": [10, 20], "value": "textbox string" }], // text boxes for labelling
				"nodes": [{ "label": "q0", "position": [100, 200] }, { "label": "q1", "position": [150, 250], "final": true }] // labels of vertices
			}
    }
  ]
}
```

### Simple Level (Used in `/levels`)
```json
{
	"id": "level id",
	"title": "level title",
	"description": "short description",
	"parent": "another level id"
}
```

### Level (Used in `/level/:id`)
```json
{
	"id": "level id",
	"title": "level title",
	"description": "long description",
	"parent": "another level id",
	"children": ["another level id"],
	"tests": [
		{
			"input": "test input",
			"output": "test output"
		}
	],
	"constraints": { // all of these fields are optional. if they don't exist, that means they are not restricted
		"states": { "min": 1, "max": 10 },
		"transitions": { "min": 0, "max": 10 },
		"tapes": { "min": 1, "max": 2 },
		"heads": { "min": 1, "max": 3 },
		"tapeTypes": ["infinite", "circular"] // tape types allowed for ANY tape
	},
	"solved": true, // whether this user has solved this level
	"machine": { /* Turing Machine data structure */ } // the machine this user has last submitted
}
```

## Detailed Descriptions
### Common
**Request**  
If a request requires authentication, the access token is passed using the request header.
```
Authorization: Bearer <RSA encrypted token>
```

If client needs to send data to the server, data is sent using POST body as JSON.

**Response**  
All server responses should be in JSON, with at least the field named `success`, indicating if the server processed the request successfully. `data` field is the returned data for a specific request. For example, a successful GET request of `/validate` will be:
```json
{
	"success": true,
	"data": {
		"valid": true
	}
}
```

If it fails, `success` is obviously `false`, and the server adds an error code `errcode` and error message `errmsg`.
```json
{
	"success": false,
	"errcode": "TOO_MANY_REQUEST",
	"errmsg": "Too many request."
}
```

Returned objects specified after this point is the extra data wanted by the client.

### GET `/getserverresponse`
- Access token: Not required

Ping the server.

No request body.

No response data.

### GET `/validate`
- Access token: Required

Validates the client's access token. Most likely stored inside the browser's LocalStorage.

No request body.

Response data:
- `valid`: Whether the access token is valid or not
```json
{ "valid": true }
```

### GET `/progress`
- Access token: Required

Gather data for client to restore progress if nothing is stored locally, or local data is older than server data.

No request body.

Response data:
- `level`: Level ID if user was in a level
- `machine`: Turing Machine data structure if user was in designer
- `timestamp`: The time this progress is saved
```json
{
	"level": "level_id",
	"machine": { /* Turing Machine data structure */ },
	"timestamp": 12345
}
```

### GET `/pubkey`
- Access token: Not required

Get the public key of the server for RSA encryption.

No request body.

Response data:
- `key`: The RSA public key
```json
{
	"key": "BEGIN_KEY ... END_KEY"
}
```

### POST `/login`
- Access token: Not required

Login and generate an access token.

Request body:
```json
{
	"username": "example",
	"password": "salt-hashed password",
	"salt": "salt for hash"
}
```

Response data:
- `access_token`: Access token for client to make further authorized requests
```json
{
	"accessToken": "token for user"
}
```

### POST `/register`
- Access token: Not required

Register a user with a username, a password and a license.  
Password is RSA-encrypted using server public key obtained from `/pubkey`.

Request body:
```json
{
	"username": "example",
	"password": "rsa-encrypted password",
	"licenseKey": "license key"
}
```

Response data:
- `access_token`: Access token for client to make further authorized requests
```json
{
	"accessToken": "token for user"
}
```

### GET `/levels`
- Access token: Required

Get a list of levels. The list includes level IDs and their connections, which can be used to construct the level tree on client side.

No request body.

Response data:
```json
{
	"levels": [{ /* Simple Level data structure */}]
}
```

### GET `/level/:id`
- Access token: Required
- Parameters:
	- `id`: Level ID

Get the details of a level by ID.

No request body.

Response data:
```json
{
	"level": { /* Level data structure */ }
}
```

### POST `/level/:id`
- Access token: Required
- Parameters:
	- `id`: Level ID

Submit a solution for a level.

Request body:
```json
{
	"machine": { /* Turing Machine data structure */ }
}
```

Response data:
- `correct`: Whether the solution is correct or not
- `rank`: Rank of this solution. 1-indexed
```json
{
	"correct": true,
	"rank": 1
}
```

### POST `/save`
- Access token: Required

Save client's progress to the server.

Request body:
- `level`: Level ID, nullable. If null, means the user is in sandbox mode
- `machine`: Turing Machine data structure, nullable. If null, means the user is in mode selection or reading the level
```json
{
	"level": "level id",
	"machine": { /* Turing Machine data structure */ }
}
```

Response data:
- `timestamp`: Server time of when the progress is saved
```json
{
	"timestamp": 12345
}
```

### POST `/upload`
- Access token: Required

Only usable in sandbox mode (client-side duty). This uploads a Turing Machine to the server and generates a ID for others to import.

Request body:
```json
{
	"machine": { /* Turing Machine data structure */ }
}
```

Response data:
- `id`: Server-generated ID of the Turing Machine. Can be used in `/import/:id`
```json
{
	"id": "machine id"
}
```

### GET `/import/:id`
- Access token: Required
- Parameters:
	- `id`: Turing Machine ID

Only usable in sandbox mode (client-side duty). Imports a Turing Machine uploaded by `/upload` using an ID.

No request body.

Response data:
```json
{
	"machine": { /* Turing Machine data structure */ }
}
```