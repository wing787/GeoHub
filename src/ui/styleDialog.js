/**
 * レイヤースタイル設定ダイアログ
 */
import { getMap } from '../map/mapInstance.js';
import { getLayer } from '../map/layerManager.js';

let dialog = null;
let isOpen = false;
let currentLayerId = null;
let currentAttributes = [];
let colorMappings = {};

// カラースキーム
const COLOR_SCHEMES = {
  default: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf'],
  pastel: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec'],
  vibrant: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
  earth: ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#c7eae5', '#80cdc1', '#35978f', '#01665e'],
  ocean: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594']
};

/**
 * スタイル設定ダイアログを初期化
 */
export function initStyleDialog() {
  dialog = createDialogElement();
  document.body.appendChild(dialog);
  setupEventListeners();
  console.log('GeoHub: Style dialog initialized');
}

/**
 * ダイアログのHTML要素を作成
 */
function createDialogElement() {
  const dialogHtml = `
    <div class="style-dialog" id="style-dialog">
      <div class="style-dialog-content">
        <div class="style-dialog-header">
          <h3>スタイル設定</h3>
          <button class="style-dialog-close" id="style-dialog-close-btn">&times;</button>
        </div>

        <div class="style-error" id="style-error"></div>

        <div class="style-dialog-body" id="style-dialog-body">
          <div class="style-loading" id="style-loading">
            属性情報を読み込んでいます...
          </div>

          <form class="style-form" id="style-form" style="display: none;">
            <!-- 属性フィールド選択 -->
            <div class="style-form-group">
              <label for="attribute-field">属性フィールド</label>
              <select id="attribute-field" name="attributeField">
                <option value="">選択してください</option>
              </select>
              <span class="style-form-help">
                色分けに使用する属性を選択してください
              </span>
            </div>

            <!-- カラースキーム選択 -->
            <div class="style-form-group" id="color-scheme-group" style="display: none;">
              <label>カラースキーム</label>
              <div class="color-scheme-selector" id="color-scheme-selector"></div>
            </div>

            <!-- カラーマッピング -->
            <div class="style-form-group" id="color-mapping-group" style="display: none;">
              <label>色の設定</label>
              <div class="color-mapping-container" id="color-mapping-container"></div>
            </div>
          </form>
        </div>

        <div class="style-dialog-actions">
          <button type="button" class="btn btn-secondary" id="style-cancel-btn">
            キャンセル
          </button>
          <button type="button" class="btn btn-primary" id="style-apply-btn" disabled>
            適用
          </button>
        </div>
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
  const closeBtn = dialog.querySelector('#style-dialog-close-btn');
  const cancelBtn = dialog.querySelector('#style-cancel-btn');

  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);

  // ダイアログ背景クリックで閉じる
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  // 属性フィールド選択
  const attributeField = dialog.querySelector('#attribute-field');
  attributeField.addEventListener('change', handleAttributeFieldChange);

  // 適用ボタン
  const applyBtn = dialog.querySelector('#style-apply-btn');
  applyBtn.addEventListener('click', handleApplyStyle);
}

/**
 * ダイアログを開く
 */
export function openDialog(layerId) {
  if (!dialog) return;

  currentLayerId = layerId;
  dialog.classList.add('open');
  isOpen = true;

  // レイヤーの属性情報を読み込む
  loadLayerAttributes(layerId);
}

/**
 * ダイアログを閉じる
 */
export function closeDialog() {
  if (!dialog) return;

  dialog.classList.remove('open');
  isOpen = false;
  currentLayerId = null;
  currentAttributes = [];
  colorMappings = {};
  hideError();
}

/**
 * レイヤーの属性情報を読み込む
 */
async function loadLayerAttributes(layerId) {
  const loading = dialog.querySelector('#style-loading');
  const form = dialog.querySelector('#style-form');
  const attributeField = dialog.querySelector('#attribute-field');

  loading.style.display = 'block';
  form.style.display = 'none';

  try {
    const map = getMap();
    const layer = getLayer(layerId);

    if (!map || !layer) {
      throw new Error('レイヤーが見つかりません');
    }

    // レイヤーのフィーチャーから属性を取得
    const features = map.querySourceFeatures(layerId, {
      sourceLayer: layer.metadata?.sourceLayer
    });

    if (!features || features.length === 0) {
      throw new Error('フィーチャーが見つかりません。地図を拡大してレイヤーを表示してください。');
    }

    // 属性フィールドのリストを取得
    const properties = features[0].properties || {};
    const fieldNames = Object.keys(properties);

    if (fieldNames.length === 0) {
      throw new Error('属性フィールドが見つかりません');
    }

    currentAttributes = fieldNames;

    // 属性フィールドのオプションを作成
    attributeField.innerHTML = '<option value="">選択してください</option>';
    fieldNames.forEach(fieldName => {
      const option = document.createElement('option');
      option.value = fieldName;
      option.textContent = fieldName;
      attributeField.appendChild(option);
    });

    loading.style.display = 'none';
    form.style.display = 'block';

  } catch (error) {
    console.error('GeoHub: Failed to load layer attributes', error);
    showError(error.message);
    loading.style.display = 'none';
  }
}

/**
 * 属性フィールド変更時の処理
 */
function handleAttributeFieldChange(e) {
  const fieldName = e.target.value;

  if (!fieldName) {
    hideColorMapping();
    return;
  }

  // フィールドの固有値を取得してカラーマッピングを作成
  createColorMapping(fieldName);
}

/**
 * カラーマッピングを作成
 */
function createColorMapping(fieldName) {
  const map = getMap();
  const layer = getLayer(currentLayerId);

  if (!map || !layer) return;

  try {
    // フィーチャーから固有値を取得
    const features = map.querySourceFeatures(currentLayerId, {
      sourceLayer: layer.metadata?.sourceLayer
    });

    const uniqueValues = new Set();
    features.forEach(feature => {
      const value = feature.properties[fieldName];
      if (value !== null && value !== undefined) {
        uniqueValues.add(String(value));
      }
    });

    const values = Array.from(uniqueValues).sort();

    if (values.length === 0) {
      showError('この属性フィールドに値がありません');
      return;
    }

    if (values.length > 20) {
      showError('固有値が多すぎます（最大20個まで）。別の属性を選択してください。');
      return;
    }

    // カラースキームセレクターを表示
    showColorSchemeSelector(values);

    // デフォルトのカラースキームでマッピングを作成
    applyColorScheme('default', values);

  } catch (error) {
    console.error('GeoHub: Failed to create color mapping', error);
    showError('カラーマッピングの作成に失敗しました');
  }
}

/**
 * カラースキームセレクターを表示
 */
function showColorSchemeSelector(values) {
  const schemeGroup = dialog.querySelector('#color-scheme-group');
  const schemeSelector = dialog.querySelector('#color-scheme-selector');

  schemeSelector.innerHTML = '';

  Object.keys(COLOR_SCHEMES).forEach(schemeName => {
    const option = document.createElement('div');
    option.className = 'color-scheme-option';
    if (schemeName === 'default') {
      option.classList.add('selected');
    }

    const preview = document.createElement('div');
    preview.className = 'color-scheme-preview';

    const colors = COLOR_SCHEMES[schemeName];
    colors.forEach(color => {
      const item = document.createElement('div');
      item.className = 'color-scheme-preview-item';
      item.style.backgroundColor = color;
      preview.appendChild(item);
    });

    option.appendChild(preview);
    option.appendChild(document.createTextNode(getSchemeLabel(schemeName)));

    option.addEventListener('click', () => {
      document.querySelectorAll('.color-scheme-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
      applyColorScheme(schemeName, values);
    });

    schemeSelector.appendChild(option);
  });

  schemeGroup.style.display = 'block';
}

/**
 * カラースキーム名のラベルを取得
 */
function getSchemeLabel(schemeName) {
  const labels = {
    default: 'デフォルト',
    pastel: 'パステル',
    vibrant: 'ビビッド',
    earth: 'アース',
    ocean: 'オーシャン'
  };
  return labels[schemeName] || schemeName;
}

/**
 * カラースキームを適用
 */
function applyColorScheme(schemeName, values) {
  const colors = COLOR_SCHEMES[schemeName];
  colorMappings = {};

  values.forEach((value, index) => {
    colorMappings[value] = colors[index % colors.length];
  });

  showColorMapping(values);
}

/**
 * カラーマッピングを表示
 */
function showColorMapping(values) {
  const mappingGroup = dialog.querySelector('#color-mapping-group');
  const mappingContainer = dialog.querySelector('#color-mapping-container');
  const applyBtn = dialog.querySelector('#style-apply-btn');

  mappingContainer.innerHTML = '';

  values.forEach(value => {
    const item = document.createElement('div');
    item.className = 'color-mapping-item';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'color-mapping-value';
    valueSpan.textContent = value;

    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-mapping-color';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker';
    colorPicker.value = colorMappings[value];
    colorPicker.addEventListener('change', (e) => {
      colorMappings[value] = e.target.value;
    });

    colorDiv.appendChild(colorPicker);

    item.appendChild(valueSpan);
    item.appendChild(colorDiv);

    mappingContainer.appendChild(item);
  });

  mappingGroup.style.display = 'block';
  applyBtn.disabled = false;
}

/**
 * カラーマッピングを非表示
 */
function hideColorMapping() {
  const schemeGroup = dialog.querySelector('#color-scheme-group');
  const mappingGroup = dialog.querySelector('#color-mapping-group');
  const applyBtn = dialog.querySelector('#style-apply-btn');

  schemeGroup.style.display = 'none';
  mappingGroup.style.display = 'none';
  applyBtn.disabled = true;
}

/**
 * スタイルを適用
 */
function handleApplyStyle() {
  const attributeField = dialog.querySelector('#attribute-field').value;

  if (!attributeField || Object.keys(colorMappings).length === 0) {
    showError('属性フィールドとカラーマッピングを設定してください');
    return;
  }

  try {
    applyStyleToMap(currentLayerId, attributeField, colorMappings);
    closeDialog();
  } catch (error) {
    console.error('GeoHub: Failed to apply style', error);
    showError('スタイルの適用に失敗しました: ' + error.message);
  }
}

/**
 * 地図にスタイルを適用
 */
function applyStyleToMap(layerId, attributeField, mappings) {
  const map = getMap();
  const layer = getLayer(layerId);

  if (!map || !layer) {
    throw new Error('レイヤーが見つかりません');
  }

  // data-driven stylingのための配列を作成
  // ['match', ['get', 'property'], value1, color1, value2, color2, ..., defaultColor]
  const matchExpression = ['match', ['get', attributeField]];

  Object.entries(mappings).forEach(([value, color]) => {
    matchExpression.push(value, color);
  });

  // デフォルトカラー
  matchExpression.push('#cccccc');

  // fillレイヤーのスタイルを更新
  const fillLayerId = `${layerId}-fill`;
  if (map.getLayer(fillLayerId)) {
    map.setPaintProperty(fillLayerId, 'fill-color', matchExpression);
  }

  // レイヤーのメタデータにスタイル情報を保存
  if (!layer.metadata) {
    layer.metadata = {};
  }
  layer.metadata.styleField = attributeField;
  layer.metadata.styleMapping = mappings;

  console.log(`GeoHub: Applied style to layer ${layerId}`);
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
  const errorEl = dialog.querySelector('#style-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

/**
 * エラーメッセージを非表示
 */
function hideError() {
  const errorEl = dialog.querySelector('#style-error');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
}
