import * as fs from 'fs';
import { TextSegment } from './segment.js';
import { align, TranscriptSegment, WordData } from "./align.js";
import { cutAudioFile } from './utils.js';
import { BestSentenceMatcher } from './bestSentenceMatcher.js';

/**
 * AudioSegmentProcessor handles speech-to-text alignment and segmentation.
 */
export class AudioSegmentProcessor {
    private ffmpegPath: string = '/usr/bin/ffmpeg';

    constructor() {
        if (!fs.existsSync(this.ffmpegPath)) {
            this.ffmpegPath = 'ffmpeg';
            console.log("⚠️ FFmpeg not found at default path, using fallback.");
        }
    }

    /**
     * Extracts aligned speech segments from an audio file.
     * 
     * @param audioFile Path to the audio file.
     * @param expectedTextSegments Expected text segments in the audio.
     * @returns A tuple containing the trimmed audio file path, remaining unmatched text, start timestamp, and extracted text segments.
     */
    private async processAudioFile(
        audioFile: string,
        expectedTextSegments: string[],
        language: string,
    ): Promise<[string | null, string[], number | null, TextSegment[]]> {
        console.log("🎤 Processing audio file:", audioFile);
        const alignmentResult = await align(audioFile, expectedTextSegments.join('\n\n'), language);
        return await this.processAlignedSegments(audioFile, expectedTextSegments, alignmentResult);
    }

    /**
     * Matches aligned segments with expected text and trims the audio if needed.
     *
     * @param audioFile Path to the audio file.
     * @param expectedTextSegments Expected text segments.
     * @param alignmentData JSON object containing speech-to-text alignment results.
     * @returns A tuple containing the trimmed audio file path, remaining unmatched text, start timestamp, and extracted text segments.
     */
    public async processAlignedSegments(
        audioFile: string, 
        expectedTextSegments: string[], 
        alignmentData: { segments: TranscriptSegment[] }
    ): Promise<[string | null, string[], number | null, TextSegment[]]> {

        console.log("📊 Aligning segments...");
        const transcriptSegments: TranscriptSegment[] = alignmentData['segments'] || [];

        console.log("✅ Alignment file saved.");
        
        const matchThreshold = parseFloat(process.env.MATCH_THRESHOLD || '0.1');
        const matcher = new BestSentenceMatcher(transcriptSegments, expectedTextSegments);
        const [matchedSegments, lastSegmentEnd, remainingText]: [TextSegment[], number | null, string[], any[]] = matcher.findBestMatch(matchThreshold);
        
        if (lastSegmentEnd === null) {
            if (remainingText.length > 0) {
                console.log("❌ Alignment failed: No segments found but remaining text exists.");
                throw new Error("Alignment failed: no segments found, but remaining text is not empty.");
            } else {
                console.log("ℹ️ No remaining text, returning empty result.");
                return [null, [], null, []];
            }
        }
        console.log("🎯 Matched segments found, trimming audio if needed.");
        let startTimestamp: number = lastSegmentEnd;
        
        const trimmedAudioFile: string | null = remainingText.length > 0 ? await cutAudioFile(audioFile, lastSegmentEnd) : null;
        if (trimmedAudioFile) {
            console.log("✂️ Audio trimmed:", trimmedAudioFile);
        }
        
        return [trimmedAudioFile, remainingText, startTimestamp, matchedSegments];
    }

    /**
     * Adjusts the timestamps of a segment and its words by adding an offset.
     *
     * @param segment The segment whose times need adjustment.
     * @param offset The time offset to add.
     * @returns A new segment with adjusted times.
     */
    private adjustSegmentTimes(segment: TextSegment, offset: number): TextSegment {
        return {
            ...segment,
            startTime: segment.startTime + offset,
            endTime: segment.endTime + offset,
            words: segment.words.map(word => ({
                ...word,
                start: word.start + offset,
                end: word.end + offset,
            })),
        } as TextSegment;
    }

    /**
     * Recursively extracts and aligns text segments from an audio file.
     * 
     * @param audioFile Path to the audio file.
     * @param expectedTextSegments Expected text segments.
     * @returns Extracted text segments.
     */
    public async recursiveGetSegmentsFromAudioFile(audioFile: string, expectedTextSegments: string[], language: string, stack = 0): Promise<TextSegment[]> {
        if (!expectedTextSegments.length) {
            console.log("ℹ️ No expected text segments provided.");
            return [];
        }
        
        console.log("🔄 Processing segments recursively...");
        const [trimmedAudio, remainingText, , segments] = await this.processAudioFile(audioFile, expectedTextSegments, language);
        
        if (!trimmedAudio) {
            console.log("❌ Processing failed: No trimmed audio generated.");
            // throw new Error("Processing failed: no trimmed audio generated.");

            return [];
        }
        
        let additionalSegments: TextSegment[] = [];
        if (remainingText.length > 0) {
            console.log("🔁 Continuing recursion with remaining text.", {
                trimmedAudio,
                remainingText,
            });
            additionalSegments = await this.recursiveGetSegmentsFromAudioFile(trimmedAudio, remainingText, language, stack + 1);

            // Modify additionalSegments by adding the last segment's endTime
            if (segments.length > 0) {
                const lastEndTime = segments[segments.length - 1].endTime;
                additionalSegments = additionalSegments.map(segment => this.adjustSegmentTimes(segment, lastEndTime));
            }
        }
        
        console.log("✅ Processing complete.");
        return segments.concat(additionalSegments);
    }
}

export default AudioSegmentProcessor;
