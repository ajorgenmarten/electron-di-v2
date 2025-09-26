import { Class, InjectablePayload, ModulePayload, Provider } from "../types/types";
import Metadata from "./metadata";
import { ArrayPipes, Reflector } from "./utilities";

type Key = Class | string

class ProviderHelpers {
  static getKey(provider: Provider): Key {
    return typeof provider === 'function'
      ? provider
      : provider.provided
  }

  static getScopeType(provider: Provider): InjectablePayload {
    if (typeof provider === 'function') {
      const scope = Metadata.Injectable.get(provider)
      if (!scope) throw new NotInjectableError(provider.name);
      return scope;
    }
    if (provider.useClass) {
      const scope = Metadata.Injectable.get(provider.useClass)
      if (!scope) throw new NotInjectableError(provider.useClass.name);
      return scope;
    }
    if (provider.useFactory) return 'singleton';
    return 'transient'
  }

  static getDependencyKeys(provider: Provider): Key[] {
    let dependencies: Key[];
    let injects: Key[];

    if (typeof provider === 'function') {
      dependencies = Metadata.ParamTypes.get(provider)
      injects = Metadata.Inject.get(provider)
    } else {
      if (!provider.useClass) return []
      dependencies = Metadata.ParamTypes.get(provider.useClass)
      injects = Metadata.Inject.get(provider.useClass)
    }
    
    if (!dependencies) {
      const providedKey = this.getKey(provider);
      throw new NotClassError(
        typeof providedKey === 'function'
          ? providedKey.name : providedKey
      )
    }
      

    for(const k in injects)
      dependencies[k] = injects[k]

    return dependencies;
  }
}

class ProviderFinder {
  constructor(
    private modules: [Class, ModulePayload][] = [],
    private instances: [Class, Key, any][] = [],
    private providers: [Class, Provider][] = [],
    private exports: [Class, Key][] = [],
  ) {}

  public findInstance(providerKey: Key, moduleScope: Class) {
    return ArrayPipes.getInstance(this.instances)
      .findPipes(
        ([v]) => v === moduleScope,
        ([,k]) => k === providerKey,
      )
  }

  public findInScope(providerKey: Key, moduleScope: Class) {
    return ArrayPipes.getInstance(this.providers)
      .findPipes(
        ([v]) => v === moduleScope,
        ([,p]) => ProviderHelpers.getKey(p) === providerKey
      )
  }

  public findInShared(providerKey: Key, moduleScope: Class) {
    const sharedModules = this.modules.find(([module]) => {
      return module === moduleScope
    })?.[1].imports ?? []

    const exportedProvider = ArrayPipes.getInstance(this.exports)
      .findPipes(
        ([module]) => sharedModules.includes(module),
        ([,key]) => providerKey === key
      )

    if (!exportedProvider) return undefined;

    const [sharedModule] = exportedProvider
    return this.findInScope(providerKey, sharedModule);
  }
}

class Container {
  // { Modulo: Payload }
  private modules: [Class, ModulePayload][] = []
  // { Modulo: Controller }
  private controllers: [Class, Class][] = []
  // { Modulo: Provider }
  private providers: [Class, Provider][] = []
  // { Modulo: Provider Key }
  private exports: [Class, Key][] = []
  // { Modulo: { ProviderKey: instance } }
  private instances: [Class, Key, any][] = []

  private finder: ProviderFinder;

  constructor() {
    this.finder = new ProviderFinder(
      this.modules,
      this.instances,
      this.providers,
      this.exports,
    );
  }

  public register(module: Class, visited: Class[] = []) {
    const metadata = Metadata.Module.get(module);
    if (!metadata) throw new NotModuleError(module.name);
    if (visited.includes(module)) throw new CircularDependencyError(module.name);

    const { controllers, providers, imports, exports } = metadata;
    for(const controller of controllers ?? [])
      this.controllers.push([module, controller]);

    for (const provider of providers ?? [])
      this.providers.push([module, provider]);

    for(const exportp of exports ?? [])
      this.exports.push([module, exportp])

    this.modules.push([module, metadata]);

    for(const importModule of imports ?? [])
      this.register(importModule, [...visited, module])
  }

  public resolve(providerKey: Key, scopeModule: Class, providersVisited: Key[]): any {
    const utilities = [Reflector];

    if (typeof providerKey === 'function' && utilities.includes(providerKey))
      return utilities.find(u => u === providerKey);

    if (providersVisited.includes(providerKey))
      throw new CircularDependencyError(typeof providerKey === 'function' ? providerKey.name : providerKey);

    // Buscar si existe una instancia
    const instance = this.finder.findInstance(providerKey, scopeModule);

    if (typeof instance !== 'undefined') return instance[2];

    // Buscar si existe en el scope actual
    const providerInScope = this.finder.findInScope(providerKey, scopeModule);

    if (providerInScope) {
      const [, provider] = providerInScope;
      const dependencies = ProviderHelpers.getDependencyKeys(provider);
      const scopeType = ProviderHelpers.getScopeType(provider);
      return this.createInstance(provider, dependencies, scopeModule, scopeType, providersVisited);
    }

    const providerInSharedModules = this.finder.findInShared(providerKey, scopeModule)

    if (providerInSharedModules) {
      const [module, provider] = providerInSharedModules;
      const dependencies = ProviderHelpers.getDependencyKeys(provider);
      const scopeType = ProviderHelpers.getScopeType(provider);
      return this.createInstance(provider, dependencies, module, scopeType, providersVisited);
    }

    const globalModules = this.modules.filter(([globalModule]) => Metadata.Global.get(globalModule))

    for(const globalModule of globalModules) {
      const result = this.resolve(providerKey, globalModule[0], providersVisited)
      if (typeof result === 'undefined') continue;
      return result;
    }

    return undefined;
  }

  private createInstance(
    provider: Provider,
    dependencies: Key[],
    scopeModule: Class,
    scopeType: InjectablePayload,
    providersVisited: Key[]
  ): any {
    const providerKey = ProviderHelpers.getKey(provider);
    const resolvedDependencies = dependencies
      .map(k => this.resolve(k, scopeModule, [...providersVisited, providerKey]))
    const instance = typeof provider === 'function'
      ? new (provider)(...resolvedDependencies)
      : provider.useClass
        ? new (provider.useClass)(...resolvedDependencies)
        : provider.useValue
          ? provider.useValue
          : provider.useFactory
    if (scopeType === 'singleton')
      this.instances.push([scopeModule, providerKey, instance])
    return instance;
  }
}

// MANEJO DE ERRORES
class ContainerError extends Error {
  private code: string;
  constructor(message: string, code: string) {
    super(message)
    this.code = code;
    this.name = 'ContainerError';
  }
}
class CircularDependencyError extends ContainerError {
  constructor(item: string) {
    super(
      `Circular dependency detected for ${item}`,
      'CIRCULAR_DEPENDENCY'
    )
  }
}
class NotInjectableError extends ContainerError {
  constructor(item: string) {
    super(
      `Class ${item} is not injectable`,
      'NOT_INJECTABLE'
    );
  }
}
class NotModuleError extends ContainerError {
  constructor(item: string) {
    super(
      `Class ${item} is not a module`,
      'NOT_MODULE'
    )
  }
}
class NotClassError extends ContainerError {
  constructor(item: string) {
    super(`Value provided for ${item} is not a class`, 'NOT_CLASS')
  }
}
