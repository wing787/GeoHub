/**
 * 地図クリックイベントハンドラー
 * 地物の情報を抽出してパネルに表示
 */
import { getMap } from './mapInstance.js';
import { updateDataTab } from '../ui/layerPanel.js';
import { openPanel } from '../ui/panel.js';

let isInitialized = false;

/**
 * クリックハンドラーを初期化
 */
export function initClickHandler() {
  const map = getMap();
  if (!map) {
    console.error('GeoHub: Map instance not found');
    return;
  }

  if (isInitialized) {
    console.warn('GeoHub: Click handler already initialized');
    return;
  }

  // 地図クリックイベント
  map.on('click', handleMapClick);

  // カーソルスタイル変更（ホバー時）
  map.on('mousemove', handleMouseMove);
  map.on('mouseleave', handleMouseLeave);

  isInitialized = true;
  console.log('GeoHub: Click handler initialized');
}

/**
 * 地図クリックをハンドル
 */
function handleMapClick(e) {
  const map = getMap();
  if (!map) return;

  const features = map.queryRenderedFeatures(e.point, {
    layers: getInteractiveLayerIds()
  });

  if (features.length > 0) {
    // 地物が見つかった場合
    displayFeatureInfo(features, e.lngLat);
  } else {
    // 地物がない場合
    displayNoFeatureMessage(e.lngLat);
  }
}

/**
 * マウスムーブをハンドル（カーソル変更用）
 */
function handleMouseMove(e) {
  const map = getMap();
  if (!map) return;

  const features = map.queryRenderedFeatures(e.point, {
    layers: getInteractiveLayerIds()
  });

  map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
}

/**
 * マウスリーブをハンドル
 */
function handleMouseLeave() {
  const map = getMap();
  if (!map) return;

  map.getCanvas().style.cursor = '';
}

/**
 * インタラクティブなレイヤーIDリストを取得
 */
function getInteractiveLayerIds() {
  const map = getMap();
  if (!map) return [];

  const layers = map.getStyle().layers;

  // カスタムレイヤー（背景地図以外）のみを対象
  return layers
    .filter(layer => {
      // 背景地図レイヤーを除外
      if (layer.id.startsWith('gsi-') || layer.id.startsWith('osm-')) {
        return false;
      }
      // ラスターレイヤーを除外（クリック不要）
      if (layer.type === 'raster') {
        return false;
      }
      return true;
    })
    .map(layer => layer.id);
}

/**
 * 地物情報を表示
 */
function displayFeatureInfo(features, lngLat) {
  const content = createFeatureInfoHTML(features, lngLat);
  updateDataTab(content);
  openPanel();
}

/**
 * 地物情報のHTMLを作成
 */
function createFeatureInfoHTML(features, lngLat) {
  const container = document.createElement('div');
  container.className = 'feature-info';

  // ヘッダー
  const header = document.createElement('div');
  header.className = 'feature-info-header';
  header.innerHTML = `
    <h3>地物情報</h3>
    <p class="coordinates">
      緯度: ${lngLat.lat.toFixed(6)}<br>
      経度: ${lngLat.lng.toFixed(6)}
    </p>
  `;
  container.appendChild(header);

  // 地物ごとに情報を表示
  features.forEach((feature, index) => {
    const featureSection = createFeatureSection(feature, index);
    container.appendChild(featureSection);
  });

  return container;
}

/**
 * 個別の地物セクションを作成
 */
function createFeatureSection(feature, index) {
  const section = document.createElement('div');
  section.className = 'feature-section';

  // セクションヘッダー
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'feature-section-header';

  const layerName = getLayerDisplayName(feature.layer.id);
  sectionHeader.innerHTML = `
    <h4>地物 ${index + 1}</h4>
    <span class="layer-badge">${layerName}</span>
  `;
  section.appendChild(sectionHeader);

  // プロパティテーブル
  if (feature.properties && Object.keys(feature.properties).length > 0) {
    const table = createPropertiesTable(feature.properties);
    section.appendChild(table);
  } else {
    const noProps = document.createElement('p');
    noProps.className = 'no-properties';
    noProps.textContent = 'プロパティがありません';
    section.appendChild(noProps);
  }

  return section;
}

/**
 * プロパティテーブルを作成
 */
function createPropertiesTable(properties) {
  const table = document.createElement('table');
  table.className = 'properties-table';

  const tbody = document.createElement('tbody');

  Object.entries(properties).forEach(([key, value]) => {
    const row = document.createElement('tr');

    const keyCell = document.createElement('td');
    keyCell.className = 'property-key';
    keyCell.textContent = key;

    const valueCell = document.createElement('td');
    valueCell.className = 'property-value';
    valueCell.textContent = formatPropertyValue(value);

    row.appendChild(keyCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

/**
 * プロパティ値をフォーマット
 */
function formatPropertyValue(value) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * レイヤーIDから表示名を取得
 */
function getLayerDisplayName(layerId) {
  // layerManager.jsから名前を取得する
  // 簡易的にレイヤーIDから生成
  return layerId.replace(/-layer$/, '').replace(/-/g, ' ');
}

/**
 * 地物がない場合のメッセージを表示
 */
function displayNoFeatureMessage(lngLat) {
  const content = `
    <div class="feature-info">
      <div class="feature-info-header">
        <h3>地物情報</h3>
        <p class="coordinates">
          緯度: ${lngLat.lat.toFixed(6)}<br>
          経度: ${lngLat.lng.toFixed(6)}
        </p>
      </div>
      <p class="no-features">この位置に地物はありません</p>
    </div>
  `;
  updateDataTab(content);
  openPanel();
}

/**
 * クリックハンドラーを破棄
 */
export function destroyClickHandler() {
  const map = getMap();
  if (!map) return;

  map.off('click', handleMapClick);
  map.off('mousemove', handleMouseMove);
  map.off('mouseleave', handleMouseLeave);

  isInitialized = false;
  console.log('GeoHub: Click handler destroyed');
}
