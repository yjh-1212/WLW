import './styles/main.css';
import { AppShell } from './ui/AppShell.js';
import { LayerDataManager } from './data/LayerDataManager.js';
import { MapRuntime } from './core/MapRuntime.js';

const shell = new AppShell(document.querySelector('#app'));
const dataManager = new LayerDataManager();

try {
  const data = await dataManager.loadInitial();
  const runtime = new MapRuntime({ canvas: shell.canvas, ui: shell, data, dataManager });
  shell.bindRuntime(runtime, data);
  await runtime.init();
  shell.hideLoading();
  window.__LOGISTICS_MAP__ = runtime;
} catch (error) {
  console.error(error);
  shell.showError(error instanceof Error ? error.message : '未知错误');
}
