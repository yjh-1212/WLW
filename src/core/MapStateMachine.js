export const MAP_STATES = Object.freeze({
  COMBINED: 'COMBINED',
  EXPLODED: 'EXPLODED',
  FOCUS_INFRA: 'FOCUS_INFRA',
  FOCUS_OPERATION: 'FOCUS_OPERATION',
  FOCUS_DIGITAL: 'FOCUS_DIGITAL',
  PENETRATION: 'PENETRATION',
  TASK_TRACE: 'TASK_TRACE',
});

export const stateToLayer = {
  [MAP_STATES.FOCUS_INFRA]: 'infrastructure',
  [MAP_STATES.FOCUS_OPERATION]: 'operation',
  [MAP_STATES.FOCUS_DIGITAL]: 'digital',
};

/**
 * Decide which network's provincial cockpit to open when the user clicks a province.
 *
 * The single source of truth is what is currently on screen:
 *   - already inside a province -> keep that province's network;
 *   - a national single-network page (基础/运营/数字) -> drill into that same network;
 *   - a combined/exploded/penetration view -> plain three-layer province.
 *
 * We deliberately do NOT fall back to remembered layers such as `networkFocusLayer`
 * or `currentLayer`: those can go stale (e.g. after passing through 三层分解/三网合一)
 * and would make a province drill jump to the wrong network.
 */
export function resolveDrillNetworkLayer({
  selectedProvince = null,
  state = null,
  provinceOperationView = false,
  provinceInfrastructureView = false,
  provinceDigitalView = false,
} = {}) {
  if (selectedProvince) {
    if (provinceInfrastructureView) return 'infrastructure';
    if (provinceOperationView) return 'operation';
    if (provinceDigitalView) return 'digital';
    return null;
  }
  return state ? (stateToLayer[state] ?? null) : null;
}

export class MapStateMachine extends EventTarget {
  constructor(initialState = MAP_STATES.COMBINED) {
    super();
    this.state = initialState;
    this.previousState = null;
    this.context = {};
  }

  setState(state, context = {}) {
    if (!Object.values(MAP_STATES).includes(state)) throw new Error(`未知地图状态：${state}`);
    if (
      !context.force
      && this.state === state
      && (this.context?.province ?? null) === (context.province ?? null)
      && (this.context?.operationTaskId ?? null) === (context.operationTaskId ?? null)
      && (this.context?.entityId ?? null) === (context.entityId ?? null)
      && (this.context?.routeId ?? null) === (context.routeId ?? null)
      && (this.context?.featureId ?? null) === (context.featureId ?? null)
      && (this.context?.taskId ?? null) === (context.taskId ?? null)
      && Boolean(this.context?.story) === Boolean(context.story)
    ) return;
    const previous = this.state;
    this.previousState = previous;
    this.state = state;
    this.context = context;
    this.dispatchEvent(new CustomEvent('change', { detail: { state, previous, context } }));
  }

  back() {
    const target = this.previousState ?? MAP_STATES.COMBINED;
    this.setState(target);
  }
}
