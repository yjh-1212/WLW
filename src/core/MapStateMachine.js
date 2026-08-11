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

export class MapStateMachine extends EventTarget {
  constructor(initialState = MAP_STATES.COMBINED) {
    super();
    this.state = initialState;
    this.previousState = null;
    this.context = {};
  }

  setState(state, context = {}) {
    if (!Object.values(MAP_STATES).includes(state)) throw new Error(`未知地图状态：${state}`);
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
