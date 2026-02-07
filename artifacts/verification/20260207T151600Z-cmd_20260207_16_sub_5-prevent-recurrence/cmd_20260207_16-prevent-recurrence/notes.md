# cmd_20260207_16_sub_5 prevent recurrence (.gitignore guard + duplicate removal)

- RUN_ID: 20260207T151600Z-cmd_20260207_16_sub_5-prevent-recurrence
- Date(UTC): 2026-02-07 15:16:00
- multi-agent-shogun commit: 5a83048

## .gitignore additions (multi-agent-shogun/.gitignore)

Added to prevent accidental placement of OpenDolphin repos/work products in the shogun repo root:

- OpenDolphin_WebClient/  (mis-copied repo guard)
- server-modernized/     (misplaced server tree guard)
- *.har                 (HAR exports are large and not needed in shogun repo)
- *.log                 (log outputs are not needed in shogun repo)
- *.zip                 (packaged artifacts are not needed in shogun repo)

## Duplicate removal (multi-agent-shogun side)

Removed tracked mis-duplicated OpenDolphin work products under multi-agent-shogun/OpenDolphin_WebClient/.

Verification commands (ran in multi-agent-shogun):

```bash
find . -maxdepth 3 -type d \( -name OpenDolphin_WebClient -o -name server-modernized \) -print
find docs -maxdepth 6 -type d \( -name artifacts -o -name 'web-client' \) -print
find . -maxdepth 4 -type f \( -name '*.har' -o -name '*.zip' -o -name '*.log' \) -print
```

Expected result: no output (no misplaced dirs/files found).

## Captured outputs

find checks: (no output)

git show --stat -1 5a83048:

```
5a83048 cmd_20260207_16: guard against misplaced OpenDolphin work products
 .gitignore                                         |     7 +
 .../curl-http-headers.txt                          |     0
 .../curl-http-stdout.txt                           |     1 -
 .../curl-system01dailyv2-headers.txt               |     0
 .../curl-system01dailyv2-stdout.txt                |     1 -
 .../nc-100.102.17.40-8000.txt                      |     0
 .../ping-100.102.17.40.txt                         |     3 -
 .../route-100.102.17.40.txt                        |     7 -
 .../socket-connect-100.102.17.40-8000.txt          |     3 -
 .../qa-order-master-blocked.md                     |    22 -
 .../RUN_ID.txt                                     |     1 -
 .../compare.md                                     |    51 -
 ...arts_ia_SOAP_area_annotated_scroll_to_SOAP_.har | 11350 ------------------
 ....ts__charts_ia_current_layout_top_annotated.har | 11455 -------------------
 .../notes.md                                       |     9 -
 .../screenshots/00-current-top-1440.png            |   Bin 406173 -> 0 bytes
 .../screenshots/01-current-soap-1440.png           |   Bin 531958 -> 0 bytes
 ...ts_ia_SOAP_area_annotated_scroll_to_SOAP_-0.png |   Bin 80409 -> 0 bytes
 ...s__charts_ia_current_layout_top_annotated-0.png |   Bin 119413 -> 0 bytes
 .../videos/378a72f07c1c872c257a38e3ae1ef5e9.webm   |   Bin 763058 -> 0 bytes
 .../videos/60529e4462a332a756ef0c610b21de2c.webm   |   Bin 801630 -> 0 bytes
 .../videos/a93e5fac27f75f1a440aca5742025e3a.webm   |   Bin 756421 -> 0 bytes
 .../videos/b21310ef9b11bdf29e2413e00667d573.webm   |   Bin 759766 -> 0 bytes
 .../videos/ba2818a8f905081389eae8e7a0e09fc7.webm   |   Bin 763246 -> 0 bytes
 .../videos/e565960aad345ffb80121db403021793.webm   |   Bin 322602 -> 0 bytes
 .../videos/eb9a4e6b242694aefe5bb4819be107f8.webm   |   Bin 323602 -> 0 bytes
 .../videos/f39a8fadaa8c7d07fa3b8acad6f4de70.webm   |   Bin 512498 -> 0 bytes
 .../wireframe.md                                   |   137 -
 .../open/dolphin/rest/KarteRevisionResource.java   |   280 -
 .../dolphin/session/KarteRevisionServiceBean.java  |   372 -
 .../qa-charts-do-copy-manual-regression.mjs        |   227 -
 .../web-client/scripts/qa-order-001-parity.mjs     |   407 -
 32 files changed, 7 insertions(+), 24326 deletions(-)
```
