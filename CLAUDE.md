# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**サイト名:** クモカワのIT屋さん  
**URL:** kumoti.jp  
**種別:** フリーランスエンジニアの個人HP（集客・問い合わせ獲得が目的）

**オーナー:** フルスタックエンジニア（経験10年以上）。屋号「クモカワのIT屋さん」で活動中。  
**ターゲット層:** 非エンジニアの中小企業オーナー・事業主。社内業務の非効率やシステム課題を抱えているが、エンジニアへの依頼方法がわからない層がメイン。

**デザインコンセプト:** Tokyo Night Moon カラーテーマ。Neovim の lualine 風ステータスバー・ターミナルウィンドウ・コードスニペットなど、エンジニアらしい要素を随所に盛り込んだデザイン。

**セクション構成:**
| セクション | 内容 |
|---|---|
| statusbar | Neovim 風固定ナビ。スクロールで vim モード（NORMAL/INSERT/VISUAL…）が変化 |
| hero | タイピングアニメーションでキャッチコピー「あなたの課題を、仕組みに変える。」を表示 |
| stats | 実績数値（経験年数・案件数・技術スタック数など）のカウントアップ |
| about | 擬似ターミナル + `const me` コードブロック + 自己紹介・スキルタグ |
| services | 提供サービス5種（WEBシステム・アプリ・HP制作・品質改善・技術顧問）のジグザグレイアウト |
| forwho | 「For who」ターゲット顧客の課題チェックリスト |
| whyme | 強み6項目のベントーグリッド |
| works | 実績カード3件 + ポートフォリオサイトへのリンク |
| contact | 問い合わせ種別セレクト + Turnstile スパム対策付きコンタクトフォーム |
| footer | コピーライト・AI制作クレジット |

**重要な制約:**  
実名は検索エンジンにインデックスされたくないため、サイト内のいかなる箇所にも表示しない。表示名は屋号「クモカワのIT屋さん」のみ使用すること。

## Development

ローカルで起動:
```
npx http-server . -p 8080 -c-1
```

ビルド・トランスパイル・テストは存在しない。変更はブラウザリロードで即確認できる。

## Architecture

**技術スタック:** 素の HTML / CSS / JavaScript（フレームワーク・バンドラー不使用）+ AWS Lambda（お問い合わせフォームのバックエンド）

| ファイル / ディレクトリ | 役割 |
|---|---|
| `index.html` | 全コンテンツ。セクション順: statusbar → hero → stats → about → services → forwho → whyme → works → contact → footer |
| `style.css` | Tokyo Night Moon テーマ。CSS変数（`:root`）でパレットを管理 |
| `script.js` | すべてのインタラクション |
| `send-mail/` | お問い合わせフォームのバックエンド（AWS SAM プロジェクト） |

**CSS設計**  
カラーパレットは `:root` の CSS 変数で一元管理（`--bg`, `--accent`, `--blue` 等）。シンタックストークン用のユーティリティクラス（`.tk-kw`, `.tk-fn`, `.tk-str` 等）が HTML 中に直書きされており、コードスニペット風の装飾に使われている。

**script.js の主要機能**
- **Neovim モード表示**: `IntersectionObserver` でスクロール位置を監視し、ステータスバーの MODE 表示を切り替える（NORMAL/INSERT/VISUAL/TERMINAL/REPLACE/COMMAND）
- **ヒーローアニメーション**: `typeChars()` でキャッチコピーをタイピング演出
- **About ターミナル**: スクロールインビュー時に `runAboutTerminal()` が起動し、擬似ターミナルに順次コマンドを打ち込む演出
- **スタッツカウントアップ**: `countUp()` で数値をイージングしながら増加
- **コンタクトフォーム**: Cloudflare Turnstile でスパム検証 → AWS API Gateway（`CONTACT_API_URL`、`script.js` 195行目）に POST → Lambda が メール送信

**send-mail/ の構成**
AWS SAM プロジェクト（TypeScript / Node.js 24.x）。

| ファイル | 役割 |
|---|---|
| `template.yaml` | SAM テンプレート。API Gateway + Lambda |
| `hello-world/app.ts` | Lambda ハンドラ。Turnstile 検証 → 送信 |
| `samconfig.toml` | SAM デプロイ設定（スタック名: `send-mail`） |

環境変数は SAM デプロイ時のパラメータで設定（`TurnstileSecretKey` / `ToEmail` / `FromEmail` / `AllowedOrigin`）。

再デプロイ:
```bash
cd send-mail
sam build && sam deploy
```

## 注意点

- フォント（Inter / JetBrains Mono）は Google Fonts から CDN 読み込み。オフライン環境では表示が崩れる。
- Cloudflare Turnstile の Site Key は `index.html` の `data-sitekey` 属性に、Secret Key は Lambda の環境変数（AWS Parameter Store 経由）に設定。
