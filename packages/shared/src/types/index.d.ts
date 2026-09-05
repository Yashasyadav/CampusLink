export interface HealthResponse {
    status: string;
    version?: string;
    environment?: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown[];
    };
    meta?: {
        timestamp: string;
        version: string;
    };
}
