import { Class, Provider } from "../types/types";
import Metadata from "./metadata";

export default class Container {
  private modules: Set<Class> = new Set();
  // [MODULE, CONTROLLER]
  private controllers: [Class, Class][] = [];
  // [MODULE, PROVIDER]
  private providers: [Class, Provider][] = [];
  
  public register(module: Class, visited: Class[]) {
    const moduleMetadata = Metadata.Module.get(module)
    if (!moduleMetadata) throw new Error(`Class ${module.name} is not a module.`)
    if (visited.includes(module)) throw new Error(`Circular import for module ${module.name}.`)

    const controllers = moduleMetadata.controllers ?? []
    const providers = moduleMetadata.providers ?? []
    const imports = moduleMetadata.imports ?? []

    for(const controller of controllers)
      this.registerController(controller, module)

    for(const provider of providers)
      this.registerProvider(provider, module)

    this.modules.add(module)

    for(const importModule of imports)
      this.register(importModule, [...visited, module])
  }

  private registerController(controller: Class, scope: Class) {
    this.controllers.push([scope, controller])
  }

  private registerProvider(provider: Provider, scope: Class) {
    this.providers.push([scope, provider])
  }
}
