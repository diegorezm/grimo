import { describe, expect, it } from "vitest";
import {
  changeFocusMode,
  focusClock,
  focusRestMs,
  pauseFocus,
  restoreFocus,
  resumeFocus,
  serializeFocus,
  settleFocus,
  skipFocusPhase,
  startFocus,
} from "./focus";

const MIN = 60_000;

describe("reading focus timer", () => {
  it("counts down the reading block, then the break", () => {
    const state = startFocus("classic", 0);
    expect(focusClock(state, 0, 10 * MIN)).toMatchObject({
      remainingMs: 15 * MIN,
      readingMs: 10 * MIN,
    });
    const inBreak = settleFocus(state, 27 * MIN);
    expect(inBreak).toMatchObject({ phase: "break", cycle: 1 });
    expect(focusClock(inBreak, 0, 27 * MIN)).toMatchObject({
      remainingMs: 3 * MIN,
      readingMs: 25 * MIN,
    });
  });

  it("catches up on phases that ended with the tab closed", () => {
    const state = settleFocus(startFocus("classic", 0), 61 * MIN);
    expect(state).toMatchObject({ phase: "reading", cycle: 3, restMs: 10 * MIN });
    expect(focusClock(state, 0, 61 * MIN).readingMs).toBe(51 * MIN);
  });

  it("does not count a pause as reading, and the clock waits", () => {
    const paused = pauseFocus(startFocus("classic", 0), 10 * MIN);
    expect(settleFocus(paused, 90 * MIN).phase).toBe("reading");
    expect(focusClock(paused, 0, 20 * MIN)).toMatchObject({
      remainingMs: 15 * MIN,
      readingMs: 10 * MIN,
    });
    const resumed = resumeFocus(paused, 20 * MIN);
    expect(focusClock(resumed, 0, 25 * MIN)).toMatchObject({
      remainingMs: 10 * MIN,
      readingMs: 15 * MIN,
    });
  });

  it("does not count a pause twice during a break", () => {
    const inBreak = settleFocus(startFocus("classic", 0), 26 * MIN);
    const paused = pauseFocus(inBreak, 26 * MIN);
    expect(focusRestMs(paused, 28 * MIN)).toBe(3 * MIN);
    expect(focusRestMs(resumeFocus(paused, 28 * MIN), 28 * MIN)).toBe(3 * MIN);
  });

  it("restores only the timer of this session", () => {
    const session = { entryId: "a", startedAt: 100 * MIN };
    const saved = serializeFocus("a", startFocus("long", 100 * MIN));
    expect(restoreFocus(saved, "free", session).mode).toBe("long");
    expect(
      restoreFocus(serializeFocus("b", startFocus("long", 100 * MIN)), "free", session).mode,
    ).toBe("free");
    expect(restoreFocus(serializeFocus("a", startFocus("long", 0)), null, session).mode).toBe(
      "classic",
    );
    expect(restoreFocus("{broken", "nope", session).mode).toBe("classic");
  });

  it("skips a phase", () => {
    const inBreak = skipFocusPhase(startFocus("classic", 0), 10 * MIN);
    expect(inBreak.phase).toBe("break");
    const reading = skipFocusPhase(inBreak, 12 * MIN);
    expect(reading).toMatchObject({ phase: "reading", cycle: 2, restMs: 2 * MIN });
  });

  it("never ends a phase in the free mode, and keeps rest when changing mode", () => {
    const free = settleFocus(startFocus("free", 0), 500 * MIN);
    expect(free.phase).toBe("reading");
    expect(focusClock(free, 0, 500 * MIN)).toMatchObject({ remainingMs: null, progress: null });

    const inBreak = settleFocus(startFocus("classic", 0), 27 * MIN);
    const changed = changeFocusMode(inBreak, "long", 27 * MIN);
    expect(changed).toMatchObject({ mode: "long", phase: "reading", restMs: 2 * MIN });
  });
});
