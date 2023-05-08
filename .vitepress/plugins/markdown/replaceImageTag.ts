import type MarkdownIt from "markdown-it";

export const replaceImagePlugin = (md: MarkdownIt) => {
  const imageRule = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    const altIndex = token.attrIndex("alt");
    const src = token.attrs[srcIndex][1];
    const alt = altIndex >= 0 ? token.attrs[altIndex][1] : "";
    return `<image-zoom src="${src}" alt="${alt}" />`;
  };
};
