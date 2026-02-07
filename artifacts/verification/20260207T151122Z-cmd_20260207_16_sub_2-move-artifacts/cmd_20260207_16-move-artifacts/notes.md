# cmd_20260207_16: move artifacts

- RUN_ID: 20260207T151122Z-cmd_20260207_16_sub_2-move-artifacts
- created_at_utc: 2026-02-07T15:11:22Z
- dst: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts

## src1
- src: /Users/Hayato/Documents/GitHub/multi-agent-shogun/artifacts
- rsync_cmd: rsync -a --remove-source-files --prune-empty-dirs --stats --human-readable <src>/ <dst>/
- note: rsync --remove-source-files は「転送が発生しない(up-to-date)ファイル」を移設元から削除しないため、rsync後に dst 側の存在を検証した上で、残っていた 51 files を src 側から削除した。


### rsync_stats (src1)

```text
Number of files: 409
Number of files transferred: 332
Total file size: 170 MB
Total transferred file size: 170 MB
Unmatched data: 170 MB
Matched data: 0 B
File list size: 38387 B
File list generation time: 0.003 seconds
File list transfer time: 0.009 seconds
Total sent: 170 MB
Total received: 7774 B

sent 170M bytes  received 7774 bytes  169M bytes/sec
total size is 170M  speedup is 1.00
```


## src2
- src: /Users/Hayato/Documents/GitHub/multi-agent-shogun/OpenDolphin_WebClient/artifacts
- rsync_cmd: rsync -a --remove-source-files --prune-empty-dirs --stats --human-readable <src>/ <dst>/
- note: rsync後に dst 側の存在を検証した上で、残っていた 4 files を src 側から削除した。


### rsync_stats (src2)

```text
Number of files: 36
Number of files transferred: 9
Total file size: 7207 kB
Total transferred file size: 1650 B
Unmatched data: 1650 B
Matched data: 0 B
File list size: 4145 B
File list generation time: 0.001 seconds
File list transfer time: 0.002 seconds
Total sent: 6241 B
Total received: 242 B

sent 6241 bytes  received 242 bytes  1063k bytes/sec
total size is 7207k  speedup is 1111.75
```

