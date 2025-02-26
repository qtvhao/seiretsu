import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import path from "path";
import os from "os";

const execPromise = promisify(exec);

export function stripMarkdownFormatting(inputText: string): string {
    return inputText
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        // Replace colon at the end of a line with a period
        .replace(/:\s*\n/g, ".\n")
        // Replace exclamation mark at the end of a line with a period
        .replace(/!\s*\n/g, ".\n")
        .replace(/\:\s*\n/g, ".\n")
        .replace(/([^\.\n])\s*\n/g, "$1.\n")
        .replace(/`(.*?)`/g, "$1") // Inline code
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Links: [text](url) → text
        .replace(/#+\s*(.*)\s*\n/g, "$1\n") // Headers: # Header → Header
        .replace(/-\s*(.*)\n/g, "$1\n") // 
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold: **bold** → bold
        .replace(/__(.*?)__/g, "$1") // Bold: __bold__ → bold
        .replace(/\*(.*?)\*/g, "$1") // Italic: *italic* → italic
        .replace(/_(.*?)_/g, "$1") // Italic: _italic_ → italic
        .replace(/(\d+)\. /g, "$1 ")
        .trim();
}

export function splitMarkdown(text: string): string[] {
    return text.split(/\n|(?<=[.!?;])\s*/g).filter(Boolean);
}


export async function cutAudioFile(audioFile: string, start: number, end?: number): Promise<string> {
    // Create a unique temporary file path
    const tempDir = os.tmpdir();

    if (!fs.existsSync(audioFile)) {
        throw new Error("Audio file does not exist.");
    }

    // Determine the file extension
    const fileExtension = path.extname(audioFile).toLowerCase();
    if (!['.aac', '.wav', '.mp3'].includes(fileExtension)) {
        throw new Error("Unsupported audio format. Only AAC, WAV, and MP3 are supported.");
    }

    const durationCommand = `ffprobe -i "${audioFile}" -show_entries format=duration -v quiet -of csv="p=0"`;
    let duration: string;
    try {
        const { stdout } = await execPromise(durationCommand);
        duration = parseFloat(stdout.trim()).toFixed(2).padStart(6, '0');
    } catch (error) {
        throw new Error(`Error retrieving audio duration: ${(error as Error).message}`);
    }

    const endOption = end !== undefined ? `-to ${end}` : "";
    const outputFile = path.join(tempDir, `trimmed_${Date.now()}_${duration}_${start}_${end ?? "end"}${fileExtension}`);
    
    let codecOption = "-c copy";
    if (fileExtension === ".aac") {
        codecOption = "-c:a aac -b:a 128k"; // Ensure proper AAC encoding
    } else if (fileExtension === ".wav") {
        codecOption = "-c:a pcm_s16le"; // Ensure WAV encoding is correct
    }
    
    const command = `ffmpeg -i "${audioFile}" -ss ${start} ${endOption} ${codecOption} -vn "${outputFile}"`;

    try {
        await execPromise(command);
        return outputFile;
    } catch (error) {
        throw new Error(`Error processing audio: ${(error as Error).message}`);
    }
}
