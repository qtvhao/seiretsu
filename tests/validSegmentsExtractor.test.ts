import { ValidSegmentsExtractor } from '../src/validSegmentsExtractor';
import { TextSegment } from '../src/segment';

describe('ValidSegmentsExtractor', () => {
    const tolerance = 0.5;
    let extractor: ValidSegmentsExtractor;

    beforeEach(() => {
        extractor = new ValidSegmentsExtractor(tolerance);
    });

    test('extractValidSegments should handle long vs short sentences correctly', () => {
        const longSentence = "This is a very long sentence that has a lot of words but ends the same way as the short sentence.";
        const shortSentence = " way as the short sentence.";

        const segments: TextSegment[] = [
            new TextSegment(
                longSentence,
                [
                    { word: "This", probability: 0.9, start: 0, end: 0.1 },
                    { word: "is", probability: 0.8, start: 0.1, end: 0.2 },
                    { word: "a", probability: 0.85, start: 0.2, end: 0.3 },
                    { word: "very", probability: 0.9, start: 0.3, end: 0.4 }
                ],
                0,
                1
            ),
            new TextSegment(
                shortSentence,
                [
                    { word: "way", probability: 0.7, start: 1.0, end: 1.1 },
                    { word: "as", probability: 0.72, start: 1.1, end: 1.2 },
                    { word: "the", probability: 0.74, start: 1.2, end: 1.3 }
                ],
                1,
                2
            ),
            new TextSegment(
                "Invalid",
                [{ word: "Invalid", probability: 0.3, start: 2, end: 2.1 }],
                2,
                3
            ) // Should stop here
        ];

        const result = extractor.extractValidSegments(segments);

        expect(result).toEqual([
            new TextSegment(
                longSentence,
                [
                    { word: "This", probability: 0.9, start: 0, end: 0.1 },
                    { word: "is", probability: 0.8, start: 0.1, end: 0.2 },
                    { word: "a", probability: 0.85, start: 0.2, end: 0.3 },
                    { word: "very", probability: 0.9, start: 0.3, end: 0.4 }
                ],
                0,
                1
            ),
            new TextSegment(
                shortSentence,
                [
                    { word: "way", probability: 0.7, start: 1.0, end: 1.1 },
                    { word: "as", probability: 0.72, start: 1.1, end: 1.2 },
                    { word: "the", probability: 0.74, start: 1.2, end: 1.3 }
                ],
                1,
                2
            )
        ]);
    });
    // 
    test('extractValidSegments should stop when probability is too low', () => {
        const segments: TextSegment[] = [
            new TextSegment(
                "Valid Segment 1",
                [
                    { word: "Valid", probability: 0.8, start: 0, end: 0.1 },
                    { word: "Segment", probability: 0.85, start: 0.1, end: 0.2 },
                ],
                0,
                1
            ),
            new TextSegment(
                "Invalid Segment (Low Probability)",
                [
                    { word: "Invalid", probability: 0.3, start: 1.0, end: 1.1 },
                    { word: "Segment", probability: 0.4, start: 1.1, end: 1.2 }
                ],
                1,
                2
            ), // This segment should stop extraction
            new TextSegment(
                "Valid Segment 2",
                [
                    { word: "Valid", probability: 0.9, start: 2.0, end: 2.1 },
                    { word: "Again", probability: 0.95, start: 2.1, end: 2.2 }
                ],
                2,
                3
            ) // Should not be included in the result
        ];

        const result = extractor.extractValidSegments(segments);

        expect(result).toEqual([
            new TextSegment(
                "Valid Segment 1",
                [
                    { word: "Valid", probability: 0.8, start: 0, end: 0.1 },
                    { word: "Segment", probability: 0.85, start: 0.1, end: 0.2 },
                ],
                0,
                1
            )
        ]);
    });

});
