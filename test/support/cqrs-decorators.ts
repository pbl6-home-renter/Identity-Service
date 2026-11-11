type HandlerClass = Function;

export class EventBus {
  publish(_event: unknown): void {}
}

export function CommandHandler(
  ..._metadata: unknown[]
): (target: HandlerClass) => void {
  return () => undefined;
}

export function QueryHandler(
  ..._metadata: unknown[]
): (target: HandlerClass) => void {
  return () => undefined;
}

export function EventsHandler(
  ..._metadata: unknown[]
): (target: HandlerClass) => void {
  return () => undefined;
}
