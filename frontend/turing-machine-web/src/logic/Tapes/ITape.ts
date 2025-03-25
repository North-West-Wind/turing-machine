import { TapeTypes } from "./TapeTypes"

export interface ITape 
{
    LeftBoundary: number;
    RightBoundary: number;
    Type: TapeTypes; // Allow UIs to know which tape it is and render it correctly.

    /**
     * Checks whether the position is out of the tape.
     * @returns Return true if the position lies outside the boundaries, false otherwise.
     * @remarks Be careful, the logic is reversed.
     */
    IsOutOfRange(position: number): boolean;

    /**
     * Reads a cell on the tape.
     * @param position The position of the cell. Position can be negatives.
     * @returns The content of the given cell. It must be a single character.
     * @throws {RangeError} when reading out of range.
     */
    Read(position: number): string;

    /**
     * Tries to read a cell on the tape.
     * @param position The position of the cell. Position can be negatives.
     * @returns A boolean value indicating success or not. If yes, returns the content.
     */
    TryRead(position: number): {success: boolean; content: string | null};

    /**
     * Schedules a write into a cell on the tape.
     * @param position The position of the cell. Position can be negatives.
     * @param content The write content. It must be a single character.
     * @param machineID The machine that is going to write.
     * @param headID The machine head that is going to write.
     * @throws {RangeError} when writing out of range or the write content's length is greater than 1.
     * @throws {Error} when multiple writes occur.
     */
    ScheduleWrite(position: number, content: string, machineID: number, headID: number): void;

    /**
     * Updates the tape contents by the scheduled write operations.
     */
    CommitWrite(): void;

    /**
     * Obtains the new position of the moved heads.
     * @param position The position of the cell. Position can be negatives.
     * @param moves The move steps. Moves can be negative.
     * @returns Returns the new position of the head. Can be negative as well.
     */
    GetMovedPosition(position: number, moves: number): number;

    /**
     * Inputs the initial content to the tape. By default, it starts with tape index 0.
     * @param contents The initial content, represented by a string.
     */
    InitializeContent(contents: string): void;

    /**
     * Visually displays the contents with head positions. Not for UI. Implement later.
     */
    //DisplayContent(): void;

    /**
     * Updates the tape boundaries based on the new position of the head in infinite tapes.
     * @param headPosition The current (moved) head position. For dynamically update the boundaries of infinite tapes.
     */
    UpdateBoundaries(headPosition: number): void;

    /**
     * Get the tape contents as a string. For UI.
     */
    GetContentsAsString(): string;
}