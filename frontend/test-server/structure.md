Server:
- GetPublicKey  => ServerResponse
- GetResponse  => ServerResponse

Progress:
- Create <AccessToken> <LevelID>  => ServerResponse<DesignID>
- Get <AccessToken> <LevelID>  => ServerResponse<Progress>
- GetAll <AccessToken> => ServerResponse<Progress[]>
- Update <AccessToken> <LevelID> <IsSolved> [MachineDesign]  => ServerResponse  (Alias to update)

User:
- Register <Username> <Password> <LienceKey>  => ServerResponse<AccessToken>
- Login <Username> <Password> <Salt>  => ServerResponse<AccessToken>
- IncludeDesign <AccessToken> <DesignID>  => ServerResponse
- ValidateToken <AccessToken>  => ServerResponse

LevelTemplate:
- Get <LevelID>  => ServerResponse<LevelTemplate>
- GetAll  => ServerResponse<LevelTemplate[]>
.
LicenseKey:
- Create <count>

MachineDesign:
- Create <AccessToken> <MachineDesign>  => ServerResponse<DesignID>
- Update <AccessToken> <DesignID> <MachineDesign>  => ServerResponse
- Delete <AccessToken> <DesignID>  => ServerResponse
- Get <AccessToken> <DesignID>  => ServerResponse<MachineDesign>


ServerResponse<T> {
    Enum(...): Status
    T?: Result
    DateTime: ResponseTime

    string?: ResponseTrace
}

ServerResponse {
    Enum(...): Status
    DateTime: ResponseTime

    string?: ResponseTrace
}

Progress {
    Guid: UUID // For backend remember it
    byte: LevelID
    DateTime: SubmittedTime
    GUID: DesignID
    bool: IsSolved
}

// Not for frontend
User {
    Guid: UUID

    string: Username
    byte[]: Password

    string: AccessToken
    DateTime: AccessTokenExpireTime // For backend remember it

    Guid: LicenseKey

    Guid[]: SandboxDesigns
}

LevelTemplate {
    byte: LevelID
    char[128]: Title
    string: Descriptions

    byte?: ParentID
    byte[]: ChildrenID

    object[]: Testcases [{
        string: Input
        string: Output
    }]

    object: Constraint {
        short?: MinState
        short?: MaxState
        short?: MinTransition
        short?: MaxTransition
        short?: MinHead
        short?: MaxHead
        short?: MinTape
        short?: MaxTape

        bool: AllowInfinite
        bool: AllowLeftLimited
        bool: AllowRightLimited
        bool: AllowLeftRightLimited
        bool: AllowCircular
    }

    // obtained by query
    int: MinTransitionCount
    int: MinStateCount
    int: MinHeadCount
    int: MinTapeCount
    int: MinOperationCount

    // obtained by query
    int: MaxTransitionCount
    int: MaxStateCount
    int: MaxHeadCount
    int: MaxTapeCount
    int: MaxOperationCount
}

MachineDesign {
    Guid: Author
    byte: levelID // only for backend

    // null when saved for a particular level
    int?: TransitionCount
    short?: StateCount
    short?: HeadCount
    short?: TapeCount
    int?: OperationCount

    object: TapeInfo {
        short: InputTape
        short: OutputTape
        ordered object[]: Tapes [{
            Enum(Infinite/LeftLimited/RightLimited/LeftRightLimited/Circular) TapeType: Type
            string: InitialValues
        }]
    }
    object[]: Machine [{
        object: UI {
            int : Color
            object[]: TransitionLines [{
                object: Source {
                    float: X
                    float: Y
                }
                object[]: Steps [{
                    float: StepX
                    float: StepY
                }]
            }]
            object[]: HighlightBoxes [{
                string: Title
                float: X
                float: Y
                float: Width
                float: Height
                int: Color
            }]
            object[]: TextLabels [{
                float: X
                float: Y
                string: Value
            }]
            ordered object[]: Nodes [{
                short: NodeID
                float: X
                float: Y
                bool: IsFinal
            }]
        }

        object: Machine {
            object[]: Transitions [{
                short: SourceNodeID
                short: TargetNodeID
                object[0~256]: Statements [{
                    short: TapeID
                    char: Read
                    char: Write
                    int: Move
                }]
            }]

            object[]: Heads [{
                short: HeadOrderIndex
                short: TapeID
                Enum(Read/Write/ReadWrite) HeadType: Type
                int: Position
            }]

            short: StartNode
        }
    }]
}