import { generateTextImage, getAssetsFile } from "@/utils/pub-use";

export const textTemplates = [
  {
    preview: getAssetsFile("text/1.png"),
    name: "描边标题",
    style: {
      content: "描边文字效果",
      fontSize: 48,
      fontFamily: "Microsoft YaHei",
      bold: true,
      italic: false,
      color: "#FFFFFF",
      opacity: 100,
      lineSpacing: 0,
      letterSpacing: 0,
      align: "center",
      showShadow: false,
      shadowColor: "#000000",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      showStroke: true,
      strokeColor: "red",
      strokeWidth: 3,
    },
  },
  {
    preview: getAssetsFile("text/2.png"),
    name: "阴影标题",
    style: {
      content: "阴影文字效果",
      fontSize: 52,
      fontFamily: "Microsoft YaHei",
      bold: true,
      italic: false,
      color: "#FFD93D",
      opacity: 100,
      lineSpacing: 0,
      letterSpacing: 0,
      align: "center",
      showShadow: true,
      shadowColor: "rgba(59, 59, 59, 1)",
      shadowBlur: 10,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      showStroke: false,
      strokeColor: "#000000",
      strokeWidth: 0,
    },
  },
];

function getTextConfig(textTemplate) {
  return {
    lineSpacing: 0,
    letterSpacing: 0,
    showStroke: false,
    strokeColor: "#ffffff",
    strokeWidth: 0,
    showShadow: false,
    shadowColor: "#ffffff",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    ...textTemplate.style,
  };
}
// !新增新的文字时，需要生成图片, 自行放置生成的图片地址，然后注释下面这行代码
// generateTextImage(getTextConfig(textTemplates[1]));
