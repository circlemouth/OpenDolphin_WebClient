package open.dolphin.infomodel;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InfoModelCloneTest {

    @Test
    @DisplayName("DocInfoModel#clone で admFlag が複製される")
    void docInfoModelCloneCopiesAdmFlag() throws CloneNotSupportedException {
        DocInfoModel original = new DocInfoModel();
        original.setAdmFlag("A");

        DocInfoModel cloned = (DocInfoModel) original.clone();

        assertThat(cloned.getAdmFlag()).isEqualTo("A");
    }

    @Test
    @DisplayName("ModuleInfoBean#clone で performFlag が複製される")
    void moduleInfoBeanCloneCopiesPerformFlag() throws CloneNotSupportedException {
        ModuleInfoBean original = new ModuleInfoBean();
        original.setPerformFlag("1");

        ModuleInfoBean cloned = (ModuleInfoBean) original.clone();

        assertThat(cloned.getPerformFlag()).isEqualTo("1");
    }
}
