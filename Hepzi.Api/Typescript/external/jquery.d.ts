// PLACEHOLDER: just a stopgap until I get VS2022 to work with the JQuery type definitions.
export as namespace jQuery;

export type ToastAction = 'dispose' | 'hide' | 'show';
export interface JQueryResult {
    clone(): JQueryResult;
    find(selector: string): JQueryResult;
    on(event: string, action: () => void): void;
    parent(): JQueryResult;
    prepend(where: JQueryResult): JQueryResult;
    remove(): JQueryResult;
    text(plaintext?: string): string;
    toast(action: ToastAction): void;
}

export = (selector: string) => JQueryResult;