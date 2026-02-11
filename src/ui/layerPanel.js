/**
 * レイヤーパネルの管理
 */
import { setLayerVisibility, setLayerOpacity, removeLayer, getLayer } from '../map/layerManager.js';
import { getMap } from '../map/mapInstance.js';
import { openDialog as openAddLayerDialog } from './addLayerDialog.js';
import { openDialog as openStyleSettingDialog } from './styleDialog.js';

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
 * レイヤー追加ダイアログを表示
 */
function showAddLayerDialog() {
  openAddLayerDialog();
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

  controls.appendChild(opacityContainer);

  // ラベル設定（ベクタータイルとPMTilesのみ）
  if (layer.type === 'vector' || layer.type === 'pmtiles') {
    const labelControl = createLabelControl(layer);
    controls.appendChild(labelControl);
  }

  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'layer-button-container';

  // スタイル設定ボタン（ベクタータイルとPMTilesのみ）
  if (layer.type === 'vector' || layer.type === 'pmtiles') {
    const styleButton = document.createElement('button');
    styleButton.className = 'layer-style';
    styleButton.textContent = 'スタイル';
    styleButton.addEventListener('click', () => {
      handleLayerStyle(layer.id);
    });
    buttonContainer.appendChild(styleButton);
  }

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'layer-delete';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => {
    handleLayerDelete(layer.id);
  });

  buttonContainer.appendChild(deleteButton);
  controls.appendChild(buttonContainer);

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
 * ラベルコントロールを作成
 */
function createLabelControl(layer) {
  const container = document.createElement('div');
  container.className = 'label-control';

  // ラベル表示チェックボックス
  const checkboxContainer = document.createElement('div');
  checkboxContainer.className = 'label-checkbox-container';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'label-visibility';
  checkbox.id = `label-${layer.id}`;
  checkbox.checked = false;

  const checkboxLabel = document.createElement('label');
  checkboxLabel.htmlFor = `label-${layer.id}`;
  checkboxLabel.textContent = 'ラベル表示';
  checkboxLabel.className = 'label-checkbox-label';

  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  // 属性選択ドロップダウン
  const selectContainer = document.createElement('div');
  selectContainer.className = 'label-select-container';

  const select = document.createElement('select');
  select.className = 'label-attribute-select';
  select.id = `label-attr-${layer.id}`;
  select.disabled = true;

  // デフォルトオプション
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '属性を選択';
  select.appendChild(defaultOption);

  selectContainer.appendChild(select);

  // イベントリスナー
  checkbox.addEventListener('change', async (e) => {
    const isChecked = e.target.checked;
    select.disabled = !isChecked;

    if (isChecked && select.options.length === 1) {
      // 属性リストをロード
      await loadAttributesForLabel(layer.id, select);
    }

    if (isChecked && select.value) {
      handleLabelVisibilityChange(layer.id, true, select.value);
    } else {
      handleLabelVisibilityChange(layer.id, false, null);
    }
  });

  select.addEventListener('change', (e) => {
    if (checkbox.checked && e.target.value) {
      handleLabelVisibilityChange(layer.id, true, e.target.value);
    }
  });

  container.appendChild(checkboxContainer);
  container.appendChild(selectContainer);

  return container;
}

/**
 * ラベル用の属性リストをロード
 */
async function loadAttributesForLabel(layerId, selectElement) {
  const map = getMap();
  if (!map) {
    console.error('GeoHub: Map not found for loading label attributes');
    return;
  }

  try {
    const layer = getLayer(layerId);

    if (!layer) {
      console.error('GeoHub: Layer not found', layerId);
      return;
    }

    console.log('GeoHub: Loading attributes for label', layerId, layer.metadata?.sourceLayer);

    // フィーチャーから属性を取得
    const features = map.querySourceFeatures(layerId, {
      sourceLayer: layer.metadata?.sourceLayer
    });

    console.log(`GeoHub: Found ${features?.length || 0} features for label attributes`);

    if (!features || features.length === 0) {
      console.warn('GeoHub: No features found for label attributes. Try zooming in or panning to where the data is visible.');
      alert('属性を読み込めませんでした。データが表示されている場所にズームしてから再度お試しください。');
      return;
    }

    const properties = features[0].properties || {};
    const fieldNames = Object.keys(properties);

    console.log('GeoHub: Available attributes:', fieldNames);

    if (fieldNames.length === 0) {
      console.warn('GeoHub: No properties found in features');
      return;
    }

    // 属性オプションを追加
    fieldNames.forEach(fieldName => {
      const option = document.createElement('option');
      option.value = fieldName;
      option.textContent = fieldName;
      selectElement.appendChild(option);
    });

    console.log(`GeoHub: Added ${fieldNames.length} attribute options`);

  } catch (error) {
    console.error('GeoHub: Failed to load attributes for label', error);
    alert('属性の読み込みに失敗しました: ' + error.message);
  }
}

