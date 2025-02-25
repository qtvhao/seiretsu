import { ValidSegmentsExtractor } from "./validSegmentsExtractor.js";
import { TextSegment } from "./segment.js";
import { TranscriptSegment } from "./align.js";
import levenshtein from 'fast-levenshtein';

export class BestSentenceMatcher {
    private transcriptEntries: TextSegment[];
    private expectedSentences: string[];
    private levenshteinCache: Map<string, number>;
    private debugMode: boolean;

    constructor(transcriptEntries: TranscriptSegment[], expectedSentences: string[], debugMode = false) {
        this.debugMode = debugMode;
        this.levenshteinCache = new Map();

        this.log("🛠️ Initializing BestSentenceMatcher...");

        this.transcriptEntries = transcriptEntries.map(segment => new TextSegment(
            segment.text,
            segment.words || [],
            segment.start,
            segment.end
        ));

        this.expectedSentences = expectedSentences;

        this.log(`✅ Initialized with ${transcriptEntries.length} transcript segments and ${expectedSentences.length} reference sentences.`);
    }

    private log(message: string): void {
        if (this.debugMode) console.log(message);
    }

    private extractSegmentsWithTolerance(tolerance: number): TextSegment[] {
        return new ValidSegmentsExtractor(tolerance).extractValidSegments(this.transcriptEntries);
    }

    private getLastNWords(texts: string[], n: number): string {
        return texts.join(' ').replace(/\s+/g, ' ').trim().split(' ').slice(-n).join(' ');
    }
    
    private computeLevenshtein(texts1: string[], texts2: string[], wordLimit: number = 12): number {
        const str1 = this.getLastNWords(texts1, wordLimit);
        const str2 = this.getLastNWords(texts2, wordLimit);
        const distance = levenshtein.get(str1, str2);
        if (distance < 10) {
            console.log({str1, str2, distance})
        }

        return distance;
    }

    public findBestSentenceMatch(filteredSegments: TextSegment[]): [string[], string[]] {
        this.log("🔍 Finding best sentence match...");

        if (filteredSegments.length === 0) {
            console.warn("⚠️ No valid transcript segments available.");
            return [[], this.expectedSentences];
        }

        let bestMatchIndex: number | null = null;
        let lowestDistance = Infinity;

        this.expectedSentences.forEach((_, index) => {
            filteredSegments.forEach((_, segmentIndex) => {
                const distance = this.computeLevenshtein(this.expectedSentences.slice(0, index + 1), filteredSegments.slice(0, segmentIndex + 1).map(a=>a.rawText))
                if (distance <= lowestDistance && distance < 20) {
                    lowestDistance = distance;
                    bestMatchIndex = index;
                }
            });
        });

        if (bestMatchIndex !== null) {
            this.log(`🎯 Best match found at index ${bestMatchIndex} with Levenshtein distance ${lowestDistance.toFixed(2)}`);
            return [
                this.expectedSentences.slice(0, bestMatchIndex + 1),
                this.expectedSentences.slice(bestMatchIndex + 1),
            ];
        }

        console.warn("⚠️ No matching sentence found.");
        return [[], this.expectedSentences];
    }

    private findOptimalMatchingSegments(filteredSegments: TextSegment[], matchedSentences: string[]): [TextSegment[], number | null] {
        this.log("🧩 Identifying best matching transcript segments...");

        let bestMatchSegments: TextSegment[] = [];
        let lastMatchedSegmentTime: number | null = null;
        let lowestDistance = Infinity;

        filteredSegments.forEach((segment, index) => {
            matchedSentences.forEach((_, sentenceIndex) => {
                const distance = this.computeLevenshtein(matchedSentences.slice(0, sentenceIndex + 1), filteredSegments.slice(0, index + 1).map(segment => segment.rawText));
                if (distance <= lowestDistance && distance < 20) {
                    lowestDistance = distance;
                    bestMatchSegments = filteredSegments.slice(0, index + 1);
                    lastMatchedSegmentTime = bestMatchSegments[bestMatchSegments.length - 1].endTime;
                }
            });
        });

        this.log(`✅ Best segment match found with distance ${lowestDistance.toFixed(2)}`);
        return [bestMatchSegments, lastMatchedSegmentTime];
    }

    public findBestMatch(minTolerance: number): [TextSegment[], number | null, string[], string[]] {
        this.log("🚀 Starting segment match process...");
        
        let tolerance = 0.5;
        let filteredSegments: TextSegment[] = [];
        let matchedSentences: string[] = [];
        let remainingSentences: string[] = [];
    
        while (tolerance >= minTolerance) {
            filteredSegments = this.extractSegmentsWithTolerance(tolerance);
            
            if (filteredSegments.length > 0) {
                [matchedSentences, remainingSentences] = this.findBestSentenceMatch(filteredSegments);
                if (matchedSentences.length > 0) {
                    break; // Valid match found, exit loop
                }
            }
    
            tolerance = parseFloat((tolerance * 0.9).toFixed(3));
        }
    
        if (matchedSentences.length === 0) {
            this.log("🚨 No valid segments found.");
            return [[], null, this.expectedSentences, []];
        }
    
        const [bestMatchSegments, lastMatchedSegmentTime] = this.findOptimalMatchingSegments(filteredSegments, matchedSentences);

        return [bestMatchSegments, lastMatchedSegmentTime, remainingSentences, matchedSentences];
    }
}
