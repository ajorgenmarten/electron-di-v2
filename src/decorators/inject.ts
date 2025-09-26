import Metadata from "../core/metadata";

export function Inject(key: string): ParameterDecorator {
  return (target: Object, _, paramIndex: number) => 
    Metadata.Inject.set(target, paramIndex, key)
}
