// Action本体はユーザが定義するものなので、フレームワーク側では型定義だけを提供する。
export type ActionType<State> = (state: State, ...date: any) => void | any;

export type ActionTree<State> = {
  [action: string]: ActionType<State>
};