package open.dolphin.adm10.converter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.function.Supplier;
import open.dolphin.infomodel.ClaimItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class IClaimItemXmlRoundTripTest {

    @Test
    @DisplayName("adm10 コンバータ: ClaimItem 拡張フィールドを XML ラウンドトリップで保持する")
    void roundTripAdm10() {
        assertRoundTrip(
                open.dolphin.adm10.converter.IClaimItem.class,
                open.dolphin.adm10.converter.IClaimItem::new,
                open.dolphin.adm10.converter.IClaimItem::fromModel,
                open.dolphin.adm10.converter.IClaimItem::toModel,
                open.dolphin.adm10.converter.IOSHelper::toXMLBytes,
                open.dolphin.adm10.converter.IOSHelper::xmlDecode);
    }

    @Test
    @DisplayName("adm20 コンバータ: ClaimItem 拡張フィールドを XML ラウンドトリップで保持する")
    void roundTripAdm20() {
        assertRoundTrip(
                open.dolphin.adm20.converter.IClaimItem.class,
                open.dolphin.adm20.converter.IClaimItem::new,
                open.dolphin.adm20.converter.IClaimItem::fromModel,
                open.dolphin.adm20.converter.IClaimItem::toModel,
                open.dolphin.adm20.converter.IOSHelper::toXMLBytes,
                open.dolphin.adm20.converter.IOSHelper::xmlDecode);
    }

    @Test
    @DisplayName("Touch コンバータ: ClaimItem 拡張フィールドを XML ラウンドトリップで保持する")
    void roundTripTouch() {
        assertRoundTrip(
                open.dolphin.touch.converter.IClaimItem.class,
                open.dolphin.touch.converter.IClaimItem::new,
                open.dolphin.touch.converter.IClaimItem::fromModel,
                open.dolphin.touch.converter.IClaimItem::toModel,
                open.dolphin.touch.converter.IOSHelper::toXMLBytes,
                open.dolphin.touch.converter.IOSHelper::xmlDecode);
    }

    private <T> void assertRoundTrip(
            Class<T> converterType,
            Supplier<T> supplier,
            BiConsumer<T, ClaimItem> fromModel,
            Function<T, ClaimItem> toModel,
            Function<Object, byte[]> encoder,
            Function<byte[], Object> decoder) {

        ClaimItem source = createSampleClaimItem();

        T converter = supplier.get();
        fromModel.accept(converter, source);

        byte[] xml = encoder.apply(converter);
        Object decoded = decoder.apply(xml);
        T restored = converterType.cast(decoded);
        ClaimItem actual = toModel.apply(restored);

        assertThat(actual.getNumberCodeName()).isEqualTo(source.getNumberCodeName());
        assertThat(actual.getSanteiCode()).isEqualTo(source.getSanteiCode());
        assertThat(actual.getDose()).isEqualTo(source.getDose());
        assertThat(actual.getDoseUnit()).isEqualTo(source.getDoseUnit());
    }

    private ClaimItem createSampleClaimItem() {
        ClaimItem item = new ClaimItem();
        item.setName("テスト内服薬");
        item.setCode("610004123");
        item.setCodeSystem("YJ");
        item.setClassCode("210");
        item.setClassCodeSystem("claim007");
        item.setNumber("3");
        item.setUnit("錠");
        item.setNumberCode("260000602");
        item.setNumberCodeSystem("claim007");
        item.setNumberCodeName("分3 毎食後");
        item.setMemo("Jakarta 拡張フィールド検証");
        item.setYkzKbn("1");
        item.setSanteiCode("1234500");
        item.setDose("10");
        item.setDoseUnit("mg");
        return item;
    }
}
