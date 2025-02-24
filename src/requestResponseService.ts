/**
 * Service to manage request-response correlation using correlationId.
 */
export class RequestResponseService {
    private pendingRequests: Map<string, (response: any) => void>;

    constructor() {
        this.pendingRequests = new Map();
    }

    /**
     * Adds a request to the tracking map and returns a Promise that resolves when a response is received.
     * @param correlationId Unique identifier for the request.
     * @returns Promise that resolves with the response data.
     */
    addRequest(correlationId: string): Promise<any> {
        return new Promise((resolve) => {
            this.pendingRequests.set(correlationId, resolve);
        });
    }

    /**
     * Handles the incoming response by resolving the corresponding request's promise.
     * @param correlationId Unique identifier for the request.
     * @param responseData Data to resolve the pending request.
     */
    handleResponse(correlationId: string, responseData: any): void {
        const resolver = this.pendingRequests.get(correlationId);
        if (resolver) {
            resolver(responseData);
            this.pendingRequests.delete(correlationId);
        } else {
            console.warn(`⚠️ No matching request found for correlationId: ${correlationId}`);
        }
    }
}
