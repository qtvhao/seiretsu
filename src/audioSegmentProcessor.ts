import * as fs from 'fs';
import { TextSegment } from './segment';
import { align, TranscriptSegment, WordData } from "./align";
import { cutAudioFile } from './utils';
import { BestSentenceMatcher } from './bestSentenceMatcher';

/**
 * AudioSegmentProcessor handles speech-to-text alignment and segmentation.
 */
export class AudioSegmentProcessor {
    private ffmpegPath: string = '/usr/bin/ffmpeg';

    constructor() {
        if (!fs.existsSync(this.ffmpegPath)) {
            this.ffmpegPath = 'ffmpeg';
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
    ): Promise<[string | null, string[], number | null, TextSegment[]]> {
        const alignmentResult = await align(audioFile, expectedTextSegments.join('\n\n'));
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
    private async processAlignedSegments(
        audioFile: string, 
        expectedTextSegments: string[], 
        alignmentData: { segments: TranscriptSegment[] }
    ): Promise<[string | null, string[], number | null, TextSegment[]]> {

        const transcriptSegments: TranscriptSegment[] = alignmentData['segments'] || [];
        await fs.promises.writeFile(
            audioFile.replace('.mp3', '.txt'),
            transcriptSegments.map(segment => `${segment.start} - ${segment.end}: ${segment.text}`).join('\n\n')
        );
        
        const matcher = new BestSentenceMatcher(transcriptSegments, expectedTextSegments);
        const [matchedSegments, lastSegmentEnd, remainingText]: [TextSegment[], number | null, string[], any[]] = matcher.findBestMatch(0.2);
        
        if (lastSegmentEnd === null) {
            if (remainingText.length > 0) {
                throw new Error("Alignment failed: no segments found, but remaining text is not empty.");
            }else{
                return [null, [], null, []];
            }
        }
        let startTimestamp: number = lastSegmentEnd;
        
        const trimmedAudioFile: string | null = remainingText.length > 0 ? await cutAudioFile(audioFile, lastSegmentEnd) : null;
        
        return [trimmedAudioFile, remainingText, startTimestamp, matchedSegments];
    }

    /**
     * Recursively extracts and aligns text segments from an audio file.
     * 
     * @param audioFile Path to the audio file.
     * @param expectedTextSegments Expected text segments.
     * @returns Extracted text segments.
     */
    public async recursiveGetSegmentsFromAudioFile(audioFile: string, expectedTextSegments: string[]): Promise<TextSegment[]> {
        if (!expectedTextSegments.length) {
            return [];
        }
        
        const [trimmedAudio, remainingText, start, segments] = await this.processAudioFile(audioFile, expectedTextSegments);
        
        if (!trimmedAudio) {
            throw new Error("Processing failed: no trimmed audio generated.");
        }
        
        let additionalSegments: TextSegment[] = [];
        if (remainingText.length > 0) {
            additionalSegments = await this.recursiveGetSegmentsFromAudioFile(trimmedAudio, remainingText);
        }
        
        return segments.concat(additionalSegments);
    }
}

export default AudioSegmentProcessor;
