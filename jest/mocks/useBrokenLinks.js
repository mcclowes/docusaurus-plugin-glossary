export const collectAnchor = jest.fn();

export default function useBrokenLinks() {
  return { collectAnchor, collectLink: () => {} };
}
