import * as fs from 'fs';
import { TextSegment } from './segment';

export class ValidSegmentsExtractor {
    private readonly probabilityThreshold: number;
    private readonly enableDebugLogging: boolean;

    constructor(probabilityThreshold: number, enableDebugLogging: boolean = false) {
        /**
         * Initializes the ValidSegmentsExtractor with a specified probability threshold.
         * @param probabilityThreshold Minimum allowed average probability for a segment to be considered valid.
         * @param enableDebugLogging Enables detailed logging when set to true.
         */
        this.probabilityThreshold = probabilityThreshold;
        this.enableDebugLogging = enableDebugLogging;
    }

    extractValidSegments(segments: TextSegment[]): TextSegment[] {
        /**
         * Extracts valid segments from the provided list.
         * Stops at the first invalid segment.
         * @param segments List of TextSegment objects.
         * @returns Array of valid segments.
         */
        const validSegments: TextSegment[] = [];

        for (const segment of segments) {
            if (!this.isSegmentValid(segment)) {
                break; // Stop processing at the first invalid segment
            }
            validSegments.push(segment);
        }

        return validSegments;
    }

    private isSegmentValid(segment: TextSegment): boolean {
        /**
         * Determines if a segment is valid based on its probability and text length.
         * @param segment A TextSegment object.
         * @returns True if the segment is valid, otherwise False.
         */
        if (ValidSegmentsExtractor.isEndSegment(segment)) {
            this.logValidation(segment, 'Rejected: Termination segment');
            return false;
        }

        if (!segment.words || segment.words.length === 0) {
            this.logValidation(segment, 'Rejected: No words in segment');
            return false;
        }

        const avgProbability = segment.avgProbability
        const textLength = segment.rawText.trim().length;

        this.logValidationDetails(segment, avgProbability);

        if (textLength <= 2 && avgProbability === 0) {
            this.logValidation(segment, 'Accepted: Special case (short text with zero probability)');
            return true;
        }

        const isValid = avgProbability > this.probabilityThreshold;
        this.logValidation(segment, isValid ? 'Accepted: Probability within threshold' : `Rejected: Probability too low (${avgProbability} ≤ ${this.probabilityThreshold})`);

        return isValid;
    }

    static isEndSegment(segment: TextSegment): boolean {
        /**
         * Checks if a segment is an end/termination segment.
         * @param segment A TextSegment object.
         * @returns True if the segment's startTime is equal to its endTime, otherwise False.
         */
        return segment.endTime === segment.startTime;
    }

    private logValidationDetails(segment: TextSegment, avgProbability: number): void {
        /**
         * Logs validation details for a segment if debug mode is enabled.
         * @param segment The TextSegment being validated.
         * @param avgProbability The computed average probability.
         */
        if (this.enableDebugLogging) {
            console.log(`Segment Validation: Avg Probability = ${avgProbability}, Text = '${segment.rawText.trim()}'`);
        }
    }

    private logValidation(segment: TextSegment, status: string): void {
        /**
         * Logs the validation status of a segment if debug mode is enabled.
         * @param segment The TextSegment being validated.
         * @param status The validation status message.
         */
        if (this.enableDebugLogging) {
            console.log(`Validation Status: ${status}, Text: '${segment.rawText.trim()}'`);
        }
    }
}
