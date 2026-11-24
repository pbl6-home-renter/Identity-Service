export class InvalidBuildingReviewEventException extends Error {
  constructor(field: string) {
    super(`Invalid building review event: ${field}`);
    this.name = InvalidBuildingReviewEventException.name;
  }
}
