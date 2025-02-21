import { TextSegment } from '../src/segment';

describe('Segment Class', () => {
    test('computeLevenshteinDistance should return correct Levenshtein distance', () => {
        const segment = new TextSegment('Test case', [], 0, 1);

        const distance = segment.computeLevenshteinDistance(['Another test case example']);
        expect(distance).toBe(8);
    });

    test('computeLevenshteinDistance should handle case insensitivity', () => {
        const segment = new TextSegment('Hello World', [], 0, 1);

        const distance = segment.computeLevenshteinDistance(['HELLO WORLD']);
        expect(distance).toBe(0);
    });

    test('computeLevenshteinDistance should handle long sentence vs short sentence with same ending', () => {
        const longSentence = "This is a very long sentence that has a lot of words but ends the same way as the short sentence.";
        const shortSentence = " way as the short sentence.";
    
        const segment = new TextSegment(longSentence, [], 0, 1);
        const distance = segment.computeLevenshteinDistance(['ends the same', shortSentence]);
        expect(distance).toBe(0);
    });

    test('computeLevenshteinDistance should handle markdown syntax differences', () => {
        const segment = new TextSegment('This is a **bold** and *italic* test', [], 0, 1);
    
        const distance = segment.computeLevenshteinDistance(['This is a __bold__ and _italic_ test']);
    
        expect(distance).toBe(0);
    });
});
