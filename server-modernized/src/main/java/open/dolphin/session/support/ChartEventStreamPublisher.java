package open.dolphin.session.support;

import open.dolphin.infomodel.ChartEventModel;

/**
 * ChartEvent の SSE 配信を抽象化するインタフェース。
 * セッション層は REST 実装に依存せず、このインタフェース越しに配信を指示する。
 */
public interface ChartEventStreamPublisher {

    void broadcast(ChartEventModel event);
}
