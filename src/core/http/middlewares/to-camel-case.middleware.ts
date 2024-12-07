import { toCamelCase } from "@/core/utils/case-converters/to-camel-case";
import { HttpRequest, HttpResponse } from "..";

export async function toCamelCaseMiddleware(
    req: HttpRequest,
    _: HttpResponse,
    next: () => void
) {
    req.body = toCamelCase(req.body);
    next();
}
