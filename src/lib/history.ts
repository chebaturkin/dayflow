export class DocumentHistory {
  private past: string[] = [];
  private future: string[] = [];
  private group: unknown;

  constructor(private present: string) {}

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }

  record(next: string, group?: unknown) {
    if (next === this.present) return;
    if (group === undefined || group !== this.group) {
      this.past.push(this.present);
      if (this.past.length > 50) this.past.shift();
    }
    this.present = next;
    this.group = group;
    this.future = [];
  }

  endGroup() { this.group = undefined; }

  undo(): string | null {
    const previous = this.past.pop();
    if (previous === undefined) return null;
    this.future.push(this.present);
    this.present = previous;
    this.endGroup();
    return previous;
  }

  redo(): string | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(this.present);
    this.present = next;
    this.endGroup();
    return next;
  }
}
