export function id(item: string | null): HTMLElement {
    const element = item ? document.getElementById(item) : null;
    if (!element) {
        throw new Error(`No element found with id: ${item}`);
    }
    return element;
}

export function qs(item: string | null): HTMLElement {
    if (!item) {
        throw new Error("Invalid selector: item is null");
    }
    const element = document.querySelector(item);
    if (!element) {
        throw new Error(`No element found for selector: ${item}`);
    }
    return element as HTMLElement;
}

export function qsa(item: string | null): NodeListOf<HTMLElement> {
    return item ? document.querySelectorAll<HTMLElement>(item) : document.querySelectorAll<HTMLElement>('');
}