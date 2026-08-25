import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only runs once, with the last call's args, after the delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("first");
    debounced("second");
    debounced("third");

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("resets the delay on every call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("a");
    vi.advanceTimersByTime(400);
    debounced("b");
    vi.advanceTimersByTime(400);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("flush runs a pending call immediately and cancels the timer", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("x");
    debounced.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("x");

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush is a no-op when nothing is pending", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced.flush();
    expect(fn).not.toHaveBeenCalled();
  });
});
