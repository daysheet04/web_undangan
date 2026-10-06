import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

export const VERDANT_STAGE_COUNT = 5;

export const VERDANT_CINEMATIC_STAGES = Object.freeze([
  Object.freeze({ id: "intro", label: "Tampilan awal" }),
  Object.freeze({ id: "couple", label: "Informasi pasangan" }),
  Object.freeze({ id: "blessing", label: "Kalimat pembuka" }),
  Object.freeze({ id: "event", label: "Tanggal & acara" }),
  Object.freeze({ id: "location", label: "Lokasi" }),
]);

export const VERDANT_JOURNEY_PHASES = Object.freeze({
  CINEMATIC: "cinematic",
  EXITING: "exiting",
  NORMAL: "normal",
  ENTERING: "entering",
});

export const VERDANT_JOURNEY_DEFAULTS = Object.freeze({
  wheelThreshold: 72,
  wheelIdleMs: 170,
  swipeThreshold: 54,
  transitionMs: 920,
  viewportTransitionMs: 680,
  normalBoundaryTolerance: 4,
});

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable='true']",
  "[data-vv-gesture-ignore]",
].join(",");

const createControllerState = (stage) => ({
  phase: VERDANT_JOURNEY_PHASES.CINEMATIC,
  activeStage: clampStage(stage),
  fromStage: null,
  targetStage: null,
  direction: 0,
  isTransitioning: false,
  source: "initial",
});

export function clampStage(stage, stageCount = VERDANT_STAGE_COUNT) {
  const lastStage = Math.max(0, Number(stageCount || 1) - 1);
  const value = Number.isFinite(Number(stage)) ? Math.trunc(Number(stage)) : 0;
  return Math.min(lastStage, Math.max(0, value));
}

export function normalizeWheelDelta(deltaY, deltaMode = 0, pageSize = 800) {
  const value = Number(deltaY) || 0;
  if (deltaMode === 1) return value * 16;
  if (deltaMode === 2) return value * Math.max(1, Number(pageSize) || 800);
  return value;
}

/**
 * Pure wheel accumulator used by the hook and lightweight unit tests.
 * It deliberately discards the previous sum when the user reverses direction.
 */
export function accumulateWheelDelta(
  accumulator,
  delta,
  threshold = VERDANT_JOURNEY_DEFAULTS.wheelThreshold,
) {
  const numericDelta = Number(delta) || 0;
  const direction = Math.sign(numericDelta);
  const safeThreshold = Math.max(1, Number(threshold) || 1);
  const previous = accumulator || { total: 0, direction: 0 };

  if (!direction) {
    return { total: previous.total || 0, direction: previous.direction || 0, triggered: 0 };
  }

  const total = previous.direction && previous.direction !== direction
    ? numericDelta
    : (Number(previous.total) || 0) + numericDelta;

  if (Math.abs(total) >= safeThreshold) {
    return { total: 0, direction, triggered: direction };
  }

  return { total, direction, triggered: 0 };
}

export function getCinematicStageStatus(state, stage) {
  if (!state) return "inactive";
  if (state.isTransitioning && state.fromStage === stage) return "leaving";
  if (state.isTransitioning && state.targetStage === stage) return "entering";
  if (state.activeStage === stage) return "active";
  return "inactive";
}

export function getOffsetInsideScroller(node, scroller) {
  if (!node || !scroller) return 0;
  const nodeRect = node.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  return scroller.scrollTop + nodeRect.top - scrollerRect.top;
}

export function isInteractiveJourneyTarget(target) {
  return Boolean(target?.closest?.(INTERACTIVE_SELECTOR));
}

