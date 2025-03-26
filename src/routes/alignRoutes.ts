import { Router, Request, Response } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { Storage } from '../utils/storage.js';
import { sendMessageToQueue } from '../utils/kafkaHelper.js';
import { App } from '../app.js';

const router: Router = Router();
const upload = multer({ dest: 'uploads/' });
const storage: Storage = new Storage();
const enableLogging = true; // config.enableLogging;

const log = (message: string, context: any = {}) => {
    if (enableLogging) {
        console.log(JSON.stringify({ message, context }));
    }
};

const validateRequest = (req: Request, res: Response): boolean => {
    if (!req.file) {
        log("Validation failed: Missing audio file", { requestId: req.headers["x-request-id"] });
        res.status(400).json({ error: 'audioFile is required' });
        return false;
    }

    const referenceTexts = JSON.parse(req.body.referenceTexts);
    if (!referenceTexts || !Array.isArray(referenceTexts) || referenceTexts.length === 0) {
        log("Validation failed: Invalid referenceTexts", { requestId: req.headers["x-request-id"] });
        res.status(400).json({ error: 'referenceTexts is required and must be a non-empty array' });
        return false;
    }

    log("Validation successful", { requestId: req.headers["x-request-id"] });
    return true;
};

const alignHandler = async (req: Request, res: Response): Promise<void> => {
    const requestResponseService = App.getInstance().requestResponseService;
    try {
        if (!validateRequest(req, res)) {
            log("Request validation failed", { requestId: req.headers["x-request-id"] });
            return;
        }

        const referenceTexts = JSON.parse(req.body.referenceTexts);
        const language = req.body.language;
        const fileClaimCheck: string = await storage.uploadAudioFile(req.file!);
        
        const correlationId: string = crypto.randomUUID();
        log("Generated correlationId", { correlationId, requestId: req.headers["x-request-id"] });
        
        const responsePromise = requestResponseService.addRequest(correlationId);
        responsePromise.catch(e=>{
            console.log(e)
        })
        await sendMessageToQueue(config.kafka.topics.request, { referenceTexts, fileClaimCheck, correlationId, language });
        
        log("Sent message to queue", { correlationId, requestId: req.headers["x-request-id"] });
        
        log("Response not ready", { correlationId, requestId: req.headers["x-request-id"] });
        res.status(202).json({ message: 'Request accepted, but response not ready yet', correlationId });
    } catch (error) {
        log("Error processing request", { error: (error as Error).message, requestId: req.headers["x-request-id"] });
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

const getResponseHandler = async (req: Request, res: Response): Promise<void> => {
    const requestResponseService = App.getInstance().requestResponseService;
    try {
        const { correlationId } = req.params;
        log("Fetching response", { correlationId, requestId: req.headers["x-request-id"] });
        
        const response = requestResponseService.getResponse(correlationId);
        
        if (!response) {
            log("Response not found", { correlationId, requestId: req.headers["x-request-id"] });
            res.status(404).json({ error: 'Response not found', correlationId });
            return;
        }

        log("Response successfully retrieved", { correlationId, requestId: req.headers["x-request-id"] });
        res.status(200).json(response);
    } catch (error) {
        log("Error fetching response", { error: (error as Error).message, requestId: req.headers["x-request-id"] });
        console.error('Error fetching response:', error);
        res.status(500).json({ error: 'Failed to retrieve response' });
    }
};

router.post('/align', upload.single('audioFile'), alignHandler);
router.get('/align/:correlationId', getResponseHandler);

export default router;
