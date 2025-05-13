# Proposal from NW for server API endpoints needed for client
Top is a list of all endpoints categorized by UI pages. Scroll further for details.  
Note: **For all endpoints listed, prepand `/api[/v1]` (version is optional)**

#### Changes
Current revision: 11
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
- rev9:
	- Changed TM structure to match server structure
	- Changed primative data type in requests to be sent using parameters
- rev10:
	- Changed response of POST `/level` to return rank in percentage
	- Added GET `/stat` to obtain the stat of user's last submission
- rev11: Changed response formats to match backend design

### Landing
- GET `/try-get-response` (or `/ping`)
- GET `/validate`
- GET `/progress`

### Login
- GET `/get-rsa-key`
- POST `/login`
- POST `/register`

### Level Select
- GET `/levels`
- GET `/level`

### Designer
- POST `/level`
- POST `/save`
- POST `/upload`
- GET `/import`
- GET `/stat`

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
    { "type": "Infinite", "isInput": true }, // input
    { "type": "Infinite", "isOutput": true }, // output
    { // storage tapes (can have more)
      "type": "LeftLimited",
      "values": "a" // initial value of storage tape
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
					"transitionLineSteps": [{ "x": 50, "y": 0 }, { "x": 0, "y": 50 }] // (UI) intermediate lines of the edge
				}
      ],
      "heads": [ // heads, with their type and tape ref
        { "type": "Read", "tape": 0, "position": 2 }, // type can be r, w or rw. tape is the index of top-level `tapes`. position is the initial position of the head
        { "type": "ReadWrite", "tape": 0, "position": -1 }
      ],
			"startNode": 0,
			"label": {
				"title": "title of the machine", // nullable
				"color": 16777215, // color of the machine in RGB
				"boxes": [ // rectangles for grouping states
					{ "start": { "x": 0, "y": 0 }, "size": { "x": 20, "y": 50 }, "color": 16777216 }
				],
				"texts": [ // text boxes for labelling
					{ "position": { "x": 10, "y": 20 }, "value": "textbox string" }
				],
				"nodes": [ // labels of vertices
					{ "label": "q0", "position": { "x": 100, "y": 200 } },
					null, // this node is deleted
					{ "position": { "x": 150, "y": 250 }, "final": true }
				]
			}
    }
  ]
}
```

### Simple Level (Used in GET `/levels`)
```json
{
	"levelID": 1, // ID in number
	"title": "level title",
	"description": "short description",
	"parent": 0
}
```

### Level (Used in GET `/level`)
```json
{
	"levelID": 1,
	"title": "level title",
	"description": "long description",
	"parents": [0],
	"children": [2, 3, 4],
	"testCases": [
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
		"tapeTypes": ["Infinite", "Circular"] // tape types allowed for ANY tape
	},
	"solved": true, // whether this user has solved this level
	"design": { /* Turing Machine data structure */ } // the machine this user has last submitted
}
```

## Detailed Descriptions
### Common
**Request**  
If a request requires authentication, the access token is passed as a parameter.
`http://<host>:<port>/api/validate?accessToken=<rsa-encrypted-token>`

If client needs to send data to the server, all primative data types are sent as parameters, while nested objects are sent using POST body as JSON.

**Response**  
All server responses should be in JSON, with at least the field named `status`, indicating if the server processed the request successfully. `result` field is the returned data for a specific request. For example, a successful GET request of `/get-rsa-key` will be:
```json
{
	"time": "2025-05-11T12:39:35.7173549+08:00",
	"status": "SUCCESS",
	"result": "-----BEGIN RSA PUBLIC KEY-----..."
}
```

If it fails, `status` is the error code, and the server provides a stack trace in `responseStackTraces`.
```json
{
  "time": "2025-05-11T12:06:17.4154906+08:00",
	"status": "DESIGN_NOT_FOUND",
	"responseStackTraces": "Stack trace"
}
```

Returned objects specified after this point is the extra data wanted by the client.

### GET `/try-get-response`
- Access token: Not required

Ping the server.

No request body.

No response data.

### GET `/validate`
- Access token: Required

Validates the client's access token. Most likely stored inside the browser's LocalStorage.

No request body.

Response data:  
No extra response data. `status` will indicate whether it is valid.

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
	"level": 255, // 255 is a placeholder level
	"machine": { /* Turing Machine data structure */ },
	"timestamp": 12345
}
```

### GET `/get-rsa-key`
- Access token: Not required

Get the public key of the server for RSA encryption.

No request body.

Response data:
- A string that is the RSA public key

### POST `/login`
- Access token: Not required

Login and generate an access token.

Request parameters:
- `username`
- `hashedPassword`: A salt-hashed password
- `salt`: Salt used for hashing

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
Password is RSA-encrypted using server public key obtained from `/get-rsa-key`.

Request parameters:
- `username`
- `rsaEncryptedPassword`: RSA-encrypted password
- `licenseKey`: License key for registration

Response data:  
String. Access token for client to make further authorized requests

### GET `/levels`
- Access token: Required

Get a list of levels. The list includes level IDs and their connections, which can be used to construct the level tree on client side.

No request body.

Response data:
```json
[{ /* Simple Level data structure */}]
```

### GET `/level`
- Access token: Required

Get the details of a level by ID.

Request parameter:
- `levelID`

Response data:
```json
{ /* Level data structure */ }
```

### POST `/level`
- Access token: Required

Submit a solution for a level.

Request parameters:
- `levelID`
- `operations`: Amount of operations for all the cases

Request body:
- A Turing Machine data structure

Response data:  
Ranks of individual parts of the machine.
```json
{
	"transitions": { "rank": 1, "max": 10 }, // 1 out of 10,
	"states": { "rank": 2, "max": 10 }, // 2 out of 10
	"heads": { "rank": 4, "max": 10 }, // 4 out of 10
	"tapes": { "rank": 4, "max": 10 }, // 4 out of 10
	"operations": { "rank": 8, "max": 10 } // 8 out of 10
}
```

### POST `/save`
- Access token: Required

Save client's progress to the server.

Request parameter:
- `levelID`: Level ID, nullable. If null, means the user is in sandbox mode
Request body:
```json
{ /* Turing Machine data structure */ }
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
{ /* Turing Machine data structure */ }
```

Response data:
- `id`: Server-generated ID of the Turing Machine. Can be used in `/import?designID=1234`
```json
{
	"id": "machine id"
}
```

### GET `/import`
- Access token: Required

Only usable in sandbox mode (client-side duty). Imports a Turing Machine uploaded by `/upload` using an ID.

Request parameter:
- `designID`: Turing Machine ID

Response data:
```json
{ /* Turing Machine data structure */ }
```

### GET `/stat`
- Access token: Required

Returns the ranking of the user's last submitted machine of a level.

Request parameter:
- `levelID`

Response data:  
Ranks of individual parts of the machine.
```json
{
	"transitions": { "rank": 1, "max": 10 }, // 1 out of 10,
	"states": { "rank": 2, "max": 10 }, // 2 out of 10
	"heads": { "rank": 4, "max": 10 }, // 4 out of 10
	"tapes": { "rank": 4, "max": 10 }, // 4 out of 10
	"operations": { "rank": 8, "max": 10 } // 8 out of 10
}
```