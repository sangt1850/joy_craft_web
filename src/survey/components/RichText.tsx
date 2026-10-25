import { Fragment, type ReactNode } from 'react';

// 안내문용 제한 서식. HTML을 해석하지 않고 아래 태그만 React 요소로 변환한다.
//   [b]굵게[/b]  [u]밑줄[/u]  [red]빨강[/red]
// 닫히지 않았거나 모르는 태그는 입력한 그대로 글자로 보여준다.
const TAGS: Record<string, string> = {
  b: 'rt-b',
  u: 'rt-u',
  red: 'rt-red',
};

const TOKEN = /\[(\/?)(b|u|red)\]/g;

interface TagNode {
  tag: string | null;
  closed: boolean;
  children: (string | TagNode)[];
}

function parse(text: string): TagNode {
  const root: TagNode = { tag: null, closed: true, children: [] };
  const stack: TagNode[] = [root];
  let last = 0;

  for (const m of text.matchAll(TOKEN)) {
    const top = stack[stack.length - 1];
    const closing = m[1] === '/';
    if (closing && top.tag !== m[2]) continue; // 짝이 안 맞는 닫는 태그는 글자로 둔다
    if (m.index > last) top.children.push(text.slice(last, m.index));
    last = m.index + m[0].length;
    if (closing) {
      top.closed = true;
      stack.pop();
    } else {
      const node: TagNode = { tag: m[2], closed: false, children: [] };
      top.children.push(node);
      stack.push(node);
    }
  }
  if (last < text.length) stack[stack.length - 1].children.push(text.slice(last));
  return root;
}

function render(node: TagNode, key: number): ReactNode {
  const kids = node.children.map((c, i) =>
    typeof c === 'string' ? <Fragment key={i}>{c}</Fragment> : render(c, i),
  );
  if (!node.tag) return <Fragment key={key}>{kids}</Fragment>;
  if (!node.closed) {
    // 닫히지 않은 태그: 여는 태그를 글자로 되돌리고 내용은 서식 없이 보여준다.
    return (
      <Fragment key={key}>
        [{node.tag}]{kids}
      </Fragment>
    );
  }
  return (
    <span key={key} className={TAGS[node.tag]}>
      {kids}
    </span>
  );
}

export function RichText({ text }: { text: string }) {
  return <>{render(parse(text), 0)}</>;
}
