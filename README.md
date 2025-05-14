# 一方云剪

一方云剪是一款不依赖服务器服务的视频剪辑站点，通过整合@hughfenghen作者的WebAV、opfs-tools，添加一些必要的剪辑功能，希望能给相关开发者更多的帮助和启发。如果对您有帮助，请给个star支持一下。如果在使用中遇到问题，请在issue中提出，也欢迎提交PR。

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

5. Project Management
   - Local project saving

6. Exporting
   - Export as MP4 format
   - Real-time export progress display
   - Export operation can be interrupted

7. Local Storage
   - Uses IndexedDB for project data
   - Uses OPFS (Origin Private File System) for media files
   - Fully serverless operation
   - Protects user privacy

8. User Interface
   - Modern dark theme
   - Responsive layout
   - Adjustable editor panel ratio
   - Intuitive drag-and-drop experience

## 注意事项

1. Browser Compatibility
   - Works only on local or HTTPS deployments
   - Supports only Chrome 102+ and Edge 102+
   - Recommended to use the latest version of Chrome or Edge for the best experience

2. Storage Limitations
   - IndexedDB used for project data
   - OPFS used for storing media files
   - Be aware of browser storage limits

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