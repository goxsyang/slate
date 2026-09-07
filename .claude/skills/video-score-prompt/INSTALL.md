# video-score-prompt 安裝說明（另一台電腦）

## 0. 最快的方式：從 slate repo 直接用
本 skill 已放在 `goxsyang/slate` 的 `.claude/skills/video-score-prompt/`。在該 repo 裡開 Claude Code 就會自動載入，不需另外安裝。
要讓所有專案都能用，在 repo 根目錄跑一次：
```bash
bash .claude/skills/video-score-prompt/install.sh
```

## 1. 放到 Claude Code 的 skills 目錄
```bash
mkdir -p ~/.claude/skills
unzip -o video-score-prompt-20260903.zip -d ~/.claude/skills/
chmod +x ~/.claude/skills/video-score-prompt/scripts/analyze_video.sh
```
重開 Claude Code（或新開 session），輸入含「配樂」「BGM」「配樂 prompt」的請求即會自動觸發。

## 2. 依賴（macOS）
- ffmpeg / ffprobe：`brew install ffmpeg`
- python3（macOS 內建即可，腳本只用標準庫，不需要 librosa／numpy）
- awk（內建）

Windows／Linux：需有 bash、ffmpeg、python3 在 PATH；路徑含中文請加引號。

## 3. 快速自測
```bash
bash ~/.claude/skills/video-score-prompt/scripts/analyze_video.sh --help
bash ~/.claude/skills/video-score-prompt/scripts/analyze_video.sh "<任一影片>" /tmp/score-test 2
```
應產出：規格、音軌能量表與人聲空窗、切點清單、每 5 秒密度、contact sheet（/tmp/score-test/sheet*.jpg）。

## 4. 內容一覽
- SKILL.md：四步流程（量測→判讀→寫 prompt→交付）與路由表
- references/arrangement-theory.md：樂理與編曲（調式、轉調、配器分層、力度曲線、切點→BPM、轉折工具箱、音色人格）
- references/genre-playbooks.md：22 種影片類型骨架＋三軸多樣性＋台灣語境替代表
- references/scoring-craft.md、comedy-tension-advanced.md、melody-craft.md、chinese-idioms.md
- references/ai-model-vocab.md（詞彙效度）、elevenlabs-music.md（平台事實，未查證項已標）
- scripts/analyze_video.sh：量測腳本（--prev 重剪比對、--music 現成曲分析、--no-frames）

版本：2026-09-03 v2（升級自 2026-07-26 v1）
