/**
 * 公式LINE URL設定
 *
 * LPのクエリパラメータ(?s=xxx)に応じて異なるLINE URLに誘導する。
 * 新しい流入経路を追加する場合はここに追記する。
 */

/** デフォルトの公式LINE URL */
export const DEFAULT_LINE_URL =
  process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || 'https://lin.ee/5uOPktg';

/** クエリパラメータ ?s= の値と公式LINE URLのマッピング */
export const LINE_URL_BY_SOURCE: Record<string, string> = {
  insta: 'https://lin.ee/h6Ahao7',
  sns: 'https://lin.ee/2rHJODO',
};

/** ソースに対応するLINE URLを返す。該当なしならデフォルト */
export function getLineUrl(source: string | null): string {
  if (source && source in LINE_URL_BY_SOURCE) {
    return LINE_URL_BY_SOURCE[source];
  }
  return DEFAULT_LINE_URL;
}
