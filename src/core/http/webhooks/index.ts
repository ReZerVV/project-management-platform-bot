import { HttpRequest, HttpResponse, HttpServer } from "@/core/http";

type WebhookFunc =
    | (() => Promise<void> | void)
    | ((req: HttpRequest) => Promise<void> | void)
    | ((req: HttpRequest, res: HttpResponse) => Promise<void> | void)
    | ((
          req: HttpRequest,
          res: HttpResponse,
          next: () => void
      ) => Promise<void> | void);
const webhooks = new Map<string, WebhookFunc[]>();

export function setWebhook(webhookUrl: string, ...webhookFunc: WebhookFunc[]) {
    webhooks.set(webhookUrl, webhookFunc);
}

export async function setUpWebhooks(app: HttpServer) {
    for (const [url, func] of webhooks) {
        app.post("/webhooks" + url, ...func);
    }
}
