export class WriteOperation {
    Position: number;
    Content: string;
    MachineID: number;
    HeadID: number;

    constructor(position: number, content: string, machineID: number, headID: number)
    {
        this.Position = position;
        this.Content = content;
        this.MachineID = machineID;
        this.HeadID = headID;
    }
}