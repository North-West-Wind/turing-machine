# Frontend Test Server
This is a test server used to test certain client-server communication without the server.

## Usage
1. Change directory to `frontend/test-server`
2. Install dependencies (`npm install`)
3. Copy `assets.example` to `assets`
4. Start server (`npm test`)

## Structure
This server operates on the `assets` directory.

### `assets/levels`
Each `.json` file in this directory is a detailed level template.
The name of the file is the level ID.
This file will be copied to a user's directory (explained later) to store the state of `solved` and `machine`.

### `assets/machines`
Each `.json` file in this directory houses a structure of Turing Machine.
The name of the file is the machine ID.
This is used for sharing levels between users that can be uploaded with `/upload` and imported with `/import/:id`.
```json
{ "machine": { /* Machine object */ } }
```

### `assets/users`
Each `.json` file in this directory is a user.
The name of the file is the username.
```json
{
	"username": "test",
	"hashedPassword": "d74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1" // "pass"
}
```

### `assets/levels.json`
This `.json` file stores the list of simplified level details.
```json
[
	{
		"id": "root",
		"title": "root level",
		"description": "start of all levels"
	},
	{
		"id": "child",
		"title": "a child level",
		"description": "the next level",
		"parent": "root"
	}
]
```