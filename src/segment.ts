import levenshtein from 'fast-levenshtein';
import { WordData } from './align';

const MAX_SNIPPET_WORDS = 12;

function stripMarkdownFormatting(inputText: string): string {
    return inputText
        .replace(/`(.*?)`/g, "$1") // Inline code
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Links: [text](url) → text
        .replace(/#+\s*(.*)/g, "$1") // Headers: # Header → Header
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold: **bold** → bold
        .replace(/__(.*?)__/g, "$1") // Bold: __bold__ → bold
        .replace(/\*(.*?)\*/g, "$1") // Italic: *italic* → italic
        .replace(/_(.*?)_/g, "$1") // Italic: _italic_ → italic
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .trim();
}

export class TextSegment {
    rawText: string;
    snippetWordCount: number;
    wordTokens: string[];
    words: WordData[];
    startTime: number;
    endTime: number;

    constructor(rawText: string, words: WordData[], startTime: number, endTime: number) {
        this.startTime = startTime
        this.endTime = endTime
        this.rawText = stripMarkdownFormatting(rawText);
        this.words = words;

        // Normalize and extract the last snippet of words
        this.wordTokens = this.rawText.toLowerCase().split(/\s+/).slice(-MAX_SNIPPET_WORDS);
        this.snippetWordCount = this.wordTokens.join(" ").split(/\s+/).length;
    }

    computeLevenshteinDistance(referenceSentences: string[]): number {
        const normalizedReference = referenceSentences.join(" ").trim().toLowerCase();
        const referenceWords = stripMarkdownFormatting(normalizedReference).split(/\s+/);

        const relevantWordCount = Math.min(referenceWords.length, this.snippetWordCount);
        
        // Extract the last snippet
        const referenceSnippet = referenceWords.slice(-relevantWordCount).join(" ");
        const segmentSnippet = this.wordTokens.slice(-relevantWordCount).join(" ");

        return levenshtein.get(segmentSnippet, referenceSnippet);
    }
}
