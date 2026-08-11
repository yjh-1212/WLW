export const MAP_THEME_PRIMARY = '#33C7FF';

export const MAP_THEME = {
  background: '#06111f',
  backgroundDeep: '#020712',
  surface: '#081827',
  surfaceRaised: '#0d2337',
  map: '#10253a',
  mapBright: '#173a55',
  mapMuted: '#0b1b2c',
  mapOutline: '#5f8fb4',
  primary: MAP_THEME_PRIMARY,
  primarySoft: '#67d9ff',
  text: '#edf8ff',
  textMuted: '#89a9bd',
  border: 'rgba(51, 199, 255, 0.20)',

  // Three-network semantic palette. Keep these colors stable across map, UI and effects.
  infrastructure: '#FFB547',
  infrastructureSurface: '#9B5417',
  infrastructureBright: '#FFD277',
  infrastructureSide: '#6F3409',
  operation: '#35B9FF',
  operationSurface: '#0B67B7',
  operationBright: '#82D8FF',
  operationSide: '#06477F',
  digital: '#46E69A',
  digitalSurface: '#168E63',
  digitalBright: '#91F7C7',
  digitalSide: '#0B5C40',

  routeAxis: '#FFCC58',
  routeCorridor: '#52E29B',
  routeChannel: '#58BFFF',
  danger: '#FF6B6B',
};

export const toNumberColor = (value) => Number.parseInt(value.replace('#', ''), 16);
