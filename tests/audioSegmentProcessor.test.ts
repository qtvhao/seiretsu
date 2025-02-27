import fs from 'fs'
import {
    AudioSegmentProcessor
} from "../src/audioSegmentProcessor"
import { splitMarkdown, stripMarkdownFormatting } from "../src/utils";

describe("AudioSegmentProcessor", () => {
    let referenceSentences: string[];
    let processor: AudioSegmentProcessor;

    beforeEach(() => {
        processor = new AudioSegmentProcessor();
        let transcriptTxt = './examples/transcript.txt';
        let transcript = fs.readFileSync(transcriptTxt).toString();
        referenceSentences = splitMarkdown(stripMarkdownFormatting(transcript))
    });
    test('processAlignedSegments with misaligned dot', async () => {
        let audioFile = './examples/audio-3.mp3'
        let expectedTextSegments = JSON.parse(fs.readFileSync('./examples/audioSegmentProcessor-expectedTextSegments-1.json').toString())
        let alignmentResult = JSON.parse(fs.readFileSync('./examples/audioSegmentProcessor-alignmentResult-1.json').toString())
        // 
        const [trimmedAudio, remainingText, , segments] = await processor.processAlignedSegments(audioFile, expectedTextSegments, alignmentResult)
        expect(remainingText).not.toHaveLength(0)
        expect(segments[segments.length - 1].rawText).toEqual("thích hợp với khí hậu lạnh.")
    })
    test("should correctly match transcript segments to reference sentences 2", async () => {
        let referenceSentences = JSON.parse(fs.readFileSync('./examples/transcript-2.json').toString())
        let processed = await processor.recursiveGetSegmentsFromAudioFile('./examples/audio-2.mp3', referenceSentences)
        console.log(processed)
    }, 600_000);

    test("should correctly match transcript segments to reference sentences 1", async () => {
        let processed = await processor.recursiveGetSegmentsFromAudioFile('./examples/audio.mp3', referenceSentences, 'vi')
        console.log(processed)
    }, 600_000);
});
