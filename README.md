# n8n-workflow-validator

n8n ワークフロー JSON ファイルをバリデーションするスタンドアロン CLI ツール

[![npm version](https://badge.fury.io/js/n8n-workflow-validator.svg)](https://badge.fury.io/js/n8n-workflow-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特徴

- 🚀 **軽量・高速** - データベース接続不要、即座に起動
- ✅ **Zod スキーマ検証** - n8n 公式の型定義に基づく厳密な検証
- 🔗 **接続整合性チェック** - ノード間接続の参照整合性を検証
- 📦 **CI/CD 対応** - 終了コードで検証結果を報告

## インストール

```bash
npm install -g n8n-workflow-validator
```

または npx で直接実行:

```bash
npx n8n-workflow-validator workflow.json
```

## 使い方

### CLI

```bash
# 単一ファイルの検証
n8n-validate workflow.json

# 複数ファイルの検証
n8n-validate workflow1.json workflow2.json

# 警告をエラーとして扱う（厳格モード）
n8n-validate --strict workflow.json

# JSON形式で出力
n8n-validate --json workflow.json

# 静かモード（エラーのみ出力）
n8n-validate --quiet workflow.json
```

### オプション

| オプション | 説明 |
|-----------|------|
| `-q, --quiet` | エラーのみ出力 |
| `-s, --strict` | 警告をエラーとして扱う |
| `-j, --json` | 結果を JSON 形式で出力 |
| `-V, --version` | バージョン表示 |
| `-h, --help` | ヘルプ表示 |

### プログラマティック使用

```typescript
import {
  validateWorkflow,
  validateWorkflowFile,
  validateWorkflowJson,
} from 'n8n-workflow-validator';

// オブジェクトを検証
const result = validateWorkflow({
  nodes: [...],
  connections: {...},
});

console.log(result.valid);    // boolean
console.log(result.errors);   // ValidationError[]
console.log(result.warnings); // ValidationError[]

// ファイルを検証
const fileResult = await validateWorkflowFile('./workflow.json');

// JSON文字列を検証
const jsonResult = validateWorkflowJson('{"nodes": [], "connections": {}}');
```

## CI/CD 統合

### GitHub Actions

```yaml
name: Validate Workflows
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Validate Workflows
        run: npx n8n-workflow-validator ./workflows/*.json
```

### GitLab CI

```yaml
validate-workflows:
  image: node:20
  script:
    - npx n8n-workflow-validator ./workflows/*.json
```

## 検証項目

### エラー（valid = false）

- JSON パースエラー
- 必須フィールドの欠落 (`nodes`, `connections`)
- ノード構造の不正
  - `id`, `name`, `type`, `typeVersion`, `position`, `parameters` の欠落
- 重複したノード ID
- 重複したノード名
- 存在しないノードへの接続参照
- 存在しないソースノードからの接続

### 警告

- 空のワークフロー（ノードなし）
- 無効化されたノード
- パラメータが設定されていないノード
- 接続されていない非トリガーノード

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト実行
npm test

# 型チェック
npm run typecheck
```

## n8n バージョン追従

このパッケージは `n8n-workflow` パッケージに依存しており、n8n のバージョンアップ時に新しい型定義やスキーマが自動的に利用可能になります。

## ライセンス

MIT
