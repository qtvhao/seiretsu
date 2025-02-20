import levenshtein from 'fast-levenshtein';
import { WordData, TranscriptSegment } from './align';

const WORD_SNIPPET_LIMIT = 12;

export class Segment {
    segmentText: string;
    startTime: number;
    endTime: number;
    wordList: WordData[];
    segmentList: TranscriptSegment[];
    lastWordsSnippet: string;
    lastWordsCount: number;

    constructor(segmentText: string, endTime: number, startTime: number, wordList: WordData[] = [], segmentList: TranscriptSegment[] = []) {
        if (!Array.isArray(segmentList)) {
            throw new Error("segmentList must be an array.");
        }
        this.segmentList = segmentList;

        this.segmentText = segmentText;
        this.endTime = endTime;
        this.startTime = startTime;
        this.wordList = wordList;

        // Normalize and extract the last snippet of words
        const wordsArray = segmentText.split(/\s+/);
        this.lastWordsSnippet = wordsArray.slice(-WORD_SNIPPET_LIMIT).join(" ");
        this.lastWordsCount = this.lastWordsSnippet.split(/\s+/).length;
    }

    calculateDistance(sentenceList: string[]): number {
        const fullSentence = sentenceList.join(" ").trim().toLowerCase();
        const sentenceWords = fullSentence.split(/\s+/);
        
        // Extract the last `lastWordsCount` words from the sentence
        const lastSentenceSnippet = sentenceWords.slice(-this.lastWordsCount).join(" ");
        
        return levenshtein.get(this.lastWordsSnippet.toLowerCase(), lastSentenceSnippet);
    }
}
