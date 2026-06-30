---
"@eins78/agent-skills": patch
---

dossier: collapse unpublished dossiers to a single current version (#56)

When a user gives mid-session corrections, the agent previously accumulated document history in the dossier body — "Revision note" blocks, `rev. <date>` date suffixes, and inline "first draft framed X / corrected after feedback" phrasing. That edit history is noise to any reader who wasn't in the authoring session.

- SKILL.md §SYNTHESIZE gains an "Anti-revision rule" bullet: rewrite corrections as present-tense facts; state *why a point matters* rather than *that it was added later*; document history lives in commit messages and the sessionlog.
- Common Mistakes table gains a "narrating edit history" row.
- review-checklist.md gains item #9 ("Single current version") with red-flag patterns.
- The dossier template's header comment block now names the anti-revision rule alongside the section-order rule.

Out of scope: deliberate dated addenda on already-published dossiers.

<!--
bumps:
  skills:
    dossier: patch
-->
