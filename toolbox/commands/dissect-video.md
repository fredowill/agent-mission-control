# Dissect Video

Comprehensive visual + audio analysis of an MP4 video file. Extracts frames, reads transcripts, and synthesizes all information into structured, actionable knowledge. Automatically integrates with the persistent knowledge base at `video-frames/INDEX.md`.

**Usage:** `/dissect-video <path-to-mp4> [--transcript <path-to-vtt>] [--summary <path-to-txt>]`

If no arguments given, search for MP4 files in:
- Current working directory and subdirectories
- `~/Downloads/tech docs/` and subdirectories
- `~/Downloads/`, `~/Videos/`, `~/Desktop/`

## Phase 1: Read Existing Knowledge

**Before doing anything else**, read the master index to understand what's already known:

1. **Read INDEX.md**: `C:\Users\emeskel\Claude\cares-guide\video-frames\INDEX.md`
   - Note the "What We Already Know" section — do NOT re-extract any of these findings
   - Check if this video has been partially dissected before (check "Undissected Videos" table)
2. **Set output folder**: Choose a descriptive topic-based name (what you learn from the video, NOT the meeting name).
   - Examples: `experiment-walkthrough`, `tenant-credentials`, `metrics-nrr-investigation`
   - NOT: `1-1-eugene`, `fhl-1`, `mapi-recording`
   - Path: `C:\Users\emeskel\Claude\cares-guide\video-frames\<topic-name>/`
   - Create subfolders: `frames/` and optionally `dense/`

## Phase 2: Locate Assets

1. **Find the MP4 file** at the provided path (or search for it)
2. **Find companion files** in the same directory:
   - `.vtt` transcript (WebVTT subtitle format) — this is the most valuable asset
   - `*summary*` or `*notes*` text files (AI-generated meeting notes)
   - `.srt` subtitle files
3. **Get video metadata** using ffprobe:
   ```bash
   FFMPEG_DIR="C:/Users/emeskel/Claude/tools/ffmpeg_extracted/ffmpeg-8.0.1-essentials_build/bin"
   "$FFMPEG_DIR/ffprobe" -v quiet -print_format json -show_format -show_streams "<video_path>"
   ```
   Extract: duration, resolution, creation time

## Phase 3: Transcript-First Analysis

**If a VTT transcript exists, read it ENTIRELY before extracting any frames.**

1. **Read the full VTT transcript** — parse `<v Speaker>` tags for speaker attribution
2. **Read the AI summary** if available
3. **Build a topic timeline** from the transcript:
   - Who speaks when and about what
   - When screens/demos are shown (cues: "let me share", "you can see", "click on")
   - Key decisions, explanations, and action items
   - New information NOT already in INDEX.md "What We Already Know" section
4. **Identify frame-worthy moments** — timestamps where visual proof is needed:
   - UI screens being demonstrated
   - Configuration fields being filled in
   - Data/metrics being shown
   - Error states or unexpected behavior
   - Skip talking-head segments — no frames needed

## Phase 4: Storyboard Scan

Before targeted extraction, do a quick visual scan to identify screen-share vs talking-head segments:

```bash
FFMPEG="C:/Users/emeskel/Claude/tools/ffmpeg_extracted/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe"
VID="<path-to-video>"
OUT="<output-folder>/storyboard"
mkdir -p "$OUT"

# Extract 1 frame every 90 seconds for quick visual scan
"$FFMPEG" -i "$VID" -vf "fps=1/90" -q:v 5 "$OUT/scan-%03d.jpg" -y
```

Read the storyboard frames to identify:
- **Screen-share segments**: timestamps with application UIs, portals, code, spreadsheets
- **Talking-head segments**: timestamps with webcam feeds only
- **Transition points**: where content changes significantly

