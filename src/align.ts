import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import crypto from 'crypto';
import * as stream from 'stream';
import path from 'path';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Define response types
export interface WordData {
    word: string;
    start: number;
    end: number;
    probability: number;
}

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
    words: WordData[];
}

interface AlignmentResponse {
    alignment: {
        segments: TranscriptSegment[];
    };
}

const CACHE_DIR = 'cache';

// Ensure cache directory exists
const ensureCacheDirExists = () => {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
};

// Generate a unique cache filename based on content hash
const generateCacheKey = (audioFilePath: string, transcription: string): string => {
    return crypto.createHash('md5').update(audioFilePath + transcription).digest('hex');
};

// Retrieve cached result from cache directory
const getCachedResult = (cacheKey: string): { segments: TranscriptSegment[] } | null => {
    ensureCacheDirExists();
    
    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    if (!fs.existsSync(cacheFilePath)) return null;

    try {
        const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
        return cacheData;
    } catch (error) {
        console.error(`Error reading cache file: ${cacheFilePath}`, error);
        return null;
    }
};

// Store result in a separate cache file
const cacheResult = (cacheKey: string, data: { segments: TranscriptSegment[] }): void => {
    ensureCacheDirExists();

    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.json`);

    try {
        fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Cached result saved: ${cacheFilePath}`);
    } catch (error) {
        console.error(`Error writing to cache file: ${cacheFilePath}`, error);
    }
};

const areFilesAvailable = (audioFilePath: string): boolean => {
    if (!fs.existsSync(audioFilePath)) {
        console.error('Error: Missing required audio file.');
        return false;
    }
    return true;
};

const prepareFormData = (audioFilePath: string, transcription: string): FormData => {
    if (!fs.existsSync(audioFilePath)) {
        throw new Error(`File not found: ${audioFilePath}`);
    }

    const audioStream: fs.ReadStream = fs.createReadStream(audioFilePath);
    const textBuffer = Buffer.from(transcription, 'utf-8');
    const textStream = new stream.PassThrough();
    textStream.end(textBuffer);

    const formData = new FormData();
    formData.append('audio_file', audioStream);
    formData.append('text', textStream, { filename: 'transcription.txt', contentType: 'text/plain' });

    return formData;
};

const uploadAudioFile = async (formData: FormData): Promise<TranscriptSegment[]> => {
    try {
        const response = await axios.post<AlignmentResponse>('http://localhost:5000/align', formData, {
            headers: {
                ...formData.getHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data || !response.data.alignment) {
            throw new Error("Invalid API response format.");
        }

        return response.data.alignment.segments;
    } catch (error: any) {
        handleError(error);
        throw new Error("Failed to upload and process the audio file.");
    }
};

const handleError = (error: unknown): void => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        } else if (error.request) {
            console.error('No response received from API:', error.request);
        } else {
            console.error('Axios Error:', error.message);
        }
    } else if (error instanceof Error) {
        console.error('Unexpected Error:', error.message);
    } else {
        console.error('An unknown error occurred:', error);
    }
};

const getAudioDuration = async (audioFilePath: string): Promise<number> => {
    try {
        const { stdout } = await execPromise(`ffprobe -i "${audioFilePath}" -show_entries format=duration -v quiet -of csv="p=0"`);
        return parseFloat(stdout.trim());
    } catch (error) {
        throw new Error("Failed to get audio duration");
    }
};

const trimAudioFile = async (inputPath: string, outputPath: string, start: number, duration: number): Promise<string> => {
    try {
        await execPromise(`ffmpeg -i "${inputPath}" -ss ${start} -t ${duration} -c copy "${outputPath}"`);
        return outputPath;
    } catch (error) {
        throw new Error("Failed to trim audio file");
    }
};

export const align = async (audioFilePath: string, transcription: string): Promise<{ segments: TranscriptSegment[] }> => {
    if (!areFilesAvailable(audioFilePath)) {
        throw new Error("Audio file not found");
    }

    let processedAudioFilePath = audioFilePath;
    // If we don't cut the audio, it take 8m12.332s
    // If we cut the audio, it takes 4m37.843s on the same hardware
    const duration = await getAudioDuration(audioFilePath);
    if (duration > 20) {
        const tmpFilePath = join(tmpdir(), `trimmed-${Math.random()}.wav`);
        processedAudioFilePath = await trimAudioFile(audioFilePath, tmpFilePath, 0, 20);
    }

    const cacheKey = generateCacheKey(processedAudioFilePath, transcription);
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
        console.log("Returning cached result...");
        return cachedResult;
    }

    const formData = prepareFormData(processedAudioFilePath, transcription);

    try {
        const segments = await uploadAudioFile(formData);
        const result = { segments };

        cacheResult(cacheKey, result);
        return result;
    } catch (error) {
        throw new Error(`Failed to upload audio file`);
    }
};
