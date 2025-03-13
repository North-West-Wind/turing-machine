# SQL
The SQL we uses is a Microsoft SQL. The SQL is currently online at `*************.******.legendsofsky.com`. Access information can be obtained in the development group.

To access the MS SQL, find a software that can login and manage a SQL. Using `SQL Server Management Studio` is prefered, but other SQL managment software also works. Open your login page and configurate everything like below:

Attribute       | Content
----------------|--------------------
Server Type     | Database engine
Server Name     | `*************.******.legendsofsky.com`
Authentication  | SQL Server authentication
Login/User name | TuringMachineDev
Password        | `********`
Credential      | Optional/False

## Database Schemas
The overall data has splited into 5 schemas. The Machine schema is responsible for storing Turing Machine for import and export. The Level schema is responsible for storing level information and test cases. This schema is separated from user progress to allow level creators to modification, add or remove levels easily. The User schema is responsible for storing user informations. This schema is isolated from the user progress to allow admins to ban users, but without premission to influencing their progress and their machine design. The Progress schema is reponsible to relate Machine schema and User schema together with other necessary information attached. The UI schema is reponsible to store UI informations. This part has been seperated from the Machine design to avoid any UI updates to influence any existing machine designs.

### Machine Schema
#### MachineDesigns
Name     | Type             | Nullable
---------|------------------|----------
DesignID | uniqueidentifier | No

#### Tapes
Name      | Type             | Nullable
----------|------------------|----------
DesignID  | uniqueidentifier | No
TapeIndex | tinyint          | No
TapeType  | tinyint          | No
TapeValue | text             | Yes
TapeID    | uniqueidentifier | No

#### Machines
Name      | Type             | Nullable
----------|------------------|----------
DesignID  | uniqueidentifier | No
MachineID | uniqueidentifier | No

#### Heads
Name               | Type             | Nullable
-------------------|------------------|----------
MachineID          | uniqueidentifier | No
IsReadable         | bit              | No
IsWriteable        | bit              | No
TapeReferenceIndex | tinyint          | No
Position           | smallint         | No

#### Transitions
Name         | Type             | Nullable
-------------|------------------|----------
MachineID    | uniqueidentifier | No
Source       | tinyint          | No
Target       | tinyint          | No
TransitionID | uniqueidentifier | No

#### TransitionStatements
Name           | Type             | Nullable
---------------|------------------|----------
TransitionID   | uniqueidentifier | No
StatementIndex | tinyint          | No
Read           | char(1)          | No
Write          | char(1)          | No
Move           | smallInt         | No


### Level Schema
#### LevelInfos
Name                        | Type             | Nullable
----------------------------|------------------|----------
Title                       | nchar(255)       | No
Description                 | text             | No
HasStateLimit               | bit              | No
MaxState                    | tinyint          | Yes
MinState                    | tinyint          | Yes
HasTransitionLimit          | bit              | No
MaxTransition               | tinyint          | Yes
MinTransition               | tinyint          | Yes
HasTapeLimit                | bit              | No
MaxTape                     | tinyint          | Yes
MinTape                     | tinyint          | Yes
HasHeadLimit                | bit              | No
MaxHead                     | tinyint          | Yes
MinHead                     | tinyint          | Yes
AllowInfiniteTape           | bit              | No
AllowLeftLimitedTape        | bit              | No
AllowRightLimitedTape       | bit              | No
AllowLeftRightLimitedTape   | bit              | No
AllowCircularTape           | bit              | No
LevelID                     | tinyint          | No

#### LevelRelationships
Name        | Type    | Nullable
------------|---------|----------
ChildLevel  | tinyint | No
ParentLevel | tinyint | No

#### TestCases
Name          | Type        | Nullable
--------------|-------------|----------
TestCaseIndex | tinyint     | No
Input         | varchar(64) | No
Output        | varchar(64) | No
LevelID       | tinyint     | No


### User Schema
#### Users
Name            | Type             | Nullable
----------------|------------------|----------
UserName        | char(32)         | No
Password        | char(32)         | No
LicenseKey      | uniqueidentifier | No
AccessToken     | char(32)         | Yes
TokenExpireTime | datetime2        | Yes
UUID            | uniqueidentifier | No

#### LicenseKeys
Name       | Type             | Nullable
-----------|------------------|----------
UUID       | uniqueidentifier | No
LicenseKey | uniqueidentifier | No


### Progress Schema
#### LevelProgress
Name     | Type             | Nullable
---------|------------------|----------
UUID     | uniqueidentifier | No
LevelID  | tinyint          | No
IsSolved | bit              | No
DesignID | uniqueidentifier | Yes


### UI Schema
#### MachineLabel
Name           | Type             | Nullable
---------------|------------------|----------
MachineID      | uniqueidentifier | No
Title          | text             | No
MachineLabelID | uniqueidentifier | No

#### MachineBoxLabel
Name           | Type             | Nullable
---------------|------------------|----------
MachineLabelID | uniqueidentifier | No
StartX         | int              | No
StartY         | int              | No
Width          | smallint         | No
Height         | smallint         | No
Color          | int              | No

#### NodeLabel
Name           | Type             | Nullable
---------------|------------------|----------
MachineLabelID | uniqueidentifier | No
Label          | text             | No
PosX           | int              | No
PosY           | int              | No

#### TextLabel
Name           | Type             | Nullable
---------------|------------------|----------
MachineLabelID | uniqueidentifier | No
PosX           | int              | No
PosY           | int              | No
Value          | Text             | No