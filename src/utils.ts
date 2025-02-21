import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execPromise = promisify(exec);

export function stripMarkdownFormatting(inputText: string): string {
    return inputText
        .replace(/`(.*?)`/g, "$1") // Inline code
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Links: [text](url) → text
        .replace(/#+\s*(.*)/g, "$1") // Headers: # Header → Header
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold: **bold** → bold
        .replace(/__(.*?)__/g, "$1") // Bold: __bold__ → bold
        .replace(/\*(.*?)\*/g, "$1") // Italic: *italic* → italic
        .replace(/_(.*?)_/g, "$1") // Italic: _italic_ → italic
        .trim();
}

export function splitMarkdown(text: string): string[] {
    return text.split(/\n|(?<=[.,!?;:])\s*/g).filter(Boolean);
}


export async function cutAudioFile(audioFile: string, start: number, end?: number): Promise<string> {
    if (!fs.existsSync(audioFile)) {
        throw new Error("Audio file does not exist.");
    }

    const outputFile = `cuts/trimmed_${Date.now()}.mp3`; // Change format as needed
    const endOption = end !== undefined ? `-to ${end}` : "";

    const command = `ffmpeg -i "${audioFile}" -ss ${start} ${endOption} -c copy "${outputFile}"`;

    try {
        await execPromise(command);
        return outputFile;
    } catch (error) {
        throw new Error(`Error processing audio: ${(error as Error).message}`);
    }
}
