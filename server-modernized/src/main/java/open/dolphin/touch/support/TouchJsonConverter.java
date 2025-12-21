package open.dolphin.touch.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import open.dolphin.infomodel.IStampTreeModel;
import open.dolphin.infomodel.InfoModel;
import open.dolphin.infomodel.StampModel;
import open.dolphin.touch.JSONStampBuilder;
import open.dolphin.touch.JSONStampTreeBuilder;
import open.dolphin.touch.StampTreeDirector;

@ApplicationScoped
public class TouchJsonConverter {

    @Inject
    private ObjectMapper legacyTouchMapper;

    public <T> T readLegacy(String json, Class<T> payloadType) throws IOException {
        if (json == null) {
            return null;
        }
        return legacyTouchMapper.readValue(json, payloadType);
    }

    public String writeLegacy(Object payload) throws IOException {
        return legacyTouchMapper.writeValueAsString(payload);
    }

    public String convertStampTree(IStampTreeModel treeModel) throws IOException {
        if (treeModel == null) {
            return null;
        }
        return convertStampTree(treeModel.getTreeBytes());
    }

    public String convertStampTree(byte[] treeBytes) throws IOException {
        if (treeBytes == null) {
            return null;
        }
        String treeXml = new String(treeBytes, StandardCharsets.UTF_8);
        try (BufferedReader reader = new BufferedReader(new StringReader(treeXml))) {
            JSONStampTreeBuilder builder = new JSONStampTreeBuilder();
            StampTreeDirector director = new StampTreeDirector(builder);
            String json = director.build(reader);
            if (json == null) {
                throw new IOException("Failed to convert stamp tree to JSON");
            }
            return json;
        }
    }

    public String convertStamp(StampModel stampModel) throws IOException {
        if (stampModel == null) {
            return null;
        }
        return convertStamp(stampModel.getStampBytes());
    }

    public String convertStamp(byte[] stampBytes) throws IOException {
        if (stampBytes == null) {
            return null;
        }
        try (XMLDecoder decoder = new XMLDecoder(new BufferedInputStream(new ByteArrayInputStream(stampBytes)))) {
            InfoModel model = (InfoModel) decoder.readObject();
            JSONStampBuilder builder = new JSONStampBuilder();
            return builder.build(model);
        }
    }

    public String convertStampTreeOrNull(IStampTreeModel treeModel) {
        try {
            return convertStampTree(treeModel);
        } catch (IOException | RuntimeException ex) {
            return null;
        }
    }

    public String convertStampOrNull(StampModel stampModel) {
        try {
            return convertStamp(stampModel);
        } catch (IOException | RuntimeException ex) {
            return null;
        }
    }
}
