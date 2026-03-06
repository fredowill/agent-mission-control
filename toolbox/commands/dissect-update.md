# Dissect Update

Refresh the video knowledge base index. Reads all video-analysis.md files, updates the cross-video knowledge map, regenerates the "What We Already Know" list, and identifies gaps.

**Usage:** `/dissect-update`

No arguments needed — operates on the fixed knowledge base location.

## Paths

- **Knowledge base:** `C:\Users\emeskel\Claude\cares-guide\video-frames\INDEX.md`
- **Video folders:** `C:\Users\emeskel\Claude\cares-guide\video-frames\*/`
- **Each video folder contains:** `video-analysis.md` + `frames/` + optionally `dense/`

## Steps

### 1. Inventory All Video Folders

Scan `cares-guide/video-frames/` for all subdirectories (excluding storyboard temp dirs). For each folder:
- Count JPG files in `frames/` and `dense/`
- Check if `video-analysis.md` exists and has content beyond a stub
- Determine status: Complete, Incomplete (frames only), Empty (analysis only, no frames)

### 2. Read All video-analysis.md Files

For each video folder, read the full analysis and extract:
- Metadata (date, speakers, source path, duration)
- Key findings (the numbered NEW findings sections)
- Topics covered
- Status indicators (TODO items, incomplete markers)

### 3. Rebuild INDEX.md

Regenerate the entire INDEX.md with:

**Quick Summary table:** Updated counts for videos, frames, analysis docs, date.

**Videos section:** One entry per video folder with:
- Folder name, source path, speakers, date
- Key topics and findings (bullet list of top 5-10)
- Frame counts and status

**Cross-Video Knowledge Map:** Rebuild the topic → video mapping table by scanning all analyses for topic keywords.

**"What We Already Know" section:** Consolidated bullet list of ALL findings across all videos. This is the canonical "already known" list used by `/dissect-video` for delta analysis. Deduplicate and merge overlapping findings.

**Undissected Videos table:** Check `~/Downloads/tech docs/` subdirectories for MP4 files not yet associated with any video folder.

### 4. Gap Analysis

After rebuilding, output a summary:

```
## Gap Analysis

### Videos Needing Work
- <folder>: <what's missing — e.g., "frames only, no transcript analysis">

### Topics With Single Source
- <topic>: Only covered in <video> — consider cross-referencing

### Stale Information
- <any findings that may be outdated based on dates>
```

### 5. Report

Print a brief summary of changes made:
- How many videos indexed
- How many findings consolidated
- Any gaps identified
- Any new undissected videos found

## Notes

- This skill is non-destructive — it only updates INDEX.md, never modifies video-analysis.md files
- Run after each `/dissect-video` session to keep the index fresh (though `/dissect-video` also updates INDEX.md itself)
- Useful for periodic maintenance or after manual edits to analysis files