/**
 * ラベル表示/非表示の変更をハンドル
 */
function handleLabelVisibilityChange(layerId, visible, attributeName) {
  if (visible && attributeName) {
    addLabelToMap(layerId, attributeName);
  } else {
    removeLabelFromMap(layerId);
  }
}

/**
 * 地図にラベルレイヤーを追加
 */
function addLabelToMap(layerId, attributeName) {
  const map = getMap();
  if (!map) return;

  const layer = getLayer(layerId);

  if (!layer) return;

  const labelLayerId = `${layerId}-label`;

  // 既存のラベルレイヤーを削除
  if (map.getLayer(labelLayerId)) {
    map.removeLayer(labelLayerId);
  }

  // ラベルレイヤーを追加
  try {
    const labelConfig = {
      id: labelLayerId,
      type: 'symbol',
      source: layerId,
      'source-layer': layer.metadata?.sourceLayer,
      layout: {
        'text-field': ['get', attributeName],
        'text-font': ['Noto Sans Regular'],
        'text-size': 14,
        'text-anchor': 'center',
        'text-offset': [0, 0],
        'text-allow-overlap': true,
        'text-ignore-placement': false,
        'text-optional': true
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    };

    console.log('GeoHub: Adding label layer with config:', labelConfig);
    map.addLayer(labelConfig);

    console.log(`GeoHub: Successfully added label layer ${labelLayerId} with attribute ${attributeName}`);
    console.log(`GeoHub: Source layer: ${layer.metadata?.sourceLayer}`);
  } catch (error) {
    console.error('GeoHub: Failed to add label layer', error);
    alert('ラベルレイヤーの追加に失敗しました: ' + error.message);
  }
}

/**
 * 地図からラベルレイヤーを削除
 */
function removeLabelFromMap(layerId) {
  const map = getMap();
  if (!map) return;

  const labelLayerId = `${layerId}-label`;

  if (map.getLayer(labelLayerId)) {
    map.removeLayer(labelLayerId);
    console.log(`GeoHub: Removed label layer ${labelLayerId}`);
  }
}

/**
 * レイヤースタイル設定をハンドル
 */
function handleLayerStyle(layerId) {
  openStyleSettingDialog(layerId);
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

  const visibility = visible ? 'visible' : 'none';

  // ラスタータイルの場合
  const rasterLayerId = `${layerId}-layer`;
  if (map.getLayer(rasterLayerId)) {
    map.setLayoutProperty(rasterLayerId, 'visibility', visibility);
  }

  // ベクタータイル/PMTilesの場合（fillとlineの両方）
  const fillLayerId = `${layerId}-fill`;
  const lineLayerId = `${layerId}-line`;

  if (map.getLayer(fillLayerId)) {
    map.setLayoutProperty(fillLayerId, 'visibility', visibility);
  }

  if (map.getLayer(lineLayerId)) {
    map.setLayoutProperty(lineLayerId, 'visibility', visibility);
  }
}

/**
 * 地図上のレイヤー透明度を適用
 */
function applyLayerOpacityToMap(layerId, opacity) {
  const map = getMap();
  if (!map) return;

  // ラスタータイルの場合
  const rasterLayerId = `${layerId}-layer`;
  if (map.getLayer(rasterLayerId)) {
    const layer = map.getLayer(rasterLayerId);
    if (layer.type === 'raster') {
      map.setPaintProperty(rasterLayerId, 'raster-opacity', opacity);
    }
  }

  // ベクタータイル/PMTilesの場合（fillとlineの両方）
  const fillLayerId = `${layerId}-fill`;
  const lineLayerId = `${layerId}-line`;

  if (map.getLayer(fillLayerId)) {
    map.setPaintProperty(fillLayerId, 'fill-opacity', opacity);
  }

  if (map.getLayer(lineLayerId)) {
    map.setPaintProperty(lineLayerId, 'line-opacity', opacity);
  }
}

/**
 * 地図からレイヤーを削除
 */
function removeLayerFromMap(layerId) {
  const map = getMap();
  if (!map) return;

  // ラスタータイルの場合
  const rasterLayerId = `${layerId}-layer`;
  if (map.getLayer(rasterLayerId)) {
    map.removeLayer(rasterLayerId);
  }

  // ベクタータイル/PMTilesの場合（fillとlineの両方）
  const fillLayerId = `${layerId}-fill`;
  const lineLayerId = `${layerId}-line`;
  const labelLayerId = `${layerId}-label`;

  if (map.getLayer(labelLayerId)) {
    map.removeLayer(labelLayerId);
  }

  if (map.getLayer(lineLayerId)) {
    map.removeLayer(lineLayerId);
  }

  if (map.getLayer(fillLayerId)) {
    map.removeLayer(fillLayerId);
  }

  // ソースを削除
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
