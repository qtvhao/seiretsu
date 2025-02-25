import { Router, Request, Response } from 'express';
import multer from 'multer';
import { config } from '../config';
import { Storage } from '../utils/storage';
import { sendMessageToQueue } from '../utils/kafkaHelper';
import { App } from '../app';

const router: Router = Router();
const upload = multer({ dest: 'uploads/' });
const storage: Storage = new Storage();
const requestResponseService = App.getInstance().requestResponseService;

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

const alignHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!validateRequest(req, res)) {
            return;
        }

        const { referenceTexts } = req.body;
        const fileClaimCheck: string = await storage.uploadAudioFile(req.file!);
        
        const correlationId: string = crypto.randomUUID();
        const responsePromise = requestResponseService.addRequest(correlationId);
        await sendMessageToQueue(config.kafka.topics.request, { referenceTexts, fileClaimCheck, correlationId });
        
        responsePromise
            .then(response => {
                res.status(200).json(response);
            })
            .catch(error => {
                console.error('Error processing response:', error);
                res.status(202).json({ message: 'Request accepted, but response not ready yet', correlationId });
            });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

const getResponseHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { correlationId } = req.params;
        const response = requestResponseService.getResponse(correlationId);
        
        if (!response) {
            res.status(404).json({ error: 'Response not found', correlationId });
            return;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching response:', error);
        res.status(500).json({ error: 'Failed to retrieve response' });
    }
};

router.post('/align', upload.single('audioFile'), alignHandler);
router.get('/align/:correlationId', getResponseHandler);

export default router;
