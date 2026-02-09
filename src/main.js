/**
 * GeoHub - メインエントリーポイント
 */
import { initMap, switchBasemap } from './map/mapInstance.js';
import { initPanel } from './ui/panel.js';
import { initBasemapControl } from './ui/basemapControl.js';
import { initLayerManager } from './map/layerManager.js';
import { initLayerPanel, updateLayerList } from './ui/layerPanel.js';

/**
 * アプリケーション初期化
 */
function initApp() {
  console.log('GeoHub: Initializing application...');

  // 地図を初期化
  const map = initMap('map');

  // サイドパネルを初期化
  initPanel();

  // レイヤーマネージャーを初期化
  initLayerManager((layers) => {
    // レイヤー変更時にパネルを更新
    updateLayerList(layers);
  });

  // レイヤーパネルを初期化
  initLayerPanel();

  // 背景地図コントロールを初期化
  initBasemapControl((basemapId) => {
    // 背景地図変更時に地図を更新
    switchBasemap(basemapId);
  });

  console.log('GeoHub: Application initialized successfully');
}

// DOMContentLoaded時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
