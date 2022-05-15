# `@yuuza/utils`

## Classes

### Callbacks

Events in JS/TS with easy typing/autocompletion.

Example:

```ts
class MusicPlayer {
  onPlay = new Callbacks<() => void>();
  // ...
  play() {
    // ...
    // Call/invoke the callbacks:
    this.onPlay.invoke();
  }
}

const player = new MusicPlayer();
// ...
player.onPlay.add(() => {
  console.info("player play");
});
```

### Ref

Ref with `onChanged` callbacks.

Example:

```ts
class MusicPlayer {
  refState = new Ref<"stopped" | "playing" | "paused">("stopped");
  // ...
  play() {
    // ...
    this.refState.value = "playing";
  }
}

const player = new MusicPlayer();
// ...
player.refState.onChanged.add(() => {
  console.info("player current state:", player.refState.value);
});
```

### Semaphore

Example:

```ts
// Limit the concurrency of downloads
const downloadLimit = new Semaphore({ maxCount: 5 });
async function download() {
  // Will block/await here if >= 5 downloads currently running,
  await downloadLimit.enter();
  try {
    await actuallyDownload();
  } finally {
    downloadLimit.exit();
  }
}
```

Or shorter version with `run()`:

```ts
const downloadLimit = new Semaphore({ maxCount: 5 });
function download() {
  return downloadLimit.run(async () => {
    await actuallyDownload();
  });
}
```

### Lazy

### CancelToken

### AutoResetEvent

### EventRegistrations

## Functions

(TBD)

### strPadLeft

```ts
function strPadLeft(str: string, len: number, ch?: string): string;
```

### formatDuration

```ts
function formatDuration(sec: number | any): string;
```

### formatFileSize

```ts
function formatFileSize(size: number | any): string;
```

### formatDateTime

```ts
function formatDateTime(date: Date): string;
```

### numLimit

```ts
function numLimit(num: number, min: number, max: number): number;
```

### createName

```ts
function createName(
  nameFunc: (num: number) => string,
  existsFunc: (str: string) => boolean
): string;
```

### base64EncodeUtf8

```ts
function base64EncodeUtf8(str: any): string;
```

### sleepAsync

```ts
function sleepAsync(time: number): Promise<void>;
```

### arrayRemove

```ts
function arrayRemove<T>(array: T[], val: T): void;
```

### arrayInsert

```ts
function arrayInsert<T>(array: T[], val: T, pos?: number): void;
```

### arrayMap

```ts
function arrayMap<T, TRet>(
  arr: Iterable<T>,
  func: (item: T, idx: number) => TRet
): TRet[];
```

### arrayForeach

```ts
function arrayForeach<T>(
  arr: Iterable<T>,
  func: (item: T, idx: number) => void
): void;
```

### foreachFlaten

```ts
function foreachFlaten<T>(arr: T[], func: Action<T>): void;
```

### arrayFind

```ts
function arrayFind<T>(
  arr: Iterable<T>,
  func: (item: T, idx: number) => any
): T | null;
```

### arraySum

```ts
function arraySum<T>(
  arr: Iterable<T>,
  func: (item: T) => number | null | undefined
): number;
```

### objectApply

```ts
function objectApply<T>(
  obj: Partial<T>,
  kv?: Partial<T>,
  keys?: Array<keyof T>
): Partial<T>;
```

### objectInit

```ts
function objectInit<T>(obj: T, kv?: ObjectInit<T>, keys?: Array<keyof T>): T;
```

### mod

```ts
function mod(a: number, b: number): number;
```

### readBlobAsDataUrl

```ts
function readBlobAsDataUrl(blob: Blob): Promise<string>;
```
