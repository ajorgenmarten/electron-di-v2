import { Class, InjectablePayload, Provider } from "../types/types";
import Metadata from "./metadata";
import { Reflector } from "./utilities";

// Clave para buscar el proveedor
type Key = Class | string

export default class Container {
  private modules: Set<Class> = new Set();
  // [MODULO, CONTROLADOR]
  private controllers: [Class, Class][] = [];
  // [MODULO, PROVEEDOR]
  private providers: [Class, Provider][] = [];
  // [MODULO, CLAVE DEL PROVEEDOR]
  private exports: [Class, Key][] = [];
  
  public register(module: Class, visited: Class[]) {
    const moduleMetadata = Metadata.Module.get(module)
    if (!moduleMetadata) throw new Error(`Class ${module.name} is not a module.`)
    if (visited.includes(module)) throw new Error(`Circular import for module ${module.name}.`)

    const controllers = moduleMetadata.controllers ?? [];
    const providers = moduleMetadata.providers ?? [];
    const imports = moduleMetadata.imports ?? [];
    const exports = moduleMetadata.exports ?? [];

    for(const controller of controllers)
      this.controllers.push([module, controller]);

    for(const provider of providers)
      this.providers.push([module, provider]);

    for(const exportProvider of exports)
      this.exports.push([module, exportProvider]);

    this.modules.add(module);

    for(const importModule of imports)
      this.register(importModule, [...visited, module]);
  }

  public resolve(key: Key, scope: Class, visited: Key[] = []) {
    const utilities = [Reflector];

    if (typeof key === 'function' && utilities.includes(key)) 
      return new (utilities.find(u => u === key) as Class)()

    if (visited.includes(key))
      throw new Error(`Circular dependency detected for ${typeof key === 'string' ? key : key.name}`)

    const globalProvider = this.resolveInGlobalModules(key, [...visited])

  }

  private resolveInGlobalModules(key: Key, visited: Key[]) {
    const getGlobalModules = () => {
      const globals = [];
      for(const module of this.modules) {
        const globalMetadata = Metadata.Global.get(module)
        if (global) globals.push(module)
      }
      return globals;
    }

    const globalsModules = getGlobalModules();
    for(const globalModule of globalsModules) {
      const foundProvider = this.providers.find(p => {
        const [providerScope, provider] = p;
        if (providerScope !== globalModule) return false;
        if (typeof provider === 'object' && provider.provided !== key) return false;
        return true;
      });
      if (!foundProvider) continue;

      const [, provider] = foundProvider;
      let providerValue = typeof provider === 'function'
        ? provider
        : provider.useClass || provider.useValue || provider.useFactory;

      const dependencies = this.getProviderDependencies(provider);



    }

    return null;
  }

  private getProviderDependencies(provider: Provider) {
    let dependencies: Key[];
    let injecteds: Key[];
    if (typeof provider === 'function') {
      dependencies = Metadata.ParamTypes.get(provider);
      injecteds = Metadata.Inject.get(provider);
    }
    if (typeof provider === 'object' && provider.useClass) {
      dependencies = Metadata.ParamTypes.get(provider.useClass)
      injecteds = Metadata.Inject.get(provider.useClass)
    }
    else return [];

    for(const k in injecteds)
      dependencies[k] = injecteds[k]

    return dependencies;
  }

  private getProviderScopeType(provider: Provider): InjectablePayload {
    let type;
    if (typeof provider === 'function') {
      if (
        (type = Metadata.Injectable.get(provider)) === undefined
      ) throw new Error(`Class ${provider.name} is not a injectable`)
    }
    if (typeof provider === 'object') {
      if (!provider.useClass) return 'transient';
      if (
        (type = Metadata.Injectable.get(provider)) === undefined
      ) throw new Error(`Class ${provider.useClass.name} is not a injectable`)
    }
    return type as InjectablePayload;
  }
}

