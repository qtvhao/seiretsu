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

    test("should correctly match transcript segments to reference sentences", async () => {
        let processed = await processor.recursiveGetSegmentsFromAudioFile('./examples/audio.mp3', referenceSentences)
        console.log(processed)
    }, 360e3);
});