export function canScrollableAncestorConsume(target, direction, boundary) {
  const ElementConstructor = typeof Element === "undefined" ? null : Element;
  let node = ElementConstructor && target instanceof ElementConstructor ? target : null;
  const travelDirection = Math.sign(direction);

  while (node && node !== boundary) {
    const style = typeof window === "undefined"
      ? { overflowY: "visible" }
      : window.getComputedStyle(node);
    const canOverflow = node.hasAttribute("data-vv-scrollable")
      || style.overflowY === "auto"
      || style.overflowY === "scroll";

    if (canOverflow && node.scrollHeight > node.clientHeight + 1) {
      if (travelDirection > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true;
      if (travelDirection < 0 && node.scrollTop > 1) return true;
    }

    node = node.parentElement;
  }

  return false;
}

function resolveTarget(scroller, target, fallback) {
  if (target?.nodeType === 1) return target;
  if (target?.current?.nodeType === 1) return target.current;
  if (typeof target !== "string") return fallback || null;

  const selector = target.startsWith("#") ? target : `#${target}`;
  try {
    return scroller?.querySelector(selector)
      || (typeof document === "undefined" ? null : document.querySelector(selector))
      || fallback
      || null;
  } catch {
    return fallback || null;
  }
}

/**
 * Controls Verdant Vow's five-scene cinematic without coupling it to markup.
 * The component only needs to attach the returned refs and render scene classes
 * from getStageStatus(index).
 */
export default function useVerdantJourneyController({
  enabled = true,
  initialStage = 0,
  stageCount = VERDANT_STAGE_COUNT,
  wheelThreshold = VERDANT_JOURNEY_DEFAULTS.wheelThreshold,
  wheelIdleMs = VERDANT_JOURNEY_DEFAULTS.wheelIdleMs,
  swipeThreshold = VERDANT_JOURNEY_DEFAULTS.swipeThreshold,
  transitionMs = VERDANT_JOURNEY_DEFAULTS.transitionMs,
  viewportTransitionMs = VERDANT_JOURNEY_DEFAULTS.viewportTransitionMs,
  normalBoundaryTolerance = VERDANT_JOURNEY_DEFAULTS.normalBoundaryTolerance,
  onStageChange,
  onPhaseChange,
} = {}) {
  const safeStageCount = Math.max(1, Number(stageCount) || VERDANT_STAGE_COUNT);
  const lastStage = safeStageCount - 1;
  const scrollRef = useRef(null);
  const cinematicRef = useRef(null);
  const normalRef = useRef(null);
  const stateRef = useRef(createControllerState(clampStage(initialStage, safeStageCount)));
  const [, renderState] = useReducer((value) => value + 1, 0);
  const transitionTimerRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const mountedRef = useRef(false);
  const callbacksRef = useRef({ onStageChange, onPhaseChange });
  const reducedMotionRef = useRef(false);
  const touchRef = useRef(null);
  const wheelRef = useRef({
    total: 0,
    direction: 0,
    consumed: false,
    idle: true,
    idleTimer: 0,
    suppressNormalScroll: false,
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  callbacksRef.current = { onStageChange, onPhaseChange };

  const publishState = useCallback((nextOrUpdater) => {
    const previous = stateRef.current;
    const next = typeof nextOrUpdater === "function" ? nextOrUpdater(previous) : nextOrUpdater;
    if (!next || next === previous) return previous;
    stateRef.current = next;
    if (mountedRef.current) renderState();
    if (next.phase !== previous.phase) callbacksRef.current.onPhaseChange?.(next.phase, previous.phase);
    return next;
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current && typeof window !== "undefined") {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = 0;
  }, []);

  const clearScrollFrame = useCallback(() => {
    if (scrollFrameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = 0;
  }, []);

  const releaseWheelIfReady = useCallback(() => {
    const wheel = wheelRef.current;
    if (!wheel.idle || stateRef.current.isTransitioning) return;
    wheel.total = 0;
    wheel.direction = 0;
    wheel.consumed = false;
    wheel.suppressNormalScroll = false;
  }, []);

  const completeTransition = useCallback(() => {
    clearTransitionTimer();
    const current = stateRef.current;
    if (!current.isTransitioning) return false;

    if (current.phase === VERDANT_JOURNEY_PHASES.EXITING) {
      publishState({
        ...current,
        phase: VERDANT_JOURNEY_PHASES.NORMAL,
        fromStage: null,
        targetStage: null,
        direction: 0,
        isTransitioning: false,
      });
    } else if (current.phase === VERDANT_JOURNEY_PHASES.ENTERING) {
      publishState({
        ...current,
        phase: VERDANT_JOURNEY_PHASES.CINEMATIC,
        fromStage: null,
        targetStage: null,
        direction: 0,
        isTransitioning: false,
      });
    } else {
      const completedStage = clampStage(current.targetStage ?? current.activeStage, safeStageCount);
      publishState({
        ...current,
        activeStage: completedStage,
        fromStage: null,
        targetStage: null,
        direction: 0,
        isTransitioning: false,
      });
      callbacksRef.current.onStageChange?.(completedStage, {
        source: current.source,
        previousStage: current.fromStage,
      });
    }

    releaseWheelIfReady();
    return true;
  }, [clearTransitionTimer, publishState, releaseWheelIfReady, safeStageCount]);

  const scheduleTransitionCompletion = useCallback((duration) => {
    clearTransitionTimer();
    transitionTimerRef.current = window.setTimeout(completeTransition, Math.max(0, duration) + 34);
  }, [clearTransitionTimer, completeTransition]);

  const resetWheelGesture = useCallback(() => {
    const wheel = wheelRef.current;
    if (wheel.idleTimer) window.clearTimeout(wheel.idleTimer);
    wheel.total = 0;
    wheel.direction = 0;
    wheel.consumed = false;
    wheel.idle = true;
    wheel.idleTimer = 0;
    wheel.suppressNormalScroll = false;
  }, []);

  const markWheelActivity = useCallback(() => {
    const wheel = wheelRef.current;
    wheel.idle = false;
    if (wheel.idleTimer) window.clearTimeout(wheel.idleTimer);
    wheel.idleTimer = window.setTimeout(() => {
      wheel.idleTimer = 0;
      wheel.idle = true;
      wheel.total = 0;
      wheel.direction = 0;
      releaseWheelIfReady();
    }, Math.max(80, wheelIdleMs));
  }, [releaseWheelIfReady, wheelIdleMs]);

  const scrollToNode = useCallback((node, behavior = "smooth") => {
    const scroller = scrollRef.current;
    if (!scroller || !node) return false;
    scroller.scrollTo({
      top: Math.max(0, getOffsetInsideScroller(node, scroller)),
      behavior: reducedMotionRef.current ? "auto" : behavior,
    });
    return true;
  }, []);

  const startStageTransition = useCallback((requestedStage, source = "gesture") => {
    const current = stateRef.current;
    const targetStage = clampStage(requestedStage, safeStageCount);
    if (current.isTransitioning || current.phase !== VERDANT_JOURNEY_PHASES.CINEMATIC) return false;
    if (targetStage === current.activeStage) return false;
    const direction = Math.sign(targetStage - current.activeStage);

    if (reducedMotionRef.current || transitionMs <= 0) {
      publishState({
        ...current,
        activeStage: targetStage,
        fromStage: null,
        targetStage: null,
        direction: 0,
        isTransitioning: false,
        source,
      });
      callbacksRef.current.onStageChange?.(targetStage, {
        source,
        previousStage: current.activeStage,
      });
      releaseWheelIfReady();
      return true;
    }

    publishState({
      ...current,
      fromStage: current.activeStage,
      targetStage,
      direction,
      isTransitioning: true,
      source,
    });
    scheduleTransitionCompletion(transitionMs);
    return true;
  }, [publishState, releaseWheelIfReady, safeStageCount, scheduleTransitionCompletion, transitionMs]);

  const exitToNormal = useCallback((source = "gesture", target = null) => {
    const current = stateRef.current;
    if (current.isTransitioning) return false;
    const scroller = scrollRef.current;
    const destination = resolveTarget(scroller, target, normalRef.current);
    if (!scroller || !destination) return false;

    clearScrollFrame();
    wheelRef.current.suppressNormalScroll = source === "wheel";
    const immediate = reducedMotionRef.current || viewportTransitionMs <= 0;
    publishState({
      ...current,
      phase: immediate ? VERDANT_JOURNEY_PHASES.NORMAL : VERDANT_JOURNEY_PHASES.EXITING,
      activeStage: lastStage,
      fromStage: null,
      targetStage: null,
      direction: immediate ? 0 : 1,
      isTransitioning: !immediate,
      source,
    });

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      scrollToNode(destination, immediate ? "auto" : "smooth");
    });

    if (!immediate) scheduleTransitionCompletion(viewportTransitionMs);
    else releaseWheelIfReady();
    return true;
  }, [clearScrollFrame, lastStage, publishState, releaseWheelIfReady, scheduleTransitionCompletion, scrollToNode, viewportTransitionMs]);

  const reenterCinematic = useCallback((source = "gesture", requestedStage = lastStage) => {
    const current = stateRef.current;
    if (current.isTransitioning) return false;
    const scroller = scrollRef.current;
    const destination = cinematicRef.current;
    if (!scroller || !destination) return false;
    clearScrollFrame();
    const stage = clampStage(requestedStage, safeStageCount);
    const immediate = reducedMotionRef.current || viewportTransitionMs <= 0;

    publishState({
      ...current,
      phase: immediate ? VERDANT_JOURNEY_PHASES.CINEMATIC : VERDANT_JOURNEY_PHASES.ENTERING,
      activeStage: stage,
      fromStage: null,
      targetStage: null,
      direction: immediate ? 0 : -1,
      isTransitioning: !immediate,
      source,
    });
    callbacksRef.current.onStageChange?.(stage, {
      source,
      previousStage: current.activeStage,
    });

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      scrollToNode(destination, immediate ? "auto" : "smooth");
    });

    if (!immediate) scheduleTransitionCompletion(viewportTransitionMs);
    else releaseWheelIfReady();
    return true;
  }, [clearScrollFrame, lastStage, publishState, releaseWheelIfReady, safeStageCount, scheduleTransitionCompletion, scrollToNode, viewportTransitionMs]);

  const advance = useCallback((direction, source = "gesture") => {
    const current = stateRef.current;
    const travelDirection = Math.sign(direction);
    if (!travelDirection || current.isTransitioning) return false;

    if (current.phase === VERDANT_JOURNEY_PHASES.NORMAL) {
      return travelDirection < 0 ? reenterCinematic(source, lastStage) : false;
    }
    if (current.phase !== VERDANT_JOURNEY_PHASES.CINEMATIC) return false;

    const nextStage = current.activeStage + travelDirection;
    if (nextStage > lastStage) return exitToNormal(source);
    if (nextStage < 0) return false;
    return startStageTransition(nextStage, source);
  }, [exitToNormal, lastStage, reenterCinematic, startStageTransition]);

  const navigateToCinematic = useCallback((stage, { animate = true, source = "navigation" } = {}) => {
    const targetStage = clampStage(stage, safeStageCount);
    const current = stateRef.current;
    resetWheelGesture();

    if (current.phase === VERDANT_JOURNEY_PHASES.CINEMATIC) {
      if (!animate || reducedMotionRef.current) {
        clearTransitionTimer();
        clearScrollFrame();
        publishState({
          ...current,
          activeStage: targetStage,
          fromStage: null,
          targetStage: null,
          direction: 0,
          isTransitioning: false,
          source,
        });
        callbacksRef.current.onStageChange?.(targetStage, {
          source,
          previousStage: current.activeStage,
        });
        return true;
      }
      return startStageTransition(targetStage, source);
    }

    clearTransitionTimer();
    clearScrollFrame();
    const scroller = scrollRef.current;
    const destination = cinematicRef.current;
    if (!scroller || !destination) return false;
    const immediate = !animate || reducedMotionRef.current || viewportTransitionMs <= 0;
    publishState({
      ...current,
      phase: immediate ? VERDANT_JOURNEY_PHASES.CINEMATIC : VERDANT_JOURNEY_PHASES.ENTERING,
      activeStage: targetStage,
      fromStage: null,
      targetStage: null,
      direction: immediate ? 0 : -1,
      isTransitioning: !immediate,
      source,
    });
    callbacksRef.current.onStageChange?.(targetStage, {
      source,
      previousStage: current.activeStage,
    });
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      scrollToNode(destination, immediate ? "auto" : "smooth");
    });
    if (!immediate) scheduleTransitionCompletion(viewportTransitionMs);
    return true;
  }, [clearScrollFrame, clearTransitionTimer, publishState, resetWheelGesture, safeStageCount, scheduleTransitionCompletion, scrollToNode, startStageTransition, viewportTransitionMs]);

  const navigateToNormal = useCallback((target, { behavior = "smooth", source = "navigation" } = {}) => {
    clearTransitionTimer();
    clearScrollFrame();
    resetWheelGesture();
    const scroller = scrollRef.current;
    const destination = resolveTarget(scroller, target, normalRef.current);
    if (!scroller || !destination) return false;
    const current = stateRef.current;

    // Setting NORMAL before scrolling hides every cinematic panel, so direct
    // navigation cannot flash the intermediate scenes.
    publishState({
      ...current,
      phase: VERDANT_JOURNEY_PHASES.NORMAL,
      activeStage: lastStage,
      fromStage: null,
      targetStage: null,
      direction: 0,
      isTransitioning: false,
      source,
    });
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      scrollToNode(destination, behavior);
    });
    return true;
  }, [clearScrollFrame, clearTransitionTimer, lastStage, publishState, resetWheelGesture, scrollToNode]);

  const resetJourney = useCallback((stage = initialStage) => {
    clearTransitionTimer();
    clearScrollFrame();
    resetWheelGesture();
    const next = createControllerState(clampStage(stage, safeStageCount));
    publishState(next);
    const destination = cinematicRef.current;
    if (destination) scrollToNode(destination, "auto");
  }, [clearScrollFrame, clearTransitionTimer, initialStage, publishState, resetWheelGesture, safeStageCount, scrollToNode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotionRef.current = query.matches;
      setPrefersReducedMotion(query.matches);
      if (query.matches && stateRef.current.isTransitioning) completeTransition();
    };
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, [completeTransition]);

  useEffect(() => {
    if (!enabled) return undefined;
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const consumeWheel = (delta) => {
      const wheel = wheelRef.current;
      markWheelActivity();
      if (wheel.consumed || stateRef.current.isTransitioning) return 0;
      const result = accumulateWheelDelta(wheel, delta, wheelThreshold);
      wheel.total = result.total;
      wheel.direction = result.direction;
      if (result.triggered) {
        wheel.consumed = true;
        wheel.total = 0;
      }
      return result.triggered;
    };

    const handleWheel = (event) => {
      const current = stateRef.current;
      const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, scroller.clientHeight);
      if (!delta) return;

      if (current.phase !== VERDANT_JOURNEY_PHASES.NORMAL) {
        event.preventDefault();
        const triggered = consumeWheel(delta);
        if (triggered) advance(triggered, "wheel");
        return;
      }

      const wheel = wheelRef.current;
      if (wheel.suppressNormalScroll && !wheel.idle) {
        event.preventDefault();
        markWheelActivity();
        return;
      }

      if (delta >= 0 || canScrollableAncestorConsume(event.target, delta, scroller)) return;
      if (!normalRef.current) return;
      const normalStart = getOffsetInsideScroller(normalRef.current, scroller);
      const reachesBoundary = scroller.scrollTop <= normalStart + normalBoundaryTolerance
        || scroller.scrollTop + delta <= normalStart + normalBoundaryTolerance;
      if (!reachesBoundary) return;

      event.preventDefault();
      scroller.scrollTop = normalStart;
      const triggered = consumeWheel(delta);
      if (triggered < 0) advance(-1, "wheel");
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1 || isInteractiveJourneyTarget(event.target)) {
        touchRef.current = null;
        return;
      }
      const touch = event.touches[0];
      touchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        target: event.target,
        yielded: false,
      };
    };

    const handleTouchMove = (event) => {
      const gesture = touchRef.current;
      if (!gesture || event.touches.length !== 1) return;
      const touch = event.touches[0];
      gesture.lastX = touch.clientX;
      gesture.lastY = touch.clientY;
      const delta = gesture.y - touch.clientY;
      const current = stateRef.current;

      if (canScrollableAncestorConsume(gesture.target, delta, scroller)) {
        gesture.yielded = true;
        return;
      }

      if (current.phase !== VERDANT_JOURNEY_PHASES.NORMAL) {
        event.preventDefault();
        return;
      }

      if (delta >= 0) return;
      if (!normalRef.current) return;
      const normalStart = getOffsetInsideScroller(normalRef.current, scroller);
      if (scroller.scrollTop <= normalStart + normalBoundaryTolerance) {
        event.preventDefault();
        scroller.scrollTop = normalStart;
      }
    };

    const handleTouchEnd = () => {
      const gesture = touchRef.current;
      touchRef.current = null;
      if (!gesture || gesture.yielded || stateRef.current.isTransitioning) return;
      const deltaY = gesture.y - gesture.lastY;
      const deltaX = gesture.x - gesture.lastX;
      if (Math.abs(deltaY) < swipeThreshold || Math.abs(deltaY) <= Math.abs(deltaX) * 1.12) return;

      const direction = Math.sign(deltaY);
      const current = stateRef.current;
      if (current.phase === VERDANT_JOURNEY_PHASES.NORMAL) {
        if (direction >= 0) return;
        if (!normalRef.current) return;
        const normalStart = getOffsetInsideScroller(normalRef.current, scroller);
        if (scroller.scrollTop > normalStart + normalBoundaryTolerance) return;
      }
      advance(direction, "swipe");
    };

    const handleTouchCancel = () => {
      touchRef.current = null;
    };

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    scroller.addEventListener("touchstart", handleTouchStart, { passive: true });
    scroller.addEventListener("touchmove", handleTouchMove, { passive: false });
    scroller.addEventListener("touchend", handleTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      scroller.removeEventListener("wheel", handleWheel);
      scroller.removeEventListener("touchstart", handleTouchStart);
      scroller.removeEventListener("touchmove", handleTouchMove);
      scroller.removeEventListener("touchend", handleTouchEnd);
      scroller.removeEventListener("touchcancel", handleTouchCancel);
      touchRef.current = null;
    };
  }, [advance, enabled, markWheelActivity, normalBoundaryTolerance, swipeThreshold, wheelThreshold]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTransitionTimer();
      clearScrollFrame();
      resetWheelGesture();
    };
  }, [clearScrollFrame, clearTransitionTimer, resetWheelGesture]);

  const state = stateRef.current;
  const visualStage = state.isTransitioning && state.targetStage !== null
    ? state.targetStage
    : state.activeStage;
  const getStageStatus = useCallback((stage) => getCinematicStageStatus(stateRef.current, stage), []);

  return useMemo(() => ({
    scrollRef,
    cinematicRef,
    normalRef,
    phase: state.phase,
    activeStage: state.activeStage,
    visualStage,
    fromStage: state.fromStage,
    targetStage: state.targetStage,
    direction: state.direction,
    isTransitioning: state.isTransitioning,
    prefersReducedMotion,
    getStageStatus,
    next: () => advance(1, "control"),
    previous: () => advance(-1, "control"),
    navigateToCinematic,
    navigateToNormal,
    exitToNormal,
    reenterCinematic,
    completeTransition,
    resetJourney,
  }), [
    advance,
    completeTransition,
    exitToNormal,
    getStageStatus,
    navigateToCinematic,
    navigateToNormal,
    prefersReducedMotion,
    reenterCinematic,
    resetJourney,
    state.activeStage,
    state.direction,
    state.fromStage,
    state.isTransitioning,
    state.phase,
    state.targetStage,
    visualStage,
  ]);
}
