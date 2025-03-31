/**
 * TS doesn't support built-in string hash function like C# does.
 * Defines a simple custom string hash function.
 * @param str The input string.
 * @returns The hash value of the input string.
 */
export function getStringHash(str: string): number {
    // Choose a large prime seed value to start
    let hash = 5381;

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }

    return hash >>> 0; // Ensure unsigned
}