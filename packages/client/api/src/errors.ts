export class ApiError extends Error {
    readonly status: number;
    readonly url: string;
    readonly details?: unknown;

    constructor(message: string, status: number, url: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.url = url;
        this.details = details;
    }
}
