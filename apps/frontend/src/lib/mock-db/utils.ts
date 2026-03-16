export const sortByIndex = <T extends { index: number }>(items: T[]) =>
  [...items].sort((left, right) => left.index - right.index);

export const getRequiredItem = <T>(item: T | undefined, reference: string): T => {
  if (!item) {
    throw new Error(`Mock DB contract error: missing reference "${reference}" in mock-db seed files`);
  }

  return item;
};
