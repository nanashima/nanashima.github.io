window.labInformationArchive = [
  // featured: true の項目だけがトップページの What's New でループ表示されます。
  // 配列の並び順もそのまま使われます。内容はこの配列を書き換えて更新できます。
  //
  // 改行を表示したいときは，summary をバッククォート（`）か \n で書いてください。
  // 例: summary: `1行目
  // 2行目`
  //     summary: '1行目\n2行目'
  //
  // 文中リンクを入れたいときは，summaryHtml を使えます。
  // 例: summaryHtml: '詳細は <a href="https://example.com/" target="_blank" rel="noopener noreferrer">こちら</a> をご覧ください。'
  /*{
    id: 'opening-prep',
    featured: true,
    kind: '案内',
    date: '2026-03-27',
    dateLabel: '2026.03.27',
    title: '2026年5月の立ち上げに向けて準備を進めています。',
    summary: '研究室の立ち上げにあわせて，配属や運営に関する案内も順次追加していく予定です．'
  },*/
  {
    id: 'labex2026',
    featured: true,
    kind: 'お知らせ',
    date: '2026-04-01',
    dateLabel: '2026.04.01',
    title: '2026年度 大学院説明会',
    summaryHtml: `4/18(土) の大学院説明会 (@大岡山キャンパス) に参加します．
    研究内容に興味がある方や活動について質問がある方は，気軽に西8号館W棟7階 W710 にお越しください．
    <a href="https://www.li.comp.isct.ac.jp/admission/2026.html" target="_blank" rel="noopener noreferrer">詳細はこちら</a>`
  },
  {
    id: 'site-open',
    featured: true,
    kind: 'お知らせ',
    date: '2026-04-01',
    dateLabel: '2026.04.01',
    title: '研究室ページを公開しました．',
    summary: `詳細情報やページ構成は今後も少しずつ更新していきます．`
  }
];
