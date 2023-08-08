import { View, h } from "./view";
import { ActionTree } from "./action";
import { App } from "./app";

type State = typeof state;
type Actions = typeof actions;

// state
const state = {
  count: 0
};

// actionsはstateを更新する処理群を保持している
const actions: ActionTree<State> = {
  increment: (state: State) => {
    state.count++;
  }
};

// ここにviewを書いている
// viewはhメソッドの呼び出しが返されるので、仮想DOMツリーが返される
// hメソッドを呼び出した時点では、ただ仮想DOMのオブジェクトツリーを作っているだけ。
const view: View<State, Actions> = (state, actions) => {
  // 引数で渡されたactionsのactionをセットしている
  return h(
    "div",
    null,
    h("p", null, state.count),
    h(
      "button",
      { type: "button", onclick: () => actions.increment(state) },
      "count up"
    )
  );
};

new App<State, Actions>({
  element: "#app",
  state,
  view,
  actions
});
