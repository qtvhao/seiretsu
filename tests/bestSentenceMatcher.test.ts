import { BestSentenceMatcher } from "../src/bestSentenceMatcher";
import { TranscriptSegment } from "../src/align";

describe("BestSentenceMatcher", () => {
    let transcriptSegments: TranscriptSegment[];
    let referenceSentences: string[];
    let matcher: BestSentenceMatcher;

    beforeEach(() => {
        transcriptSegments = [
            {
                "text": " # Các Giống Chó Phổ Biến Trên Thế Giới    Chó là một trong",
                "start": 0.24,
                "end": 2.74,
                "words": [
                    {
                        "word": " #",
                        "start": 0.24,
                        "end": 0.24,
                        "probability": 0
                    },
                    {
                        "word": " Các",
                        "start": 0.26,
                        "end": 0.64,
                        "probability": 0.267
                    },
                    {
                        "word": " Giống",
                        "start": 0.64,
                        "end": 0.64,
                        "probability": 0.004
                    },
                    {
                        "word": " Chó",
                        "start": 0.64,
                        "end": 0.88,
                        "probability": 0.504
                    },
                    {
                        "word": " Phổ",
                        "start": 0.88,
                        "end": 1.12,
                        "probability": 0.157
                    },
                    {
                        "word": " Biến",
                        "start": 1.12,
                        "end": 1.3,
                        "probability": 0.203
                    },
                    {
                        "word": " Trên",
                        "start": 1.34,
                        "end": 1.56,
                        "probability": 0.058
                    },
                    {
                        "word": " Thế",
                        "start": 1.56,
                        "end": 1.68,
                        "probability": 0.219
                    },
                    {
                        "word": " Giới",
                        "start": 1.68,
                        "end": 2.06,
                        "probability": 0.399
                    },
                    {
                        "word": "    Chó",
                        "start": 2.14,
                        "end": 2.32,
                        "probability": 0.193
                    },
                    {
                        "word": " là",
                        "start": 2.32,
                        "end": 2.42,
                        "probability": 0.527
                    },
                    {
                        "word": " một",
                        "start": 2.42,
                        "end": 2.6,
                        "probability": 0.978
                    },
                    {
                        "word": " trong",
                        "start": 2.6,
                        "end": 2.74,
                        "probability": 0.613
                    }
                ]
            },
            {
                "text": " những loài vật nuôi phổ biến và trung thành nhất của con người.",
                "start": 2.74,
                "end": 5.86,
                "words": [
                    {
                        "word": " những",
                        "start": 2.74,
                        "end": 3.04,
                        "probability": 0.981
                    },
                    {
                        "word": " loài",
                        "start": 3.04,
                        "end": 3.28,
                        "probability": 0.675
                    },
                    {
                        "word": " vật",
                        "start": 3.28,
                        "end": 3.5,
                        "probability": 0.63
                    },
                    {
                        "word": " nuôi",
                        "start": 3.5,
                        "end": 3.78,
                        "probability": 0.602
                    },
                    {
                        "word": " phổ",
                        "start": 3.86,
                        "end": 4.08,
                        "probability": 0.904
                    },
                    {
                        "word": " biến",
                        "start": 4.08,
                        "end": 4.34,
                        "probability": 0.842
                    },
                    {
                        "word": " và",
                        "start": 4.34,
                        "end": 4.64,
                        "probability": 0.846
                    },
                    {
                        "word": " trung",
                        "start": 4.64,
                        "end": 4.82,
                        "probability": 0.563
                    },
                    {
                        "word": " thành",
                        "start": 4.82,
                        "end": 5.02,
                        "probability": 0.618
                    },
                    {
                        "word": " nhất",
                        "start": 5.1,
                        "end": 5.3,
                        "probability": 0.5
                    },
                    {
                        "word": " của",
                        "start": 5.44,
                        "end": 5.54,
                        "probability": 0.993
                    },
                    {
                        "word": " con",
                        "start": 5.54,
                        "end": 5.76,
                        "probability": 0.682
                    },
                    {
                        "word": " người.",
                        "start": 5.76,
                        "end": 5.86,
                        "probability": 0.82
                    }
                ]
            },
            {
                "text": "  Có hàng trăm giống chó trên thế giới,",
                "start": 6.52,
                "end": 7.92,
                "words": [
                    {
                        "word": "  Có",
                        "start": 6.52,
                        "end": 6.54,
                        "probability": 0.014
                    },
                    {
                        "word": " hàng",
                        "start": 6.54,
                        "end": 6.72,
                        "probability": 0.908
                    },
                    {
                        "word": " trăm",
                        "start": 6.72,
                        "end": 6.88,
                        "probability": 0.195
                    },
                    {
                        "word": " giống",
                        "start": 6.88,
                        "end": 6.98,
                        "probability": 0.503
                    },
                    {
                        "word": " chó",
                        "start": 6.98,
                        "end": 7.24,
                        "probability": 0.522
                    },
                    {
                        "word": " trên",
                        "start": 7.24,
                        "end": 7.36,
                        "probability": 0.1
                    },
                    {
                        "word": " thế",
                        "start": 7.36,
                        "end": 7.52,
                        "probability": 0.19
                    },
                    {
                        "word": " giới,",
                        "start": 7.52,
                        "end": 7.92,
                        "probability": 0.882
                    }
                ]
            },
            {
                "text": "  mỗi giống có đặc điểm riêng về ngoại hình,",
                "start": 8.28,
                "end": 9.82,
                "words": [
                    {
                        "word": "  mỗi",
                        "start": 8.28,
                        "end": 8.28,
                        "probability": 0.268
                    },
                    {
                        "word": " giống",
                        "start": 8.28,
                        "end": 8.48,
                        "probability": 0.847
                    },
                    {
                        "word": " có",
                        "start": 8.48,
                        "end": 8.64,
                        "probability": 0.961
                    },
                    {
                        "word": " đặc",
                        "start": 8.64,
                        "end": 8.86,
                        "probability": 0.764
                    },
                    {
                        "word": " điểm",
                        "start": 8.88,
                        "end": 9,
                        "probability": 0.906
                    },
                    {
                        "word": " riêng",
                        "start": 9,
                        "end": 9.24,
                        "probability": 0.624
                    },
                    {
                        "word": " về",
                        "start": 9.24,
                        "end": 9.42,
                        "probability": 0.456
                    },
                    {
                        "word": " ngoại",
                        "start": 9.42,
                        "end": 9.64,
                        "probability": 0.604
                    },
                    {
                        "word": " hình,",
                        "start": 9.64,
                        "end": 9.82,
                        "probability": 0.772
                    }
                ]
            },
        ];

        referenceSentences = [
            "# Các Giống Chó Phổ Biến Trên Thế Giới",
            "Chó là một trong những loài vật nuôi phổ biến và trung thành nhất của con người.",
            "Có hàng trăm giống chó trên thế giới,",
            "mỗi giống có đặc điểm riêng về ngoại hình,",
        ];

        matcher = new BestSentenceMatcher(transcriptSegments, referenceSentences);
    });

    test("should correctly match transcript segments to reference sentences", () => {
        const [matchedSegments, bestMatchEndTime, remainingSentences, processedSentences] = matcher.findBestMatch(0.2);

        expect(matchedSegments.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).not.toBeNull();
        expect(remainingSentences.length).toBeLessThan(referenceSentences.length);
        expect(processedSentences.length).toBeGreaterThan(0);
        expect(bestMatchEndTime).toEqual(5.86)
        expect(remainingSentences[0]).toEqual('Có hàng trăm giống chó trên thế giới,')
    });
});
