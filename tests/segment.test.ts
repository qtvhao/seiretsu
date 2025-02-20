import { Segment } from '../src/segment';

describe('Segment Class', () => {
    test('calculateDistance should return correct Levenshtein distance', () => {
        const segment = new Segment('Test case', 10, 0, [], []);

        const distance = segment.calculateDistance(['Another test case example']);
        expect(distance).toBe(8);
    });

    test('calculateDistance should handle case insensitivity', () => {
        const segment = new Segment('Hello World', 10, 0, [], []);

        const distance = segment.calculateDistance(['HELLO WORLD']);
        expect(distance).toBe(0);
    });
});
