/**
 * Service to manage request-response correlation using correlationId.
 */
export class RequestResponseService {
    private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>;
    private responses: Map<string, any>;

    constructor() {
        this.pendingRequests = new Map();
        this.responses = new Map();
    }

    /**
     * Adds a request to the tracking map and returns a Promise that resolves when a response is received.
     * @param correlationId Unique identifier for the request.
     * @returns Promise that resolves with the response data.
     */
    addRequest(correlationId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(correlationId, { resolve, reject });
            
            // Automatically reject the request if no response is received within 60 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(correlationId)) {
                    this.pendingRequests.delete(correlationId);
                    reject(new Error('Request timed out'));
                }
            }, 60000);
        });
    }

    /**
     * Stores the response in a map and resolves the pending request.
     * @param correlationId Unique identifier for the request.
     * @param response Response data.
     */
    storeResponse(correlationId: string, response: any): void {
        if (this.pendingRequests.has(correlationId)) {
            this.pendingRequests.get(correlationId)?.resolve(response);
            this.pendingRequests.delete(correlationId);
        }
        this.responses.set(correlationId, response);
    }

    /**
     * Retrieves a stored response by correlationId.
     * @param correlationId Unique identifier for the request.
     * @returns Response data or undefined if not found.
     */
    getResponse(correlationId: string): any {
        return this.responses.get(correlationId);
    }
}
