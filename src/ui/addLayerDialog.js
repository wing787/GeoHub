/**
 * レイヤー追加ダイアログ
 */
import { addRasterTileLayer, addVectorTileLayer } from '../map/layerManager.js';
import { getMap } from '../map/mapInstance.js';

let dialog = null;
let isOpen = false;
let currentTileType = 'raster';

/**
 * レイヤー追加ダイアログを初期化
 */
export function initAddLayerDialog() {
  dialog = createDialogElement();
  document.body.appendChild(dialog);
  setupEventListeners();
  console.log('GeoHub: Add layer dialog initialized');
}

/**
 * ダイアログのHTML要素を作成
 */
function createDialogElement() {
  const dialogHtml = `
    <div class="add-layer-dialog" id="add-layer-dialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>レイヤーを追加</h3>
          <button class="dialog-close" id="dialog-close-btn">&times;</button>
        </div>

        <div class="error-message" id="dialog-error"></div>

        <form class="dialog-form" id="add-layer-form">
          <!-- タイルタイプ選択 -->
          <div class="form-group">
            <label>タイルタイプ</label>
            <div class="tile-type-selector">
              <label class="tile-type-option selected">
                <input type="radio" name="tileType" value="raster" checked>
                <span class="tile-type-label">ラスタータイル</span>
                <span class="tile-type-desc">PNG/JPG画像タイル</span>
              </label>
              <label class="tile-type-option">
                <input type="radio" name="tileType" value="vector">
                <span class="tile-type-label">ベクタータイル</span>
                <span class="tile-type-desc">MVT/PBF形式</span>
              </label>
            </div>
          </div>

          <!-- レイヤー名 -->
          <div class="form-group">
            <label for="layer-name">レイヤー名 *</label>
            <input
              type="text"
              id="layer-name"
              name="layerName"
              placeholder="例: 自作タイルレイヤー"
              required
            >
          </div>

          <!-- タイルURL -->
          <div class="form-group">
            <label for="tile-url">タイルURL *</label>
            <textarea
              id="tile-url"
              name="tileUrl"
              placeholder="例: https://example.com/tiles/{z}/{x}/{y}.png"
              required
            ></textarea>
            <span class="form-help">
              {z}, {x}, {y} をプレースホルダーとして使用してください
            </span>
          </div>

          <!-- タイルサイズ（ラスターのみ） -->
          <div class="form-group" id="tile-size-group">
            <label for="tile-size">タイルサイズ</label>
            <select id="tile-size" name="tileSize">
              <option value="256">256px</option>
              <option value="512">512px</option>
            </select>
          </div>

          <!-- ソースレイヤー（ベクターのみ） -->
          <div class="form-group" id="source-layer-group" style="display: none;">
            <label for="source-layer">ソースレイヤー</label>
            <input
              type="text"
              id="source-layer"
              name="sourceLayer"
              placeholder="例: buildings"
            >
            <span class="form-help">
              ベクタータイルに含まれるレイヤー名を指定してください
            </span>
          </div>

          <!-- Attribution -->
          <div class="form-group">
            <label for="attribution">出典表記</label>
            <input
              type="text"
              id="attribution"
              name="attribution"
              placeholder="例: © データ提供者"
            >
          </div>

          <!-- アクションボタン -->
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary" id="submit-btn">
              レイヤーを追加
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = dialogHtml;
  return container.firstElementChild;
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
  // ダイアログを閉じる
  const closeBtn = dialog.querySelector('#dialog-close-btn');
  const cancelBtn = dialog.querySelector('#cancel-btn');

  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);

  // ダイアログ背景クリックで閉じる
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  // タイルタイプ選択
  const typeOptions = dialog.querySelectorAll('.tile-type-option');
  typeOptions.forEach(option => {
    option.addEventListener('click', () => {
      typeOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');

      const radio = option.querySelector('input[type="radio"]');
      radio.checked = true;
      currentTileType = radio.value;

      // タイルサイズとソースレイヤーの表示切り替え
      const tileSizeGroup = dialog.querySelector('#tile-size-group');
      const sourceLayerGroup = dialog.querySelector('#source-layer-group');

      tileSizeGroup.style.display = currentTileType === 'raster' ? 'flex' : 'none';
      sourceLayerGroup.style.display = currentTileType === 'vector' ? 'flex' : 'none';

      // source-layerの必須を切り替え
      const sourceLayerInput = dialog.querySelector('#source-layer');
      if (sourceLayerInput) {
        sourceLayerInput.required = currentTileType === 'vector';
      }
    });
  });

  // フォーム送信
  const form = dialog.querySelector('#add-layer-form');
  form.addEventListener('submit', handleSubmit);
}

/**
 * フォーム送信をハンドル
 */
async function handleSubmit(e) {
  e.preventDefault();

  hideError();

  const formData = new FormData(e.target);
  const layerName = formData.get('layerName');
  const tileUrl = formData.get('tileUrl').trim();
  const tileSize = parseInt(formData.get('tileSize') || '256');
  const attribution = formData.get('attribution') || '';
  const sourceLayer = formData.get('sourceLayer') || '';

  // PMTilesファイルかどうかを判定
  const isPMTiles = tileUrl.endsWith('.pmtiles');

  // URLバリデーション（PMTiles以外の場合）
  if (!isPMTiles && !validateTileUrl(tileUrl)) {
    showError('タイルURLが正しくありません。{z}, {x}, {y} を含むか、.pmtilesファイルを指定してください。');
    return;
  }

  // ベクタータイルの場合、source-layerが必須（PMTiles除く）
  if (!isPMTiles && currentTileType === 'vector' && !sourceLayer) {
    showError('ベクタータイルの場合、ソースレイヤーを指定してください。');
    return;
  }

  try {
    // レイヤーを追加
    let layerId;

    if (isPMTiles) {
      // PMTilesファイルの場合
      const { addLayer } = await import('../map/layerManager.js');
      layerId = addLayer({
        name: layerName,
        type: 'pmtiles',
        source: {
          type: 'vector',
          url: `pmtiles://${tileUrl}`,
          attribution: attribution
        },
        metadata: {
          isPMTiles: true
        }
      });
    } else if (currentTileType === 'raster') {
      layerId = addRasterTileLayer({
        name: layerName,
        tiles: [tileUrl],
        tileSize: tileSize,
        attribution: attribution
      });
    } else if (currentTileType === 'vector') {
      layerId = addVectorTileLayer({
        name: layerName,
        tiles: [tileUrl],
        attribution: attribution,
        metadata: {
          sourceLayer: sourceLayer
        }
      });
    }

    // 地図にレイヤーを追加
    await addLayerToMap(layerId, sourceLayer, currentTileType, isPMTiles);

    // フォームをリセットして閉じる
    e.target.reset();
    closeDialog();

  } catch (error) {
    console.error('GeoHub: Failed to add layer', error);
    showError('レイヤーの追加に失敗しました: ' + error.message);
  }
}

