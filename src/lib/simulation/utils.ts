export const getRequiredItem = <T,>(item: T | undefined, reference: string): T => {
  if (!item) {
    throw new Error(`Simulation contract error: missing reference "${reference}" in simulation data files`);
  }

  return item;
};

export const fillSimulationTemplate = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
