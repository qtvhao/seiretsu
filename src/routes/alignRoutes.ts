import { Router, Request, Response } from 'express';
import multer from 'multer';
import { config } from '../config.js'
import { Storage } from '../utils/storage.js';
import { sendMessageToQueue } from '../utils/kafkaHelper.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });
const storage = new Storage();

const validateRequest = (req: Request, res: Response): boolean => {
    if (!req.file) {
        res.status(400).json({ error: 'audioFile is required' });
        return false;
    }

    const { referenceTexts } = req.body;
    if (!referenceTexts || !Array.isArray(referenceTexts) || referenceTexts.length === 0) {
        res.status(400).json({ error: 'referenceTexts is required and must be a non-empty array' });
        return false;
    }

    return true;
};

const alignHandler = async (req: Request, res: Response) => {
    try {
        if (!validateRequest(req, res)) {
            return;
        }

        const { referenceTexts } = req.body;
        const fileClaimCheck = await storage.uploadAudioFile(req.file!);

        await sendMessageToQueue(config.kafka.topics.request, { referenceTexts, fileClaimCheck });

        res.status(200).json({ message: 'Message sent to queue successfully', fileClaimCheck });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

router.post('/align', upload.single('audioFile'), alignHandler);

export default router;
