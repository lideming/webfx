import { Callbacks } from "@yuuza/utils";

const cbs = new Array(100).fill(0).map((x) => () => {});

for (let N = 1; N <= 100; ) {
  console.time("test " + N);
  for (let i = 0; i < 1_000_000; i++) {
    const cb = new Callbacks();
    for (let j = 0; j < N; j++) {
      cb.add(cbs[j]);
    }
    for (let j = 0; j < N; j++) {
      cb.remove(cbs[j]);
    }
  }
  console.timeEnd("test " + N);
  if (N < 15) N++;
  else if (N < 50) N += 5;
  else N += 10;
}
