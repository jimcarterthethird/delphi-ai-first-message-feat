const PREFIX = '[DelphiFirstMessage]';

export function log(msg: string): void {
    console.log(`${PREFIX} ${msg}`);
}

export function warn(msg: string): void {
    console.warn(`${PREFIX} ${msg}`);
}
