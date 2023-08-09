import { ActionTree } from "./action";
import { View, VNode, createElement, updateElement} from "./view";

interface AppConstructor<State, Action> {
  // 親ノード
  element: HTMLElement | string;
  // Viewの定義
  view: View<State, ActionTree<State>>;
  // 状態管理
  state: State;
  // Actionの定義
  actions: ActionTree<State>;
}

// フロントエンドアプリケーションのルートエレメント, ビュー、ステイト、ステイトの更新処理、変更前後の仮想DOMを管理している
export class App<State, Actions> {
  // このelementはトップレベルの親ノード
  // elementは変化しなくて、element配下が変化する
  private readonly element: HTMLElement;
  private readonly view: View<State, ActionTree<State>>;
  private readonly state: State;
  private readonly actions: ActionTree<State>;
  private oldNode: VNode;
  private newNode: VNode;
  private skipRender: boolean;

  constructor(params: AppConstructor<State, Actions>) {
    // Document メソッド querySelector() は、指定したセレクタあるいはセレクタ群にマッチするドキュメント内の最初の要素を返します
    this.element = typeof params.element === "string" ? document.querySelector(params.element) : params.element;
    this.view = params.view;
    this.state = params.state;
    // ただのactionsだとstateの更新処理しかしないからdispatchでラップして、アクションに仮想DOMの更新処理も付与している
    // だから更新されるのか。
    this.actions = this.dispatchAction(params.actions);
    // これが実行されると仮想DOMを再構築して、レンダリング処理を行う
    this.resolveNode();
  }

  // dispatchActionではユーザが定義したactionsを書き換え、引数にStateを追加したり、処理が終わったら仮想DOMの再構築を実行したりする。
  private dispatchAction(actions: ActionTree<State>) {
    // actionsはオブジェクト。そこからキーを取り出して、キーを元にアクションのバリューに指定してある処理を取り出している
    const dispatched = {} as ActionTree<State>;
    for (let key in actions) {
      const action = actions[key];
      // ここでresolveNodeが実行されるわけではなくて、こういう関数が代入されるってだけか
      dispatched[key] = (state: State, ...data: any) => {
        // actionsのキーに対応する関数を呼び出す
        // ここでstateが更新される
        const ret = action(state, ...data);
        // actionに指定してある関数を呼びだした後、新しい仮想DOMを生成してDOMの更新処理を行う。
        this.resolveNode();
        return ret;
      };
    }
    return dispatched;
  }

  // 仮想DOMを再構築して、スケジューラーにレンダリング処理を登録している
  // 現在のビュー(こいつはapp配下の仮想DOM)をnewNodeに代入して、スケジュールレンダーしている
  // resolveNodeが呼び出されるたびに、新しいthis.stateがactionsにセットされる
  private resolveNode() {
    // actionsにある実際の更新処理をviewの処理内でイベントに設定している
    // このviewのstateは変化する。actionsの具体的な処理は一般的には変化しない
    // このactionsはactionsと言いつつdispatchでラップされている
    this.newNode = this.view(this.state, this.actions);
    // scheduleRenderの中でレンダリング処理をしている
    this.scheduleRender();
  }

  // レンダリングのスケジューリングを行う
  // （連続でActionが実行されたときに、何度もDOMツリーを書き換えないため）
  private scheduleRender() {
    if (!this.skipRender) {
      this.skipRender = true;
      // bindは引数に渡した値でthisを固定する
      // スケジュールレンダーの中でレンダーを呼び出している
      // 0ミリ秒を指定する(指定しなかったらデフォルトの0ミリ秒となる)とメインスレッドの処理がすべて完了してから実行する
      setTimeout(this.render.bind(this));
    }
  }

  // 描画処理
  private render(): void {
    // 最初の描画処理ではoldNodeがない(undefined)。その場合はnewNode(Viewが表す仮想DOMツリー)を
    if (this.oldNode) {
      updateElement(this.element, this.oldNode, this.newNode);
    } else {
      // このelementはトップレベルのノード(#appが指定されているノード)
      // このappendChildで画面に反映されている
      // createElementを実行することで、仮想DOMを元にリアルDOMに追加するリアルDOMツリーを生成している。そのDOMツリーをappendChildに渡している
      // appendChildはNodeインターフェースのメソッドで、引数には、HTMLElement | Textを指定する
      this.element.appendChild(createElement(this.newNode));
    }

    // newNode(#app配下の仮想DOMツリー)をoldNodeとする
    this.oldNode = this.newNode;
    this.skipRender = false;
  }
}