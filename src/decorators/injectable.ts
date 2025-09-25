import Metadata from "../core/metadata"

export function Injectable(type: "transient" | "singleton" = "singleton"): ClassDecorator {
  return (target) => {
    Metadata.Injectable.set(target, type)
  }
}
