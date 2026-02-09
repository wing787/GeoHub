/**
 * 背景地図切り替えコントロール
 */
import { getAllBasemaps } from '../map/basemaps.js';

let currentBasemapId = 'gsi-standard';
let onBasemapChange = null;

/**
 * 背景地図コントロールを初期化
 * @param {Function} callback - 背景地図変更時のコールバック関数
 */
export function initBasemapControl(callback) {
  onBasemapChange = callback;

  const basemaps = getAllBasemaps();
  const container = createControlContainer(basemaps);

  // 地図コンテナに追加
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.appendChild(container);
  }

  console.log('GeoHub: Basemap control initialized');
}

/**
 * コントロールのHTMLを作成
 */
function createControlContainer(basemaps) {
  const container = document.createElement('div');
  container.className = 'basemap-control';
  container.id = 'basemap-control';

  // ラベル
  const label = document.createElement('label');
  label.className = 'basemap-label';
  label.textContent = '背景地図';

  // セレクトボックス
  const select = document.createElement('select');
  select.className = 'basemap-select';
  select.id = 'basemap-select';

  // 各背景地図をオプションとして追加
  basemaps.forEach(basemap => {
    const option = document.createElement('option');
    option.value = basemap.id;
    option.textContent = basemap.name;
    if (basemap.id === currentBasemapId) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  // 変更イベント
  select.addEventListener('change', (e) => {
    const newBasemapId = e.target.value;
    handleBasemapChange(newBasemapId);
  });

  container.appendChild(label);
  container.appendChild(select);

  return container;
}

/**
 * 背景地図変更をハンドル
 */
function handleBasemapChange(basemapId) {
  if (basemapId === currentBasemapId) return;

  currentBasemapId = basemapId;

  if (onBasemapChange) {
    onBasemapChange(basemapId);
  }

  console.log(`GeoHub: Basemap changed to ${basemapId}`);
}

/**
 * 現在の背景地図IDを取得
 */
export function getCurrentBasemapId() {
  return currentBasemapId;
}

/**
 * 背景地図を設定（プログラムから変更）
 */
export function setBasemap(basemapId) {
  const select = document.getElementById('basemap-select');
  if (select) {
    select.value = basemapId;
    handleBasemapChange(basemapId);
  }
}
