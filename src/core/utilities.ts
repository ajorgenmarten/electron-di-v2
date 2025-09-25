import { isEmpty, isObject } from "./utils";

export class Reflector {
  get(key: any, target: Object | Function) {
    return Reflect.getMetadata(key, target)
  }
  getAll(key: any, targets: (Object | Function)[]) {
    return targets.map((target) => this.get(key, target))
  }
  getAllAndMerge(key: any, targets: (Object | Function)[]) {
    const metadataCollection = this.getAll(key, targets)
      .filter(item => item !== undefined);
    if (isEmpty(metadataCollection)) {
      return metadataCollection;
    }
    if (metadataCollection.length === 1) {
      const value = metadataCollection[0];
      if (isObject(value)) {
        return value;
      }
      return metadataCollection;
    }
    return metadataCollection.reduce((a, b) => {
      if (Array.isArray(a)) {
        return a.concat(b);
      }
      if (isObject(a) && isObject(b)) {
        return {
          ...a,
          ...b,
        };
      }
      return [a, b];
    });
    
  }
  getAllAndOverride(key: any, targets: (Object | Function)[]) {
    for (const target of targets) {
      const result = this.get(key, target);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }
}
