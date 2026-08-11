export class EntityRegistry {
  constructor(entities = []) {
    this.entities = new Map(entities.map((entity) => [entity.id, entity]));
    this.references = new Map();
  }

  registerLayerObject(entityId, layer, object) {
    if (!this.references.has(entityId)) this.references.set(entityId, {});
    this.references.get(entityId)[layer] = object;
  }

  get(id) {
    return this.entities.get(id);
  }

  getReferences(id) {
    return this.references.get(id) ?? {};
  }

  search(keyword) {
    const term = keyword.trim().toLowerCase();
    if (!term) return [];
    return [...this.entities.values()].filter((entity) =>
      [entity.name, entity.id, entity.type, entity.province].some((value) => String(value).toLowerCase().includes(term)),
    );
  }
}
