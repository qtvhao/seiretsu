import { ValidSegmentsExtractor } from "./validSegmentsExtractor";
import { TextSegment } from "./segment";
import { TranscriptSegment } from "./align";

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

    private dynamicallyAdjustTolerance(minTolerance: number): TextSegment[] {
        this.log("🧪 Adjusting tolerance to find valid segments...");
        let tolerance = 0.9;
        let filteredSegments: TextSegment[] = [];

        while (filteredSegments.length === 0 && tolerance >= minTolerance) {
            filteredSegments = this.extractSegmentsWithTolerance(tolerance);
            tolerance = Math.max(minTolerance, parseFloat((tolerance * 0.9).toFixed(3))); // Adjust dynamically
        }

        if (filteredSegments.length === 0) this.log("🚨 No valid segments found.");
        return filteredSegments;
    }

    private computeLevenshtein(sentence: string, segment: TextSegment): number {
        const key = `${sentence}-${segment.rawText}`;
        if (this.levenshteinCache.has(key)) return this.levenshteinCache.get(key)!;

        const distance = segment.computeLevenshteinDistance([sentence]);
        this.levenshteinCache.set(key, distance);
        return distance;
    }

    private findBestSentenceMatch(filteredSegments: TextSegment[]): [string[], string[]] {
        this.log("🔍 Finding best sentence match...");

        if (filteredSegments.length === 0) {
            console.warn("⚠️ No valid transcript segments available.");
            return [[], this.expectedSentences];
        }

        let bestMatchIndex: number | null = null;
        let lowestDistance = Infinity;

        this.expectedSentences.forEach((_, index) => {
            filteredSegments.forEach(segment => {
                const distance = this.computeLevenshtein(this.expectedSentences.slice(0, index + 1).join(" "), segment);
                if (distance < lowestDistance && distance < 20) {
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
                const distance = this.computeLevenshtein(matchedSentences.slice(0, sentenceIndex + 1).join(" "), segment);
                if (distance < lowestDistance && distance < 20) {
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

        const filteredSegments = this.dynamicallyAdjustTolerance(minTolerance);
        if (filteredSegments.length === 0) return [[], null, this.expectedSentences, []];

        const [matchedSentences, remainingSentences] = this.findBestSentenceMatch(filteredSegments);
        if (matchedSentences.length === 0) return [[], null, remainingSentences, []];

        const [bestMatchSegments, lastMatchedSegmentTime] = this.findOptimalMatchingSegments(filteredSegments, matchedSentences);

        return [bestMatchSegments, lastMatchedSegmentTime, remainingSentences, matchedSentences];
    }
}
