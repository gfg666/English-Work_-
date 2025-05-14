# 一方云剪

Yifang Clip is a video editing site that runs entirely in the browser without relying on any server-side services. Built upon @hughfenghen’s WebAV and opfs-tools, it adds essential editing features to support and inspire developers working on similar projects. If you find it helpful, please consider giving it a ⭐. For issues or feature requests, feel free to open an issue or submit a PR.
## 项目地址

[https://github.com/caohongz/yifang-clip](https://github.com/caohongz/yifang-clip)

## 项目预览

[https://caohongz.github.io/yifang-clip/](https://caohongz.github.io/yifang-clip/)

## 功能特点

1. Multi-track editing
   - Support multiple video, audio, picture and text tracks
   - Drag-and-drop sorting and position adjustment are supported between tracks
   - Track operation history
   - Support up to 10 parallel tracks

2. Media editing function
   - Video segmentation
   - Visualization of audio waveforms
   -  Accurate positioning at the video frame level
   - Support dynamic pictures (GIF)
   - Support the volume adjustment of video clips
   -  Support the filter of video clips

3. Text Editing Features
   - Rich text styling options
   - Customizable font size and color
   - Text shadow and stroke effects
   - Multiple text alignment options

4. Real-Time Preview
   - Real-time editing preview
   - Full-screen preview support
   - Frame-by-frame precise preview
   - Adaptive canvas sizing

5. 项目管理
   - 本地项目保存

6. 导出功能
   - 支持导出MP4格式
   - 导出进度实时显示
   - 支持中断导出操作

7. 本地化存储
   - 使用IndexedDB存储项目数据
   - 使用OPFS存储媒体文件
   - 无需服务器即可运行
   - 保护用户隐私数据

8. 用户界面
   - 现代化深色主题界面
   - 响应式布局设计
   - 可调节编辑区域比例
   - 友好的拖放操作体验

## 注意事项

1. 浏览器兼容性
   - 仅支持本地部署或HTTPS协议
   - 仅支持 Chrome 102+和 Edge 102+版本
   - 建议使用最新版 Chrome或 Edge 以获得最佳体验

2. 存储限制
   - 使用 IndexedDB 存储项目数据
   - 使用 OPFS (Origin Private File System) 存储媒体文件
   - 注意浏览器存储空间限制

3. Performance Considerations
   - Recommended for processing videos under 1080p
   - Long videos may take more time to process

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- WebCodecs API
- WebAV
- PIXI.js (v7.4.2)
- IndexedDB
- Tailwind CSS

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 致谢

- [@hughfenghen/WebAV](https://github.com/bilibili/WebAV)
- [@hughfenghen/opfs-tools](https://github.com/hughfenghen/opfs-tools)

## License

MIT License - 详见 [LICENSE](LICENSE) 文件