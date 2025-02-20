import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

// Define response types
interface WordData {
    word: string;
    start: number;
    end: number;
    probability: number;
}

interface TranscriptSegment {
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

// Utility functions
const isValidSpeechWord = (text: string): boolean => {
    const isSpeechWord = !/^[^a-zA-Z0-9]+$/.test(text);
    if (!isSpeechWord) {
        console.log('Invalid Speech Word:', { text });
    }
    return isSpeechWord;
};

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

const handleError = (error: any): void => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        } else if (error.request) {
            console.error('No response received from API:', error.request);
        }
    } else {
        console.error('Unexpected Error:', (error as Error).message);
    }
};

export const align = async (audioFilePath: string, transcriptFilePath: string): Promise<void> => {
    if (!areFilesAvailable(audioFilePath, transcriptFilePath)) return;
    
    const formData = prepareFormData(audioFilePath, transcriptFilePath);
    const segments = await uploadAudioFile(formData);
};