/**
 * タイルURLをバリデーション
 */
function validateTileUrl(url) {
  return url.includes('{z}') && url.includes('{x}') && url.includes('{y}');
}

/**
 * 地図にレイヤーを追加
 */
async function addLayerToMap(layerId, sourceLayer = '', tileType = '', isPMTiles = false) {
  const map = getMap();
  if (!map) {
    throw new Error('Map instance not found');
  }

  const { getLayer } = await import('../map/layerManager.js');
  const layer = getLayer(layerId);

  if (!layer) {
    throw new Error('Layer not found');
  }

  // 地図が読み込まれるまで待機
  if (!map.isStyleLoaded()) {
    await new Promise(resolve => map.once('load', resolve));
  }

  // ソースを追加
  map.addSource(layerId, layer.source);

  // レイヤーを追加
  if (layer.type === 'pmtiles') {
    // PMTilesの場合、メタデータからソースレイヤーを取得
    const { PMTiles } = await import('pmtiles');
    const pmtilesUrl = layer.source.url.replace('pmtiles://', '');
    const pmtiles = new PMTiles(pmtilesUrl);
    const metadata = await pmtiles.getMetadata();

    // vector_layersからソースレイヤー名を取得
    const vectorLayers = metadata.vector_layers || [];
    const firstLayer = vectorLayers[0];

    if (firstLayer) {
      // メタデータにソースレイヤー情報を保存
      layer.metadata = layer.metadata || {};
      layer.metadata.sourceLayer = firstLayer.id;

      // ポリゴン塗りつぶしレイヤー
      map.addLayer({
        id: `${layerId}-fill`,
        type: 'fill',
        source: layerId,
        'source-layer': firstLayer.id,
        paint: {
          'fill-color': '#4a90e2',
          'fill-opacity': 0.5
        }
      });

      // ポリゴン境界線レイヤー
      map.addLayer({
        id: `${layerId}-line`,
        type: 'line',
        source: layerId,
        'source-layer': firstLayer.id,
        paint: {
          'line-color': '#2d5f8d',
          'line-width': 1.5
        }
      });
    }
  } else if (layer.type === 'raster') {
    map.addLayer({
      id: `${layerId}-layer`,
      type: 'raster',
      source: layerId,
      paint: {
        'raster-opacity': layer.opacity
      }
    });
  } else if (layer.type === 'vector') {
    // メタデータにソースレイヤー情報を保存
    layer.metadata = layer.metadata || {};
    layer.metadata.sourceLayer = sourceLayer;

    // ベクタータイル（MVT）のポリゴン塗りつぶしレイヤー
    map.addLayer({
      id: `${layerId}-fill`,
      type: 'fill',
      source: layerId,
      'source-layer': sourceLayer,
      paint: {
        'fill-color': '#4a90e2',
        'fill-opacity': 0.5
      }
    });

    // ベクタータイル（MVT）のポリゴン境界線レイヤー
    map.addLayer({
      id: `${layerId}-line`,
      type: 'line',
      source: layerId,
      'source-layer': sourceLayer,
      paint: {
        'line-color': '#2d5f8d',
        'line-width': 1.5
      }
    });
  }

  console.log(`GeoHub: Layer ${layerId} added to map`);
}

/**
 * ダイアログを開く
 */
export function openDialog() {
  if (!dialog) return;

  dialog.classList.add('open');
  isOpen = true;

  // フォーカスを最初の入力欄に
  const firstInput = dialog.querySelector('#layer-name');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

/**
 * ダイアログを閉じる
 */
export function closeDialog() {
  if (!dialog) return;

  dialog.classList.remove('open');
  isOpen = false;
  hideError();
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
  const errorEl = dialog.querySelector('#dialog-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

/**
 * エラーメッセージを非表示
 */
function hideError() {
  const errorEl = dialog.querySelector('#dialog-error');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
}

/**
 * ダイアログの開閉状態を取得
 */
export function isDialogOpen() {
  return isOpen;
}
