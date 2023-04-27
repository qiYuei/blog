import path from "node:path";
import glob from "fast-glob";
import fs from "node:fs";
import type { DefaultTheme } from "vitepress/types/default-theme";
const root = process.cwd();

const docsRootPath = path.join(root, "docs");

interface mdFileInfo {
  path: string;
  fileName: string;
}

interface Options {
  ignoreDirectory?: Array<string>; // Directoty path to ignore from being captured.
  ignoreMDFiles?: Array<string>; // File path to ignore from being captured.
}

function getMdPath(
  parentPath: string,
  ignoreMDFiles: Array<string> = []
): mdFileInfo[] {
  const pattern = "**/*.md";
  const files = glob.sync([pattern], {
    cwd: docsRootPath,
    ignore: ignoreMDFiles,
  });
  return files.map((filePath) => {
    const fileName = filePath.split("/").pop()!;
    return { path: filePath, fileName };
  });
}

function resolveSideBar(baseDir: string, opts?: Options) {
  const mdFiles = getMdPath(baseDir, opts?.ignoreMDFiles);

  const sidebars: DefaultTheme.SidebarItem[] = [];

  for (let file of mdFiles) {
    generateRoute(file.path.split("/"), file, sidebars);
  }

  fs.writeFileSync("./text.json", JSON.stringify(sidebars));
  return sidebars;
}

function generateRoute(
  paths: string[],
  file: mdFileInfo,
  sidebar: DefaultTheme.SidebarItem[] | undefined
) {
  if (!sidebar) return;
  const { path: fullPath, fileName } = file;

  const dir = paths.shift();
  if (!dir) return;
  const sideItem = sidebar.find((item) => item.text === dir);

  if (sideItem) {
    sideItem.items = generateRoute(paths, file, sideItem.items);
  } else {
    const newItem: DefaultTheme.SidebarItem = {
      text: dir,
      collapsed: true,
    };
    if (paths.length === 0) {
      //最后一项说明到md文件了
      newItem.text = newItem.text?.slice(0, newItem.text.length - 3);
      newItem.link = "/docs" + "/" + fullPath.slice(0, fullPath.length - 3);
      if (newItem.items?.length === 0) {
        delete newItem.items;
      }
      delete newItem.collapsed;
    } else {
      newItem.items = generateRoute(paths, file, newItem.items || []);
    }

    sidebar.push(newItem);
  }

  return sidebar;
}

export function getSideBar() {
  return resolveSideBar(docsRootPath, {
    ignoreMDFiles: ["index.md"],
  });
}

// [
//   {
//     text: "Examples",
//     items: [
//       { text: "Markdown Examples", link: "/markdown-examples" },
//       { text: "Runtime API Examples", link: "/api-examples" },
//     ],
//   },
// ]
