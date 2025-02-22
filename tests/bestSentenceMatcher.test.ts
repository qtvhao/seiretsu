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
        // "Chó là một trong những loài vật nuôi phổ biến và trung thành nhất của con người."
        const [matchedSegments, bestMatchEndTime, remainingSentences, processedSentences] = matcher.findBestMatch(0.2);

        expect(matchedSegments.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).not.toBeNull();
        expect(remainingSentences.length).toBeLessThan(referenceSentences.length);
        expect(processedSentences.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).toBeGreaterThan(5.86)
        expect(remainingSentences).toHaveLength(0)
    });
});
