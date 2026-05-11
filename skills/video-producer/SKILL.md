---
name: video-producer
description: Produce long-form AI video preproduction packages through an autonomous producer workflow. Use when the user asks for a producer agent, video story development, storyboard generation, shotboard planning, Seedance 2 prompts, or iterative conversion of a story into storyboard images and 15-second Seedance generation arcs using delegated subagents.
---

# Video Producer

## Overview

Act as the producer for an AI video project. Drive the work from story clarification through storyboard coverage, shotboard arcs, Seedance 2 prompts, review, and organized artifact storage.

Use this skill to coordinate the process, not to rush into generation. Begin by understanding the video story well enough to delegate specific visual planning work.

## Operating Rules

- Converse with the user before production starts to understand the story, project name, target duration if known, tone, style, characters, setting, intended audience, and any hard constraints.
- Ask only for clarification that is needed to continue. If the user already provided enough information, proceed without more questions.
- Run autonomously once production has enough information. Return to the user only when blocked by an ambiguity that would materially change the story, visual continuity, duration, or deliverables.
- Use subagents when the user has authorized delegation or the runtime permits it. If subagents are unavailable, execute the same roles sequentially and preserve the same review gates.
- Review each subagent result before using it. Reject or revise outputs that are incomplete, visually inconsistent, not grounded in the story, or unsuitable for Seedance 2 generation.
- Save every artifact inside a folder named for the project. Organize files so another agent can resume the project without reading the conversation.
- Keep Seedance 2 prompts as separate text files. Shotboard images may include concise production-board labels, panel numbers, timecodes, and action captions, but must not embed the full Seedance 2 prompt.
- Storyboard and shotboard images must be generated with GPT Image 2 or the active image-generation tool that the runtime exposes as GPT Image 2. Do not satisfy image deliverables with SVG diagrams, ASCII art, layout placeholders, screenshots of text, or purely schematic wireframes unless the user explicitly asks for placeholders.
- If the runtime saves generated images to a cache or default generated-images directory, copy the generated image into the required project folder path using the required filename, and leave the original cached image in place unless the user explicitly asks to delete it.
- If the runtime cannot provide a local generated-image file path, still generate the image in the conversation and create the required notes/prompt files with the exact image-generation prompt and a clear note that the generated image was returned in-chat rather than saved locally.

## Generated Image Copy Protocol

When image generation returns or reports a local generated-image path:

1. Identify the generated file for the current storyboard or shotboard. If several images were generated in a batch, use generation order and verify timestamps before copying.
2. Copy, do not move, the generated file into the required project folder:
   - Storyboards: `01_storyboards/storyboard_[nn]/storyboard_image.[ext]`
   - Shotboards: `02_shotboards/storyboard_[nn]/arc_[nn]_[start-end]s/shotboard_image.[ext]`
3. Leave the original cached/generated image untouched unless the user explicitly asks to delete it.
4. Update the notes file to say whether the image was copied into the project folder or only returned in-chat.
5. Before finalizing, list the expected image files and confirm they exist at their project paths.

## Project Folder

Create a project folder using a filesystem-safe version of the project name:

```text
[project-name]/
  00_brief/
    story_brief.md
    production_log.md
  01_storyboards/
    storyboard_[nn]/
      storyboard_image.png
      storyboard_notes.md
  02_shotboards/
    storyboard_[nn]/
      arc_[nn]_000-015s/
        shotboard_image.png
        seedance2_prompt.md
        arc_notes.md
      arc_[nn]_015-030s/
        shotboard_image.png
        seedance2_prompt.md
        arc_notes.md
  03_review/
    continuity_notes.md
    coverage_checklist.md
```

Adapt extensions to the actual generated image format. Maintain stable numbering with leading zeroes.

## Workflow

1. Intake the story.
   - Capture the user's story, desired project name, duration, format, style references, characters, locations, emotional arc, and constraints.
   - If the duration is unknown, infer a practical structure and document the assumption.
   - Save the agreed brief in `00_brief/story_brief.md`.

2. Plan storyboard coverage.
   - Split the whole story into storyboard sections. A section should cover one coherent beat, scene, or major visual turn.
   - Do not jump directly to 15-second arcs for the full story. First produce a storyboard image for the current story section.

3. Delegate storyboard image creation for the current section.
   - Use the storyboard subagent prompt template in `references/subagent-prompts.md`.
   - Provide the complete story brief plus the specific section to cover.
   - Require the subagent to generate the storyboard image using GPT Image 2, then copy/save the generated image and notes in `01_storyboards/storyboard_[nn]/`.

4. Review the storyboard image.
   - Check story fidelity, character continuity, readable composition, scene coverage, and whether it can support multiple Seedance 2 arcs.
   - If the result is weak, ask the same subagent for a revision or produce a corrected version before continuing.

5. Convert the approved storyboard section into 15-second shotboard arcs.
   - Repeat the shotboard loop until the current storyboard section is fully covered.
   - For each 15-second arc, delegate to a shotboard subagent using the template in `references/subagent-prompts.md`.
   - Require the shotboard image to be generated using GPT Image 2, then copy/save the generated image into the arc folder.
   - Require both `shotboard_image.png` and `seedance2_prompt.md`. The prompt is an accompanying text file, not part of the image.

6. Review each shotboard arc.
   - Confirm that the shotboard image matches the approved storyboard section.
   - Confirm that the Seedance 2 prompt is specific, cinematic, time-bounded to 15 seconds, and directly usable.
   - Revise before moving to the next arc if continuity, timing, or prompt quality is insufficient.

7. Repeat sections until the whole story is covered.
   - After all arcs for the current storyboard section are approved, return to step 3 for the next section.
   - Continue until every story beat in `story_brief.md` has storyboard and shotboard coverage.

8. Finalize.
   - Write `03_review/coverage_checklist.md` mapping every story beat to storyboard and shotboard files.
   - Write `03_review/continuity_notes.md` with character, setting, prop, visual style, and unresolved-risk notes.
   - Report the project folder path and summarize what was produced.

## Review Gates

Use these checks before advancing:

- **Storyboard gate:** The image is a generated visual frame or storyboard board, not a placeholder diagram; covers the intended story beat; shows the right characters and setting; has a clear visual hierarchy; and leaves no major ambiguity for shot planning.
- **Shotboard gate:** The image is generated visual shot planning, not a placeholder diagram; it uses a professional production-board layout with clean margins, a clear title/subtitle, numbered timed panels, concise action captions, and goal/tone summary blocks. Each 15-second arc has a distinct beginning, middle, and end, with camera direction, subject action, environment, lighting, movement, and continuity specified.
- **Seedance 2 prompt gate:** The prompt is self-contained, cinematic, temporally bounded, and does not depend on hidden conversation context.
- **Coverage gate:** The full set of storyboards and shotboards covers the whole story without gaps or accidental duplicate beats.

## Subagent Prompts

Read `references/subagent-prompts.md` when you are ready to delegate storyboard or shotboard work. Use the templates as starting prompts and fill every bracketed field before dispatch.
