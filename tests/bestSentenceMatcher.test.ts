import { BestSentenceMatcher } from "../src/bestSentenceMatcher";
import { TranscriptSegment } from "../src/align";
import fs from 'fs'

describe("BestSentenceMatcher", () => {
    let transcriptSegments: TranscriptSegment[];
    let referenceSentences: string[];
    let matcher: BestSentenceMatcher;

    beforeEach(() => {
        transcriptSegments = JSON.parse(fs.readFileSync('./examples/bestSentenceMatcher-transcriptSegments-1.json').toString())

        referenceSentences = JSON.parse(fs.readFileSync('./examples/bestSentenceMatcher-expectedTextSegments-1.json').toString())

        matcher = new BestSentenceMatcher(transcriptSegments, referenceSentences);
    });

    test("findBestMatch 1", () => {
        const [matchedSegments, bestMatchEndTime, remainingSentences, processedSentences] = matcher.findBestMatch(0.2);

        expect(matchedSegments.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).not.toBeNull();
        expect(remainingSentences.length).toBeLessThan(referenceSentences.length);
        expect(processedSentences.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).toEqual(14.26)
        expect(remainingSentences).toHaveLength(53)
    });

    test("findBestMatch 2", () => {
        transcriptSegments = JSON.parse(fs.readFileSync('./examples/bestSentenceMatcher-transcriptSegments-2.json').toString())

        referenceSentences = JSON.parse(fs.readFileSync('./examples/bestSentenceMatcher-expectedTextSegments-2.json').toString())

        matcher = new BestSentenceMatcher(transcriptSegments, referenceSentences);
        const [matchedSegments, bestMatchEndTime, remainingSentences, processedSentences] = matcher.findBestMatch(0.2);

        expect(matchedSegments.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).not.toBeNull();
        expect(remainingSentences.length).toBeLessThan(referenceSentences.length);
        expect(processedSentences.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).toEqual(18.38)
        expect(remainingSentences).toHaveLength(48)
    });
});
