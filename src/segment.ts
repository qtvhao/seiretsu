import levenshtein from 'fast-levenshtein';
import { WordData } from './align';
import { stripMarkdownFormatting } from './utils'

const MAX_SNIPPET_WORDS = 12;

export class TextSegment {
    rawText: string;
    snippetWordCount: number;
    wordTokens: string[];
    words: WordData[];
    startTime: number;
    endTime: number;
    avgProbability: number;

    constructor(rawText: string, words: WordData[], startTime: number, endTime: number) {
        this.startTime = startTime
        this.endTime = endTime
        this.rawText = stripMarkdownFormatting(rawText);
        this.words = words;

        // Normalize and extract the last snippet of words
        this.wordTokens = this.rawText.toLowerCase().split(/\s+/).slice(-MAX_SNIPPET_WORDS);
        this.snippetWordCount = this.wordTokens.join(" ").split(/\s+/).length;
        this.avgProbability = this.calculateAverageProbability();
    }

    // Method to calculate average probability
    private calculateAverageProbability(): number {
        if (this.words.length === 0) return 0;
        return +(this.words.reduce((sum, word) => sum + (word.probability || 0), 0) / this.words.length).toFixed(3);
    }
    computeLevenshteinDistance(referenceSentences: string[]): number {
        const normalizedReference = referenceSentences.join(" ").trim().toLowerCase();
        const referenceWords = stripMarkdownFormatting(normalizedReference).split(/\s+/);

        const relevantWordCount = Math.min(referenceWords.length, this.snippetWordCount);
        
        // Extract the last snippet
        const referenceSnippet = referenceWords.slice(-relevantWordCount).join(" ");
        const segmentSnippet = this.wordTokens.slice(-relevantWordCount).join(" ");

        return levenshtein.get(segmentSnippet, referenceSnippet, {
            useCollator: true
        });
    }
}
