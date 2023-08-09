// 仮想DOMが満たすべきインターフェース
export interface VNode {
  nodeName: keyof HTMLElementTagNameMap;
  attributes: Attributes;
  children: NodeType[];
}

type NodeType = VNode | string | number;
type Attributes = { [key: string]: string | Function };

// TSのインターフェースはクラスが実装すべきフィールドやメソッドを定義した型です。
// クラスはインターフェースを実装することで、クラスがインターフェースが求めるメソッド名や引数の型に則っているかをチェックすることができる。
// TypeScriptにはインターフェースがあるが、JavaScriptにはない。トランスパイルの過程でインターフェースは消される
// Goにおけるインターフェースとは型の一種であり、任意の型がどのようなメソッドを実装すべきかを規定している。
// 以下はジェネリクスのインターフェース
export interface View<State, Actions> {
  (state: State, actions: Actions): VNode;
}

// 仮想DOMツリーを作成する
// jsxをトランスパイhメソッドの呼び出しに変換される
// childrenは子ノードを表している
// hメソッドの戻り値がが仮想DOMのツリーである
export function h(nodeName: keyof HTMLElementTagNameMap, attributes: Attributes, ...children: NodeType[]): VNode {
  return { nodeName, attributes, children };
}

function isVNode(node: NodeType): node is VNode {
  return typeof node !== "string" && typeof node !== "number";
}

// onから始まる属性名はイベントとして扱う
function isEventAttr(attribute: string) {
  return /^on/.test(attribute);
}

// targetのエレメントに属性群を追加する
function setAttributes(target: HTMLElement, attributes: Attributes): void {
  for (let attribute in attributes) {
    // attributeがeventなら、addEventListenerで登録する
    if (isEventAttr(attribute)) {
      const eventName = attribute.slice(2);
      target.addEventListener(eventName, attributes[attribute] as EventListener);
    } else {
      // 第一引数はname、第二引数はvalue
      target.setAttribute(attribute, attributes[attribute] as string);
    }
  }
}

// 仮想DOMを元に、リアルDOMに追加するDOMツリーを生成する
export function createElement(node: NodeType): HTMLElement | Text {
  if (!isVNode(node)) {
    return document.createTextNode(node.toString());
  }

  // 上のif文を突破したら、nodeはNodeTypeではなくて、VNodeになる
  // createElementメソッドに仮想DOMツリーを渡して、 document.createElementにnodeNameを渡してHTML elementを作成している
  // elementにしないとsetAttributeが使えないので、nodeの情報からelementを作成している
  // setAttributeは、elementのインターフェースから提供されている
  const element = document.createElement(node.nodeName);
  // targetのエレメントに属性群を追加する(イベントもあるならイベントを追加する)
  setAttributes(element, node.attributes);
  // 再起的にcreateElement関数を呼び出している
  node.children.forEach((child) => element.appendChild(createElement(child)));

  return element;
}

// 差分検知
// 差分検知では、変更前後の仮想DOMツリーを比較し、差分がある部分だけをリアルDOMに反映する処理を行う。
enum ChangedType {
  // 差分なし
  None,
  // nodeの型が違う
  Type,
  // テキストノードが違う
  Text,
  // ノード名(タグ名)が違う
  Node,
  // inputのvalueが違う
  Value,
  // 属性が違う
  Attr
}

// 受け取った2つの仮想DOMの差分を検知する
function detectVirtualDOMDifference(oldNode: NodeType, newNode: NodeType): ChangedType {
  // different type
  if (typeof oldNode != typeof newNode) {
    return ChangedType.Type;
  }

  // different text
  if (!isVNode(oldNode) && oldNode !== newNode) {
    return ChangedType.Text;
  }

  // 簡易的比較
  if (isVNode(oldNode) && isVNode(newNode)) {
    if (oldNode.nodeName !== newNode.nodeName) {
      return ChangedType.Node;
    }
    if (oldNode.attributes?.value !== newNode.attributes?.value) {
      return ChangedType.Value;
    }
    if (JSON.stringify(oldNode.attributes) !== JSON.stringify(newNode.attributes)) {
      return ChangedType.Attr;
    }
  }

  // 差分なし
  return ChangedType.None;
}

// 仮想DOMの差分を検知して、リアルDOMに反映する
// updateElementメソッドに変更前後の仮想DOMツリーを渡すことで、差分がある箇所だけリアルDOMに反映する。
export function updateElement(parent: HTMLElement, oldNode: NodeType, newNode: NodeType, index = 0) {
  // oldNodeがない場合は新しいnodeをparentに追加する
  if (typeof oldNode === "undefined") {
    parent.appendChild(createElement(newNode));
    return;
  }

  // ペアレントの最初の子ノードを取得する
  // つまり、updateElementを初回で呼び出す場合、parentは#appのnode。
  // つまり、updateElementを初回で呼び出す場合、targetは仮想DOMツリーのルートノードであることがわかる
  const target = parent.childNodes[index];

  // newNodeがない場合、そのノードを削除する
  if (!newNode) {
    parent.removeChild(target);
    return;
  }

  // 差分検知をして、バッチ処理を行う
  // nodeに含まれるnodeNameに応じて変化しているかをチェックする。nodeに含まれるnodeは見ないで一つのnodeだけを見る
  const changeType = detectVirtualDOMDifference(oldNode, newNode);

  switch (changeType) {
    // TypeScriptのswitchは連続して書ける
    case ChangedType.Type:
    case ChangedType.Text:
    case ChangedType.Node:
      // parent(ルートノード)のchildをreplaceする
      // 最初にnewChildを指定する。次にoldChildを指定する
      // ノードの変化がある部分だけ置き換える。仮想DOMツリーで全部置き換えるってわけではない
      parent.replaceChild(createElement(newNode), target)
    case ChangedType.Value:
      // valueの変更時にNodeを置き換えてしまうとフォーカスが外れてしまうため
      // DOMツリーのnodeにあるvalueを更新している
      updateValue(target as HTMLInputElement, (newNode as VNode).attributes?.value as string)
      return;
    case ChangedType.Attr:
      // DOMツリーのノードのattributesを更新している
      updateAttributes(target as HTMLElement, (oldNode as VNode).attributes, (newNode as VNode).attributes)
      return;
  }

  // 再帰的にupdateElementを呼び出して、childrenの更新処理を行う
  // ここの処理特殊やな。このスコープでのループ処理と、呼び出したスコープでのループ処理がある
  if (isVNode(oldNode) && isVNode(newNode)) {
    for (let i = 0; i < newNode.children.length || i < oldNode.children.length; i++) {
      updateElement(target as HTMLElement, oldNode.children[i], newNode.children[i], i);
    }
  }
}

// NodeをReplaceしてしまうとinputのフォーカスが外れてしまうため
function updateAttributes(target: HTMLElement, oldAttributes: Attributes, newAttributes: Attributes) {
  // remove attributes
  for (let attribute in oldAttributes) {
    if (!isEventAttr(attribute)) {
      target.removeAttribute(attribute);
    }
  }

  // set attributes
  for (let attribute in newAttributes) {
    if (!isEventAttr(attribute)) {
      target.setAttribute(attribute, newAttributes[attribute] as string);
    }
  }
}

// updateAttributesでやりたかったけど、value属性としては動かないので別途作成
function updateValue(target: HTMLInputElement, newValue: string) {
  target.value = newValue;
}




