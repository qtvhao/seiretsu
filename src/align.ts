import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import crypto from 'crypto';

// Define response types
interface WordData {
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

const areFilesAvailable = (audioFilePath: string, transcriptFilePath: string): boolean => {
    if (!fs.existsSync(audioFilePath) || !fs.existsSync(transcriptFilePath)) {
        console.error('Error: Missing one or both required files.');
        return false;
    }
    return true;
};

const prepareFormData = (audioFilePath: string, transcriptFilePath: string): FormData => {
    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(audioFilePath));
    formData.append('text', fs.createReadStream(transcriptFilePath));
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


const CACHE_FILE = ('align_cache.json');

export const align = async (audioFilePath: string, transcriptFilePath: string): Promise<{ segments: TranscriptSegment[] }> => {
    if (!areFilesAvailable(audioFilePath, transcriptFilePath)) {
        throw new Error("Audio or transcript file not found");
    }

    const cacheKey = generateCacheKey(audioFilePath, transcriptFilePath);
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
        console.log("Returning cached result...");
        return cachedResult;
    }

    const formData = prepareFormData(audioFilePath, transcriptFilePath);

    try {
        const segments = await uploadAudioFile(formData);
        const result = { segments };

        cacheResult(cacheKey, result);
        return result;
    } catch (error) {
        throw new Error(`Failed to upload audio file`);
    }
};

// Generate a unique hash for caching
const generateCacheKey = (audioFilePath: string, transcriptFilePath: string): string => {
    return crypto.createHash('md5').update(audioFilePath + transcriptFilePath).digest('hex');
};

// Retrieve cached result
const getCachedResult = (cacheKey: string): { segments: TranscriptSegment[] } | null => {
    if (!fs.existsSync(CACHE_FILE)) return null;

    try {
        const cache: Record<string, { segments: TranscriptSegment[] }> = JSON.parse(
            fs.readFileSync(CACHE_FILE, 'utf-8')
        );
        return cache[cacheKey] || null;
    } catch (error) {
        console.error("Error reading cache:", error);
        return null;
    }
};

const cache = new Map<string, { segments: TranscriptSegment[] }>();

// Store result in cache
const cacheResult = (cacheKey: string, data: { segments: TranscriptSegment[] }): void => {
    let cache: Record<string, { segments: TranscriptSegment[] }> = {};

    if (fs.existsSync(CACHE_FILE)) {
        try {
            cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as Record<
                string,
                { segments: TranscriptSegment[] }
            >;
        } catch (error) {
            console.error("Error parsing cache file. Resetting cache.");
        }
    }

    cache[cacheKey] = data;

    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
        console.log("Cache updated.");
    } catch (error) {
        console.error("Error writing to cache file:", error);
    }
};
