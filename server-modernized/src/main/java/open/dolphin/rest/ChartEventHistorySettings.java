package open.dolphin.rest;

import java.time.Duration;

public class ChartEventHistorySettings {

    private final int replayLimit;
    private final int retentionCount;
    private final Duration retentionDuration;

    public ChartEventHistorySettings(int replayLimit, int retentionCount, Duration retentionDuration) {
        this.replayLimit = replayLimit;
        this.retentionCount = retentionCount;
        this.retentionDuration = retentionDuration;
    }

    public int getReplayLimit() {
        return replayLimit;
    }

    public int getRetentionCount() {
        return retentionCount;
    }

    public Duration getRetentionDuration() {
        return retentionDuration;
    }
}
