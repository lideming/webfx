export type HookedFunction<T extends Function> = T & {
  hookOriginal: T;
  hookMiddlewares: Array<(next) => T>;
};

const hookedMethods = {
  toString() {
    return this.hookOriginal.toString().replace(/\{/, "{ /* hooked */ ");
  },
};

export function hookFunction<T extends object, K extends keyof T>(
  obj: T,
  name: K,
  middleware: (next) => T[K],
): T[K] extends Function ? HookedFunction<T[K]> : never {
  const func = obj[name] as Function;
  if (typeof func !== "function") {
    throw new Error(`Property ${String(name)} is not a function`);
  }

  let hooked: HookedFunction<Function> = func as any;

  if (!hooked.hookMiddlewares) {
    hooked = function (this: any, ...args) {
      const next =
        (index: number) =>
        (...args) => {
          if (index < hooked.hookMiddlewares.length) {
            return hooked.hookMiddlewares[index](next(index + 1)).apply(
              this,
              args,
            );
          } else {
            return hooked.hookOriginal.apply(this, args);
          }
        };
      return next(0)(...args);
    } as HookedFunction<any>;
    hooked.hookOriginal = func;
    hooked.hookMiddlewares = [];
    hooked.toString = hookedMethods.toString;

    Object.defineProperty(obj, name, {
      value: hooked,
      writable: true,
      configurable: true,
    });
  }

  hooked.hookMiddlewares.unshift(middleware as any);
  return hooked as any;
}
