/**
 * レイヤーパネルの管理
 */
import { getAllLayers, setLayerVisibility, setLayerOpacity, removeLayer } from '../map/layerManager.js';
import { getMap } from '../map/mapInstance.js';

let currentTab = 'layers';

/**
 * レイヤーパネルを初期化
 */
export function initLayerPanel() {
  setupTabs();
  setupAddLayerButton();
  console.log('GeoHub: Layer panel initialized');
}

/**
 * タブ切り替えを設定
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // すべてのタブボタンとコンテンツから active を削除
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // クリックされたタブを有効化
      button.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabName}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      currentTab = tabName;
    });
  });
}

/**
 * レイヤー追加ボタンの設定
 */
function setupAddLayerButton() {
  const addButton = document.getElementById('btn-add-layer');
  if (addButton) {
    addButton.addEventListener('click', showAddLayerDialog);
  }
}

/**
 * レイヤー追加ダイアログを表示（簡易実装）
 */
function showAddLayerDialog() {
  // 将来的にはモーダルダイアログで実装
  alert('レイヤー追加機能は今後実装予定です。\n\nS3上のカスタムタイルやGeoJSONデータを読み込めるようになります。');
}

/**
 * レイヤーリストを更新
 */
export function updateLayerList(layers) {
  const layerListContainer = document.getElementById('layer-list');
  if (!layerListContainer) return;

  // レイヤーがない場合
  if (!layers || layers.length === 0) {
    layerListContainer.innerHTML = '<p class="panel-placeholder">レイヤーがありません</p>';
    return;
  }

  // レイヤーリストを生成
  layerListContainer.innerHTML = '';

  layers.forEach(layer => {
    const layerItem = createLayerItem(layer);
    layerListContainer.appendChild(layerItem);
  });
}

/**
 * レイヤーアイテムのHTMLを作成
 */
function createLayerItem(layer) {
  const item = document.createElement('div');
  item.className = 'layer-item';
  item.dataset.layerId = layer.id;

  // レイヤー情報
  const info = document.createElement('div');
  info.className = 'layer-info';

  // 表示/非表示チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'layer-visibility';
  checkbox.checked = layer.visible;
  checkbox.addEventListener('change', (e) => {
    handleVisibilityChange(layer.id, e.target.checked);
  });

  // レイヤー名
  const name = document.createElement('span');
  name.className = 'layer-name';
  name.textContent = layer.name;

  info.appendChild(checkbox);
  info.appendChild(name);

  // レイヤーコントロール
  const controls = document.createElement('div');
  controls.className = 'layer-controls';

  // 透明度スライダー
  const opacityContainer = document.createElement('div');
  opacityContainer.className = 'opacity-control';

  const opacityLabel = document.createElement('label');
  opacityLabel.textContent = '透明度';

  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.className = 'opacity-slider';
  opacitySlider.min = '0';
  opacitySlider.max = '100';
  opacitySlider.value = Math.round(layer.opacity * 100);
  opacitySlider.addEventListener('input', (e) => {
    handleOpacityChange(layer.id, e.target.value / 100);
  });

  const opacityValue = document.createElement('span');
  opacityValue.className = 'opacity-value';
  opacityValue.textContent = `${Math.round(layer.opacity * 100)}%`;

  opacitySlider.addEventListener('input', (e) => {
    opacityValue.textContent = `${e.target.value}%`;
  });

  opacityContainer.appendChild(opacityLabel);
  opacityContainer.appendChild(opacitySlider);
  opacityContainer.appendChild(opacityValue);

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'layer-delete';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => {
    handleLayerDelete(layer.id);
  });

  controls.appendChild(opacityContainer);
  controls.appendChild(deleteButton);

  item.appendChild(info);
  item.appendChild(controls);

  return item;
}

/**
 * レイヤーの表示/非表示変更をハンドル
 */
function handleVisibilityChange(layerId, visible) {
  setLayerVisibility(layerId, visible);
  applyLayerVisibilityToMap(layerId, visible);
}

/**
 * レイヤーの透明度変更をハンドル
 */
function handleOpacityChange(layerId, opacity) {
  setLayerOpacity(layerId, opacity);
  applyLayerOpacityToMap(layerId, opacity);
}

/**
 * レイヤー削除をハンドル
 */
function handleLayerDelete(layerId) {
  if (confirm('このレイヤーを削除しますか?')) {
    removeLayer(layerId);
    removeLayerFromMap(layerId);
  }
}

/**
 * 地図上のレイヤー表示/非表示を適用
 */
function applyLayerVisibilityToMap(layerId, visible) {
  const map = getMap();
  if (!map) return;

  const mapLayerId = `${layerId}-layer`;
  if (map.getLayer(mapLayerId)) {
    map.setLayoutProperty(mapLayerId, 'visibility', visible ? 'visible' : 'none');
  }
}

/**
 * 地図上のレイヤー透明度を適用
 */
function applyLayerOpacityToMap(layerId, opacity) {
  const map = getMap();
  if (!map) return;

  const mapLayerId = `${layerId}-layer`;
  if (map.getLayer(mapLayerId)) {
    // レイヤータイプに応じて適切なプロパティを使用
    const layer = map.getLayer(mapLayerId);
    if (layer.type === 'raster') {
      map.setPaintProperty(mapLayerId, 'raster-opacity', opacity);
    } else if (layer.type === 'fill') {
      map.setPaintProperty(mapLayerId, 'fill-opacity', opacity);
    } else if (layer.type === 'line') {
      map.setPaintProperty(mapLayerId, 'line-opacity', opacity);
    }
  }
}

/**
 * 地図からレイヤーを削除
 */
function removeLayerFromMap(layerId) {
  const map = getMap();
  if (!map) return;

  const mapLayerId = `${layerId}-layer`;
  if (map.getLayer(mapLayerId)) {
    map.removeLayer(mapLayerId);
  }

  if (map.getSource(layerId)) {
    map.removeSource(layerId);
  }
}

/**
 * データタブのコンテンツを更新
 */
export function updateDataTab(content) {
  const dataTab = document.getElementById('tab-data');
  if (!dataTab) return;

  if (typeof content === 'string') {
    dataTab.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    dataTab.innerHTML = '';
    dataTab.appendChild(content);
  }
}

/**
 * 現在のタブを取得
 */
export function getCurrentTab() {
  return currentTab;
}
