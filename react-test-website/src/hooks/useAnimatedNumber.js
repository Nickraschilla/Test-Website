import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(targetValue, options = {}) {
  const {
    enabled = true,
    pulseDuration = 1400,
    animateOnMount = true,
    changeKey,
  } = options;
  const numericTarget = Number(targetValue || 0);
  const effectiveChangeKey = changeKey ?? numericTarget;
  const previousValueRef = useRef(0);
  const previousChangeKeyRef = useRef(effectiveChangeKey);
  const initialValueRef = useRef(true);
  const timeoutRef = useRef(null);
  const [animationState, setAnimationState] = useState("idle");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled) {
      previousValueRef.current = numericTarget;
      previousChangeKeyRef.current = effectiveChangeKey;
      initialValueRef.current = false;
      setAnimationState("idle");
      return undefined;
    }

    let nextAnimationState = "idle";

    if (initialValueRef.current) {
      initialValueRef.current = false;
      if (animateOnMount && numericTarget !== 0) {
        nextAnimationState = numericTarget > 0 ? "increase" : "decrease";
      }
    } else {
      const previousValue = previousValueRef.current;
      const previousChangeKey = previousChangeKeyRef.current;
      const didTrackedChangeOccur = previousChangeKey !== effectiveChangeKey;

      if (didTrackedChangeOccur && previousValue !== numericTarget) {
        nextAnimationState = numericTarget > previousValue ? "increase" : "decrease";
      }
    }

    previousValueRef.current = numericTarget;
    previousChangeKeyRef.current = effectiveChangeKey;

    if (nextAnimationState === "idle") {
      setAnimationState("idle");
      return undefined;
    }

    setAnimationState(nextAnimationState);

    timeoutRef.current = window.setTimeout(() => {
      setAnimationState("idle");
      timeoutRef.current = null;
    }, pulseDuration);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [animateOnMount, effectiveChangeKey, enabled, numericTarget, pulseDuration]);

  return {
    displayValue: numericTarget,
    animationState,
    isAnimating: animationState !== "idle",
  };
}
