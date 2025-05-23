// query.ts
const mockRegistry = new Map<any, any>()

export function mockModelQuery<T = any>(Model: any, result: T | null) {
  if (!mockRegistry.has(Model)) {
    mockRegistry.set(Model, Model.query)
  }

  Model.query = () =>
    ({
      where: () => ({
        first: async () => result,
      }),
    } as any)
}

export function restoreAllMocks() {
  for (const [Model, original] of mockRegistry) {
    Model.query = original
  }

  mockRegistry.clear()
}
