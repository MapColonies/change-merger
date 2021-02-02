export class IdGenerator {
  private currentId: number;
  public constructor() {
    this.currentId = -1;
  }

  public getId(): number {
    return this.currentId--;
  }
}
