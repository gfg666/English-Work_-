import { defineStore } from "pinia";
import { store } from "@/store";
import { Track, TrackClip } from "@/types/track";
import { db } from "@/db/db";

type ClipUpdateCallback = (
  clip: TrackClip,
  type: "default" | "resize" | "delete"
) => void;

export const useTrackStore = defineStore("track", {
  state: () => ({
    showContextMenu: false,
    contextMenuPosition: {
      x: 0,
      y: 0,
    },
    dragData: null as any,
    canvasSize: {
      width: 0,
      height: 0,
    },
    currentHistoryIndex: -1,
    maxHistoryIndex: -1,
    maxHistorySize: 50,
    clipUpdateSubscribers: new Map<string, ClipUpdateCallback>(),
    activeClip: null as TrackClip | null,
  }),
  getters: {
    getShowContextMenu: (state) => state.showContextMenu,
    getContextMenuPosition: (state) => state.contextMenuPosition,
    getDragData: (state) => state.dragData,
    getCanvasSize: (state) => state.canvasSize,
    canUndo: (state) => state.currentHistoryIndex > 0,
  },
  actions: {
    subscribeToClipUpdates(clipId: string, callback: ClipUpdateCallback) {
      this.clipUpdateSubscribers.set(clipId, callback);
    },
    unsubscribeFromClipUpdates(clipId: string) {
      this.clipUpdateSubscribers.delete(clipId);
    },
    // 调整clip通知 type: 'default' | 'resize' | 'delete'
    publishClipUpdate(
      clip: TrackClip,
      type: "default" | "resize" | "delete" = "default"
    ) {
      const callback: ClipUpdateCallback | undefined =
        this.clipUpdateSubscribers.get(clip.id!);
      if (callback) {
        callback(clip, type);
      }
    },
    setShowContextMenu(show: boolean) {
      this.showContextMenu = show;
    },
    setContextMenuPosition(position: { x: number; y: number }) {
      this.contextMenuPosition = position;
    },
    setDragData(data: any) {
      this.dragData = data;
    },
    clearDragData() {
      this.dragData = null;
    },
    setCanvasSize(size: { width: number; height: number }) {
      this.canvasSize = size;
    },
    async saveHistoryState(projectId: number, tracks: Track[]) {
      await db.history
        .where("projectId")
        .equals(projectId)
        .and((item) => item.index > this.currentHistoryIndex)
        .delete();

      this.currentHistoryIndex++;
      this.maxHistoryIndex = this.currentHistoryIndex;

      await db.history.add({
        projectId,
        tracks: JSON.parse(JSON.stringify(tracks)),
        index: this.currentHistoryIndex,
        timestamp: Date.now(),
      });

      const count = await db.history
        .where("projectId")
        .equals(projectId)
        .count();
      if (count > this.maxHistorySize) {
        const oldestRecords = await db.history
          .where("projectId")
          .equals(projectId)
          .and((item) => item.index === 0)
          .toArray();

        if (oldestRecords.length > 0) {
          await db.history.delete(oldestRecords[0].id!);
          this.currentHistoryIndex--;
          this.maxHistoryIndex--;
        }
      }
    },
    async undo(projectId: number) {
      if (!this.canUndo) return null;

      const previousState = await db.history
        .where("projectId")
        .equals(projectId)
        .and((item) => item.index === this.currentHistoryIndex - 1)
        .first();

      if (previousState) {
        this.currentHistoryIndex--;
        return previousState.tracks;
      }
      return null;
    },
    async redo(projectId: number) {
      const nextState = await db.history
        .where("projectId")
        .equals(projectId)
        .and((item) => item.index === this.currentHistoryIndex + 1)
        .first();

      if (nextState) {
        this.currentHistoryIndex++;
        return nextState.tracks;
      }
      return null;
    },
    async getCanRedo(projectId: number) {
      const count = await db.history
        .where("projectId")
        .equals(projectId)
        .count();
      return this.currentHistoryIndex < count - 1;
    },
    async clearHistory(projectId: number) {
      await db.history.where("projectId").equals(projectId).delete();
      this.currentHistoryIndex = -1;
      this.maxHistoryIndex = -1;
    },
    setActiveClip(clip: TrackClip | null) {
      this.activeClip = clip;
    },
  },
});

export function useTrackStoreWithOut() {
  return useTrackStore(store);
}
