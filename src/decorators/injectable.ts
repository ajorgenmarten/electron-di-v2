import Metadata from "../core/metadata"
import { InjectablePayload } from "../types/types"

export function Injectable(type: InjectablePayload = "singleton"): ClassDecorator {
  return (target) => 
    Metadata.Injectable.set(target, type)
}