Delete storyboard frames after scanning (they're just for planning).

## Phase 5: Strategic Frame Extraction

Using insights from Phase 3 (transcript) and Phase 4 (storyboard), extract frames:

```bash
FFMPEG="C:/Users/emeskel/Claude/tools/ffmpeg_extracted/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe"
VID="<path-to-video>"
OUT="<output-folder>/frames"
mkdir -p "$OUT"

# Extract at each key timestamp
"$FFMPEG" -ss HH:MM:SS -i "$VID" -frames:v 1 -q:v 2 "$OUT/##-description.jpg" -y
```

**Frame naming:** Descriptive, kebab-case: `01-scenario-selection.jpg`, `02-ingestion-stats.jpg`

**Dense extraction** for critical config/data screens only:
```bash
DENSE_OUT="<output-folder>/dense"
mkdir -p "$DENSE_OUT"
"$FFMPEG" -ss START -to END -i "$VID" -vf "fps=1/10" "$DENSE_OUT/%04d-%Mm%Ss.jpg" -y
```

**Target: 10-20 strategic frames.** Only go higher if the video is a long demo with many distinct screens.

## Phase 6: Visual Analysis

Read every extracted frame using the Read tool. For each frame, document:

1. **What application/website is shown** — URL bar, page title, navigation
2. **Specific UI elements** — field names, dropdown values, button labels, table columns
3. **Data shown** — actual values, selected options, configuration settings
4. **Layout and navigation** — sidebar items, breadcrumbs, tabs
5. **Anything being highlighted** — cursor position, selected elements

**CRITICAL:** Read every piece of text visible in the UI. Field labels, placeholder text, help text, tooltips, error messages — all of it matters.

## Phase 7: Cross-Reference & Synthesize

Combine visual + audio into unified understanding:

1. **Map transcript segments to frames** — what was said when each screen was shown
2. **Identify gaps** — transcript mentions things not in frames? Extract more.
3. **Delta analysis** — compare findings against INDEX.md "What We Already Know":
   - Mark findings as NEW, CONFIRMS, or CORRECTS existing knowledge
   - Only include genuinely new findings in the output
4. **Speaker attribution** — who contributed each key insight

## Phase 8: Output

### 8a. Save video-analysis.md

Save to `<output-folder>/video-analysis.md`:

```markdown
# Video Analysis: <Descriptive Topic Title>

## Metadata
- Duration: X minutes Y seconds
- Speakers: Name1 (role), Name2 (role)
- Date: Month DD, YYYY
- Source: `<full file path>`

## New Findings (Not Previously Documented)

### 1. <Finding Title>
**Transcript (MM:SS):** *"exact quote"* — Speaker Name

<Explanation of the finding and why it matters>

**Worth adding to guide?** YES/NO/MAYBE — <reason>

---

### 2. ...

## Chapters
### Chapter 1: <topic> (MM:SS - MM:SS)
**What's shown (frames):** <description>
**Key points from audio:** <synthesized>
**UI Details:** <exact field names, paths, values>

## Key Screenshots
| Frame | Description |
|---|---|
| `##-name.jpg` | What it shows and why it matters |

## Action Items
- [ ] Item from the meeting
```

### 8b. Update INDEX.md

After saving the analysis, update `C:\Users\emeskel\Claude\cares-guide\video-frames\INDEX.md`:

1. **Increment the video count** in Quick Summary
2. **Add a new entry** in the Videos section (next sequential number)
3. **Add new findings** to the "What We Already Know" section (bullet points)
4. **Update the Cross-Video Knowledge Map** table with new topic coverage
5. **Remove from "Undissected Videos"** if it was listed there

## Important Principles

- **Transcript first, frames second.** For meetings with VTT files, the transcript is the primary source. Frames provide visual proof for key moments only.
- **Delta analysis always.** Read INDEX.md first. Only extract NEW findings. Don't re-document known information.
- **Topic-based folder names.** Name by what you learn (e.g., `metrics-nrr-investigation`), not the meeting title (e.g., `mapi-quality-metrics-sync`).
- **Cross-reference always.** Every claim backed by frame or transcript, ideally both.
- **Use real names.** If the UI says `SDFv2`, don't write "SDF". If a field is `Sydney Variants`, don't call it "feature flags".
- **Dense extract for config screens only.** Don't dense-extract talking-head or meeting lobby segments.
- **Speaker parsing.** VTT `<v Speaker>` tags are gold — attribute findings to specific people.
