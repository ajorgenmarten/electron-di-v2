import { Class, ModulePayload } from "../types/types"

const MODULE_SYMBOL = Symbol('module');
const GLOBAL_SYMBOL = Symbol('global');
const INJECTABLE_SYMBOL = Symbol('injectable');
const INJECT_SYMBOL = Symbol('inject');
const PARAMS_TYPES = 'design:paramtypes'

export default class Metadata {
  static Global = {
    get(target: Object) {
      return Reflect.getMetadata(GLOBAL_SYMBOL, target) === true
    },
    set(target: Object) {
      Reflect.defineMetadata(GLOBAL_SYMBOL, true, target)
    }
  }
  static Module = {
    get(target: Object) {
      return Reflect.getMetadata(MODULE_SYMBOL, target) as ModulePayload | undefined
    },
    set(target: Object, value: ModulePayload) {
      Reflect.defineMetadata(MODULE_SYMBOL, value, target)
    }
  }
  static Inject = {
    get(target: Object) {
      return Reflect.getMetadata(INJECT_SYMBOL, target) || []
    },
    set(target: Object, index: number, value: Class | String) {
      const metadata = Metadata.Inject.get(target)
      metadata[index] = value
      Reflect.defineMetadata(INJECT_SYMBOL, metadata, target)
    }
  }
  static ParamTypes = {
    get(target: Object) {
      return Reflect.getMetadata(PARAMS_TYPES, target) as any[]
    }
  }
  static Injectable = {
    get(target: Object) {
      return Reflect.getMetadata(INJECTABLE_SYMBOL, target)
    },
    set(target: Object, value: string) {
      Reflect.defineMetadata(INJECTABLE_SYMBOL, value, target);
    }
  }
}
