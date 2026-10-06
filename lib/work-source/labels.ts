import type { WaitingOn } from './types';

/** Display labels for `waitingOn`. Kept identical to the labels the Ops screens showed before the neutral model. */
export function waitingOnLabel(w: WaitingOn): string {
  return w === 'internal' ? 'Me' : w === 'client' ? 'Client' : 'Contractor';
}
