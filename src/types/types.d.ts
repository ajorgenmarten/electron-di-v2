export type Class<T = any> = new (...args: any[]) => T;
export type ProviderConfig = {
  provided: Class | string,
  useClass?: Class,
  useValue?: any,
  useFactory?: Function,
}
export type Provider = Class | ProviderConfig
export type ModulePayload = {
  exports?: (Class | string)[],
  controllers?: Class[],
  providers?: Provider[],
  imports?: Class[],
}
export type InjectablePayload = "transient" | "singleton"
