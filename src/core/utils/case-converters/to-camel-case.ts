export function toCamelCase(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }

    return Object.entries(obj).reduce(
        (acc, [k, v]) => ({
            ...acc,
            [k.replace(/([-_][a-z])/gi, ($1) =>
                $1.toUpperCase().replace("-", "").replace("_", "")
            )]: toCamelCase(v),
        }),
        {}
    );
}
