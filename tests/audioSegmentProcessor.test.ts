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
    test("should correctly match transcript segments to reference sentences 2", async () => {
        let referenceSentences = JSON.parse(fs.readFileSync('./examples/transcript-2.json').toString())
        let processed = await processor.recursiveGetSegmentsFromAudioFile('./examples/audio-2.mp3', referenceSentences)
        console.log(processed)
    }, 600_000);

    test("should correctly match transcript segments to reference sentences 1", async () => {
        let processed = await processor.recursiveGetSegmentsFromAudioFile('./examples/audio.mp3', referenceSentences)
        console.log(processed)
    }, 600_000);
});
