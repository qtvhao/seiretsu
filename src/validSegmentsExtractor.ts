import * as fs from 'fs';
import { TextSegment } from './segment';

export class ValidSegmentsExtractor {
    private readonly probabilityThreshold: number;
    private readonly enableDebugLogging: boolean;

    constructor(probabilityThreshold: number, enableDebugLogging: boolean = false) {
        this.probabilityThreshold = probabilityThreshold;
        this.enableDebugLogging = enableDebugLogging;
    }

    extractValidSegments(segments: TextSegment[]): TextSegment[] {
        const validSegments: TextSegment[] = [];
        let concatenatedText = "";

        for (const segment of segments) {
            if (!this.isSegmentValid(segment) && concatenatedText.replace(/\s/g, "").length >= 3) {
                this.logWithEmoji('🚫 Stopping extraction at first invalid segment');
                break;
            }
            concatenatedText += segment.rawText;
            validSegments.push(segment);
        }

        return validSegments;
    }

    private isSegmentValid(segment: TextSegment): boolean {
        if (ValidSegmentsExtractor.isEndSegment(segment)) {
            return this.logAndReturn(segment, false, '🚧 Rejected: Termination segment');
        }

        if (!segment.words || segment.words.length === 0) {
            return this.logAndReturn(segment, false, '❌ Rejected: No words in segment');
        }

        const avgProbability = segment.avgProbability;
        const textLength = segment.rawText.trim().length;

        if (textLength <= 2 && avgProbability === 0) {
            return this.logAndReturn(segment, true, '✅ Accepted: Special case (short text with zero probability)');
        }

        return this.logAndReturn(segment, avgProbability > this.probabilityThreshold, avgProbability > this.probabilityThreshold ? '✅ Accepted: Probability within threshold' : `❌ Rejected: Probability too low (${avgProbability} ≤ ${this.probabilityThreshold})`);
    }

    static isEndSegment(segment: TextSegment): boolean {
        return segment.endTime === segment.startTime;
    }

    private logAndReturn(segment: TextSegment, result: boolean, message: string): boolean {
        if (this.enableDebugLogging) {
            console.log(`Validation Status: ${message}, Text: '${segment.rawText.trim()}'`);
        }
        return result;
    }

    private logWithEmoji(message: string): void {
        if (this.enableDebugLogging) {
            console.log(message);
        }
    }
}
