// プラグインの読み込み
const HtmlWebpackPlugin = require("html-webpack-plugin");

// webpackはエントリーファイルとエントリーファイル内で読み込まれているモジュールをバンドルしてファイルを出力する
const config = {
  mode: "development",

  // Webpackのデフォルトのエントリーファイルはsrc/index.jsなので、エントリーファイルをこちらで指定する
  entry: {
    main: "./src/index.ts",
  },
  // デフォルトでは devServer はホストのルートディレクトリ / を起点として起動する
  // そのため、サーブすべきディレクトリを webpack.config.js 内で指定してあげる必要があります。
  // ここでは index.html を置いているプロジェクト直下の ./dist を指定します。
  // Webpack Dev Serverは / へのリクエストに対しては index.html ファイルをおそらく返す
  devServer: {
    static: {
      directory: "./dist",
    },
  },
  // "plugins" エントリーを追加
  plugins: [
    // プラグインのインスタンスを作成
    new HtmlWebpackPlugin({
      // html-webpack-plugin はデフォルトで src/index.ejs をテンプレートとし、
      // それにバンドル済みの JS を <script> ~ </script> タグとして差し込んだ HTML ファイルを出力します。
      // テンプレートは独自に指定できる。
      // このプラグインのおかげでdist配下に「バンドルされたjsを指定したscriptタグを書いたindex.html」を手動で置かずにに済む
      template: "./src/index.html",
      // <script> ~ </script> タグの挿入位置
      // injectは挿入するって意味
      inject: "body",
      // スクリプト読み込みのタイプ
      scriptLoading: "defer",
      // ファビコンも <link rel="shortcut icon" ~ /> として挿入できる
      // favicon: "./src/favicon.ico",
    }),
  ],
  resolve: {
    // TS ファイルを追加
    // Webpackは、エントリーファイルから開始して他のモジュールを読み込む際に、resolve オプションに指定されたルールに基づいてモジュールの解決を行います。
    // extensions: モジュールの解決時に自動的に解決されるファイル拡張子の配列を指定します。
    // これにより、import文やrequire文でファイルの拡張子を省略できます。例えば、extensions: ['.js', '.jsx', '.json'] と指定すると、
    // .js、.jsx、.json ファイルの拡張子が省略された場合にも自動的に解決されます。
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    // module.rulesは、Webpackがモジュールをどのように処理するかを指定するためのセクション
    rules: [
      {
        // testでは、モジュールを処理する際に使用する正規表現パターンを指定します。この正規表現にマッチするファイルにルールが適用されます。
        test: /\.ts$/,
        // testで指定した正規表現にマッチするファイルに対してloaderを適用する
        loader: "ts-loader",
      },
    ],
  },
};

// 設定を CommonJS 形式でエクスポート
module.exports = config;